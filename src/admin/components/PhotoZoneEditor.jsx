// Editor de una «zona de fotos»: sube, reencuadra, ordena, oculta, retira y
// restaura fotos de una categoría. Lo usan tanto las zonas fijas de la web
// (ver GALLERY_SECTIONS en src/config/gallery.js, gestionadas desde la
// pestaña «Galería») como los apartados que la dueña crea libremente en
// «Nuestras Colecciones» (pestaña «Colecciones»): a ambos les basta con
// describir su zona como un objeto `section` ({ key, label, fields, aspect… }).
import { useCallback, useEffect, useState } from 'react'
import { FIELD_LABELS, canAddPhoto } from '../../config/gallery'
import {
  listPhotos, publishPhoto, updatePhoto, removePhoto, setPhotoVisibility,
  reorderPhotos, listPhotoHistory, restorePhoto,
} from '../db'
import ImageUploader from './ImageUploader'
import ConfirmDialog from './ConfirmDialog'
import SectionPreview from './SectionPreview'
import { useToast } from './Toast'

export default function PhotoZoneEditor({ section }) {
  const toast = useToast()
  const [photos, setPhotos] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [pendingPreview, setPendingPreview] = useState(null)

  const refreshHistory = useCallback(async ({ announceError = false } = {}) => {
    setHistoryLoading(true)
    try {
      setHistory(await listPhotoHistory(section.key))
      setHistoryError('')
      return true
    } catch (error) {
      const message = error?.message || 'No se pudo actualizar el historial.'
      setHistoryError(message)
      if (announceError) toast.error(message)
      return false
    } finally {
      setHistoryLoading(false)
    }
  }, [section.key, toast])

  const load = useCallback(async () => {
    const [photosResult] = await Promise.allSettled([
      listPhotos(section.key),
      refreshHistory(),
    ])
    if (photosResult.status === 'fulfilled') setPhotos(photosResult.value)
    else {
      toast.error(photosResult.reason?.message || 'No se pudieron cargar las fotos.')
      setPhotos([])
    }
  }, [section.key, refreshHistory, toast])

  useEffect(() => { void load() }, [load])
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') void refreshHistory() }
    window.addEventListener('focus', refresh)
    const timer = window.setInterval(refresh, 60_000)
    return () => {
      window.removeEventListener('focus', refresh)
      window.clearInterval(timer)
    }
  }, [refreshHistory])

  async function handleUploaded(upload, currentPhoto = null) {
    const created = await publishPhoto(section.key, upload, currentPhoto)
    setPhotos((previous) => currentPhoto
      ? previous.map((photo) => photo.id === currentPhoto.id ? created : photo)
      : [...(previous || []), created])
    setPendingPreview(null)
    await refreshHistory({ announceError: true })
    return created
  }

  async function patch(photo, fields) {
    try {
      const updated = await updatePhoto(photo, fields)
      setPhotos((previous) => previous.map((item) => item.id === photo.id ? updated : item))
      toast.ok('Cambios guardados.')
    } catch (error) {
      toast.error(conflictMessage(error, 'No se pudo guardar el cambio.'))
    }
  }

  async function move(index, direction) {
    const other = index + direction
    if (!photos || other < 0 || other >= photos.length) return
    const ordered = [...photos]
    ;[ordered[index], ordered[other]] = [ordered[other], ordered[index]]
    try {
      const saved = await reorderPhotos(section.key, ordered.map((photo) => photo.id))
      setPhotos(saved)
    } catch (error) {
      toast.error(conflictMessage(error, 'No se pudo reordenar. Recarga la zona e inténtalo de nuevo.'))
    }
  }

  async function remove(photo) {
    setBusy(true)
    try {
      await removePhoto(photo)
      setPhotos((previous) => previous.filter((item) => item.id !== photo.id))
      await refreshHistory()
      toast.ok('Foto enviada a la papelera durante 30 días.')
    } catch (error) {
      toast.error(conflictMessage(error, 'No se pudo retirar la foto.'))
    } finally {
      setBusy(false)
      setConfirm(null)
    }
  }

  async function toggle(photo) {
    try {
      const updated = await setPhotoVisibility(photo, !photo.published)
      setPhotos((previous) => previous.map((item) => item.id === photo.id ? updated : item))
      toast.ok(updated.published ? 'Foto visible en la web.' : 'Foto oculta en la web.')
    } catch (error) {
      toast.error(conflictMessage(error, 'No se pudo cambiar la visibilidad.'))
    }
  }

  async function restore(revision) {
    setBusy(true)
    try {
      const restored = await restorePhoto(revision.id, section.key)
      await load()
      toast.ok(`Se ha recuperado la revisión ${restored.revision}.`)
    } catch (error) {
      toast.error(conflictMessage(error, 'No se pudo recuperar esa versión.'))
    } finally {
      setBusy(false)
    }
  }

  const activeCount = photos?.filter((photo) => photo.published).length || 0
  const showUploader = photos && canAddPhoto(section, activeCount)
  const single = section.single ? photos?.[0] : null

  return (
    <div className="min-w-0">
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-headline text-2xl text-primary">{section.label}</h2>
          {section.maxItems && (
            <span className="rounded-full bg-surface-container px-3 py-1 text-xs text-on-surface-variant">
              {activeCount} de {section.maxItems}
            </span>
          )}
        </div>
        {section.help && <p className="font-body-md text-sm text-on-surface-variant mt-1">{section.help}</p>}
        <p className="font-body-md text-sm text-on-surface-variant mt-1">
          Ajusta el encuadre y comprueba móvil y escritorio antes de publicar.
        </p>
      </header>

      {photos === null ? (
        <p className="font-body-md text-on-surface-variant" role="status">Cargando…</p>
      ) : (
        <div className="space-y-8">
          {section.single ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div className="max-w-md w-full">
                <ImageUploader
                  key={single?.id || 'nueva'}
                  currentUrl={single?.image_url || null}
                  onUploaded={(upload) => handleUploaded(upload, single || null)}
                  onPending={setPendingPreview}
                  label={single ? 'Cambiar o reencuadrar' : 'Subir foto'}
                  aspect={section.aspect}
                />
                {single && (
                  <div className="mt-5 space-y-4">
                    <PhotoFields key={`${single.id}-${single.revision}`} photo={single} fields={section.fields} onChange={patch} />
                    <PhotoActions photo={single} onToggle={toggle} onRemove={setConfirm} />
                  </div>
                )}
              </div>
              <SectionPreview
                sectionKey={section.key}
                page={section.group}
                imageUrl={pendingPreview?.url || single?.image_url || null}
                crop={pendingPreview?.crop || null}
              />
            </div>
          ) : (
            <>
              {photos.length === 0 && (
                <div className="border border-dashed border-outline-variant rounded-xl p-8 text-center text-on-surface-variant">
                  Esta zona está vacía y permanecerá oculta en la web.
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {photos.map((photo, index) => (
                  <PhotoCard
                    key={`${photo.id}-${photo.revision}`}
                    photo={photo}
                    section={section}
                    index={index}
                    total={photos.length}
                    onReplace={(upload) => handleUploaded(upload, photo)}
                    onPatch={patch}
                    onMove={move}
                    onToggle={toggle}
                    onRemove={setConfirm}
                  />
                ))}
              </div>
              {showUploader && (
                <div className="max-w-md border-t border-outline-variant pt-6">
                  <ImageUploader key={photos.length} onUploaded={(upload) => handleUploaded(upload)} label="Añadir foto" aspect={section.aspect} />
                </div>
              )}
              {!showUploader && section.maxItems && (
                <p className="text-sm text-on-surface-variant">Has alcanzado el máximo de esta zona. Sustituye o retira una foto para cambiarlo.</p>
              )}
            </>
          )}

          <HistoryPanel
            current={photos}
            history={history}
            loading={historyLoading}
            error={historyError}
            busy={busy}
            onRefresh={() => refreshHistory({ announceError: true })}
            onRestore={restore}
          />
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title="¿Enviar la foto a la papelera?"
        message="Dejará de verse en la web, pero podrás recuperarla desde el historial durante 30 días."
        confirmLabel="Enviar a papelera"
        busyLabel="Retirando…"
        busy={busy}
        onConfirm={() => remove(confirm)}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}

function PhotoCard({ photo, section, index, total, onReplace, onPatch, onMove, onToggle, onRemove }) {
  const [editingImage, setEditingImage] = useState(false)
  return (
    <article className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-lowest">
      <div className="p-4 pb-0">
        {editingImage ? (
          <ImageUploader currentUrl={photo.image_url} onUploaded={async (upload) => {
            const result = await onReplace(upload)
            setEditingImage(false)
            return result
          }} label="Nuevo encuadre" aspect={section.aspect} />
        ) : (
          <SectionPreview sectionKey={section.key} page={section.group} imageUrl={photo.image_url}
            fields={{ title: photo.title, desc: photo.description, badge: photo.badge }} />
        )}
      </div>
      <div className="p-4 space-y-4">
        <button type="button" onClick={() => setEditingImage((value) => !value)}
          className="min-h-11 inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline">
          <span className="material-symbols-outlined text-lg" aria-hidden="true">crop</span>
          {editingImage ? 'Cerrar edición de imagen' : 'Cambiar o reencuadrar'}
        </button>
        <PhotoFields photo={photo} fields={section.fields} onChange={onPatch} />
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex gap-2">
            <IconBtn label="Subir" disabled={index === 0} onClick={() => onMove(index, -1)}>arrow_upward</IconBtn>
            <IconBtn label="Bajar" disabled={index === total - 1} onClick={() => onMove(index, 1)}>arrow_downward</IconBtn>
          </div>
          <PhotoActions photo={photo} onToggle={onToggle} onRemove={onRemove} />
        </div>
      </div>
    </article>
  )
}

function PhotoActions({ photo, onToggle, onRemove }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => onToggle(photo)} className="min-h-11 px-3 text-sm rounded-lg border border-outline-variant hover:bg-surface-container">
        {photo.published ? 'Ocultar' : 'Mostrar'}
      </button>
      <button type="button" onClick={() => onRemove(photo)} className="min-h-11 px-3 text-sm rounded-lg border border-error/40 text-error hover:bg-error-container">
        Papelera
      </button>
    </div>
  )
}

function PhotoFields({ photo, fields, onChange }) {
  const values = () => Object.fromEntries(fields.map((field) => [field, photo[mapField(field)] || '']))
  const [draft, setDraft] = useState(values)
  const [saving, setSaving] = useState(false)
  const dirty = fields.some((field) => draft[field] !== (photo[mapField(field)] || ''))

  async function save() {
    const changed = {}
    for (const field of fields) {
      const column = mapField(field)
      if ((photo[column] || '') !== draft[field]) changed[column] = draft[field]
    }
    if (!Object.keys(changed).length) return
    setSaving(true)
    try { await onChange(photo, changed) } finally { setSaving(false) }
  }

  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <label key={field} className="block">
          <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">{FIELD_LABELS[field]}</span>
          {field === 'desc' ? (
            <textarea value={draft[field]} rows={2} onChange={(e) => setDraft((old) => ({ ...old, [field]: e.target.value }))}
              className="admin-input mt-1 resize-none" />
          ) : (
            <input type="text" value={draft[field]} onChange={(e) => setDraft((old) => ({ ...old, [field]: e.target.value }))}
              className="admin-input mt-1" />
          )}
        </label>
      ))}
      {fields.length > 0 && (
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setDraft(values())} disabled={!dirty || saving}
            className="min-h-11 px-4 rounded-lg border border-outline-variant text-on-surface-variant text-sm font-semibold disabled:opacity-40 hover:bg-surface-container">
            Restablecer
          </button>
          <button type="button" onClick={save} disabled={!dirty || saving}
            className="min-h-11 px-4 rounded-lg bg-primary text-on-primary text-sm font-semibold disabled:opacity-40 hover:bg-surface-tint">
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      )}
    </div>
  )
}

function HistoryPanel({ current, history, loading, error, busy, onRefresh, onRestore }) {
  const [open, setOpen] = useState(false)
  const total = current.length + history.length
  return (
    <section className="border-t border-outline-variant pt-6">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}
        className="min-h-11 flex items-center gap-2 text-primary font-semibold">
        <span className="material-symbols-outlined" aria-hidden="true">history</span>
        Historial y papelera ({total})
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-on-surface-variant" aria-live="polite">
              {loading ? 'Actualizando historial…' : `${current.length} actuales · ${history.length} anteriores`}
            </p>
            <button type="button" onClick={onRefresh} disabled={loading}
              className="min-h-11 px-3 inline-flex items-center gap-2 rounded-lg border border-outline-variant text-sm text-primary hover:bg-surface-container disabled:opacity-50">
              <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`} aria-hidden="true">refresh</span>
              Actualizar
            </button>
          </div>
          {error && <p role="alert" className="text-sm text-error">{error}</p>}
          {current.map((item) => (
            <div key={`current-${item.id}`} className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary-fixed/20 p-3">
              <img src={item.image_url} alt="Versión actual" className="w-16 h-16 object-cover rounded-lg bg-surface-container" />
              <div className="min-w-0 flex-grow">
                <p className="text-sm font-semibold text-primary truncate">{item.title || 'Foto sin título'} · revisión {item.revision}</p>
                <p className="text-xs text-on-surface-variant">{item.published ? 'Versión visible actualmente' : 'Versión actual oculta'}</p>
              </div>
              <span className="rounded-full bg-primary px-3 py-1 text-xs text-on-primary">Actual</span>
            </div>
          ))}
          {history.length === 0 ? <p className="text-sm text-on-surface-variant">Todavía no hay versiones anteriores para restaurar.</p> : history.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-3">
              <img src={item.image_url} alt="Versión anterior" className="w-16 h-16 object-cover rounded-lg bg-surface-container" />
              <div className="min-w-0 flex-grow">
                <p className="text-sm font-semibold text-primary truncate">{item.title || 'Foto sin título'} · revisión {item.source_revision}</p>
                <p className="text-xs text-on-surface-variant">Disponible hasta {formatDate(item.expires_at)}</p>
              </div>
              <button type="button" disabled={busy} onClick={() => onRestore(item)}
                className="min-h-11 px-3 rounded-lg border border-primary text-sm text-primary hover:bg-surface-container disabled:opacity-50">
                Restaurar
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function mapField(field) { return field === 'desc' ? 'description' : field }
function formatDate(value) { return new Date(value).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) }
function conflictMessage(error, fallback) {
  const message = String(error?.message || '')
  if (message.includes('REVISION_CONFLICT') || message.includes('conflict')) return 'La foto cambió en otra sesión. Recarga esta zona antes de continuar.'
  if (message.includes('CATEGORY_LIMIT_REACHED')) return 'Esta zona ya ha alcanzado su límite de fotos.'
  return error?.message || fallback
}

function IconBtn({ children, label, onClick, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label}
      className="w-11 h-11 rounded-lg border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed">
      <span className="material-symbols-outlined text-lg" aria-hidden="true">{children}</span>
    </button>
  )
}
