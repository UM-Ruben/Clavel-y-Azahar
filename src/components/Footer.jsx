import { Link } from 'react-router-dom'
import Logo from './Logo'
import { useBusiness } from '../lib/content'

function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" {...props}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M14 9h2.5V6H14c-2 0-3.5 1.5-3.5 3.5V11H8v3h2.5v7h3v-7H16l.5-3h-3v-1.3c0-.5.3-.7.8-.7Z" />
    </svg>
  )
}

export default function Footer() {
  const site = useBusiness()
  const year = new Date().getFullYear()

  const socials = [
    { key: 'instagram', url: site.social.instagram, label: 'Instagram', Icon: InstagramIcon, placeholder: 'tu_floristeria' },
    { key: 'facebook', url: site.social.facebook, label: 'Facebook', Icon: FacebookIcon, placeholder: 'tu_floristeria' },
  ].filter((s) => s.url && !s.url.includes(s.placeholder))

  return (
    <footer className="bg-surface-container-low w-full pt-16 pb-10 border-t border-outline-variant/50">
      <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        {/* Rejilla repartida: marca (emblema + nombre) | Explora | Contacto */}
        <div className="grid grid-cols-2 md:grid-cols-12 gap-x-8 gap-y-12 items-start">
          {/* Marca: emblema + nombre, alineado para que no quede suelto */}
          <div className="col-span-2 md:col-span-6">
            <div className="flex items-center gap-4 text-primary">
              <Logo className="h-24 w-auto shrink-0" />
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="font-headline text-2xl text-primary">{site.name}</span>
                <span className="font-body-md text-[10px] uppercase tracking-[0.18em] text-on-surface-variant leading-relaxed">
                  {site.brand.slogan}
                </span>
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mt-6 max-w-sm">
              Escaparate de floristería boutique. Diseño floral estacional, decoración de espacios
              y atención personalizada en tienda en {site.address.district}, {site.address.city}.
            </p>

            {socials.length > 0 && (
              <div className="flex items-center gap-4 mt-6 text-primary">
                {socials.map(({ key, url, label, Icon }) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="hover:opacity-70 transition-opacity focus-visible:outline-2"
                  >
                    <Icon className="w-6 h-6" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Explora */}
          <nav className="col-span-1 md:col-span-3">
            <p className="uppercase tracking-widest text-xs text-on-tertiary-container mb-4 font-semibold">
              Explora
            </p>
            <div className="space-y-3 text-on-surface-variant">
              <Link className="block hover:text-primary transition-colors font-body-md text-body-md" to="/colecciones">
                Colecciones
              </Link>
              <Link className="block hover:text-primary transition-colors font-body-md text-body-md" to="/servicios">
                Servicios
              </Link>
              <Link className="block hover:text-primary transition-colors font-body-md text-body-md" to="/eventos">
                Eventos
              </Link>
              <Link className="block hover:text-primary transition-colors font-body-md text-body-md" to="/contacto">
                Contacto
              </Link>
            </div>
          </nav>

          {/* Contacto */}
          <div className="col-span-1 md:col-span-3">
            <p className="uppercase tracking-widest text-xs text-on-tertiary-container mb-4 font-semibold">
              Contacto
            </p>
            <address className="not-italic space-y-3 text-on-surface-variant">
              <p className="font-body-md text-body-md">
                {site.address.street}
                <br />
                {site.address.postalCode} {site.address.city}
              </p>
              <a
                className="block hover:text-primary transition-colors font-body-md text-body-md"
                href={`tel:${site.phoneTel}`}
              >
                {site.phoneHuman}
              </a>
              <p className="font-body-md text-body-md text-sm opacity-80">
                {site.hours[0].days}: {site.hours[0].time}
              </p>
            </address>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="mt-14 pt-6 border-t border-outline-variant/40">
          <p className="font-body-md text-sm text-on-surface-variant opacity-70">
            © {year} {site.name}. Hecho a mano con cariño.
          </p>
        </div>
      </div>
    </footer>
  )
}
