import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ADMIN_EMAIL, ADMIN_PATH, isAuthorizedAdminEmail } from '../config/admin'

const CONNECTION_ERROR = 'No se ha podido conectar con Supabase. Comprueba la conexión y vuelve a intentarlo.'

export async function withAuthTimeout(operation, milliseconds = 10000) {
  let timer
  try {
    return await Promise.race([
      operation,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(CONNECTION_ERROR)), milliseconds) }),
    ])
  } finally { clearTimeout(timer) }
}

async function checkOwner() {
  const { data, error } = await supabase.rpc('is_admin')
  if (error) {
    if (error.code === 'PGRST202' || error.code === '42883') {
      throw new Error('Falta actualizar el panel en Supabase. Aplica la migración indicada en SETUP_PANEL.md.')
    }
    throw new Error(CONNECTION_ERROR)
  }
  if (data === true) return true
  const claim = await supabase.rpc('claim_initial_admin')
  if (claim.error) throw new Error(CONNECTION_ERROR)
  return claim.data === true
}

export function useAuth() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [recovery, setRecovery] = useState(false)
  const [authError, setAuthError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let disposed = false
    let generation = 0
    if (!supabase) { setReady(true); return }

    async function resolveSession(pendingSession) {
      const current = ++generation
      setReady(false)
      setAuthError('')
      setIsOwner(false)
      try {
        const next = await withAuthTimeout(pendingSession)
        if (disposed || current !== generation) return
        setSession(next)
        const owner = next && isAuthorizedAdminEmail(next.user?.email)
          ? await withAuthTimeout(checkOwner())
          : false
        if (!disposed && current === generation) setIsOwner(owner)
      } catch (error) {
        if (!disposed && current === generation) setAuthError(error.message || CONNECTION_ERROR)
      } finally {
        if (!disposed && current === generation) setReady(true)
      }
    }

    void resolveSession(supabase.auth.getSession().then(({ data, error }) => {
      if (error) throw error
      return data.session
    }))
    // Keep this callback synchronous: Auth holds its session lock while notifying listeners.
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      if (event === 'INITIAL_SESSION') return // handled by getSession above
      setTimeout(() => { if (!disposed) void resolveSession(Promise.resolve(next)) }, 0)
    })
    return () => { disposed = true; generation++; sub.subscription.unsubscribe() }
  }, [attempt])

  async function signIn(password) {
    if (!supabase) throw new Error('Supabase no está configurado.')
    const { error } = await withAuthTimeout(supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password }))
    if (error) throw error
  }

  async function signOut() {
    try {
      if (supabase) {
        const { error } = await withAuthTimeout(supabase.auth.signOut({ scope: 'local' }))
        if (error) throw error
      }
      setSession(null)
      setIsOwner(false)
      setAuthError('')
      setRecovery(false)
    } catch { setAuthError(CONNECTION_ERROR) }
  }

  async function resetPassword() {
    if (!supabase) throw new Error('Supabase no está configurado.')
    const redirectTo = `${window.location.origin}${ADMIN_PATH}`
    const { error } = await withAuthTimeout(supabase.auth.resetPasswordForEmail(ADMIN_EMAIL, { redirectTo }))
    if (error) throw error
  }

  async function updatePassword(password) {
    if (!supabase) throw new Error('Supabase no está configurado.')
    const { error } = await withAuthTimeout(supabase.auth.updateUser({ password }))
    if (error) throw error
    setRecovery(false)
  }

  return { session, ready, isOwner, recovery, authError, retry: () => setAttempt((value) => value + 1), signIn, signOut, resetPassword, updatePassword }
}
