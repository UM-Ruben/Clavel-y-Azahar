// ============================================================================
//  APARTADOS DE "NUESTRAS COLECCIONES"  —  convención de categoría de fotos
// ----------------------------------------------------------------------------
//  La dueña crea, desde el panel, tantos apartados como quiera en la página
//  Colecciones (cada uno con su título, su breve descripción y sus fotos). Las
//  fotos de cada apartado se guardan en la tabla `photos` de siempre, bajo una
//  categoría derivada del id del apartado. Esta función vive fuera de /admin
//  porque también la usa la web pública (ver src/pages/Colecciones.jsx).
// ============================================================================
export function collectionCategory(collectionId) {
  return `coleccion_${collectionId}`
}
