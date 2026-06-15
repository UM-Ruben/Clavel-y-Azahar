# Datos pendientes para finalizar la web — Clavel y Azahar

> Marca: **Clavel y Azahar** · eslogan «El nuevo aroma de Entre Ramblas».
> El negocio se adquiere por **traspaso** de *Entre Ramblas*; ese nombre se
> conserva en el eslogan y en el `alternateName` del JSON-LD para no perder
> el SEO local. Editar la marca en `src/config/site.js` (`name`, `brand.slogan`,
> `formerName`) y, en paralelo, en `index.html` (meta + JSON-LD).

## 0. Panel de gestión de la dueña (NUEVO)

La dueña ya puede editar **fotos, eventos, textos y datos del negocio** desde el
panel privado en `/admin`, sin tocar código. Para activarlo hay que conectar
Supabase una sola vez: ver **[SETUP_PANEL.md](./SETUP_PANEL.md)**.

> ⚠️ **Aviso SEO (importante):** el panel actualiza lo que se VE en la web
> (pie de página, contacto, botón de WhatsApp), pero **no** reescribe los datos
> estructurados (JSON-LD) ni las meta de `index.html`, que son HTML estático y
> críticos para aparecer en Google Maps. Cuando se confirme el teléfono y la
> dirección reales, hay que ponerlos **a mano en `index.html`** (y en `site.js`
> como valores por defecto), además de en el panel. Cambian muy rara vez.

---

Lista de lo que hay que **pedir a la encargada** y dónde se aplica cada dato.

> Regla general: casi todo se edita en **un solo archivo**, `src/config/site.js`.
> La excepción es `index.html` (meta tags + JSON-LD), que hay que actualizar
> a mano **con los mismos valores** porque es HTML estático y no puede leer
> la configuración. Todos los puntos pendientes en el código están marcados
> con `TODO` (buscar "TODO" en el proyecto).

## 1. Dominio web
- [ ] Dominio final (ej. `https://www.entreramblas.es`), comprarlo si no existe.
- Dónde se aplica:
  - `src/config/site.js` → `domain`
  - `index.html` → `og:image`, `twitter:image` y JSON-LD (`image`, `url`)
  - `public/robots.txt` → línea `Sitemap:`
  - `public/sitemap.xml` → todas las URLs `<loc>`

## 2. Contacto
- [ ] Teléfono de la tienda → `site.js` (`phoneHuman` y `phoneTel`) + `index.html` JSON-LD `telephone`
- [ ] Número de WhatsApp (formato `34XXXXXXXXX`, sin `+` ni espacios) → `site.js` `whatsapp`
- [ ] Email del negocio → `site.js` `email`

## 3. Dirección exacta y Google Business Profile
- [ ] Calle y número de la tienda en Los Ramos
- [ ] Confirmar código postal (¿30589?)
- [ ] Coordenadas exactas (en Google Maps: clic derecho sobre la tienda → copiar coordenadas)
- [ ] **IMPORTANTE (traspaso)**: la ficha de Google Business de *Entre Ramblas*
  debe transferirse y **renombrarse a "Clavel y Azahar"** (así se conservan
  reseñas, antigüedad y posición local). Confirmar el nombre EXACTO con el que
  figura hoy la ficha para casar el `alternateName` del JSON-LD. Nombre y
  dirección de la web deben coincidir EXACTOS con los de la ficha.
- Dónde: `site.js` → `address.*` + `index.html` JSON-LD (`address`, `geo`, `alternateName`)

## 4. Horario real
- [ ] Días y horas de apertura (¿cierre a mediodía?, ¿domingos?)
- Dónde: `site.js` → `hours` + `index.html` JSON-LD `openingHoursSpecification`

## 5. Redes sociales
- [ ] ¿Se conservan las cuentas de Instagram/Facebook del anterior dueño? URLs definitivas.
- Dónde: `site.js` → `social.*` + `index.html` JSON-LD `sameAs`
- Nota: mientras queden las URLs de plantilla, los iconos NO se muestran (correcto).

## 6. Formulario de contacto
- [ ] Crear cuenta gratuita en [Formspree](https://formspree.io) con el email del
  negocio y pegar el endpoint en `site.js` → `formEndpoint`.
- Nota: mientras tanto el formulario funciona en "modo demo" (no envía nada).

## 7. Imágenes
- [ ] `og-image.jpg` (1200×630, foto de la tienda o un ramo) → subir a `/public`
  (ya está referenciada en `index.html`; solo falta el archivo y el dominio real)
- [ ] `apple-touch-icon.png` (180×180) → subir a `/public` y descomentar la línea
  correspondiente en `index.html`
- [ ] Fotos reales de la tienda y de los productos para sustituir las imágenes
  de la plantilla (están en `src/pages/Inicio.jsx`, `Colecciones.jsx`,
  `Servicios.jsx` y `Contacto.jsx` como URLs externas)

## 8. Contenido a revisar con la encargada
- [ ] ¿Los servicios mostrados (bodas/eventos, suscripciones, talleres) se ofrecen
  realmente? Ajustar textos y precios en `src/pages/Servicios.jsx`.
- [ ] Nombres y descripciones de las colecciones en `src/pages/Colecciones.jsx`.

## Checklist final antes de publicar
- [ ] Buscar "TODO" en todo el proyecto y confirmar que no queda ninguno
- [ ] Validar el JSON-LD en https://search.google.com/test/rich-results
- [ ] `pnpm build` sin errores y revisar las páginas generadas en `dist/`
- [ ] Dar de alta el sitemap en Google Search Console
