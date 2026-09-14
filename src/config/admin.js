// Configuración privada del acceso de la dueña. El correo se incluye en el
// JavaScript del navegador, así que no es un secreto: la seguridad real la
// garantizan Supabase Auth y las políticas RLS del servidor.
export const ADMIN_PATH = '/naniPanel'
export const ADMIN_EMAIL = 'entreramblasclavelyazahar@gmail.com'

export function isAuthorizedAdminEmail(value) {
  return String(value || '').trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()
}
