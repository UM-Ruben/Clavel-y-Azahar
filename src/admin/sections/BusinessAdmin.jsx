// Sección «Datos del negocio» del panel. Teléfono, WhatsApp, email, dirección,
// horario y redes. Estos datos alimentan el pie de página, la página de contacto
// y el botón de WhatsApp. Lo que se deje vacío usa el valor por defecto de site.js.
import { useEffect, useState } from 'react'
import { getBusiness, saveBusiness } from '../db'
import { site } from '../../config/site'
import { useToast } from '../components/Toast'

export default function BusinessAdmin() {
  const toast = useToast()
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getBusiness()
      .then((row) => setForm(fromRow(row)))
      .catch(() => {
        toast.error('No se pudieron cargar los datos.')
        setForm(fromRow(null))
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const setAddr = (k, v) => setForm((f) => ({ ...f, address: { ...f.address, [k]: v } }))
  const setSocial = (k, v) => setForm((f) => ({ ...f, social: { ...f.social, [k]: v } }))
  const setHour = (i, k, v) => setForm((f) => ({ ...f, hours: f.hours.map((h, j) => (j === i ? { ...h, [k]: v } : h)) }))
  const addHour = () => setForm((f) => ({ ...f, hours: [...f.hours, { days: '', time: '', closed: false }] }))
  const removeHour = (i) => setForm((f) => ({ ...f, hours: f.hours.filter((_, j) => j !== i) }))

  async function save() {
    setSaving(true)
    try {
      await saveBusiness(toRow(form))
      toast.ok('Datos guardados.')
    } catch {
      toast.error('No se pudieron guardar los datos.')
    } finally {
      setSaving(false)
    }
  }

  if (form === null) return <p className="font-body-md text-on-surface-variant">Cargando…</p>

  return (
    <div className="max-w-2xl space-y-10">
      <header>
        <h2 className="font-headline text-2xl text-primary">Datos del negocio</h2>
        <p className="font-body-md text-sm text-on-surface-variant mt-1">
          Aparecen en el pie de página, en la página de contacto y en el botón de WhatsApp.
        </p>
      </header>

      <Group title="Contacto">
        <Field label="Teléfono (cómo se muestra)"><input className="admin-input" value={form.phone_human} onChange={(e) => set('phone_human', e.target.value)} placeholder={site.phoneHuman} /></Field>
        <Field label="Teléfono (para llamar, sin espacios)"><input className="admin-input" value={form.phone_tel} onChange={(e) => set('phone_tel', e.target.value)} placeholder={site.phoneTel} /></Field>
        <Field label="Móvil (cómo se muestra)"><input className="admin-input" value={form.phone_mobile_human} onChange={(e) => set('phone_mobile_human', e.target.value)} placeholder={site.phoneMobileHuman} /></Field>
        <Field label="WhatsApp (con prefijo del país, ej. +34 600 00 00 00)"><input className="admin-input" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder={site.whatsapp} /></Field>
        <Field label="Mensaje inicial de WhatsApp"><input className="admin-input" value={form.whatsapp_message} onChange={(e) => set('whatsapp_message', e.target.value)} placeholder={site.whatsappMessage} /></Field>
        <Field label="Email"><input className="admin-input" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder={site.email} /></Field>
      </Group>

      <Group title="Dirección">
        <Field label="Calle y número"><input className="admin-input" value={form.address.street} onChange={(e) => setAddr('street', e.target.value)} placeholder={site.address.street} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Pedanía / barrio"><input className="admin-input" value={form.address.district} onChange={(e) => setAddr('district', e.target.value)} placeholder={site.address.district} /></Field>
          <Field label="Código postal"><input className="admin-input" value={form.address.postalCode} onChange={(e) => setAddr('postalCode', e.target.value)} placeholder={site.address.postalCode} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ciudad"><input className="admin-input" value={form.address.city} onChange={(e) => setAddr('city', e.target.value)} placeholder={site.address.city} /></Field>
          <Field label="Provincia"><input className="admin-input" value={form.address.region} onChange={(e) => setAddr('region', e.target.value)} placeholder={site.address.region} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Latitud"><input className="admin-input" value={form.address.lat} onChange={(e) => setAddr('lat', e.target.value)} placeholder={String(site.address.lat)} /></Field>
          <Field label="Longitud"><input className="admin-input" value={form.address.lng} onChange={(e) => setAddr('lng', e.target.value)} placeholder={String(site.address.lng)} /></Field>
        </div>
        <p className="font-body-md text-xs text-on-surface-variant">
          Las coordenadas se sacan de Google Maps: clic derecho sobre la tienda → «copiar coordenadas».
        </p>
      </Group>

      <Group title="Horario">
        <div className="space-y-3">
          {form.hours.map((h, i) => (
            <div key={i} className="flex items-center gap-3">
              <input className="admin-input flex-1" value={h.days} onChange={(e) => setHour(i, 'days', e.target.value)} placeholder="Lunes – Sábado" />
              <input className="admin-input flex-1" value={h.time} onChange={(e) => setHour(i, 'time', e.target.value)} placeholder="9:00 – 20:00" />
              <label className="flex items-center gap-1 text-xs text-on-surface-variant whitespace-nowrap">
                <input type="checkbox" checked={!!h.closed} onChange={(e) => setHour(i, 'closed', e.target.checked)} className="accent-[#061b0e]" />
                Cerrado
              </label>
              <button onClick={() => removeHour(i)} aria-label="Quitar fila" className="text-error">
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>
          ))}
          <button onClick={addHour} className="text-sm text-primary hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-base" aria-hidden="true">add</span>
            Añadir franja horaria
          </button>
        </div>
      </Group>

      <Group title="Redes sociales">
        <Field label="Instagram (URL)"><input className="admin-input" value={form.social.instagram} onChange={(e) => setSocial('instagram', e.target.value)} placeholder={site.social.instagram} /></Field>
        <Field label="Facebook (URL)"><input className="admin-input" value={form.social.facebook} onChange={(e) => setSocial('facebook', e.target.value)} placeholder={site.social.facebook} /></Field>
        <p className="font-body-md text-xs text-on-surface-variant">Deja la URL vacía para ocultar el icono de esa red.</p>
      </Group>

      <Group title="Formulario de contacto">
        <Field label="Endpoint de Formspree"><input className="admin-input" value={form.form_endpoint} onChange={(e) => set('form_endpoint', e.target.value)} placeholder={site.formEndpoint} /></Field>
      </Group>

      <div className="sticky bottom-0 bg-surface/90 backdrop-blur py-4 -mx-1 px-1 border-t border-outline-variant">
        <button
          onClick={save}
          disabled={saving}
          className="bg-primary text-on-primary px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider hover:bg-surface-tint transition-colors disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar todos los datos'}
        </button>
      </div>
    </div>
  )
}

// La fila de la BD usa nombres en minúsculas; el formulario los agrupa.
function fromRow(row) {
  const r = row || {}
  return {
    phone_human: r.phone_human || '',
    phone_tel: r.phone_tel || '',
    phone_mobile_human: r.phone_mobile_human || '',
    whatsapp: r.whatsapp || '',
    whatsapp_message: r.whatsapp_message || '',
    email: r.email || '',
    address: {
      street: '', district: '', postalCode: '', city: '', region: '', country: 'España', lat: '', lng: '',
      ...(r.address || {}),
    },
    hours: Array.isArray(r.hours) && r.hours.length ? r.hours : [{ days: '', time: '', closed: false }],
    social: { instagram: '', facebook: '', ...(r.social || {}) },
    form_endpoint: r.form_endpoint || '',
  }
}

function toRow(form) {
  return {
    phone_human: form.phone_human || null,
    phone_tel: form.phone_tel || null,
    phone_mobile_human: form.phone_mobile_human || null,
    whatsapp: form.whatsapp || null,
    whatsapp_message: form.whatsapp_message || null,
    email: form.email || null,
    address: cleanObject(form.address),
    hours: form.hours.filter((h) => h.days || h.time),
    social: cleanObject(form.social),
    form_endpoint: form.form_endpoint || null,
  }
}

// Quita claves vacías para no pisar los valores por defecto de site.js con "".
function cleanObject(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== '' && v !== null && v !== undefined) out[k] = v
  }
  return out
}

function Group({ title, children }) {
  return (
    <section>
      <p className="font-label-sm text-label-sm text-on-tertiary-container uppercase tracking-wider mb-4">{title}</p>
      <div className="space-y-4">{children}</div>
    </section>
  )
}
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  )
}
