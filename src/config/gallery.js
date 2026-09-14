// Fuente de verdad de las zonas gestionables. El panel, la validación del
// cliente y las vistas públicas comparten estas reglas para que el recorte y
// el hueco final siempre tengan la misma proporción.
//
// Los apartados de la página "Nuestras Colecciones" (antes 3 zonas fijas:
// Ramos de Temporada, Centros de Mesa y Plantas Exóticas) ya NO viven aquí:
// la dueña elige libremente cuántos hay, con su título y descripción, desde
// la pestaña «Colecciones» del panel (ver src/admin/sections/CollectionsAdmin.jsx
// y src/lib/collections.js). Esta lista solo describe las zonas de imagen fijas.
export const GALLERY_SECTIONS = [
  { key: 'inicio_hero', group: 'Inicio', label: 'Imagen principal', single: true, maxItems: 1, fields: ['alt'], aspect: 4 / 5, output: { width: 1280, height: 1600 }, help: 'La foto grande de la página de inicio.' },
  { key: 'inicio_destacados', group: 'Inicio', label: 'Destacados del escaparate', maxItems: 3, fields: ['title', 'desc', 'alt'], aspect: 4 / 5, output: { width: 1280, height: 1600 }, help: 'Puedes publicar hasta 3 fotos destacadas.' },
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
