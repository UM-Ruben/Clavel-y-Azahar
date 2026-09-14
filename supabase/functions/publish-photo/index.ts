import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const MAX_ORIGINAL = 20 * 1024 * 1024
const MAX_DERIVATIVE = 6 * 1024 * 1024
const ZONES = new Set([
  'inicio_hero', 'inicio_destacados', 'servicios_hero',
  'servicios_bodas', 'servicios_taller', 'contacto_local', 'eventos', 'suscripciones',
])
// Apartados de "Nuestras Colecciones": la dueña crea tantos como quiera desde
// el panel, cada uno con su propio id (ver src/lib/collections.js), así que
// su categoría no puede vivir en la lista fija de arriba. Se admite cualquier
// `coleccion_<uuid>` que corresponda a un apartado real (comprobado más abajo).
const COLLECTION_ZONE = /^coleccion_([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (request.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const authorization = request.headers.get('Authorization') || ''
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  })
  const service = createClient(supabaseUrl, serviceKey)
  const { data: auth, error: authError } = await userClient.auth.getUser()
  if (authError || !auth.user) return json({ error: 'NOT_AUTHENTICATED' }, 401)

  const { data: owner } = await service
    .from('admin_users').select('user_id').eq('user_id', auth.user.id).maybeSingle()
  if (!owner) return json({ error: 'NOT_AUTHORIZED' }, 403)

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return json({ error: 'INVALID_BODY' }, 400)
  }

  const operationId = String(body.operationId || '')
  const mode = body.mode === 'restore' ? 'restore'
    : body.mode === 'remove' ? 'remove'
    : body.mode === 'visibility' ? 'visibility'
    : body.mode === 'asset-only' ? 'asset-only' : 'photo'
  if (mode === 'restore') return restoreRevision(userClient, service, auth.user.id, body)
  if (mode === 'remove') return removePublishedPhoto(userClient, service, auth.user.id, body)
  if (mode === 'visibility') return changeVisibility(userClient, service, auth.user.id, body)

  const zone = String(body.zone || '')
  const originalStage = String(body.originalPath || '')
  const derivativeStage = String(body.derivativePath || '')
  const collectionMatch = zone.match(COLLECTION_ZONE)
  if ((!ZONES.has(zone) && !collectionMatch) || !isUuid(operationId)) return json({ error: 'INVALID_REQUEST' }, 400)
  if (collectionMatch) {
    const { data: collection } = await service.from('collections').select('id').eq('id', collectionMatch[1]).maybeSingle()
    if (!collection) return json({ error: 'INVALID_REQUEST' }, 400)
  }
  const stagePrefix = `${auth.user.id}/${operationId}/`
  if (!originalStage.startsWith(stagePrefix) || !derivativeStage.startsWith(stagePrefix)) {
    return json({ error: 'INVALID_STORAGE_PATH' }, 400)
  }

  // Una repetición de la misma operación devuelve el resultado anterior.
  if (mode === 'photo') {
    const { data: existing } = await userClient
      .from('photos').select('*').eq('last_operation_id', operationId).maybeSingle()
    if (existing) return json({ photo: existing })
  }

  const [originalDownload, derivativeDownload] = await Promise.all([
    service.storage.from('media-staging').download(originalStage),
    service.storage.from('media-staging').download(derivativeStage),
  ])
  if (originalDownload.error || derivativeDownload.error) {
    return json({ error: 'STAGED_FILES_NOT_FOUND' }, 400)
  }

  const original = originalDownload.data
  const derivative = derivativeDownload.data
  const originalKind = await detectImageKind(original)
  const derivativeKind = await detectImageKind(derivative)
  if (!originalKind || derivativeKind !== 'jpeg' || original.size > MAX_ORIGINAL || derivative.size > MAX_DERIVATIVE) {
    await removeStaging(service, [originalStage, derivativeStage])
    return json({ error: 'INVALID_IMAGE' }, 422)
  }

  const ext = originalKind === 'jpeg' ? 'jpg' : originalKind
  const finalPrefix = `${auth.user.id}/${zone}/${operationId}`
  const originalPath = `${finalPrefix}/original.${ext}`
  const imagePath = `${finalPrefix}/published.jpg`
  const replaceId = String(body.replaceId || '')
  const { data: currentPhoto } = replaceId
    ? await service.from('photos').select('*').eq('id', replaceId).eq('category', zone).maybeSingle()
    : { data: null }
  let originalsUploaded = false
  let derivativeUploaded = false
  let archive: { path: string, created: boolean } | null = null
  try {
    if (currentPhoto?.image_path || currentPhoto?.private_image_path) archive = await archivePhoto(service, auth.user.id, currentPhoto)
    const originalUpload = await service.storage.from('media-originals').upload(originalPath, original, {
      upsert: false, contentType: mimeFor(originalKind), cacheControl: '31536000',
    })
    if (originalUpload.error) throw originalUpload.error
    originalsUploaded = true
    const derivativeUpload = await service.storage.from('media').upload(imagePath, derivative, {
      upsert: false, contentType: 'image/jpeg', cacheControl: '31536000',
    })
    if (derivativeUpload.error) throw derivativeUpload.error
    derivativeUploaded = true
    const { data: publicData } = service.storage.from('media').getPublicUrl(imagePath)

    if (mode === 'asset-only') {
      await removeStaging(service, [originalStage, derivativeStage])
      return json({ url: publicData.publicUrl, path: imagePath, originalPath })
    }

    const { data: photo, error: publishError } = await userClient.rpc('publish_photo', {
      p_category: zone,
      p_image_path: imagePath,
      p_image_url: publicData.publicUrl,
      p_original_path: originalPath,
      p_crop: body.crop || {},
      p_expected_revision: body.expectedRevision ?? null,
      p_operation_id: operationId,
      p_replace_id: body.replaceId || null,
    })
    if (publishError) throw publishError
    if (currentPhoto && archive) {
      const historyUpdate = await service.from('photo_revisions').update({ history_path: archive.path })
        .eq('photo_id', currentPhoto.id).eq('source_revision', currentPhoto.revision)
      if (!historyUpdate.error && currentPhoto.published && currentPhoto.image_path) {
        await service.storage.from('media').remove([currentPhoto.image_path])
      }
    }
    await removeStaging(service, [originalStage, derivativeStage])
    return json({ photo })
  } catch (error) {
    const removals: Promise<unknown>[] = []
    if (originalsUploaded) removals.push(service.storage.from('media-originals').remove([originalPath]))
    if (derivativeUploaded) removals.push(service.storage.from('media').remove([imagePath]))
    if (archive?.created) removals.push(service.storage.from('media-history').remove([archive.path]))
    removals.push(removeStaging(service, [originalStage, derivativeStage]))
    await Promise.allSettled(removals)
    const message = String((error as { message?: string })?.message || error)
    const status = message.includes('REVISION_CONFLICT') ? 409
      : message.includes('CATEGORY_LIMIT_REACHED') ? 422 : 500
    return json({ error: publicError(message) }, status)
  }
})

async function removePublishedPhoto(userClient: ReturnType<typeof createClient>, service: ReturnType<typeof createClient>, userId: string, body: Record<string, unknown>) {
  const photoId = String(body.photoId || '')
  const operationId = String(body.operationId || '')
  const expectedRevision = Number(body.expectedRevision)
  if (!isUuid(photoId) || !isUuid(operationId) || !Number.isInteger(expectedRevision)) return json({ error: 'INVALID_REQUEST' }, 400)
  const { data: repeated } = await service.from('photos').select('*').eq('last_operation_id', operationId).maybeSingle()
  if (repeated) return json({ photo: repeated })
  const { data: photo } = await service.from('photos').select('*').eq('id', photoId).maybeSingle()
  if (!photo) return json({ error: 'PHOTO_NOT_FOUND' }, 404)
  let archive: { path: string, created: boolean } | null = null
  try {
    archive = await archivePhoto(service, userId, photo)
    const { data: removed, error } = await userClient.rpc('remove_photo', {
      p_photo_id: photoId, p_expected_revision: expectedRevision, p_operation_id: operationId,
    })
    if (error) throw error
    if (archive) {
      const historyUpdate = await service.from('photo_revisions').update({ history_path: archive.path })
        .eq('photo_id', photo.id).eq('source_revision', photo.revision)
      if (!historyUpdate.error && photo.published && photo.image_path) {
        await service.storage.from('media').remove([photo.image_path])
      }
    }
    return json({ photo: removed })
  } catch (error) {
    if (archive?.created) await service.storage.from('media-history').remove([archive.path])
    const message = String((error as { message?: string })?.message || error)
    return json({ error: publicError(message) }, message.includes('REVISION_CONFLICT') ? 409 : 500)
  }
}

async function restoreRevision(userClient: ReturnType<typeof createClient>, service: ReturnType<typeof createClient>, userId: string, body: Record<string, unknown>) {
  const revisionId = String(body.revisionId || '')
  const operationId = String(body.operationId || '')
  if (!isUuid(revisionId) || !isUuid(operationId)) return json({ error: 'INVALID_REQUEST' }, 400)
  const { data: repeated } = await service.from('photos').select('*').eq('last_operation_id', operationId).maybeSingle()
  if (repeated) return json({ photo: repeated })
  const { data: revision } = await service.from('photo_revisions').select('*').eq('id', revisionId).gt('expires_at', new Date().toISOString()).maybeSingle()
  if (!revision) return json({ error: 'REVISION_EXPIRED_OR_MISSING' }, 404)
  const { data: current } = await service.from('photos').select('*').eq('id', revision.photo_id).maybeSingle()
  if (!current) return json({ error: 'PHOTO_NOT_FOUND' }, 404)
  const sourceBucket = revision.history_path ? 'media-history' : 'media'
  const sourcePath = revision.history_path || revision.image_path
  const source = await service.storage.from(sourceBucket).download(sourcePath)
  if (source.error || await detectImageKind(source.data) !== 'jpeg') return json({ error: 'HISTORY_FILE_NOT_FOUND' }, 404)

  const imagePath = `${userId}/${revision.category}/${operationId}/restored.jpg`
  let currentArchive: { path: string, created: boolean } | null = null
  let restoredUploaded = false
  try {
    if (current.image_path || current.private_image_path) currentArchive = await archivePhoto(service, userId, current)
    const upload = await service.storage.from('media').upload(imagePath, source.data, {
      upsert: false, contentType: 'image/jpeg', cacheControl: '31536000',
    })
    if (upload.error) throw upload.error
    restoredUploaded = true
    const { data: publicData } = service.storage.from('media').getPublicUrl(imagePath)
    const { data: photo, error } = await userClient.rpc('restore_photo_revision', {
      p_revision_id: revisionId, p_image_path: imagePath, p_image_url: publicData.publicUrl,
      p_operation_id: operationId,
    })
    if (error) throw error
    if (currentArchive) {
      const historyUpdate = await service.from('photo_revisions').update({ history_path: currentArchive.path })
        .eq('photo_id', current.id).eq('source_revision', current.revision)
      if (!historyUpdate.error && current.published && current.image_path) {
        await service.storage.from('media').remove([current.image_path])
      }
    }
    return json({ photo })
  } catch (error) {
    const removals = []
    if (currentArchive?.created) removals.push(service.storage.from('media-history').remove([currentArchive.path]))
    if (restoredUploaded) removals.push(service.storage.from('media').remove([imagePath]))
    await Promise.allSettled(removals)
    const message = String((error as { message?: string })?.message || error)
    const status = message.includes('CATEGORY_LIMIT_REACHED') ? 422 : 500
    return json({ error: publicError(message) }, status)
  }
}

async function changeVisibility(userClient: ReturnType<typeof createClient>, service: ReturnType<typeof createClient>, userId: string, body: Record<string, unknown>) {
  const photoId = String(body.photoId || '')
  const operationId = String(body.operationId || '')
  const expectedRevision = Number(body.expectedRevision)
  const visible = body.visible === true
  if (!isUuid(photoId) || !isUuid(operationId) || !Number.isInteger(expectedRevision)) return json({ error: 'INVALID_REQUEST' }, 400)
  const { data: repeated } = await service.from('photos').select('*').eq('last_operation_id', operationId).maybeSingle()
  if (repeated) return json({ photo: repeated })
  const { data: photo } = await service.from('photos').select('*').eq('id', photoId).maybeSingle()
  if (!photo) return json({ error: 'PHOTO_NOT_FOUND' }, 404)

  if (!visible) {
    let archive: { path: string, created: boolean } | null = null
    try {
      archive = await archivePhoto(service, userId, photo)
      if (!archive) throw new Error('HISTORY_FILE_NOT_READY')
      const { data: changed, error } = await userClient.rpc('set_photo_visibility', {
        p_photo_id: photoId,
        p_expected_revision: expectedRevision,
        p_visible: false,
        p_image_path: photo.image_path,
        p_image_url: photo.image_url,
        p_private_image_path: archive.path,
        p_operation_id: operationId,
      })
      if (error) throw error
      if (photo.image_path) await service.storage.from('media').remove([photo.image_path])
      return json({ photo: changed })
    } catch (error) {
      if (archive?.created) await service.storage.from('media-history').remove([archive.path])
      const message = String((error as { message?: string })?.message || error)
      return json({ error: publicError(message) }, message.includes('REVISION_CONFLICT') ? 409 : 500)
    }
  }

  const privatePath = String(photo.private_image_path || '')
  if (!privatePath) return json({ error: 'HISTORY_FILE_NOT_FOUND' }, 404)
  const source = await service.storage.from('media-history').download(privatePath)
  if (source.error || await detectImageKind(source.data) !== 'jpeg') return json({ error: 'HISTORY_FILE_NOT_FOUND' }, 404)
  const imagePath = `${userId}/${photo.category}/${operationId}/published.jpg`
  let uploaded = false
  try {
    const upload = await service.storage.from('media').upload(imagePath, source.data, {
      upsert: false, contentType: 'image/jpeg', cacheControl: '31536000',
    })
    if (upload.error) throw upload.error
    uploaded = true
    const { data: publicData } = service.storage.from('media').getPublicUrl(imagePath)
    const { data: changed, error } = await userClient.rpc('set_photo_visibility', {
      p_photo_id: photoId,
      p_expected_revision: expectedRevision,
      p_visible: true,
      p_image_path: imagePath,
      p_image_url: publicData.publicUrl,
      p_private_image_path: null,
      p_operation_id: operationId,
    })
    if (error) throw error
    await service.storage.from('media-history').remove([privatePath])
    return json({ photo: changed })
  } catch (error) {
    if (uploaded) await service.storage.from('media').remove([imagePath])
    const message = String((error as { message?: string })?.message || error)
    const status = message.includes('REVISION_CONFLICT') ? 409
      : message.includes('CATEGORY_LIMIT_REACHED') ? 422 : 500
    return json({ error: publicError(message) }, status)
  }
}

async function archivePhoto(service: ReturnType<typeof createClient>, userId: string, photo: Record<string, unknown>) {
  if (photo.private_image_path) return { path: String(photo.private_image_path), created: false }
  const imagePath = String(photo.image_path || '')
  if (!imagePath) return null
  const download = await service.storage.from('media').download(imagePath)
  if (download.error) return null
  const historyPath = `${userId}/${photo.id}/${photo.revision}/published.jpg`
  const upload = await service.storage.from('media-history').upload(historyPath, download.data, {
    upsert: false, contentType: 'image/jpeg', cacheControl: '31536000',
  })
  if (upload.error) throw upload.error
  return { path: historyPath, created: true }
}

async function removeStaging(client: ReturnType<typeof createClient>, paths: string[]) {
  await client.storage.from('media-staging').remove(paths)
}

async function detectImageKind(blob: Blob) {
  const bytes = new Uint8Array(await blob.slice(0, 32).arrayBuffer())
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg'
  if ([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => bytes[i] === v)) return 'png'
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') return 'webp'
  if (ascii(bytes, 4, 4) === 'ftyp') {
    const brand = ascii(bytes, 8, 4).toLowerCase()
    if (['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1'].includes(brand)) return 'heic'
  }
  return null
}

function ascii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.slice(start, start + length))
}
function mimeFor(kind: string) {
  if (kind === 'jpeg') return 'image/jpeg'
  if (kind === 'heic') return 'image/heic'
  return `image/${kind}`
}
function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}
function publicError(message: string) {
  for (const code of ['REVISION_CONFLICT', 'CATEGORY_LIMIT_REACHED', 'INVALID_CATEGORY', 'FILES_NOT_READY']) {
    if (message.includes(code)) return code
  }
  return 'PUBLISH_FAILED'
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
