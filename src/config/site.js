// ============================================================================
//  CONFIGURACIÓN DEL NEGOCIO  —  EDITA SOLO ESTE FICHERO CON LOS DATOS REALES
// ----------------------------------------------------------------------------
//  Todos los componentes (Footer, Contacto, botón de WhatsApp, etc.) leen de
//  aquí. Cambiar un dato aquí lo actualiza en toda la web.
//
//  IMPORTANTE: los valores marcados con «TODO» son provisionales (plantilla).
//  Sustitúyelos por los datos reales antes de publicar. Recuerda actualizar
//  TAMBIÉN los mismos datos en `index.html` (meta tags + JSON-LD), que es
//  HTML estático y no puede leer este fichero.
// ============================================================================

export const site = {
  // --- Identidad ---------------------------------------------------------
  // Marca principal: lo que queremos que el cliente RECUERDE. Se usa en SEO,
  // copyright y lectores de pantalla. El negocio se adquiere por TRASPASO de
  // «Entre Ramblas»; ese nombre se conserva en el eslogan (abajo, visible) y en
  // el alternateName del JSON-LD de index.html, para no perder el SEO local.
  name: 'Clavel y Azahar',
  // Lockup de marca (logo + nombre grande + eslogan pequeño) en Navbar/Footer.
  brand: {
    // Eslogan que conserva «Entre Ramblas» por el traspaso del negocio.
    slogan: 'El nuevo aroma de Entre Ramblas',
  },
  // Nombre anterior (traspaso). Mantenlo en el JSON-LD de index.html como
  // alternateName y en la ficha de Google Business para conservar el SEO local.
  formerName: 'Entre Ramblas',
  tagline: 'Floristería en Los Ramos, Murcia · diseño floral de temporada',
  // Dominio final, SIN barra al final. Se usa para canonical, OG y sitemap.
  domain: 'https://www.tudominio.com', // TODO: dominio real (ver PENDIENTES.md)

  // --- Contacto / NAP (debe COINCIDIR EXACTO con tu Google Business Profile)
  phoneHuman: '+34 91 234 56 78', // TODO: teléfono real (ver PENDIENTES.md)
  phoneTel: '+34912345678', // TODO: mismo teléfono en formato tel: (sin espacios)

  // Número de WhatsApp en formato internacional SIN «+», espacios ni guiones.
  whatsapp: '34600000000', // TODO: WhatsApp real (ver PENDIENTES.md)
  whatsappMessage: 'Hola, me gustaría hacer una consulta sobre vuestras flores.',

  email: 'hola@tudominio.com', // TODO: email real del negocio (ver PENDIENTES.md)

  // --- Dirección ---------------------------------------------------------
  address: {
    street: 'Calle Pendiente de confirmar, s/n', // TODO: calle y número reales (ver PENDIENTES.md)
    district: 'Los Ramos', // pedanía — aparece en títulos «Floristería en Los Ramos, Murcia»
    postalCode: '30589', // TODO: confirmar CP de Los Ramos
    city: 'Murcia',
    region: 'Murcia',
    country: 'España',
    // Coordenadas para el enlace «Cómo llegar» y el JSON-LD (5+ decimales).
    lat: 37.949, // TODO: aprox. centro de Los Ramos — sustituir por coords exactas de la tienda
    lng: -1.041, // TODO: ídem
  },

  // --- Horario (texto mostrado; mantenlo igual que en el JSON-LD) ---------
  hours: [
    // TODO: horario real de la tienda (ver PENDIENTES.md)
    { days: 'Lunes – Sábado', time: '9:00 – 20:00', closed: false },
    { days: 'Domingo', time: 'Cerrado', closed: true },
  ],

  // --- Redes sociales (vacío = no se muestra el icono) --------------------
  social: {
    instagram: 'https://instagram.com/tu_floristeria', // TODO: ver PENDIENTES.md
    facebook: 'https://facebook.com/tu_floristeria', // TODO: ver PENDIENTES.md
  },

  // --- Formulario de contacto -------------------------------------------
  // Pega el endpoint de tu servicio de formularios (sin backend):
  //   · Formspree:  https://formspree.io/f/XXXXXXXX
  //   · Web3Forms:  https://api.web3forms.com/submit  (y access_key abajo)
  // Mientras valga el placeholder, el formulario funciona en modo demo.
  formEndpoint: 'https://formspree.io/f/TU_ID_FORMULARIO', // TODO: ver PENDIENTES.md
}

// --- Helpers derivados (no hace falta tocar) ----------------------------

export const fullAddress = `${site.address.street}, ${site.address.postalCode} ${site.address.city}, ${site.address.country}`

export const mapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  `${site.address.street}, ${site.address.postalCode} ${site.address.city}`
)}`

export const whatsappUrl = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(site.whatsappMessage)}`
