import { useBusiness } from '../lib/content'
import { waDigits } from '../config/site'

export default function WhatsAppButton() {
  const site = useBusiness()

  // Se normaliza a solo dígitos: la dueña puede escribir el número con «+»,
  // espacios o guiones (igual que el teléfono) y el enlace de wa.me funciona.
  const digits = waDigits(site.whatsapp)

  // No mostrar el botón si aún no hay número real (vacío o el de ejemplo).
  if (!digits || digits === '34600000000') return null

  const whatsappUrl = `https://wa.me/${digits}?text=${encodeURIComponent(site.whatsappMessage || '')}`

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-on-primary shadow-lg hover:bg-surface-tint transition-colors duration-300 focus-visible:outline-2"
    >
      <span className="material-symbols-outlined" aria-hidden="true" style={{ fontVariationSettings: "'FILL' 1" }}>
        chat
      </span>
    </a>
  )
}
