// Sección «Eventos» del panel. La dueña crea talleres, fechas señaladas, etc.,
// con foto, fechas y descripción. Los eventos pasados desaparecen solos de la
// web (filtro por fecha en src/lib/content.js).
import { useEffect, useState } from 'react'
import { listEvents, saveEvent, deleteEvent, uploadEventMedia } from '../db'
import ImageUploader from '../components/ImageUploader'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'

const EMPTY = {
  title: '',
  description: '',
  location: '',
  start_date: '',
  end_date: '',
  image_url: '',
  image_path: '',
  original_path: '',
  published: true,
}

export default function EventsAdmin() {
  const toast = useToast()
  const [events, setEvents] = useState(null)
  const [editing, setEditing] = useState(null) // objeto evento o null
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      setEvents(await listEvents())
    } catch {
      toast.error('No se pudieron cargar los eventos.')
      setEvents([])
    }
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function save(ev, previous) {
    if (!ev.title.trim()) {
      toast.error('El evento necesita un título.')
      return
    }
    setBusy(true)
    try {
      const clean = { ...ev, start_date: ev.start_date || null, end_date: ev.end_date || null }
      await saveEvent(clean, previous)
      toast.ok(ev.id ? 'Evento actualizado.' : 'Evento creado.')
      setEditing(null)
      await load()
    } catch {
      toast.error('No se pudo guardar el evento.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(ev) {
    setBusy(true)
    try {
      await deleteEvent(ev)
      setEvents((prev) => prev.filter((e) => e.id !== ev.id))
      toast.ok('Evento borrado.')
    } catch {
      toast.error('No se pudo borrar.')
    } finally {
      setBusy(false)
      setConfirm(null)
    }
  }

  if (editing) {
    return <EventForm event={editing} onCancel={() => setEditing(null)} onSave={save} busy={busy} />
  }

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-headline text-2xl text-primary">Eventos</h2>
          <p className="font-body-md text-sm text-on-surface-variant mt-1">
            Talleres, fechas especiales, ferias… Los eventos pasados se ocultan solos.
          </p>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="bg-primary text-on-primary px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider hover:bg-surface-tint transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg" aria-hidden="true">add</span>
          Nuevo evento
        </button>
      </header>

      {events === null ? (
        <p className="font-body-md text-on-surface-variant">Cargando…</p>
      ) : events.length === 0 ? (
        <p className="font-body-md text-on-surface-variant py-10 text-center border border-dashed border-outline-variant rounded-xl">
          Aún no hay eventos. Pulsa «Nuevo evento» para crear el primero.
        </p>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <div key={e.id} className="flex items-center gap-4 border border-outline-variant rounded-xl p-3 bg-surface-container-lowest">
              <div className="w-20 h-20 rounded-lg bg-surface-container-low overflow-hidden shrink-0">
                {e.image_url ? (
                  <img src={e.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-outline">
                    <span className="material-symbols-outlined" aria-hidden="true">event</span>
                  </div>
                )}
              </div>
              <div className="flex-grow min-w-0">
                <p className="font-headline text-lg text-primary truncate">{e.title}</p>
                <p className="font-body-md text-sm text-on-surface-variant">{formatRange(e)}</p>
                {e.location && <p className="font-body-md text-sm text-on-surface-variant truncate">{e.location}</p>}
                {!e.published && <span className="text-xs text-error">Oculto</span>}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setEditing(e)} className="px-3 py-2 rounded-lg border border-outline-variant text-sm hover:bg-surface-container">
                  Editar
                </button>
                <button onClick={() => setConfirm(e)} className="px-3 py-2 rounded-lg border border-error/40 text-error text-sm hover:bg-error-container">
                  Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        message={confirm ? `Se borrará el evento «${confirm.title}». No se puede deshacer.` : ''}
        busy={busy}
        onConfirm={() => remove(confirm)}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}

function EventForm({ event, onCancel, onSave, busy }) {
  const [form, setForm] = useState(event)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="max-w-2xl">
      <h2 className="font-headline text-2xl text-primary mb-6">{event.id ? 'Editar evento' : 'Nuevo evento'}</h2>
      <div className="space-y-5">
        <Field label="Título *">
          <input
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Ej. Taller de centros de primavera"
            className="admin-input"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Fecha de inicio">
            <input type="date" value={form.start_date || ''} onChange={(e) => set('start_date', e.target.value)} className="admin-input" />
          </Field>
          <Field label="Fecha de fin (opcional)">
            <input type="date" value={form.end_date || ''} onChange={(e) => set('end_date', e.target.value)} className="admin-input" />
          </Field>
        </div>

        <Field label="Lugar (opcional)">
          <input type="text" value={form.location || ''} onChange={(e) => set('location', e.target.value)} placeholder="Ej. En nuestra tienda" className="admin-input" />
        </Field>

        <Field label="Descripción">
          <textarea
            value={form.description || ''}
            onChange={(e) => set('description', e.target.value)}
            rows={4}
            placeholder="Cuenta de qué va el evento, horario, plazas…"
            className="admin-input resize-none"
          />
        </Field>

        <Field label="Foto (opcional)">
          <div className="max-w-sm">
            <ImageUploader
              currentUrl={form.image_url || null}
              label=""
              aspect={4 / 3}
              onUploaded={async (upload) => {
                const result = await uploadEventMedia(upload)
                setForm((f) => ({
                  ...f,
                  image_url: result.url,
                  image_path: result.path,
                  original_path: result.originalPath,
                }))
                return result
              }}
            />
          </div>
        </Field>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} className="w-4 h-4 accent-[#061b0e]" />
          <span className="font-body-md text-sm text-on-surface">Mostrar en la web</span>
        </label>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => onSave(form, event)}
            disabled={busy}
            className="bg-primary text-on-primary px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider hover:bg-surface-tint transition-colors disabled:opacity-60"
          >
            {busy ? 'Guardando…' : 'Guardar evento'}
          </button>
          <button onClick={onCancel} disabled={busy} className="px-6 py-3 rounded-lg border border-outline-variant text-sm font-semibold hover:bg-surface-container disabled:opacity-60">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  )
}

function formatRange(e) {
  if (!e.start_date) return 'Sin fecha'
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
