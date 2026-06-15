import { Link } from 'react-router-dom'
import { site } from '../config/site'
import Seo from '../components/Seo'
import { usePhotos, firstPhotoUrl, useContent, useEvents } from '../lib/content'
import { textDefaults, subscriptionsDefault } from '../lib/textDefaults'

// Imágenes por defecto de las secciones (se usan si la dueña no sube las suyas).
const SERVICIOS_HERO_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBPLY2_-qiBRDnXH5lGAaecWZXMmHrVeOVnohRacBAtcq1N6RbD1b8xInP65wVIrsR8MlyqK24FwtTPv5aDmTPL1Sqz2nuMXI-SYRerGdfqQJmDZUmoz98DUoFDpMJcCEJ1VZ9POSUmG7mhCYEwpQIDN6NNDCeirRmmKW6WsxEpXWSrJ0rR46YPj5MdS4EX0MGHMSVT_yZnlyCscPP38n0kxmcvQcCUpcuqeHyB9dkPvB-mbdAPzxuFDMeUSnTbGrDrmWmazr91QXc'
const SERVICIOS_BODAS_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBE__Xm1eFzB5YrwxibImh_PP6RlLmafxIr-BY-PjrW0HL9xCO_nBgwoST9rWnLJJonCEMg_kF86dhsGTGPH-W1T2dt5dajJJTjB91CJ4RPR3t5mMJWCPitES6V8Qtv4qENZFfwVbfajHnxSrO1rGr6XnHtMlt9p9LiGSpoX9CG6FMlL-iKbRbU0_iXq9HwRGt7uYMQR38s7nhFVugoWn3BZfb4vNOWCy78B61QfZHoIjBH1BAr3pgWHM3-NNhpA4uM86ESiD_qhHk'
const SERVICIOS_TALLER_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCoQCDSPnc-KJx1DrdprOhMxT81hOef8fd30ZrIqa2MQNrhFQ99TDBR3Yp3s55afIdSgPLoWthRePVWzkM7sPrJPHqb_GRNaprSnVxnRJS1Kjc2-_ihBvSAuYkKCSaxM_KMmqFaSEfj2kYOiPmq58T4bghKQrjMN3oZ7BtZsj3Pr92wmx4n_DUb-qU_VSZplmC8FsMySwQlWSnRCvagVEdM76q-H_FTBdmw1cYYvJFW1_pgMLjzlK7mdvSb20aM96nYSghW_nhy6nw'

export default function Servicios() {
  const { photos: heroDb } = usePhotos('servicios_hero')
  const { photos: bodasDb } = usePhotos('servicios_bodas')
  const { photos: tallerDb } = usePhotos('servicios_taller')
  const heroTitulo = useContent('servicios_hero_titulo', textDefaults.servicios_hero_titulo)
  const heroTexto = useContent('servicios_hero_texto', textDefaults.servicios_hero_texto)
  const bodasTexto = useContent('servicios_bodas_texto', textDefaults.servicios_bodas_texto)
  const tallerTexto = useContent('servicios_taller_texto', textDefaults.servicios_taller_texto)
  const subscriptions = useContent('servicios_suscripciones', subscriptionsDefault)

  const { events } = useEvents()
  const nextEvent = events && events.length ? events[0] : null

  return (
    <div className="pt-[120px] pb-section-gap overflow-hidden">
      <Seo
        title={`Flores para bodas, eventos y talleres | ${site.name}`}
        description={`Diseño floral para bodas y eventos, suscripciones florales y talleres de arte floral en ${site.address.city}.`}
        path="/servicios"
      />
      {/* Hero */}
      <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop mb-section-gap">
        <div className="relative w-full h-[716px] min-h-[500px] flex items-end pb-12 px-8 md:px-16 overflow-hidden">
          {/* Background */}
          <div
            className="absolute inset-0 bg-surface-container-high"
            style={{
              backgroundImage: `url('${firstPhotoUrl(heroDb, SERVICIOS_HERO_IMG)}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          {/* Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/60 to-transparent" />
          {/* Content */}
          <div className="relative z-10 max-w-3xl">
            <h1 className="font-display-lg text-display-lg text-surface-bright mb-4 drop-shadow-md">
              {heroTitulo}
            </h1>
            <p className="font-body-lg text-body-lg text-surface-container mb-8 max-w-xl whitespace-pre-line">
              {heroTexto}
            </p>
            <Link
              to="/contacto"
              className="inline-flex items-center justify-center px-8 py-4 bg-primary text-on-primary font-label-sm text-label-sm uppercase tracking-widest hover:bg-surface-tint transition-colors duration-300"
            >
              Pedir información
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-container-max mx-auto px-margin-desktop mb-section-gap flex justify-center">
        <div className="h-[1px] w-32 bg-on-tertiary-container/30" />
      </div>

      {/* Bodas y Eventos */}
      <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop mb-section-gap">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
          {/* Text */}
          <div className="md:col-span-5 md:pr-12 order-2 md:order-1">
            <span className="font-label-sm text-label-sm text-on-tertiary-container uppercase tracking-[0.15em] mb-4 block">
              01 / Servicios
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary mb-6">
              Bodas y Eventos
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mb-8 leading-relaxed whitespace-pre-line">
              {bodasTexto}
            </p>
            <ul className="space-y-4 mb-10">
              {['Ramos y Flores de Novia', 'Instalaciones para la Ceremonia', 'Decoración del Banquete'].map((item) => (
                <li key={item} className="flex items-center text-body-md text-on-surface">
                  <span
                    className="material-symbols-outlined text-surface-tint mr-3"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    spa
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/contacto"
              className="inline-block border-b border-on-tertiary-container pb-1 font-label-sm text-label-sm text-primary uppercase tracking-widest hover:text-on-tertiary-container transition-colors"
            >
              Consultar porfolio
            </Link>
          </div>
          {/* Image */}
          <div className="md:col-span-7 order-1 md:order-2 mb-10 md:mb-0">
            <img
              alt="Decoración floral para mesa de banquete de boda"
              className="w-full h-auto aspect-[4/5] object-cover"
              src={firstPhotoUrl(bodasDb, SERVICIOS_BODAS_IMG)}
              width="800"
              height="1000"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* Suscripciones Florales */}
      <section className="bg-surface-container-low py-section-gap mb-section-gap">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="font-label-sm text-label-sm text-on-tertiary-container uppercase tracking-[0.15em] mb-4 block">
              02 / Envíos periódicos
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary mb-6">
              Suscripciones Florales
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Lleva la fragancia y frescura de nuestra boutique a tu hogar de forma regular. Nuestras suscripciones están diseñadas con las mejores flores frescas de temporada elegidas personalmente por nuestros floristas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {subscriptions.map((sub, i) => (
              <div
                key={sub.title || i}
                className="bg-surface p-10 border-[0.5px] border-outline-variant/50 hover:border-surface-tint transition-colors duration-300 flex flex-col h-full group relative"
              >
                {sub.featured && (
                  <div className="absolute top-4 right-4 bg-tertiary-fixed-dim text-on-tertiary-fixed px-3 py-1 rounded-xl font-label-sm text-label-sm">
                    Más popular
                  </div>
                )}
                {sub.img && (
                  <div className="mb-8 overflow-hidden">
                    <img
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      src={sub.img}
                      alt={`Suscripción floral ${sub.title}`}
                      width="600"
                      height="400"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                )}
                <h3 className="font-headline-md text-headline-md text-primary mb-2">{sub.title}</h3>
                <p className="font-label-sm text-label-sm text-on-tertiary-container mb-6">{sub.freq}</p>
                <p className="font-body-md text-body-md text-on-surface-variant mb-8 flex-grow">{sub.desc}</p>
                <Link
                  to="/contacto"
                  className={`w-full py-3 font-label-sm text-label-sm uppercase tracking-widest text-center transition-colors block ${
                    sub.featured
                      ? 'bg-primary text-on-primary hover:bg-surface-tint'
                      : 'border border-on-tertiary-container text-primary hover:bg-on-tertiary-container hover:text-surface-bright'
                  }`}
                >
                  Pedir información
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Talleres de Arte Floral */}
      <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
          {/* Image */}
          <div className="md:col-span-6 mb-10 md:mb-0">
            <img
              alt="Taller de arte floral en nuestro estudio"
              className="w-full h-auto aspect-square object-cover"
              src={firstPhotoUrl(tallerDb, SERVICIOS_TALLER_IMG)}
              width="800"
              height="800"
              loading="lazy"
              decoding="async"
            />
          </div>
          {/* Text */}
          <div className="md:col-span-5 md:col-start-8">
            <span className="font-label-sm text-label-sm text-on-tertiary-container uppercase tracking-[0.15em] mb-4 block">
              03 / Educación
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary mb-6">
              Talleres de Arte Floral
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mb-8 leading-relaxed whitespace-pre-line">
              {tallerTexto}
            </p>
            <div className="bg-surface-container-low p-6 mb-8 border-l-2 border-surface-tint">
              <p className="font-label-sm text-label-sm text-primary mb-1">PRÓXIMO TALLER:</p>
              <p className="font-body-md text-body-md text-on-surface font-medium">
                {nextEvent ? nextEvent.title : 'Masterclass de Centros de Mesa de Primavera'}
              </p>
              <p className="font-body-md text-body-md text-on-surface-variant text-sm mt-1">
                {nextEvent ? formatEventDate(nextEvent) : 'Sábado, 12 de abril | 10:00 AM - 1:00 PM'}
              </p>
            </div>
            <Link
              to={nextEvent ? '/eventos' : '/contacto'}
              className="inline-block border-b border-on-tertiary-container pb-1 font-label-sm text-label-sm text-primary uppercase tracking-widest hover:text-on-tertiary-container transition-colors"
            >
              {nextEvent ? 'Ver eventos' : 'Consultar plazas'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function formatEventDate(e) {
  if (!e.start_date) return ''
  try {
    const d = new Date(e.start_date + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    return e.location ? `${d} · ${e.location}` : d
  } catch {
    return e.start_date
  }
}
