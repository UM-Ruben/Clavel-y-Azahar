// Pantalla de inicio de sesión del panel. El email de la dueña es fijo:
// ni el inicio de sesión ni la recuperación aceptan otro destinatario.
import { useState } from 'react'
import { isSupabaseConfigured } from '../lib/supabase'
import Logo from '../components/Logo'
import { ADMIN_EMAIL } from '../config/admin'

export default function Login({ onSignIn, onReset }) {
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | error
  const [message, setMessage] = useState('')

  async function submit(e) {
    e.preventDefault()
    setStatus('sending')
    setMessage('')
    try {
      await onSignIn(password)
      // Si va bien, useAuth detecta la sesión y AdminApp muestra el panel.
    } catch (err) {
      setStatus('error')
      setMessage(traducirError(err))
    }
  }

  async function reset() {
    setStatus('sending')
    setMessage('')
    try {
      await onReset()
      setStatus('idle')
      setMessage('Te hemos enviado un email para restablecer la contraseña.')
    } catch {
      setStatus('error')
      setMessage('No se ha podido enviar el email de recuperación.')
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 font-body">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <Logo className="h-16 w-auto mb-4" />
          <h1 className="font-headline text-3xl text-primary">Panel de gestión</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Acceso privado de la floristería
          </p>
        </div>

        {!isSupabaseConfigured ? (
          <div className="bg-error-container text-on-error-container rounded-lg p-5 text-sm">
            <p className="font-semibold mb-1">Falta configurar Supabase</p>
            <p>
              Añade <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> en el archivo
              <code> .env.local</code> y reinicia. Tienes los pasos en <code>SETUP_PANEL.md</code>.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-7 shadow-sm flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="login-email" className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                value={ADMIN_EMAIL}
                readOnly
                aria-readonly="true"
                className="input-elegant bg-surface-container-low w-full py-2 font-body-md text-body-md text-on-surface-variant cursor-not-allowed"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="login-pass" className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                Contraseña
              </label>
              <input
                id="login-pass"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-elegant bg-transparent w-full py-2 font-body-md text-body-md text-on-surface"
              />
            </div>

            {message && (
              <p className={`font-body-md text-sm ${status === 'error' ? 'text-error' : 'text-surface-tint'}`} role="alert">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="mt-2 bg-primary text-on-primary font-label-sm text-label-sm py-3.5 px-8 uppercase tracking-widest hover:bg-surface-tint transition-colors disabled:opacity-60"
            >
              {status === 'sending' ? 'Entrando…' : 'Entrar'}
            </button>

            <button
              type="button"
              onClick={reset}
              disabled={status === 'sending'}
              className="text-sm text-on-surface-variant hover:text-primary transition-colors underline-offset-2 hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
            >
              ¿Has olvidado la contraseña?
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function traducirError(err) {
  const msg = (err?.message || '').toLowerCase()
  if (msg.includes('invalid login')) return 'Contraseña incorrecta.'
  if (msg.includes('email not confirmed')) return 'La cuenta aún no está confirmada.'
  return 'No se ha podido iniciar sesión. Revisa los datos e inténtalo de nuevo.'
}
