// ============================================================================
//  CLIENTE SUPABASE  —  único punto de conexión con la base de datos
// ----------------------------------------------------------------------------
//  Lee las credenciales de las variables de entorno (archivo `.env.local` en
//  local, y «Environment Variables» en Vercel). La `anon key` es PÚBLICA y se
//  puede exponer sin riesgo: la seguridad real la imponen las políticas RLS de
//  Postgres (ver `supabase/schema.sql`), que solo permiten escribir a la dueña
//  cuando ha iniciado sesión.
//
//  Si las variables no están definidas (p. ej. antes de configurar Supabase),
//  `supabase` vale `null` y TODA la web sigue funcionando con sus valores por
//  defecto (los textos/fotos actuales), sin romperse. Ver `src/lib/content.js`.
// ============================================================================
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL as url, SUPABASE_ANON_KEY as anonKey, isSupabaseConfigured } from './rest'

// Reexportado para la UI del panel (mostrar avisos si faltan las credenciales).
export { isSupabaseConfigured }

// En el navegador la sesión se guarda y se renueva sola; durante el build (SSG,
// sin navegador) se desactiva la persistencia para no tocar `localStorage`.
const isBrowser = typeof window !== 'undefined'

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: isBrowser,
        autoRefreshToken: isBrowser,
      },
    })
  : null

// Nombre del bucket de Storage donde se guardan las fotos subidas desde el panel.
export const MEDIA_BUCKET = 'media'
export const ORIGINALS_BUCKET = 'media-originals'
export const STAGING_BUCKET = 'media-staging'
export const HISTORY_BUCKET = 'media-history'
