// Subidor de imágenes reutilizable: arrastrar y soltar o hacer clic. Comprime
// en el navegador (src/lib/image.js), sube al bucket «media» y devuelve
// { url, path } al padre vía onUploaded. Muestra previsualización y estado.
import { useRef, useState } from 'react'
import { supabase, MEDIA_BUCKET } from '../../lib/supabase'
import { processImage, uniqueName } from '../../lib/image'
import { useToast } from './Toast'

export default function ImageUploader({ folder = 'general', currentUrl = null, onUploaded, label = 'Subir foto' }) {
  const toast = useToast()
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(currentUrl)
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState(false)

  async function handleFile(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('El archivo debe ser una imagen (JPG, PNG, WebP…).')
      return
    }
    if (!supabase) {
      toast.error('Supabase no está configurado todavía.')
      return
    }
    setBusy(true)
    try {
      const { blob, ext } = await processImage(file)
      const path = `${folder}/${uniqueName(ext)}`
      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, blob, { cacheControl: '3600', upsert: false, contentType: blob.type || 'image/jpeg' })
      if (error) throw error
      const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path)
      setPreview(data.publicUrl)
      onUploaded?.({ url: data.publicUrl, path })
      toast.ok('Foto subida.')
    } catch (e) {
      toast.error('No se pudo subir la foto. Inténtalo de nuevo.')
      // eslint-disable-next-line no-console
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {label && <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">{label}</p>}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          handleFile(e.dataTransfer.files?.[0])
        }}
        className={`relative rounded-lg border-2 border-dashed transition-colors overflow-hidden ${
          drag ? 'border-primary bg-primary-fixed/40' : 'border-outline-variant bg-surface-container-low'
        } ${preview ? 'aspect-[4/3]' : 'aspect-[4/3] flex items-center justify-center'}`}
      >
        {preview ? (
          <>
            <img src={preview} alt="Vista previa" className="w-full h-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent pt-6 pb-3 px-3 flex justify-center">
              <button
                type="button"
                onClick={() => !busy && inputRef.current?.click()}
                disabled={busy}
                className="bg-white text-on-surface font-label-sm text-xs uppercase tracking-wider px-4 py-2 rounded-full shadow-sm flex items-center gap-1.5 hover:bg-surface-container disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">edit</span>
                Cambiar foto
              </button>
            </div>
          </>
        ) : (
          <div className="text-center px-4">
            <span className="material-symbols-outlined text-4xl text-outline" aria-hidden="true">
              add_photo_alternate
            </span>
            <p className="font-body-md text-sm text-on-surface-variant mt-2 mb-4">
              Arrastra una foto aquí, o…
            </p>
            <button
              type="button"
              onClick={() => !busy && inputRef.current?.click()}
              disabled={busy}
              className="bg-primary text-on-primary font-label-sm text-xs uppercase tracking-wider px-5 py-2.5 rounded-full flex items-center gap-1.5 mx-auto hover:bg-surface-tint transition-colors disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">upload</span>
              Elegir foto
            </button>
          </div>
        )}

        {busy && (
          <div className="absolute inset-0 bg-surface/80 flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined animate-spin text-primary" aria-hidden="true">
              progress_activity
            </span>
            <p className="font-body-md text-sm text-primary">Subiendo…</p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}
