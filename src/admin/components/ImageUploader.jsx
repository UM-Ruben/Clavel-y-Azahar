import { useEffect, useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import { prepareImage, processImage, releasePreparedImage } from '../../lib/image'
import { useToast } from './Toast'
import ConfirmDialog from './ConfirmDialog'

export default function ImageUploader({
  currentUrl = null,
  onUploaded,
  onPending,
  label = 'Subir foto',
  aspect = 4 / 3,
}) {
  const toast = useToast()
  const inputRef = useRef(null)
  const pendingRef = useRef(null)
  const [preview, setPreview] = useState(currentUrl)
  const [busy, setBusy] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [drag, setDrag] = useState(false)
  const [pending, setPending] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [cropPixels, setCropPixels] = useState(null)
  const [cropPercentages, setCropPercentages] = useState(null)
  const [confirmReplace, setConfirmReplace] = useState(false)

  useEffect(() => {
    pendingRef.current = pending
    onPending?.(pending ? { url: pending.previewUrl, crop: cropPercentages } : null)
  }, [pending, cropPercentages, onPending])

  useEffect(() => () => releasePreparedImage(pendingRef.current), [])
  useEffect(() => setPreview(currentUrl), [currentUrl])

  async function pickFile(file) {
    if (!file || preparing || busy) return
    setPreparing(true)
    try {
      releasePreparedImage(pendingRef.current)
      const prepared = await prepareImage(file)
      setPending(prepared)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCropPixels(null)
      setCropPercentages(null)
    } catch (error) {
      toast.error(error?.message || 'No se ha podido abrir la foto.')
    } finally {
      setPreparing(false)
    }
  }

  function cancelPending() {
    releasePreparedImage(pendingRef.current)
    setPending(null)
    setCropPercentages(null)
  }

  function requestUpload() {
    if (preview) setConfirmReplace(true)
    else void doUpload()
  }

  async function doUpload() {
    if (!pending || busy) return
    setConfirmReplace(false)
    setBusy(true)
    try {
      const processed = await processImage(pending.editableBlob, cropPixels)
      if (!onUploaded) throw new Error('No se ha configurado la publicación de esta imagen.')
      const result = await onUploaded({
        ...processed,
        original: pending.original,
        originalExt: pending.originalExt,
        originalMime: pending.originalMime,
        crop: cropPixels || {},
        operationId: crypto.randomUUID(),
      })
      const publishedUrl = result?.image_url || result?.url
      if (publishedUrl) setPreview(publishedUrl)
      releasePreparedImage(pending)
      setPending(null)
      toast.ok('Foto publicada correctamente.')
    } catch (error) {
      toast.error(error?.message || 'No se pudo publicar la foto. La anterior sigue visible.')
      // eslint-disable-next-line no-console
      console.error(error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {label && <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">{label}</p>}

      {pending ? (
        <>
          <div className="relative rounded-lg overflow-hidden bg-surface-container-high" style={{ aspectRatio: String(aspect) }}>
            <Cropper
              image={pending.previewUrl}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropAreaChange={(area, pixels) => {
                setCropPercentages(area)
                setCropPixels(pixels)
              }}
            />
            {busy && (
              <div className="absolute inset-0 bg-surface/85 flex flex-col items-center justify-center gap-2 z-10" role="status">
                <span className="material-symbols-outlined animate-spin text-primary" aria-hidden="true">progress_activity</span>
                <p className="font-body-md text-sm text-primary">Procesando y publicando…</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mt-3">
            <span className="material-symbols-outlined text-outline shrink-0" aria-hidden="true">zoom_in</span>
            <input
              type="range" min={1} max={3} step={0.05} value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              disabled={busy}
              aria-label="Acercar o alejar la foto"
              className="flex-grow accent-[#061b0e] min-h-11"
            />
          </div>
          <p className="font-body-md text-xs text-on-surface-variant mt-1">
            Arrastra la foto para encuadrarla. Nada cambia en la web hasta que pulses Publicar.
          </p>

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              type="button" onClick={requestUpload} disabled={busy}
              className="min-h-11 bg-primary text-on-primary font-label-sm text-xs uppercase tracking-wider px-5 py-2.5 rounded-full flex items-center gap-1.5 hover:bg-surface-tint transition-colors disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">publish</span>
              {busy ? 'Publicando…' : 'Publicar'}
            </button>
            <button
              type="button" onClick={cancelPending} disabled={busy}
              className="min-h-11 px-5 py-2.5 rounded-full border border-outline-variant text-on-surface-variant text-xs uppercase tracking-wider font-label-sm hover:bg-surface-container transition-colors disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>

          <ConfirmDialog
            open={confirmReplace}
            title="¿Publicar este encuadre?"
            message="La foto actual seguirá guardada en el historial durante 30 días y podrás recuperarla."
            confirmLabel="Publicar foto"
            busyLabel="Publicando…"
            busy={busy}
            onConfirm={doUpload}
            onCancel={() => setConfirmReplace(false)}
          />
        </>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); void pickFile(e.dataTransfer.files?.[0]) }}
          style={{ aspectRatio: String(aspect) }}
          className={`relative rounded-lg border-2 border-dashed transition-colors overflow-hidden ${
            drag ? 'border-primary bg-primary-fixed/40' : 'border-outline-variant bg-surface-container-low'
          } ${preview ? '' : 'flex items-center justify-center'}`}
        >
          {preview ? (
            <>
              <img src={preview} alt="Vista previa de la foto publicada" className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent pt-8 pb-3 px-3 flex justify-center">
                <button
                  type="button" onClick={() => inputRef.current?.click()}
                  className="min-h-11 bg-white text-on-surface font-label-sm text-xs uppercase tracking-wider px-4 py-2 rounded-full shadow-sm flex items-center gap-1.5 hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-base" aria-hidden="true">crop</span>
                  Cambiar o reencuadrar
                </button>
              </div>
            </>
          ) : (
            <div className="text-center px-4">
              <span className="material-symbols-outlined text-4xl text-outline" aria-hidden="true">add_photo_alternate</span>
              <p className="font-body-md text-sm text-on-surface-variant mt-2 mb-4">
                JPG, PNG, WebP o HEIC · máximo 20 MB
              </p>
              <button
                type="button" onClick={() => inputRef.current?.click()} disabled={preparing}
                className="min-h-11 bg-primary text-on-primary font-label-sm text-xs uppercase tracking-wider px-5 py-2.5 rounded-full flex items-center gap-1.5 mx-auto hover:bg-surface-tint transition-colors disabled:opacity-60"
              >
                <span className={`material-symbols-outlined text-base ${preparing ? 'animate-spin' : ''}`} aria-hidden="true">
                  {preparing ? 'progress_activity' : 'upload'}
                </span>
                {preparing ? 'Abriendo…' : 'Elegir foto'}
              </button>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
        className="hidden"
        onChange={(e) => { void pickFile(e.target.files?.[0]); e.target.value = '' }}
      />
    </div>
  )
}
