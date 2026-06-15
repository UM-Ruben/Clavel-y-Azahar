// ============================================================================
//  AUTENTICACIÓN  —  sesión de la dueña (Supabase Auth)
// ----------------------------------------------------------------------------
//  Hook que expone la sesión actual y las acciones de login/logout. La sesión
//  se guarda en el navegador y se renueva sola. La seguridad real (quién puede
//  escribir) la imponen las políticas RLS de Postgres, no este hook: aquí solo
//  controlamos qué se MUESTRA.
// ============================================================================
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setReady(true)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    if (!supabase) throw new Error('Supabase no está configurado.')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut()
  }

  async function resetPassword(email) {
    if (!supabase) throw new Error('Supabase no está configurado.')
    const redirectTo = `${window.location.origin}/admin`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) throw error
  }

  return { session, ready, signIn, signOut, resetPassword }
}
