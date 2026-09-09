// Fuente de verdad de las zonas gestionables. El panel, la validación del
// cliente y las vistas públicas comparten estas reglas para que el recorte y
// el hueco final siempre tengan la misma proporción.
export const GALLERY_SECTIONS = [
  { key: 'inicio_hero', group: 'Inicio', label: 'Imagen principal', single: true, maxItems: 1, fields: ['alt'], aspect: 4 / 5, output: { width: 1280, height: 1600 }, help: 'La foto grande de la página de inicio.' },
  { key: 'inicio_destacados', group: 'Inicio', label: 'Destacados del escaparate', maxItems: 3, fields: ['title', 'desc', 'alt'], aspect: 4 / 5, output: { width: 1280, height: 1600 }, help: 'Puedes publicar hasta 3 fotos destacadas.' },
  { key: 'colecciones_temporada', group: 'Colecciones', label: 'Ramos de Temporada', fields: ['title', 'badge', 'alt'], aspect: 4 / 5, output: { width: 1280, height: 1600 }, initialVisible: 12, help: 'La etiqueta (por ejemplo «De temporada») es opcional.' },
  { key: 'colecciones_centros', group: 'Colecciones', label: 'Centros de Mesa', fields: ['title', 'desc', 'alt'], aspect: 1, output: { width: 1600, height: 1600 }, initialVisible: 12 },
  { key: 'colecciones_exoticas', group: 'Colecciones', label: 'Plantas Exóticas', fields: ['title', 'alt'], aspect: 1, output: { width: 1600, height: 1600 }, initialVisible: 12 },
  { key: 'servicios_hero', group: 'Servicios', label: 'Imagen de cabecera', single: true, maxItems: 1, fields: ['alt'], aspect: 16 / 9, output: { width: 1600, height: 900 } },
  { key: 'servicios_bodas', group: 'Servicios', label: 'Foto de Bodas y Eventos', single: true, maxItems: 1, fields: ['alt'], aspect: 4 / 5, output: { width: 1280, height: 1600 } },
  { key: 'servicios_taller', group: 'Servicios', label: 'Foto de Talleres', single: true, maxItems: 1, fields: ['alt'], aspect: 1, output: { width: 1600, height: 1600 } },
  { key: 'contacto_local', group: 'Contacto', label: 'Foto de la tienda', single: true, maxItems: 1, fields: ['alt'], aspect: 4 / 3, output: { width: 1600, height: 1200 }, help: 'Aparece en la página de contacto, sobre el enlace «Cómo llegar».' },
]

export const GALLERY_SECTION_KEYS = GALLERY_SECTIONS.map((section) => section.key)

export function getGallerySection(key) {
  return GALLERY_SECTIONS.find((section) => section.key === key) ?? null
}

export function canAddPhoto(section, currentCount) {
  return !section?.maxItems || currentCount < section.maxItems
}

export const FIELD_LABELS = {
  title: 'Título',
  desc: 'Descripción',
  alt: 'Texto alternativo (para Google y accesibilidad)',
  badge: 'Etiqueta',
}
