// ============================================================================
//  PANEL DE ADMINISTRACIÓN  —  solo para la dueña
// ----------------------------------------------------------------------------
//  Se carga de forma diferida (lazy) y solo en el navegador, así que NO engorda
//  la web pública. Si no hay sesión, muestra el login; si la hay, el panel con
//  sus cuatro secciones. La seguridad real (escritura) la impone RLS, aquí solo
//  controlamos la navegación.
// ============================================================================
import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import Login from './Login'
import { ToastProvider } from './components/Toast'
import GalleryAdmin from './sections/GalleryAdmin'
import EventsAdmin from './sections/EventsAdmin'
import TextsAdmin from './sections/TextsAdmin'
import BusinessAdmin from './sections/BusinessAdmin'
import Logo from '../components/Logo'

const TABS = [
  { key: 'galeria', label: 'Galería', icon: 'image', Component: GalleryAdmin },
  { key: 'eventos', label: 'Eventos', icon: 'event', Component: EventsAdmin },
  { key: 'textos', label: 'Textos', icon: 'edit_note', Component: TextsAdmin },
  { key: 'negocio', label: 'Datos del negocio', icon: 'storefront', Component: BusinessAdmin },
]

export default function AdminApp() {
  // Carga la fuente de iconos completa y marca la página como no indexable.
  useEffect(() => {
    document.title = 'Panel · Clavel y Azahar'
    addOnce('meta', { name: 'robots', content: 'noindex, nofollow' })
    addOnce('link', {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL@24,400,0..1&display=swap',
    })
  }, [])

  return (
    <ToastProvider>
      <AdminInner />
    </ToastProvider>
  )
}

function AdminInner() {
  const { session, ready, signIn, signOut, resetPassword } = useAuth()
  const [tab, setTab] = useState('galeria')

  if (!ready) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="font-body-md text-on-surface-variant">Cargando…</p>
      </div>
    )
  }

  if (!session) {
    return <Login onSignIn={signIn} onReset={resetPassword} />
  }

  const Active = TABS.find((t) => t.key === tab).Component

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      {/* Cabecera */}
      <header className="border-b border-outline-variant bg-surface-container-lowest sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="h-11 w-auto" />
            <span className="font-headline text-lg text-primary hidden sm:inline">Panel de gestión</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-on-surface-variant hover:text-primary transition-colors hidden sm:inline">
              Ver la web
            </a>
            <button
              onClick={signOut}
              className="text-sm flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">logout</span>
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        {/* Pestañas */}
        <nav className="flex gap-1 mb-8 overflow-x-auto no-scrollbar border-b border-outline-variant">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 font-body-md text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        <Active />
      </div>
    </div>
  )
}

// Inserta una etiqueta en <head> solo si no existe ya (evita duplicados).
function addOnce(tag, attrs) {
  const selector = tag + Object.entries(attrs).map(([k, v]) => `[${k}="${v}"]`).join('')
  if (document.head.querySelector(selector)) return
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  document.head.appendChild(el)
}
