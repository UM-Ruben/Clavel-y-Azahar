// Catálogo de «secciones de fotos» que la dueña puede gestionar, con etiquetas
// claras en español. `single: true` = hueco de una sola imagen (cabeceras).
// `fields` = qué datos se editan en cada foto.
// `aspect` = proporción del recorte al subir la foto, para que encaje igual
// que en la web pública (ver src/admin/components/SectionPreview.jsx).
export const GALLERY_SECTIONS = [
  // --- Inicio ---
  { key: 'inicio_hero', group: 'Inicio', label: 'Imagen principal', single: true, fields: ['alt'], aspect: 4 / 5,
    help: 'La foto grande de la página de inicio.' },
  { key: 'inicio_destacados', group: 'Inicio', label: 'Destacados del escaparate', fields: ['title', 'desc', 'alt'], aspect: 4 / 5,
    help: 'Las 3 fotos destacadas bajo el inicio.' },

  // --- Colecciones ---
  { key: 'colecciones_temporada', group: 'Colecciones', label: 'Ramos de Temporada', fields: ['title', 'badge', 'alt'], aspect: 4 / 5,
    help: 'La etiqueta (ej. «De temporada») es opcional.' },
  { key: 'colecciones_centros', group: 'Colecciones', label: 'Centros de Mesa', fields: ['title', 'desc', 'alt'], aspect: 1 },
  { key: 'colecciones_exoticas', group: 'Colecciones', label: 'Plantas Exóticas', fields: ['title', 'alt'], aspect: 1 },

  // --- Servicios ---
  { key: 'servicios_hero', group: 'Servicios', label: 'Imagen de cabecera', single: true, fields: ['alt'], aspect: 16 / 9 },
  { key: 'servicios_bodas', group: 'Servicios', label: 'Foto de Bodas y Eventos', single: true, fields: ['alt'], aspect: 4 / 5 },
  { key: 'servicios_taller', group: 'Servicios', label: 'Foto de Talleres', single: true, fields: ['alt'], aspect: 1 },

  // --- Contacto ---
  { key: 'contacto_local', group: 'Contacto', label: 'Foto de la tienda', single: true, fields: ['alt'], aspect: 4 / 3,
    help: 'Aparece en la página de contacto, sobre el enlace «Cómo llegar».' },
]

export const FIELD_LABELS = {
  title: 'Título',
  desc: 'Descripción',
  alt: 'Texto alternativo (para Google y accesibilidad)',
  badge: 'Etiqueta',
}
