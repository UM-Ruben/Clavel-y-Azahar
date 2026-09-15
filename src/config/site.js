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
  // «Entrerramblas»; ese nombre se conserva en el eslogan (abajo, visible) y en
  // el alternateName del JSON-LD de index.html, para no perder el SEO local.
  name: 'Clavel y Azahar',
  // Lockup de marca (logo + nombre grande + eslogan pequeño) en Navbar/Footer.
  brand: {
    // Eslogan que conserva «Entrerramblas» por el traspaso del negocio.
    slogan: 'El nuevo aroma de Entrerramblas',
  },
  // Nombre anterior (traspaso). Mantenlo en el JSON-LD de index.html como
  // alternateName y en la ficha de Google Business para conservar el SEO local.
  formerName: 'Entrerramblas',
  tagline: 'Floristería en Los Ramos, Murcia · diseño floral de temporada',
  // Dominio final, SIN barra al final. Se usa para canonical, OG y sitemap.
  domain: 'https://www.clavelyazahar.es',

  // --- Contacto / NAP (debe COINCIDIR EXACTO con tu Google Business Profile)
  // Se muestra el fijo como teléfono principal; el móvil se usa para WhatsApp.
  phoneHuman: '968 30 51 01',
  phoneTel: '+34968305101', // mismo teléfono en formato tel: (sin espacios)
  phoneMobileHuman: '690 19 43 41', // móvil (también usado para WhatsApp)

  // Número de WhatsApp. Puedes escribirlo con el MISMO formato que el teléfono
  // de arriba (con «+», espacios o guiones): al generar el enlace se queda solo
  // con los dígitos. Debe incluir el prefijo del país (34 en España).
  whatsapp: '+34 690 19 43 41',
  whatsappMessage: 'Hola, me gustaría hacer una consulta sobre vuestras flores.',

  email: 'entreramblasclavelyazahar@gmail.com',

  // --- Dirección ---------------------------------------------------------
  address: {
    street: 'Avenida de Murcia 61',
    district: 'Los Ramos', // pedanía — aparece en títulos «Floristería en Los Ramos, Murcia»
    postalCode: '30589',
    city: 'Murcia',
    region: 'Murcia',
    country: 'España',
    // Coordenadas para el enlace «Cómo llegar» y el JSON-LD (5+ decimales).
    lat: 37.949, // TODO: aprox. centro de Los Ramos — sustituir por coords exactas de la tienda (ver PENDIENTES.md)
    lng: -1.041, // TODO: ídem
  },

  // --- Horario (texto mostrado; mantenlo igual que en el JSON-LD) ---------
  hours: [
    { days: 'Lunes – Viernes', time: '9:30 – 18:30', closed: false },
    { days: 'Sábado', time: '10:00 – 13:30', closed: false },
    { days: 'Festivos', time: 'Abierto', closed: false },
  ],

  // --- Redes sociales (vacío = no se muestra el icono) --------------------
  social: {
    // Las cuentas serán nuevas. Déjalas vacías hasta disponer de sus URLs.
    instagram: '',
    facebook: '',
  },

  // --- Formulario de contacto -------------------------------------------
  // Pega el endpoint de tu servicio de formularios (sin backend):
  //   · Formspree:  https://formspree.io/f/XXXXXXXX
  //   · Web3Forms:  https://api.web3forms.com/submit  (y access_key abajo)
  // Mientras valga el placeholder, el formulario avisa de que no está activo.
  formEndpoint: 'https://formspree.io/f/TU_ID_FORMULARIO', // TODO: ver PENDIENTES.md
}

// --- Helpers derivados (no hace falta tocar) ----------------------------

export const fullAddress = `${site.address.street}, ${site.address.postalCode} ${site.address.city}, ${site.address.country}`

export const mapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  `${site.address.street}, ${site.address.postalCode} ${site.address.city}`
)}`

// Deja un número en solo dígitos (quita «+», espacios y guiones), como lo
// necesita el enlace de wa.me. Así el WhatsApp se puede escribir con el mismo
// formato que el teléfono y aun así el enlace funciona.
export function waDigits(value) {
  return String(value || '').replace(/\D/g, '')
}

export const whatsappUrl = `https://wa.me/${waDigits(site.whatsapp)}?text=${encodeURIComponent(site.whatsappMessage)}`
