// ============================================================================
//  OPERACIONES DE BASE DE DATOS DEL PANEL (escritura)
// ----------------------------------------------------------------------------
//  Funciones que usan las secciones del panel para crear/editar/borrar. Todas
//  requieren sesión de la dueña (lo impone RLS en el servidor). Tras escribir,
//  invalidamos la caché de lectura para que la web pública refleje el cambio.
// ============================================================================
import { supabase, MEDIA_BUCKET } from '../lib/supabase'
import { invalidate } from '../lib/content'

function check() {
  if (!supabase) throw new Error('Supabase no está configurado.')
}

// ---- FOTOS -----------------------------------------------------------------
export async function listPhotos(category) {
  check()
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('category', category)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function addPhoto(category, { url, path }, sortOrder) {
  check()
  const { data, error } = await supabase
    .from('photos')
    .insert({ category, image_url: url, image_path: path, sort_order: sortOrder, published: true })
    .select()
    .single()
  if (error) throw error
  invalidate(`photos:${category}`)
  return data
}

export async function updatePhoto(id, fields, category) {
  check()
  const { error } = await supabase.from('photos').update(fields).eq('id', id)
  if (error) throw error
  if (category) invalidate(`photos:${category}`)
}

export async function deletePhoto(photo) {
  check()
  if (photo.image_path) {
    // Borra también el archivo del Storage para no dejar huérfanos.
    await supabase.storage.from(MEDIA_BUCKET).remove([photo.image_path])
  }
  const { error } = await supabase.from('photos').delete().eq('id', photo.id)
  if (error) throw error
  invalidate(`photos:${photo.category}`)
}

// Intercambia el orden de dos fotos (reordenar arriba/abajo).
export async function swapPhotoOrder(a, b) {
  check()
  const updates = [
    supabase.from('photos').update({ sort_order: b.sort_order }).eq('id', a.id),
    supabase.from('photos').update({ sort_order: a.sort_order }).eq('id', b.id),
  ]
  const results = await Promise.all(updates)
  const err = results.find((r) => r.error)
  if (err) throw err.error
  invalidate(`photos:${a.category}`)
}

// ---- EVENTOS ---------------------------------------------------------------
export async function listEvents() {
  check()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('start_date', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function saveEvent(event) {
  check()
  const payload = { ...event }
  delete payload.created_at
  let result
  if (event.id) {
    result = await supabase.from('events').update(payload).eq('id', event.id).select().single()
  } else {
    delete payload.id
    result = await supabase.from('events').insert(payload).select().single()
  }
  if (result.error) throw result.error
  invalidate('events:')
  return result.data
}

export async function deleteEvent(event) {
  check()
  if (event.image_path) {
    await supabase.storage.from(MEDIA_BUCKET).remove([event.image_path])
  }
  const { error } = await supabase.from('events').delete().eq('id', event.id)
  if (error) throw error
  invalidate('events:')
}

// ---- CONTENIDO (textos) ----------------------------------------------------
export async function getContent(key) {
  check()
  const { data, error } = await supabase.from('content').select('value').eq('key', key).maybeSingle()
  if (error) throw error
  return data ? data.value : null
}

// Devuelve un objeto { clave: valor } con todos los textos guardados.
export async function getAllContent() {
  check()
  const { data, error } = await supabase.from('content').select('key,value')
  if (error) throw error
  const map = {}
  for (const row of data ?? []) map[row.key] = row.value
  return map
}

export async function saveContent(key, value) {
  check()
  const { error } = await supabase
    .from('content')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) throw error
  invalidate(`content:${key}`)
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
  const { error } = await supabase
    .from('business')
    .upsert({ id: 1, ...fields, updated_at: new Date().toISOString() }, { onConflict: 'id' })
  if (error) throw error
  invalidate('business')
}
