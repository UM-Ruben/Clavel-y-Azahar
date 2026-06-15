// ============================================================================
//  LECTURA LIGERA DE SUPABASE (REST)  —  para la WEB PÚBLICA
// ----------------------------------------------------------------------------
//  La web pública solo necesita LEER contenido, así que lo hace con `fetch` a la
//  API REST de Supabase (PostgREST). Así NO cargamos la librería completa
//  `@supabase/supabase-js` (auth + realtime + storage) en la web pública, que
//  queda mucho más ligera y rápida. Esa librería se usa únicamente en el panel.
//
//  La «anon key» es pública y solo permite leer lo publicado (lo impone RLS).
// ============================================================================
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

// Hace un GET a /rest/v1/<query> y devuelve el array de filas (o [] si falla).
export async function restGet(query) {
  if (!isSupabaseConfigured) return []
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  })
  if (!res.ok) throw new Error(`Supabase REST ${res.status}`)
  return res.json()
}
