// Sección «Textos» del panel. Edita la copia (títulos y descripciones) de las
// páginas y las tarjetas de suscripción. Cada texto cae a su valor por defecto
// (src/lib/textDefaults.js) si la dueña no lo ha cambiado.
import { useEffect, useState } from 'react'
import { getAllContent, saveContent, uploadEventMedia } from '../db'
import { textDefaults, subscriptionsDefault } from '../../lib/textDefaults'
import ImageUploader from '../components/ImageUploader'
import { useToast } from '../components/Toast'

// Campos de texto simples, agrupados por página.
const TEXT_GROUPS = [
  {
    group: 'Inicio',
    fields: [
      { key: 'inicio_hero_titulo', label: 'Título principal', multiline: true },
      { key: 'inicio_hero_texto', label: 'Texto de presentación', multiline: true },
    ],
  },
  {
    group: 'Colecciones',
    fields: [{ key: 'colecciones_intro', label: 'Texto de introducción', multiline: true }],
  },
  {
    group: 'Servicios',
    fields: [
      { key: 'servicios_hero_titulo', label: 'Título de cabecera', multiline: true },
      { key: 'servicios_hero_texto', label: 'Texto de cabecera', multiline: true },
      { key: 'servicios_bodas_texto', label: 'Texto de «Bodas y Eventos»', multiline: true },
      { key: 'servicios_taller_texto', label: 'Texto de «Talleres»', multiline: true },
    ],
  },
  {
    group: 'Contacto',
    fields: [{ key: 'contacto_intro', label: 'Texto de introducción', multiline: true }],
  },
]

export default function TextsAdmin() {
  const toast = useToast()
  const [values, setValues] = useState(null)
  const [savingKey, setSavingKey] = useState(null)

  useEffect(() => {
    getAllContent()
      .then((map) => setValues(map))
      .catch(() => {
        toast.error('No se pudieron cargar los textos.')
        setValues({})
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function save(key, value) {
    setSavingKey(key)
    try {
      await saveContent(key, value)
      setValues((v) => ({ ...v, [key]: value }))
      toast.ok('Texto guardado.')
    } catch {
      toast.error('No se pudo guardar.')
    } finally {
      setSavingKey(null)
    }
  }

  if (values === null) return <p className="font-body-md text-on-surface-variant">Cargando…</p>

  return (
    <div className="max-w-2xl space-y-10">
      <header>
        <h2 className="font-headline text-2xl text-primary">Textos de la web</h2>
        <p className="font-body-md text-sm text-on-surface-variant mt-1">
          Cambia los títulos y descripciones. Si dejas un campo vacío, se usa el texto original.
        </p>
      </header>

      {TEXT_GROUPS.map((g) => (
        <section key={g.group}>
          <p className="font-label-sm text-label-sm text-on-tertiary-container uppercase tracking-wider mb-4">{g.group}</p>
          <div className="space-y-6">
            {g.fields.map((f) => (
              <TextField
                key={f.key}
                field={f}
                value={values[f.key] ?? textDefaults[f.key] ?? ''}
                saving={savingKey === f.key}
                onSave={(val) => save(f.key, val)}
              />
            ))}
          </div>
        </section>
      ))}

      {/* Tarjetas de suscripción (estructura) */}
      <SubscriptionsEditor
        value={values['servicios_suscripciones'] || subscriptionsDefault}
        saving={savingKey === 'servicios_suscripciones'}
        onSave={(arr) => save('servicios_suscripciones', arr)}
      />
    </div>
  )
}

function TextField({ field, value, saving, onSave }) {
  const [draft, setDraft] = useState(value)
  const dirty = draft !== value
  return (
    <div>
      <label className="block">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{field.label}</span>
        {field.multiline ? (
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} className="admin-input resize-none mt-1.5" />
        ) : (
          <input type="text" value={draft} onChange={(e) => setDraft(e.target.value)} className="admin-input mt-1.5" />
        )}
      </label>
      <div className="flex justify-end mt-2">
        <button
          onClick={() => onSave(draft)}
          disabled={!dirty || saving}
          className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold disabled:opacity-40 hover:bg-surface-tint transition-colors"
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

function SubscriptionsEditor({ value, saving, onSave }) {
  const [cards, setCards] = useState(value)
  const setCard = (i, patch) => setCards((cs) => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)))

  return (
    <section>
      <p className="font-label-sm text-label-sm text-on-tertiary-container uppercase tracking-wider mb-4">
        Servicios — Tarjetas de suscripción
      </p>
      <div className="space-y-6">
        {cards.map((card, i) => (
          <div key={i} className="border border-outline-variant rounded-xl p-5 bg-surface-container-lowest grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-5">
            <ImageUploader
              currentUrl={card.img || null}
              label=""
              aspect={4 / 3}
              onUploaded={async (upload) => {
                const result = await uploadEventMedia(upload, 'suscripciones')
                setCard(i, { img: result.url, image_path: result.path, original_path: result.originalPath })
                return result
              }}
            />
            <div className="space-y-3">
              <input value={card.title || ''} onChange={(e) => setCard(i, { title: e.target.value })} placeholder="Nombre del plan" className="admin-input" />
              <input value={card.freq || ''} onChange={(e) => setCard(i, { freq: e.target.value })} placeholder="Frecuencia (ej. ENTREGA SEMANAL)" className="admin-input" />
              <textarea value={card.desc || ''} onChange={(e) => setCard(i, { desc: e.target.value })} rows={2} placeholder="Descripción" className="admin-input resize-none" />
              <label className="flex items-center gap-2 text-sm text-on-surface">
                <input type="checkbox" checked={!!card.featured} onChange={(e) => setCard(i, { featured: e.target.checked })} className="w-4 h-4 accent-[#061b0e]" />
                Destacar como «Más popular»
              </label>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-3">
        <button
          onClick={() => onSave(cards)}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold disabled:opacity-40 hover:bg-surface-tint transition-colors"
        >
          {saving ? 'Guardando…' : 'Guardar suscripciones'}
        </button>
      </div>
    </section>
  )
}
