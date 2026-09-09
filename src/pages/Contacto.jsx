import { useState } from 'react'
import Seo from '../components/Seo'
import { useBusiness, usePhotos, firstPhotoUrl, firstPhotoAlt, useContent } from '../lib/content'
import { textDefaults } from '../lib/textDefaults'
import { useDemoMode } from '../lib/demoMode'
import SmartImage from '../components/SmartImage'
import { getGallerySection } from '../config/gallery'

const LOCAL_ASPECT = getGallerySection('contacto_local').aspect

// Autoalojada en /public/demo (ver nota en Inicio.jsx).
const CONTACTO_LOCAL_IMG = '/demo/contacto-local.jpg'

export default function Contacto() {
  const demoMode = useDemoMode()
  const b = useBusiness()
  const { photos: localDb, loading: localLoading } = usePhotos('contacto_local')
  const localImg = firstPhotoUrl(localDb, CONTACTO_LOCAL_IMG, demoMode)
  const localAlt = firstPhotoAlt(localDb, `Fachada de ${b.name} en ${b.address.district}, ${b.address.city}`, demoMode)
  const intro = useContent('contacto_intro', textDefaults.contacto_intro)

  const [formData, setFormData] = useState({ name: '', email: '', message: '', website: '' })
  // 'idle' | 'sending' | 'sent' | 'error'
  const [status, setStatus] = useState('idle')

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${b.address.street}, ${b.address.postalCode} ${b.address.city}`
  )}`

  async function handleSubmit(e) {
    e.preventDefault()
    // Honeypot anti-spam: si este campo oculto viene relleno, es un bot.
    if (formData.website) return
    setStatus('sending')

    // Modo demo mientras el endpoint siga siendo el placeholder de la plantilla.
    if (!b.formEndpoint || b.formEndpoint.includes('TU_ID_FORMULARIO')) {
      setStatus('sent')
      return
    }

    try {
      const res = await fetch(b.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message,
        }),
      })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  const sent = status === 'sent'
  const sending = status === 'sending'

  return (
    <div className="flex-grow pt-[140px] pb-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">
      <Seo
        title={`Contacto y tienda en ${b.address.district}, ${b.address.city} | ${b.name}`}
        description={`Visítanos en ${b.address.district}, ${b.address.city}. Horario, teléfono, cómo llegar y formulario de contacto.`}
        path="/contacto"
      />
      {/* Hero title */}
      <header className="mb-16 md:mb-24 text-center md:text-left max-w-3xl">
        <h1 className="font-display-lg text-display-lg text-primary mb-6">Visítanos</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant whitespace-pre-line">{intro}</p>
      </header>

      {/* Grid: form + location */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-gutter">
        {/* Left: Form */}
        <section className="lg:col-span-5 flex flex-col gap-12">
          <div className="bg-surface-container-lowest p-8 md:p-10 border border-outline-variant/30 rounded-DEFAULT shadow-sm">
            <h2 className="font-headline-md text-headline-md text-primary mb-8">
              Envíanos un mensaje
            </h2>
            {sent ? (
              <div className="py-10 text-center" role="status" aria-live="polite">
                <span
                  className="material-symbols-outlined text-5xl text-surface-tint block mb-4"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  check_circle
                </span>
                <p className="font-headline-md text-headline-md text-primary mb-2">
                  ¡Mensaje enviado!
                </p>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Gracias por escribirnos. Nos pondremos en contacto contigo muy pronto.
                </p>
              </div>
            ) : (
              <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
                {/* Honeypot oculto (no rellenar) */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
                <div className="flex flex-col gap-2">
                  <label
                    className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider"
                    htmlFor="name"
                  >
                    Nombre
                  </label>
                  <input
                    className="input-elegant bg-transparent w-full py-2 font-body-md text-body-md text-on-surface placeholder:text-outline-variant"
                    id="name"
                    placeholder="Tu nombre completo"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider"
                    htmlFor="email"
                  >
                    Email
                  </label>
                  <input
                    className="input-elegant bg-transparent w-full py-2 font-body-md text-body-md text-on-surface placeholder:text-outline-variant"
                    id="email"
                    placeholder="tucorreo@ejemplo.com"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider"
                    htmlFor="message"
                  >
                    Tu consulta
                  </label>
                  <textarea
                    className="input-elegant bg-transparent w-full py-2 font-body-md text-body-md text-on-surface placeholder:text-outline-variant resize-none"
                    id="message"
                    placeholder="Cuéntanos en qué podemos ayudarte"
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>

                {status === 'error' && (
                  <p className="font-body-md text-body-md text-error" role="alert">
                    No se ha podido enviar el mensaje. Inténtalo de nuevo o escríbenos por
                    WhatsApp o teléfono.
                  </p>
                )}

                <button
                  className="mt-4 bg-primary text-on-primary font-label-sm text-label-sm py-4 px-8 uppercase tracking-widest hover:bg-surface-tint transition-colors duration-300 w-fit disabled:opacity-60 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={sending}
                >
                  {sending ? 'Enviando…' : 'Enviar mensaje'}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Right: Location */}
        <section className="lg:col-span-7 flex flex-col gap-8">
          {/* Mapa / Cómo llegar */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Cómo llegar a ${b.name} en Google Maps`}
            style={{ aspectRatio: String(LOCAL_ASPECT) }}
            className="relative block w-full aspect-[4/3] bg-surface-container overflow-hidden group focus-visible:outline-2"
          >
            <SmartImage
              alt={localAlt}
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              src={localImg}
              pending={localLoading}
              width="800"
              height="600"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 border border-on-tertiary-container/20 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 drop-shadow-md">
              <div className="bg-surface rounded-full p-3 shadow-lg border border-outline-variant/20 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  location_on
                </span>
              </div>
            </div>
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 bg-surface/90 text-primary font-label-sm text-label-sm uppercase tracking-widest px-5 py-3 border border-on-tertiary-container/40">
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                directions
              </span>
              Cómo llegar
            </span>
          </a>

          {/* Info grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-on-tertiary-container/30 pt-8">
            {/* Address */}
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <span
                  className="material-symbols-outlined text-primary mt-1"
                  aria-hidden="true"
                >
                  storefront
                </span>
                <div>
                  <h3 className="font-headline-md text-[24px] leading-[32px] text-primary mb-1">
                    Nuestra tienda
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {b.address.street}
                    <br />
                    {b.address.district}
                    <br />
                    {b.address.postalCode} {b.address.city}, {b.address.country}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="material-symbols-outlined text-primary" aria-hidden="true">
                  call
                </span>
                <a
                  className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
                  href={`tel:${b.phoneTel}`}
                >
                  {b.phoneHuman}
                </a>
              </div>
            </div>

            {/* Hours */}
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary mt-1" aria-hidden="true">
                schedule
              </span>
              <div>
                <h3 className="font-headline-md text-[24px] leading-[32px] text-primary mb-2">
                  Horario
                </h3>
                <ul className="font-body-md text-body-md text-on-surface-variant space-y-1">
                  {b.hours.map((h) => (
                    <li
                      key={h.days}
                      className={`flex justify-between w-48 ${h.closed ? 'text-outline' : ''}`}
                    >
                      <span>{h.days}</span>
                      <span>{h.time}</span>
                    </li>
                  ))}
                </ul>
                <p className="font-label-sm text-label-sm text-on-tertiary-container mt-4 uppercase">
                  Cita previa recomendada para bodas
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
