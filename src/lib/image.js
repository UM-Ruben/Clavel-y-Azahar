// ============================================================================
//  UTILIDAD DE IMAGEN  —  redimensiona y comprime en el navegador
// ----------------------------------------------------------------------------
//  Antes de subir una foto al Storage la reducimos a un tamaño razonable
//  (máx. 1600 px de lado) y la comprimimos a JPEG. Beneficios:
//    · La web carga rápido (fotos ligeras).
//    · El plan gratuito de Supabase (1 GB) dura mucho más.
//    · La dueña puede subir fotos directas del móvil (que pesan varios MB).
// ============================================================================

const MAX_SIDE = 1600 // px del lado mayor
const QUALITY = 0.82 // calidad JPEG (0–1)

// Reduce y comprime un File de imagen. Devuelve un Blob JPEG listo para subir.
// Si algo falla (formato raro, etc.), devuelve el archivo original sin tocar.
// `cropPixels` (opcional) es el recorte elegido por la dueña, en píxeles de la
// imagen original: { x, y, width, height }. Sin él, se usa la imagen entera.
export async function processImage(file, cropPixels) {
  try {
    const bitmap = await loadBitmap(file)
    const src = cropPixels
      ? { x: cropPixels.x, y: cropPixels.y, w: cropPixels.width, h: cropPixels.height }
      : { x: 0, y: 0, w: bitmap.width, h: bitmap.height }
    const { width, height } = fit(src.w, src.h, MAX_SIDE)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bitmap, src.x, src.y, src.w, src.h, 0, 0, width, height)
    if (bitmap.close) bitmap.close()

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', QUALITY)
    )
    if (!blob) return { blob: file, ext: extOf(file.name) }
    return { blob, ext: 'jpg' }
  } catch {
    return { blob: file, ext: extOf(file.name) }
  }
}

function loadBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file)
  }
  // Respaldo para navegadores sin createImageBitmap.
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

function fit(w, h, max) {
  if (w <= max && h <= max) return { width: w, height: h }
  const ratio = w > h ? max / w : max / h
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) }
}

function extOf(name = '') {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/)
  return m ? m[1] : 'jpg'
}

// Genera un nombre de archivo único y seguro para el Storage.
export function uniqueName(ext = 'jpg') {
  const rand = Math.random().toString(36).slice(2, 10)
  return `${Date.now()}-${rand}.${ext}`
}
