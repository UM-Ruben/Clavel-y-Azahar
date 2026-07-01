// ============================================================================
//  CAPA DE CONTENIDO  —  hooks que leen de Supabase (REST) con FALLBACK
// ----------------------------------------------------------------------------
//  Todos los hooks devuelven el dato de la base de datos cuando existe y, si no
//  (Supabase sin configurar, sin conexión, o sección vacía), el componente usa
//  su valor por defecto actual. Así la web NUNCA se rompe ni se queda en blanco.
//
//  Las consultas se hacen SOLO en el navegador (dentro de useEffect), por lo que
//  el prerenderizado del build (SSG) sigue funcionando con los valores por
//  defecto y un cambio en el panel se ve al instante, sin necesidad de redeploy.
//
//  Se usa `fetch` a la API REST (ver src/lib/rest.js) para no cargar la librería
//  pesada de Supabase en la web pública.
// ============================================================================
import { useEffect, useState } from 'react'
import { restGet, isSupabaseConfigured } from './rest'
import { site } from '../config/site'

// Caché en memoria: evita repetir la misma consulta al navegar entre páginas.
const cache = new Map()

function useQuery(key, run) {
  const [data, setData] = useState(() => (cache.has(key) ? cache.get(key) : null))
  const [loading, setLoading] = useState(() => isSupabaseConfigured && !cache.has(key))

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let active = true

    function refresh(showLoading) {
      if (showLoading) setLoading(true)
      run()
        .then((result) => {
          if (!active) return
          cache.set(key, result)
          setData(result)
        })
        .catch(() => {
          // Silencio intencionado: el componente caerá a su valor por defecto.
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }

    if (cache.has(key)) {
      setData(cache.get(key))
      setLoading(false)
    } else {
      refresh(true)
    }

    // La caché es por pestaña: si se edita algo en el panel desde OTRA pestaña
    // (o desde el móvil), esta pestaña no se entera. Al volver a mirarla,
    // refrescamos en segundo plano (sin quitar lo que ya se ve) para que
    // recoja los cambios sin necesidad de recargar a mano.
    function onFocusBack() {
      if (document.visibilityState === 'visible') refresh(false)
    }
    document.addEventListener('visibilitychange', onFocusBack)
    window.addEventListener('focus', onFocusBack)

    return () => {
      active = false
      document.removeEventListener('visibilitychange', onFocusBack)
      window.removeEventListener('focus', onFocusBack)
    }
    // `key` identifica la consulta; `run` se asume estable para esa key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { data, loading }
}

// Borra la caché de una clave (o de todas). Lo usa el panel tras guardar para
// que la web pública refleje el cambio sin recargar.
export function invalidate(prefix) {
  if (!prefix) return cache.clear()
  for (const k of cache.keys()) if (k.startsWith(prefix)) cache.delete(k)
}

// ---- Fotos de una categoría (galería) --------------------------------------
export function usePhotos(category) {
  const { data, loading } = useQuery(`photos:${category}`, () =>
    restGet(
      `photos?select=*&category=eq.${encodeURIComponent(category)}&published=eq.true` +
        `&order=sort_order.asc,created_at.asc`
    )
  )
  return { photos: data, loading }
}

// Normaliza las filas de la BD a la forma que esperan las páginas
// ({ img, alt, badge, title, desc }) o, si no hay, devuelve el array por defecto.
export function photosOr(dbPhotos, fallback) {
  if (!dbPhotos || dbPhotos.length === 0) return fallback
  return dbPhotos.map((p) => ({
    img: p.image_url,
    alt: p.alt || p.title || '',
    badge: p.badge || null,
    title: p.title || '',
    desc: p.description || '',
  }))
}

// URL de la primera foto de una categoría (huecos de 1 sola imagen).
export function firstPhotoUrl(dbPhotos, fallbackUrl) {
  return dbPhotos && dbPhotos.length > 0 ? dbPhotos[0].image_url : fallbackUrl
}

// ---- Eventos próximos (no caducados) ---------------------------------------
export function useEvents() {
  const { data, loading } = useQuery('events:upcoming', () =>
    restGet('events?select=*&published=eq.true&order=start_date.asc').then((rows) => {
      const today = new Date().toISOString().slice(0, 10)
      return (rows ?? []).filter((e) => {
        const until = e.end_date || e.start_date
        return !until || until >= today
      })
    })
  )
  return { events: data, loading }
}

// ---- Texto editable por clave ----------------------------------------------
export function useContent(key, fallback) {
  const { data } = useQuery(`content:${key}`, () =>
    restGet(`content?select=value&key=eq.${encodeURIComponent(key)}`).then((rows) =>
      rows && rows.length ? rows[0].value : null
    )
  )
  return data === null || data === undefined ? fallback : data
}

// ---- Datos del negocio (mezclados sobre los de site.js) --------------------
export function useBusiness() {
  const { data } = useQuery('business', () =>
    restGet('business?select=*&id=eq.1').then((rows) => (rows && rows.length ? rows[0] : null))
  )
  return mergeBusiness(data)
}

// Mezcla la fila de la BD sobre los valores por defecto de site.js. Cualquier
// campo vacío en la BD se rellena con el de site.js, de forma que la web siempre
// tiene datos coherentes.
function mergeBusiness(row) {
  if (!row) return site
  const pick = (val, def) => (val === null || val === undefined || val === '' ? def : val)
  return {
    ...site,
    name: pick(row.name, site.name),
    brand: { ...site.brand, slogan: pick(row.slogan, site.brand.slogan) },
    formerName: pick(row.former_name, site.formerName),
    tagline: pick(row.tagline, site.tagline),
    phoneHuman: pick(row.phone_human, site.phoneHuman),
    phoneTel: pick(row.phone_tel, site.phoneTel),
    whatsapp: pick(row.whatsapp, site.whatsapp),
    whatsappMessage: pick(row.whatsapp_message, site.whatsappMessage),
    email: pick(row.email, site.email),
    address: { ...site.address, ...(row.address || {}) },
    hours: Array.isArray(row.hours) && row.hours.length ? row.hours : site.hours,
    social: { ...site.social, ...(row.social || {}) },
    formEndpoint: pick(row.form_endpoint, site.formEndpoint),
  }
}
