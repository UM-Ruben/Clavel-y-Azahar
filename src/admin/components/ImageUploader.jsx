// Subidor de imágenes reutilizable: arrastrar y soltar o hacer clic. Al elegir
// una foto se recorta primero (encuadre igual que en la web pública) y NO se
// sube hasta pulsar «Subir foto» — así se puede recortar o cancelar sin que se
// suba ni se pierda nada. Si ya había una foto publicada, pide confirmación
// antes de sustituirla (esa sí es irreversible: el archivo antiguo se borra
// del almacenamiento). Comprime en el navegador (src/lib/image.js), sube al
// bucket «media» y devuelve { url, path } al padre vía onUploaded.
import { useEffect, useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import { supabase, MEDIA_BUCKET } from '../../lib/supabase'
import { processImage, uniqueName } from '../../lib/image'
import { useToast } from './Toast'
import ConfirmDialog from './ConfirmDialog'

export default function ImageUploader({
  folder = 'general',
  currentUrl = null,
  onUploaded,
  onPending,
  label = 'Subir foto',
  aspect = 4 / 3,
}) {
  const toast = useToast()
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(currentUrl)
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState(false)

  // Foto elegida pendiente de recortar/confirmar (aún no subida a Supabase).
  const [pending, setPending] = useState(null) // { file, url }
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [cropPixels, setCropPixels] = useState(null)
  const [confirmReplace, setConfirmReplace] = useState(false)

  // Avisa al padre de la imagen que se está eligiendo/recortando (aún sin subir)
  // para que la vista previa «Así se ve en la web» la muestre en el momento, sin
  // esperar a que se suba. Al cancelar o tras subir, `pending` vuelve a null.
  useEffect(() => {
    onPending?.(pending?.url ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending])

  function pickFile(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('El archivo debe ser una imagen (JPG, PNG, WebP…).')
      return
    }
    if (!supabase) {
      toast.error('Supabase no está configurado todavía.')
      return
    }
    setPending({ file, url: URL.createObjectURL(file) })
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCropPixels(null)
  }

  function cancelPending() {
    if (pending) URL.revokeObjectURL(pending.url)
    setPending(null)
  }

  function requestUpload() {
    if (preview) {
      setConfirmReplace(true)
    } else {
      doUpload()
    }
  }

  async function doUpload() {
    if (!pending) return
    setConfirmReplace(false)
    setBusy(true)
    try {
      const { blob, ext } = await processImage(pending.file, cropPixels)
      const path = `${folder}/${uniqueName(ext)}`
      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, blob, { cacheControl: '3600', upsert: false, contentType: blob.type || 'image/jpeg' })
      if (error) throw error
      const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path)
      setPreview(data.publicUrl)
      onUploaded?.({ url: data.publicUrl, path })
      toast.ok('Foto subida.')
      URL.revokeObjectURL(pending.url)
      setPending(null)
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

      {pending ? (
        <>
          <div
            className="relative rounded-lg overflow-hidden bg-surface-container-high"
            style={{ aspectRatio: String(aspect) }}
          >
            <Cropper
              image={pending.url}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_area, pixels) => setCropPixels(pixels)}
            />
            {busy && (
              <div className="absolute inset-0 bg-surface/80 flex flex-col items-center justify-center gap-2 z-10">
                <span className="material-symbols-outlined animate-spin text-primary" aria-hidden="true">
                  progress_activity
                </span>
                <p className="font-body-md text-sm text-primary">Subiendo…</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mt-3">
            <span className="material-symbols-outlined text-outline shrink-0" aria-hidden="true">zoom_in</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              disabled={busy}
              aria-label="Acercar o alejar la foto"
              className="flex-grow accent-[#061b0e]"
            />
          </div>
          <p className="font-body-md text-xs text-on-surface-variant mt-1">
            Arrastra la foto para encuadrarla y usa la barra para acercar.
          </p>

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={requestUpload}
              disabled={busy}
              className="bg-primary text-on-primary font-label-sm text-xs uppercase tracking-wider px-5 py-2.5 rounded-full flex items-center gap-1.5 hover:bg-surface-tint transition-colors disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">upload</span>
              {busy ? 'Subiendo…' : 'Subir foto'}
            </button>
            <button
              type="button"
              onClick={cancelPending}
              disabled={busy}
              className="px-5 py-2.5 rounded-full border border-outline-variant text-on-surface-variant text-xs uppercase tracking-wider font-label-sm hover:bg-surface-container transition-colors disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>

          <ConfirmDialog
            open={confirmReplace}
            title="¿Sustituir la foto?"
            message="Esta foto reemplazará a la que ya está publicada. La anterior se borrará del almacenamiento y no se podrá recuperar."
            confirmLabel="Sí, sustituir"
            busyLabel="Subiendo…"
            busy={busy}
            onConfirm={doUpload}
            onCancel={() => setConfirmReplace(false)}
          />
        </>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDrag(true)
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDrag(false)
            pickFile(e.dataTransfer.files?.[0])
          }}
          style={{ aspectRatio: String(aspect) }}
          className={`relative rounded-lg border-2 border-dashed transition-colors overflow-hidden ${
            drag ? 'border-primary bg-primary-fixed/40' : 'border-outline-variant bg-surface-container-low'
          } ${preview ? '' : 'flex items-center justify-center'}`}
        >
          {preview ? (
            <>
              <img src={preview} alt="Vista previa" className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent pt-6 pb-3 px-3 flex justify-center">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="bg-white text-on-surface font-label-sm text-xs uppercase tracking-wider px-4 py-2 rounded-full shadow-sm flex items-center gap-1.5 hover:bg-surface-container"
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
                onClick={() => inputRef.current?.click()}
                className="bg-primary text-on-primary font-label-sm text-xs uppercase tracking-wider px-5 py-2.5 rounded-full flex items-center gap-1.5 mx-auto hover:bg-surface-tint transition-colors"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">upload</span>
                Elegir foto
              </button>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          pickFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}
