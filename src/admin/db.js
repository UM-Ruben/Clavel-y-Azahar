import { supabase, MEDIA_BUCKET, STAGING_BUCKET, HISTORY_BUCKET } from '../lib/supabase'
import { invalidate } from '../lib/content'
import { collectionCategory } from '../lib/collections'

export { collectionCategory }

function check() {
  if (!supabase) throw new Error('Supabase no está configurado.')
}

async function currentUser() {
  check()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw error || new Error('La sesión ha caducado.')
  return data.user
}

export async function listPhotos(category) {
  check()
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('category', category)
    .neq('status', 'deleted')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  const rows = data ?? []
  const privatePaths = rows.map((row) => row.private_image_path).filter(Boolean)
  if (!privatePaths.length) return rows
  const signed = await supabase.storage.from(HISTORY_BUCKET).createSignedUrls(privatePaths, 3600)
  if (signed.error) throw signed.error
  const urls = new Map((signed.data || []).map((item) => [item.path, item.signedUrl]))
  return rows.map((row) => row.private_image_path
    ? { ...row, image_url: urls.get(row.private_image_path) || row.image_url }
    : row)
}

export async function publishPhoto(category, upload, currentPhoto = null) {
  const user = await currentUser()
  const operationId = upload.operationId || crypto.randomUUID()
  const prefix = `${user.id}/${operationId}`
  const originalPath = `${prefix}/original.${upload.originalExt}`
  const derivativePath = `${prefix}/derivative.jpg`
  const staged = []

  try {
    const originalResult = await supabase.storage.from(STAGING_BUCKET).upload(originalPath, upload.original, {
      upsert: false,
      cacheControl: '3600',
      contentType: upload.originalMime,
    })
    if (originalResult.error) throw originalResult.error
    staged.push(originalPath)

    const derivativeResult = await supabase.storage.from(STAGING_BUCKET).upload(derivativePath, upload.blob, {
      upsert: false,
      cacheControl: '3600',
      contentType: 'image/jpeg',
    })
    if (derivativeResult.error) throw derivativeResult.error
    staged.push(derivativePath)

    const { data, error } = await supabase.functions.invoke('publish-photo', {
      body: {
        mode: 'photo',
        zone: category,
        operationId,
        originalPath,
        derivativePath,
        crop: upload.crop || {},
        replaceId: currentPhoto?.id || null,
        expectedRevision: currentPhoto?.revision ?? null,
      },
    })
    if (error) throw functionError(error, data)
    if (!data?.photo) throw new Error('Supabase no devolvió la fotografía publicada.')
    invalidate(`photos:${category}`)
    return data.photo
  } catch (error) {
    if (staged.length) await supabase.storage.from(STAGING_BUCKET).remove(staged).catch(() => {})
    throw error
  }
}

// Los eventos usan el mismo canal de validación, aunque el alta del evento se
// confirma después en su propio formulario.
export async function uploadEventMedia(upload, zone = 'eventos') {
  const user = await currentUser()
  const operationId = upload.operationId || crypto.randomUUID()
  const prefix = `${user.id}/${operationId}`
  const originalPath = `${prefix}/original.${upload.originalExt}`
  const derivativePath = `${prefix}/derivative.jpg`
  const staged = []
  try {
    for (const [path, blob, type] of [
      [originalPath, upload.original, upload.originalMime],
      [derivativePath, upload.blob, 'image/jpeg'],
    ]) {
      const { error } = await supabase.storage.from(STAGING_BUCKET).upload(path, blob, {
        upsert: false, cacheControl: '3600', contentType: type,
      })
      if (error) throw error
      staged.push(path)
    }
    const { data, error } = await supabase.functions.invoke('publish-photo', {
      body: { mode: 'asset-only', zone, operationId, originalPath, derivativePath },
    })
    if (error) throw functionError(error, data)
    return data
  } catch (error) {
    if (staged.length) await supabase.storage.from(STAGING_BUCKET).remove(staged).catch(() => {})
    throw error
  }
}

export async function updatePhoto(photo, fields) {
  check()
  const next = { ...photo, ...fields }
  const { data, error } = await supabase.rpc('update_photo_metadata', {
    p_photo_id: photo.id,
    p_expected_revision: photo.revision,
    p_title: next.title || null,
    p_description: next.description || null,
    p_alt: next.alt || null,
    p_badge: next.badge || null,
  })
  if (error) throw error
  invalidate(`photos:${photo.category}`)
  return data
}

export async function removePhoto(photo) {
  check()
  const { data, error } = await supabase.functions.invoke('publish-photo', {
    body: {
      mode: 'remove',
      photoId: photo.id,
      expectedRevision: photo.revision,
      operationId: crypto.randomUUID(),
    },
  })
  if (error) throw functionError(error, data)
  invalidate(`photos:${photo.category}`)
  return data?.photo
}

export async function setPhotoVisibility(photo, visible) {
  check()
  const { data, error } = await supabase.functions.invoke('publish-photo', {
    body: {
      mode: 'visibility',
      photoId: photo.id,
      expectedRevision: photo.revision,
      visible,
      operationId: crypto.randomUUID(),
    },
  })
  if (error) throw functionError(error, data)
  invalidate(`photos:${photo.category}`)
  const changed = data?.photo
  if (!visible && changed?.private_image_path) {
    const signed = await supabase.storage.from(HISTORY_BUCKET).createSignedUrl(changed.private_image_path, 3600)
    if (!signed.error) return { ...changed, image_url: signed.data.signedUrl }
  }
  return changed
}

export async function reorderPhotos(category, orderedIds) {
  check()
  const { data, error } = await supabase.rpc('reorder_photos', {
    p_category: category,
    p_ordered_ids: orderedIds,
  })
  if (error) throw error
  invalidate(`photos:${category}`)
  return data ?? []
}

export async function listPhotoHistory(category) {
  check()
  const { data, error } = await supabase
    .from('photo_revisions')
    .select('*')
    .eq('category', category)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
  if (error) throw error
  const rows = data ?? []
  const paths = rows.map((row) => row.history_path).filter(Boolean)
  if (!paths.length) return rows
  const signed = await supabase.storage.from(HISTORY_BUCKET).createSignedUrls(paths, 3600)
  if (signed.error) throw signed.error
  const urls = new Map((signed.data || []).map((item) => [item.path, item.signedUrl]))
  return rows.map((row) => ({ ...row, image_url: urls.get(row.history_path) || row.image_url }))
}

export async function restorePhoto(revisionId, category) {
  check()
  const { data, error } = await supabase.functions.invoke('publish-photo', {
    body: { mode: 'restore', revisionId, operationId: crypto.randomUUID() },
  })
  if (error) throw functionError(error, data)
  invalidate(`photos:${category}`)
  return data?.photo
}

// ---- EVENTOS ---------------------------------------------------------------
export async function listEvents() {
  check()
  const { data, error } = await supabase.from('events').select('*').order('start_date', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function saveEvent(event, previous = null) {
  check()
  const payload = { ...event }
  delete payload.created_at
  let result
  if (event.id) result = await supabase.from('events').update(payload).eq('id', event.id).select().single()
  else {
    delete payload.id
    result = await supabase.from('events').insert(payload).select().single()
  }
  if (result.error) throw result.error
  if (previous?.image_path && previous.image_path !== result.data.image_path) {
    await supabase.storage.from(MEDIA_BUCKET).remove([previous.image_path])
  }
  invalidate('events:')
  return result.data
}

export async function deleteEvent(event) {
  check()
  const { error } = await supabase.from('events').delete().eq('id', event.id)
  if (error) throw error
  if (event.image_path) await supabase.storage.from(MEDIA_BUCKET).remove([event.image_path])
  invalidate('events:')
}

// ---- CONTENIDO -------------------------------------------------------------
export async function getContent(key) {
  check()
  const { data, error } = await supabase.from('content').select('value').eq('key', key).maybeSingle()
  if (error) throw error
  return data ? data.value : null
}
export async function getAllContent() {
  check()
  const { data, error } = await supabase.from('content').select('key,value')
  if (error) throw error
  return Object.fromEntries((data ?? []).map((row) => [row.key, row.value]))
}
export async function saveContent(key, value) {
  check()
  const { error } = await supabase.from('content')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) throw error
  invalidate(`content:${key}`)
}

// ---- APARTADOS DE "NUESTRAS COLECCIONES" ------------------------------------
// La dueña crea tantos apartados como quiera, cada uno con su título, su
// breve descripción y sus fotos. Las fotos comparten el mismo mecanismo de
// zonas de siempre (ver PhotoZoneEditor), bajo la categoría que calcula
// collectionCategory(id). El propio apartado (título/descripción/orden) es
// una fila normal en `collections`, protegida por RLS (política
// "collections_owner_all" en el esquema), así que se lee y escribe
// directamente con el cliente de Supabase, sin necesidad de RPC.
export async function listCollections() {
  check()
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createCollection() {
  check()
  const { data: last, error: lastError } = await supabase
    .from('collections').select('sort_order').order('sort_order', { ascending: false }).limit(1)
  if (lastError) throw lastError
  const sort_order = last && last.length ? last[0].sort_order + 1 : 0
  const { data, error } = await supabase
    .from('collections')
    .insert({ title: 'Nuevo apartado', description: '', sort_order, published: true })
    .select().single()
  if (error) throw error
  invalidate('collections')
  return data
}

export async function updateCollection(collection, fields) {
  check()
  const { data, error } = await supabase
    .from('collections')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', collection.id)
    .select().single()
  if (error) throw error
  invalidate('collections')
  return data
}

// Reordena guardando la posición (0, 1, 2…) de cada apartado en el orden dado.
// No hace falta una transacción atómica: solo la dueña edita esto, y un fallo
// a mitad de camino como mucho deja un orden provisional que se corrige
// recargando la lista.
export async function reorderCollections(orderedCollections) {
  check()
  const results = await Promise.all(
    orderedCollections.map((collection, index) =>
      supabase.from('collections').update({ sort_order: index }).eq('id', collection.id)
    )
  )
  const failed = results.find((result) => result.error)
  if (failed) throw failed.error
  invalidate('collections')
  return orderedCollections.map((collection, index) => ({ ...collection, sort_order: index }))
}

// Borra el apartado y, de paso, envía sus fotos a la papelera (se limpian
// solas del almacenamiento a los 30 días, igual que el resto de fotos
// retiradas). Si alguna foto falla al retirarse no bloquea el borrado del
// apartado: quedaría huérfana pero invisible, ya que nada vuelve a pedir
// fotos de una categoría de un apartado que ya no existe.
export async function deleteCollection(collection) {
  check()
  const category = collectionCategory(collection.id)
  let photos = []
  try { photos = await listPhotos(category) } catch { photos = [] }
  await Promise.allSettled(photos.map((photo) => removePhoto(photo)))
  const { error } = await supabase.from('collections').delete().eq('id', collection.id)
  if (error) throw error
  invalidate('collections')
  invalidate(`photos:${category}`)
}

// ---- NEGOCIO ---------------------------------------------------------------
export async function getBusiness() {
  check()
  const { data, error } = await supabase.from('business').select('*').eq('id', 1).maybeSingle()
  if (error) throw error
  return data
}
export async function saveBusiness(fields) {
  check()
  const { error } = await supabase.from('business')
    .upsert({ id: 1, ...fields, updated_at: new Date().toISOString() }, { onConflict: 'id' })
  if (error) throw error
  invalidate('business')
}

function functionError(error, data) {
  const code = data?.error
  if (code === 'REVISION_CONFLICT') return new Error('La foto cambió en otra sesión. Recarga la zona e inténtalo de nuevo.')
  if (code === 'CATEGORY_LIMIT_REACHED') return new Error('Esta zona ya ha alcanzado su número máximo de fotos.')
  if (code === 'INVALID_IMAGE') return new Error('Supabase rechazó el archivo porque no es una imagen válida.')
  return error
}
