// Sección «Colecciones» del panel: la dueña elige cuántos apartados hay en la
// página "Nuestras Colecciones", con su título, su breve descripción y sus
// fotos. Cada apartado es una fila en la tabla `collections`; sus fotos usan
// el mismo editor de zonas que el resto de la web (ver PhotoZoneEditor).
import { useEffect, useMemo, useState } from 'react'
import { listCollections, createCollection, updateCollection, reorderCollections, deleteCollection, collectionCategory } from '../db'
import PhotoZoneEditor from '../components/PhotoZoneEditor'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'

export default function CollectionsAdmin() {
  const toast = useToast()
  const [collections, setCollections] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      setCollections(await listCollections())
    } catch {
      toast.error('No se pudieron cargar los apartados.')
      setCollections([])
    }
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function add() {
    setBusy(true)
    try {
      const created = await createCollection()
      setCollections((previous) => [...(previous || []), created])
      setEditingId(created.id)
      toast.ok('Apartado creado. Ponle título, descripción y fotos.')
    } catch {
      toast.error('No se pudo crear el apartado.')
    } finally {
      setBusy(false)
    }
  }

  async function save(collection, fields) {
    const updated = await updateCollection(collection, fields)
    setCollections((previous) => previous.map((item) => item.id === collection.id ? updated : item))
    toast.ok('Cambios guardados.')
    return updated
  }

  async function move(index, direction) {
    const other = index + direction
    if (!collections || other < 0 || other >= collections.length) return
    const ordered = [...collections]
    ;[ordered[index], ordered[other]] = [ordered[other], ordered[index]]
    try {
      setCollections(await reorderCollections(ordered))
    } catch {
      toast.error('No se pudo reordenar. Recarga la página e inténtalo de nuevo.')
    }
  }

  async function remove(collection) {
    setBusy(true)
    try {
      await deleteCollection(collection)
      setCollections((previous) => previous.filter((item) => item.id !== collection.id))
      if (editingId === collection.id) setEditingId(null)
      toast.ok('Apartado borrado.')
    } catch {
      toast.error('No se pudo borrar el apartado.')
    } finally {
      setBusy(false)
      setConfirm(null)
    }
  }

  const editing = collections?.find((item) => item.id === editingId) || null

  if (editing) {
    return <CollectionEditor collection={editing} onBack={() => setEditingId(null)} onSave={save} />
  }

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div>
          <h2 className="font-headline text-2xl text-primary">Colecciones</h2>
          <p className="font-body-md text-sm text-on-surface-variant mt-1 max-w-xl">
            Cada apartado que crees aquí aparece en la página "Nuestras Colecciones", con su
            título, su breve descripción y sus fotos, en el orden en que los dejes.
          </p>
        </div>
        <button
          onClick={add}
          disabled={busy}
          className="bg-primary text-on-primary px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider hover:bg-surface-tint transition-colors flex items-center gap-2 disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-lg" aria-hidden="true">add</span>
          Nuevo apartado
        </button>
      </header>

      {collections === null ? (
        <p className="font-body-md text-on-surface-variant mt-6">Cargando…</p>
      ) : collections.length === 0 ? (
        <p className="font-body-md text-on-surface-variant py-10 text-center border border-dashed border-outline-variant rounded-xl mt-6">
          Aún no hay apartados. Pulsa «Nuevo apartado» para crear el primero.
        </p>
      ) : (
        <div className="space-y-3 mt-6">
          {collections.map((collection, index) => (
            <CollectionRow
              key={collection.id}
              collection={collection}
              index={index}
              total={collections.length}
              onMove={move}
              onEdit={() => setEditingId(collection.id)}
              onDelete={() => setConfirm(collection)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title="¿Borrar este apartado?"
        message={confirm ? `Se borrará «${confirm.title || 'este apartado'}» y sus fotos se enviarán a la papelera. No se puede deshacer desde aquí.` : ''}
        confirmLabel="Borrar apartado"
        busyLabel="Borrando…"
        busy={busy}
        onConfirm={() => remove(confirm)}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}

function CollectionRow({ collection, index, total, onMove, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-4 border border-outline-variant rounded-xl p-3 bg-surface-container-lowest">
      <div className="flex flex-col gap-1 shrink-0">
        <IconBtn label="Subir" disabled={index === 0} onClick={() => onMove(index, -1)}>arrow_upward</IconBtn>
        <IconBtn label="Bajar" disabled={index === total - 1} onClick={() => onMove(index, 1)}>arrow_downward</IconBtn>
      </div>
      <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center text-outline shrink-0">
        <span className="material-symbols-outlined" aria-hidden="true">photo_library</span>
      </div>
      <div className="flex-grow min-w-0">
        <p className="font-headline text-lg text-primary truncate">{collection.title || 'Apartado sin título'}</p>
        {collection.description && (
          <p className="font-body-md text-sm text-on-surface-variant truncate">{collection.description}</p>
        )}
        {!collection.published && <span className="text-xs text-error">Oculto</span>}
      </div>
      <div className="flex gap-2 shrink-0">
        <button onClick={onEdit} className="px-3 py-2 rounded-lg border border-outline-variant text-sm hover:bg-surface-container">
          Editar
        </button>
        <button onClick={onDelete} className="px-3 py-2 rounded-lg border border-error/40 text-error text-sm hover:bg-error-container">
          Borrar
        </button>
      </div>
    </div>
  )
}

function CollectionEditor({ collection, onBack, onSave }) {
  const toast = useToast()
  const [form, setForm] = useState({
    title: collection.title || '',
    description: collection.description || '',
    published: collection.published,
  })
  const [saving, setSaving] = useState(false)
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))
  const dirty = form.title !== (collection.title || '')
    || form.description !== (collection.description || '')
    || form.published !== collection.published

  async function save() {
    if (!form.title.trim()) {
      toast.error('Ponle un título al apartado.')
      return
    }
    setSaving(true)
    try {
      await onSave(collection, form)
    } catch {
      toast.error('No se pudo guardar el apartado.')
    } finally {
      setSaving(false)
    }
  }

  const section = useMemo(() => ({
    key: collectionCategory(collection.id),
    label: 'Fotos de este apartado',
    group: 'Colecciones',
    fields: ['alt'],
    aspect: 4 / 5,
    help: 'Estas fotos aparecen bajo el título y la descripción de este apartado, en la página Colecciones.',
  }), [collection.id])

  return (
    <div>
      <button type="button" onClick={onBack} className="min-h-11 inline-flex items-center gap-1.5 text-sm text-primary mb-6 hover:underline">
        <span className="material-symbols-outlined text-lg" aria-hidden="true">arrow_back</span>
        Volver a los apartados
      </button>

      <div className="max-w-2xl space-y-5 mb-10">
        <h2 className="font-headline text-2xl text-primary">Editar apartado</h2>

        <Field label="Título *">
          <input
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Ej. Ramos de Temporada"
            className="admin-input"
          />
        </Field>

        <Field label="Breve descripción">
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            placeholder="Una o dos frases sobre este apartado."
            className="admin-input resize-none"
          />
        </Field>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} className="w-4 h-4 accent-[#061b0e]" />
          <span className="font-body-md text-sm text-on-surface">Mostrar en la web</span>
        </label>

        <button
          onClick={save}
          disabled={!dirty || saving}
          className="min-h-11 bg-primary text-on-primary px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider hover:bg-surface-tint transition-colors disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>

      <div className="border-t border-outline-variant pt-8">
        <PhotoZoneEditor key={collection.id} section={section} />
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

function IconBtn({ children, label, onClick, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label}
      className="w-9 h-9 rounded-lg border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed">
      <span className="material-symbols-outlined text-base" aria-hidden="true">{children}</span>
    </button>
  )
}
