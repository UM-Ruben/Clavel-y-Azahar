const MAX_SIDE = 1600
const QUALITY = 0.84
export const MAX_SOURCE_BYTES = 20 * 1024 * 1024

const EXTENSIONS = { jpeg: 'jpg', png: 'png', webp: 'webp', heic: 'heic' }

export class ImageValidationError extends Error {
  constructor(message, code = 'INVALID_IMAGE', options) {
    super(message, options)
    this.name = 'ImageValidationError'
    this.code = code
  }
}

// Comprueba la firma binaria; no confía en el nombre ni en el MIME enviado por
// el móvil. La función de Supabase repite esta comprobación antes de publicar.
export async function detectImageKind(blob) {
  const bytes = new Uint8Array(await blob.slice(0, 32).arrayBuffer())
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg'
  if ([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => bytes[i] === v)) return 'png'
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') return 'webp'
  if (ascii(bytes, 4, 4) === 'ftyp') {
    const brand = ascii(bytes, 8, 4).toLowerCase()
    if (['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1'].includes(brand)) return 'heic'
  }
  return null
}

export async function prepareImage(file) {
  if (!file) throw new ImageValidationError('No se ha seleccionado ninguna foto.')
  if (file.size > MAX_SOURCE_BYTES) {
    throw new ImageValidationError('La foto supera el límite de 20 MB.', 'FILE_TOO_LARGE')
  }
  const kind = await detectImageKind(file)
  if (!kind) {
    throw new ImageValidationError('Formato no válido. Usa JPG, PNG, WebP o HEIC.', 'UNSUPPORTED_FORMAT')
  }

  let editableBlob = file
  if (kind === 'heic') {
    try {
      const { heicTo } = await import('heic-to/csp')
      editableBlob = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.92 })
    } catch (error) {
      throw new ImageValidationError(
        'No hemos podido abrir esta foto HEIC. Prueba a compartirla desde Fotos como JPEG.',
        'HEIC_CONVERSION_FAILED',
        { cause: error }
      )
    }
  }

  return {
    original: file,
    editableBlob,
    previewUrl: URL.createObjectURL(editableBlob),
    originalKind: kind,
    originalExt: EXTENSIONS[kind],
    originalMime: mimeFor(kind),
  }
}

// El canvas crea un JPEG nuevo sin EXIF ni GPS y con dimensiones previsibles.
export async function processImage(blob, cropPixels) {
  let bitmap
  try {
    bitmap = await loadBitmap(blob)
    const src = cropPixels
      ? normalizeCrop(cropPixels, bitmap.width, bitmap.height)
      : { x: 0, y: 0, w: bitmap.width, h: bitmap.height }
    const { width, height } = fit(src.w, src.h, MAX_SIDE)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('Canvas no disponible')
    ctx.drawImage(bitmap, src.x, src.y, src.w, src.h, 0, 0, width, height)
    const output = await canvasToBlob(canvas)
    return { blob: output, ext: 'jpg', width, height }
  } catch (error) {
    if (error instanceof ImageValidationError) throw error
    throw new ImageValidationError(
      'No se ha podido procesar la foto. Elige otra imagen o vuelve a exportarla.',
      'PROCESSING_FAILED',
      { cause: error }
    )
  } finally {
    bitmap?.close?.()
  }
}

export function releasePreparedImage(prepared) {
  if (prepared?.previewUrl) URL.revokeObjectURL(prepared.previewUrl)
}

function normalizeCrop(crop, imageWidth, imageHeight) {
  const x = Math.max(0, Math.round(crop.x || 0))
  const y = Math.max(0, Math.round(crop.y || 0))
  const w = Math.min(imageWidth - x, Math.max(1, Math.round(crop.width || imageWidth)))
  const h = Math.min(imageHeight - y, Math.max(1, Math.round(crop.height || imageHeight)))
  return { x, y, w, h }
}

function loadBitmap(blob) {
  if (typeof createImageBitmap === 'function') return createImageBitmap(blob)
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Imagen ilegible'))
    }
    img.src = url
  })
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo crear el JPEG'))),
      'image/jpeg',
      QUALITY
    )
  })
}

function fit(w, h, max) {
  if (w <= max && h <= max) return { width: Math.round(w), height: Math.round(h) }
  const ratio = w > h ? max / w : max / h
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) }
}

function ascii(bytes, start, length) {
  return String.fromCharCode(...bytes.slice(start, start + length))
}

function mimeFor(kind) {
  if (kind === 'jpeg') return 'image/jpeg'
  if (kind === 'heic') return 'image/heic'
  return `image/${kind}`
}

export function uniqueName(ext = 'jpg') {
  const uuid = globalThis.crypto?.randomUUID?.()
  return `${uuid || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}.${ext}`
}
