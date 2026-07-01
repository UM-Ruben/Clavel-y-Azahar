// Envoltorio de la ruta /demo: activa el modo demo (fotos de ejemplo) sobre
// las MISMAS páginas públicas. Solo existe con `pnpm dev` — ver src/App.jsx,
// que solo registra esta ruta cuando `import.meta.env.DEV` es true, así que
// no se genera ni se puede visitar en el build de producción.
import { NavLink, Outlet } from 'react-router-dom'
import Footer from '../../components/Footer'
import WhatsAppButton from '../../components/WhatsAppButton'
import { DemoModeProvider } from '../../lib/demoMode'

const LINKS = [
  { to: '/demo', label: 'Inicio', end: true },
  { to: '/demo/colecciones', label: 'Colecciones' },
  { to: '/demo/servicios', label: 'Servicios' },
  { to: '/demo/contacto', label: 'Contacto' },
]

export default function DemoLayout() {
  return (
    <DemoModeProvider>
      <div className="bg-surface text-on-surface antialiased font-body min-h-screen flex flex-col">
        <div className="bg-[#061b0e] text-white sticky top-0 z-[60] px-4 py-2.5 flex flex-wrap items-center gap-x-6 gap-y-1">
          <strong className="uppercase tracking-wider text-xs">Modo demo</strong>
          <span className="text-white/70 text-xs hidden sm:inline">
            Con fotos de ejemplo — no existe en la web publicada
          </span>
          <nav className="flex gap-4 ml-auto text-sm">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) => (isActive ? 'underline font-semibold' : 'text-white/80 hover:text-white')}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <main className="flex-grow">
          <Outlet />
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    </DemoModeProvider>
  )
}
