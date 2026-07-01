import { NavLink } from 'react-router-dom'
import Logo from './Logo'
import { useBusiness } from '../lib/content'

export default function Navbar() {
  const site = useBusiness()
  const linkBase =
    'font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors duration-300'
  const linkActive =
    'font-body-md text-body-md text-primary font-bold border-b-2 border-primary pb-1'

  return (
    <nav className="bg-surface/80 backdrop-blur-md fixed top-0 w-full border-b border-outline-variant z-50">
      {/* Desktop bar */}
      <div className="flex justify-between items-center h-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        {/* Emblema (sello) + nombre en Playfair legible + eslogan del traspaso.
            El texto del emblema es muy fino a este tamaño, por eso el nombre se
            repite al lado en grande para que se lea bien. */}
        <NavLink
          to="/"
          aria-label={`${site.name} — Inicio`}
          className="flex items-center gap-3 text-primary"
        >
          <Logo className="h-12 w-auto md:h-14 shrink-0" />
          <span className="flex flex-col leading-tight">
            <span className="font-headline text-xl md:text-2xl text-primary tracking-tight">
              {site.name}
            </span>
            <span className="font-body-md text-[9px] md:text-[10px] uppercase tracking-[0.15em] md:tracking-[0.18em] text-on-surface-variant whitespace-nowrap">
              {site.brand.slogan}
            </span>
          </span>
        </NavLink>

        {/* Desktop links. Aparecen en lg (1024px), no en md: el bloque
            logo+nombre+eslogan + 5 enlaces + teléfono necesita ~1000px para no
            solaparse (margin-desktop = 80px a cada lado). Por debajo de lg se
            usa la fila de enlaces compacta de abajo. */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? linkActive : linkBase)}
          >
            Inicio
          </NavLink>
          <NavLink
            to="/colecciones"
            className={({ isActive }) => (isActive ? linkActive : linkBase)}
          >
            Colecciones
          </NavLink>
          <NavLink
            to="/servicios"
            className={({ isActive }) => (isActive ? linkActive : linkBase)}
          >
            Servicios
          </NavLink>
          <NavLink
            to="/eventos"
            className={({ isActive }) => (isActive ? linkActive : linkBase)}
          >
            Eventos
          </NavLink>
          <NavLink
            to="/contacto"
            className={({ isActive }) => (isActive ? linkActive : linkBase)}
          >
            Contacto
          </NavLink>
        </div>

        {/* Click-to-call */}
        <div className="flex items-center gap-4 text-primary">
          <a
            href={`tel:${site.phoneTel}`}
            aria-label={`Llamar a ${site.name}`}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity focus-visible:outline-2"
          >
            <span className="material-symbols-outlined" aria-hidden="true">call</span>
            {/* El número solo desde xl: en lg el navbar ya va justo de ancho. */}
            <span className="hidden xl:inline font-body-md text-body-md">{site.phoneHuman}</span>
          </a>
        </div>
      </div>

      {/* Enlaces en fila (móvil y tablet, por debajo de lg) */}
      <div className="lg:hidden border-t border-outline-variant/60">
        <div className="px-margin-mobile py-3 flex gap-5 overflow-x-auto text-sm text-on-surface-variant">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? 'text-primary font-semibold whitespace-nowrap' : 'whitespace-nowrap'
            }
          >
            Inicio
          </NavLink>
          <NavLink
            to="/colecciones"
            className={({ isActive }) =>
              isActive ? 'text-primary font-semibold whitespace-nowrap' : 'whitespace-nowrap'
            }
          >
            Colecciones
          </NavLink>
          <NavLink
            to="/servicios"
            className={({ isActive }) =>
              isActive ? 'text-primary font-semibold whitespace-nowrap' : 'whitespace-nowrap'
            }
          >
            Servicios
          </NavLink>
          <NavLink
            to="/eventos"
            className={({ isActive }) =>
              isActive ? 'text-primary font-semibold whitespace-nowrap' : 'whitespace-nowrap'
            }
          >
            Eventos
          </NavLink>
          <NavLink
            to="/contacto"
            className={({ isActive }) =>
              isActive ? 'text-primary font-semibold whitespace-nowrap' : 'whitespace-nowrap'
            }
          >
            Contacto
          </NavLink>
        </div>
      </div>
    </nav>
  )
}
