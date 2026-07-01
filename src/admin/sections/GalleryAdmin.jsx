// Sección «Galería de fotos» del panel. Permite a la dueña elegir una zona de
// la web (cabeceras, destacados, colecciones…) y subir, editar, reordenar y
// borrar sus fotos. Si una zona se queda sin fotos, la web real muestra un
// hueco neutro (nunca fotos de mentira) — ver src/lib/demoMode.jsx.
import { useEffect, useMemo, useState } from 'react'
import { GALLERY_SECTIONS, FIELD_LABELS } from '../galleryConfig'
import { listPhotos, addPhoto, updatePhoto, deletePhoto, swapPhotoOrder } from '../db'
import ImageUploader from '../components/ImageUploader'
import ConfirmDialog from '../components/ConfirmDialog'
import SectionPreview from '../components/SectionPreview'
import { useToast } from '../components/Toast'

export default function GalleryAdmin() {
  const groups = useMemo(() => {
    const m = new Map()
    for (const s of GALLERY_SECTIONS) {
      if (!m.has(s.group)) m.set(s.group, [])
      m.get(s.group).push(s)
    }
    return [...m.entries()]
  }, [])

  const [active, setActive] = useState(GALLERY_SECTIONS[0].key)
  const section = GALLERY_SECTIONS.find((s) => s.key === active)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[224px_1fr] gap-6">
      {/* Selector de sección */}
      <aside className="lg:border-r lg:border-outline-variant lg:pr-4">
        <nav className="flex flex-col gap-5">
          {groups.map(([group, sections]) => (
            <div key={group}>
              <p className="font-label-sm text-label-sm text-on-tertiary-container uppercase tracking-wider mb-2">{group}</p>
              <div className="flex flex-col gap-1">
                {sections.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setActive(s.key)}
                    className={`text-left px-3 py-2 rounded-lg font-body-md text-sm leading-snug transition-colors ${
                      active === s.key ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Editor de la sección activa */}
      <SectionEditor key={active} section={section} />
    </div>
  )
}

function SectionEditor({ section }) {
  const toast = useToast()
  const [photos, setPhotos] = useState(null)
  const [confirm, setConfirm] = useState(null) // foto a borrar
  const [busy, setBusy] = useState(false)
  const [pendingPreview, setPendingPreview] = useState(null) // foto elegida sin subir aún

  async function load() {
    try {
      setPhotos(await listPhotos(section.key))
    } catch {
      toast.error('No se pudieron cargar las fotos.')
      setPhotos([])
    }
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.key])

  async function handleUploaded({ url, path }) {
    try {
      const nextOrder = photos && photos.length ? Math.max(...photos.map((p) => p.sort_order)) + 1 : 0
      // En secciones de una sola imagen, sustituimos la anterior.
      if (section.single && photos && photos.length) {
        for (const old of photos) await deletePhoto(old)
      }
      const created = await addPhoto(section.key, { url, path }, nextOrder)
      setPhotos((prev) => (section.single ? [created] : [...(prev || []), created]))
    } catch {
      toast.error('No se pudo guardar la foto.')
    }
  }

  async function patch(photo, fields) {
    try {
      await updatePhoto(photo.id, fields, section.key)
      setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, ...fields } : p)))
      toast.ok('Cambios guardados.')
    } catch {
      toast.error('No se pudo guardar el cambio.')
    }
  }

  async function move(index, dir) {
    const other = index + dir
    if (!photos || other < 0 || other >= photos.length) return
    try {
      await swapPhotoOrder(photos[index], photos[other])
      const copy = [...photos]
      ;[copy[index], copy[other]] = [copy[other], copy[index]]
      setPhotos(copy)
    } catch {
      toast.error('No se pudo reordenar.')
    }
  }

  async function remove(photo) {
    setBusy(true)
    try {
      await deletePhoto(photo)
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
      toast.ok('Foto borrada.')
    } catch {
      toast.error('No se pudo borrar.')
    } finally {
      setBusy(false)
      setConfirm(null)
    }
  }

  const showUploader = !section.single || !photos || photos.length === 0

  return (
    <div>
      <header className="mb-6">
        <h2 className="font-headline text-2xl text-primary">{section.label}</h2>
        {section.help && <p className="font-body-md text-sm text-on-surface-variant mt-1">{section.help}</p>}
        {!section.single && (
          <p className="font-body-md text-sm text-on-surface-variant mt-1">
            Si borras todas las fotos, esta sección se ocultará en la web hasta que subas alguna.
          </p>
        )}
      </header>

      {photos === null ? (
        <p className="font-body-md text-on-surface-variant">Cargando…</p>
      ) : (
        <div className="space-y-6">
          {section.single ? (
            <div className="flex flex-col sm:flex-row gap-8">
              <div className="max-w-[320px] w-full">
                {/* La `key` fuerza a recrear el uploader cuando cambia (o se
                    quita) la foto: así su vista previa interna se reinicia y no
                    se queda enseñando la imagen anterior. */}
                <ImageUploader
                  key={photos[0]?.id || 'nueva'}
                  folder={section.key}
                  currentUrl={photos[0]?.image_url || null}
                  onUploaded={handleUploaded}
                  onPending={setPendingPreview}
                  label={photos.length ? 'Cambiar foto' : 'Subir foto'}
                  aspect={section.aspect}
                />
                {photos[0] && (
                  <>
                    <button
                      type="button"
                      onClick={() => setConfirm(photos[0])}
                      className="mt-3 text-sm text-error hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-base" aria-hidden="true">delete</span>
                      Quitar foto
                    </button>
                    <div className="mt-4">
                      <PhotoFields key={photos[0].id} photo={photos[0]} fields={section.fields} onChange={patch} />
                    </div>
                  </>
                )}
              </div>
              <SectionPreview sectionKey={section.key} page={section.group} imageUrl={pendingPreview || photos[0]?.image_url || null} />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {photos.map((p, i) => (
                  <div key={p.id} className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-lowest">
                    <div className="p-4 pb-0">
                      <SectionPreview
                        sectionKey={section.key}
                        page={section.group}
                        imageUrl={p.image_url}
                        fields={{ title: p.title, desc: p.description, badge: p.badge }}
                      />
                    </div>
                    <div className="p-4 space-y-3">
                      <PhotoFields photo={p} fields={section.fields} onChange={patch} />
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex gap-1">
                          <IconBtn label="Subir" disabled={i === 0} onClick={() => move(i, -1)}>arrow_upward</IconBtn>
                          <IconBtn label="Bajar" disabled={i === photos.length - 1} onClick={() => move(i, 1)}>arrow_downward</IconBtn>
                        </div>
                        <button
                          onClick={() => setConfirm(p)}
                          className="text-sm text-error hover:underline flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-base" aria-hidden="true">delete</span>
                          Borrar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {showUploader && (
                <div className="max-w-md">
                  <ImageUploader
                    key={photos.length}
                    folder={section.key}
                    onUploaded={handleUploaded}
                    label="Añadir foto"
                    aspect={section.aspect}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        message="Esta foto se borrará de la web y del almacenamiento. No se puede deshacer."
        busy={busy}
        onConfirm={() => remove(confirm)}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}

// Campos editables de una foto. Los cambios NO se guardan solos: se escriben en
// un borrador y solo se aplican al pulsar «Guardar cambios» (el botón se activa
// únicamente cuando hay algo distinto de lo que ya está publicado).
function PhotoFields({ photo, fields, onChange }) {
  const savedValues = () => Object.fromEntries(fields.map((f) => [f, photo[mapField(f)] || '']))
  const [draft, setDraft] = useState(savedValues)
  const [saving, setSaving] = useState(false)
  const setField = (f, v) => setDraft((d) => ({ ...d, [f]: v }))
  const reset = () => setDraft(savedValues())

  const dirty = fields.some((f) => draft[f] !== (photo[mapField(f)] || ''))

  async function handleSave() {
    const changed = {}
    for (const f of fields) {
      const col = mapField(f)
      if ((photo[col] || '') !== draft[f]) changed[col] = draft[f]
    }
    if (!Object.keys(changed).length) return
    setSaving(true)
    try {
      await onChange(photo, changed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      {fields.map((f) => (
        <label key={f} className="block">
          <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">{FIELD_LABELS[f]}</span>
          {f === 'desc' ? (
            <textarea
              value={draft[f]}
              rows={2}
              onChange={(e) => setField(f, e.target.value)}
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm resize-none focus:border-primary focus:outline-none"
            />
          ) : (
            <input
              type="text"
              value={draft[f]}
              onChange={(e) => setField(f, e.target.value)}
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          )}
        </label>
      ))}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={reset}
          disabled={!dirty || saving}
          className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant text-sm font-semibold disabled:opacity-40 hover:bg-surface-container transition-colors"
        >
          Restablecer
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold disabled:opacity-40 hover:bg-surface-tint transition-colors"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}

// El nombre de campo de la UI ('desc') -> columna de la BD ('description').
function mapField(f) {
  return f === 'desc' ? 'description' : f
}

function IconBtn({ children, label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="w-8 h-8 rounded-lg border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed"
    >
      <span className="material-symbols-outlined text-lg" aria-hidden="true">{children}</span>
    </button>
  )
}
