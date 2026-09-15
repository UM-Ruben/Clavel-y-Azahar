// ============================================================================
//  TEXTOS POR DEFECTO  —  copia actual de la web (fallback)
// ----------------------------------------------------------------------------
//  Las páginas leen cada texto con useContent('clave', textDefaults.clave): si
//  la dueña no lo ha cambiado, se muestra este valor por defecto. El editor de
//  textos del panel también usa estos valores como punto de partida. Tener los
//  textos aquí (en un solo sitio) evita que el código y el panel se desincronicen.
// ============================================================================
export const textDefaults = {
  // --- Inicio ---
  inicio_hero_titulo: 'Flores con\nalma artesanal',
  inicio_hero_texto:
    'Floristería en Los Ramos, Murcia: composiciones naturales, ramos de temporada y diseño botánico para hogares, bodas y eventos.',

  // --- Colecciones ---
  colecciones_intro:
    'Descubre nuestra cuidada selección de ramos de temporada, elegantes centros de mesa y plantas exóticas poco comunes. Cada pieza está creada a mano para llevar la belleza efímera de la naturaleza a tu espacio.',

  // --- Servicios ---
  servicios_hero_titulo: 'Experiencias botánicas exclusivas para los momentos más importantes.',
  servicios_hero_texto:
    'Desde reuniones íntimas hasta grandes celebraciones, nuestro enfoque artesanal transforma los espacios a través de la belleza efímera de la naturaleza.',
  servicios_bodas_texto:
    'Diseñamos paisajes florales adaptados a tu historia. Nuestro servicio floral para bodas se enfoca en flores de temporada locales, dispuestas con un estilo natural y orgánico. Desde ramos de novia en cascada hasta decoraciones integrales para el banquete, cuidamos cada pequeño detalle.',
  servicios_taller_texto:
    'Sumérgete en el arte de la floristería. Nuestros talleres prácticos y exclusivos se imparten en nuestro luminoso estudio. Aprenderás las técnicas de diseño estructural, teoría del color y cómo trabajar materiales de temporada para crear tus propias obras de arte naturales.',

  // --- Contacto ---
  contacto_intro:
    'Tanto si buscas un arreglo a medida, quieres hablar de las flores de tu boda o simplemente deseas disfrutar del aroma de nuestras flores de temporada, te esperamos en Los Ramos, Murcia.',
}

// Tarjetas de suscripción (estructura). Se editan como bloque en el panel.
// Las fotos empiezan vacías y se publican exclusivamente desde el panel.
export const subscriptionsDefault = [
  {
    img: '',
    title: 'Esencial',
    freq: 'ENTREGA SEMANAL',
    desc: 'Una cuidada selección de flores frescas de temporada de una sola variedad envueltas en papel kraft, listas para tu florero favorito.',
    featured: false,
  },
  {
    img: '',
    title: 'Clásico',
    freq: 'ENTREGA QUINCENAL',
    desc: 'Un arreglo exuberante y personalizado que combina flores principales premium y follaje texturizado, entregado en una vasija de cerámica.',
    featured: true,
  },
  {
    img: '',
    title: 'Gran Estilo',
    freq: 'ENTREGA MENSUAL',
    desc: 'Nuestra propuesta más espectacular. Una pieza escultórica de gran tamaño diseñada para ser el centro de atención de cualquier recibidor o salón espacioso.',
    featured: false,
  },
]
