import { Link } from 'react-router-dom'
import { site } from '../config/site'
import Seo from '../components/Seo'
import { useEvents } from '../lib/content'
import SmartImage from '../components/SmartImage'

export default function Eventos() {
  const { events } = useEvents()
  const list = events || []

  return (
    <div className="pt-32 pb-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">
      <Seo
        title={`Eventos y talleres | ${site.name}`}
        description={`Próximos talleres, fechas especiales y eventos florales en ${site.address.district}, ${site.address.city}.`}
        path="/eventos"
      />

      <div className="text-center mb-20">
        <h1 className="font-display-lg text-display-lg text-primary mb-6">Eventos y Talleres</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          Talleres de arte floral, fechas señaladas y citas especiales en nuestra floristería.
          Reserva tu plaza o pregúntanos por los próximos eventos.
        </p>
        <div className="h-[0.5px] w-24 bg-on-tertiary-container mx-auto mt-12" />
      </div>

      {list.length === 0 ? (
        <div className="text-center py-16 max-w-xl mx-auto">
          <span className="material-symbols-outlined text-5xl text-outline-variant" aria-hidden="true">
            spa
          </span>
          <p className="font-headline-md text-headline-md text-primary mt-6 mb-3">
            Pronto anunciaremos nuevas fechas
          </p>
          <p className="font-body-md text-body-md text-on-surface-variant mb-8">
            Ahora mismo no tenemos eventos programados. Escríbenos y te avisamos del próximo taller.
          </p>
          <Link
            to="/contacto"
            className="inline-block bg-primary text-on-primary font-label-sm text-label-sm px-8 py-4 uppercase tracking-widest hover:bg-surface-tint transition-colors"
          >
            Quiero que me avisen
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-gutter gap-y-16">
          {list.map((e) => (
            <article key={e.id} className="group flex flex-col">
              {e.image_url && (
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-low mb-6">
                  <SmartImage
                    src={e.image_url}
                    alt={e.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}
              {formatRange(e) && (
                <p className="font-label-sm text-label-sm text-on-tertiary-container uppercase tracking-[0.15em] mb-2">
                  {formatRange(e)}
                </p>
              )}
              <h2 className="font-headline-md text-[24px] leading-[32px] text-primary mb-2">{e.title}</h2>
              {e.location && (
                <p className="font-body-md text-sm text-on-surface-variant mb-3 flex items-center gap-1">
                  <span className="material-symbols-outlined text-base" aria-hidden="true">location_on</span>
                  {e.location}
                </p>
              )}
              {e.description && (
                <p className="font-body-md text-body-md text-on-surface-variant whitespace-pre-line">{e.description}</p>
              )}
              <Link
                to="/contacto"
                className="mt-5 inline-block border-b border-on-tertiary-container pb-1 font-label-sm text-label-sm text-primary uppercase tracking-widest hover:text-on-tertiary-container transition-colors w-fit"
              >
                Más información
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function formatRange(e) {
  if (!e.start_date) return ''
  const start = formatDate(e.start_date)
  if (e.end_date && e.end_date !== e.start_date) return `${start} – ${formatDate(e.end_date)}`
  return start
}
function formatDate(iso) {
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}
