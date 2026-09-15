# Datos pendientes para finalizar la web — Clavel y Azahar

> Marca: **Clavel y Azahar** · eslogan «El nuevo aroma de Entrerramblas».
> El negocio se adquiere por **traspaso** de *Entrerramblas*; ese nombre se
> conserva en el eslogan y en el `alternateName` del JSON-LD para no perder
> el SEO local. Editar la marca en `src/config/site.js` (`name`, `brand.slogan`,
> `formerName`) y, en paralelo, en `index.html` (meta + JSON-LD).

## 0. Panel de gestión de la dueña (NUEVO)

La dueña ya puede editar **fotos, eventos, textos y datos del negocio** desde el
panel privado en `/naniPanel`, sin tocar código. Para activarlo hay que conectar
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

- [X] Dominio final: **clavelyazahar.es** → aplicado en `site.js` (`domain`) e `index.html`
  (`og:image`, `twitter:image`, JSON-LD `image`/`url`).
- [X] `public/robots.txt` y `public/sitemap.xml` actualizados con el dominio real.
- [ ] Comprar el dominio si aún no está comprado y configurar el hosting/DNS.

## 2. Contacto

- [X] Teléfono fijo: **968 30 51 01** → `site.js` (`phoneHuman`/`phoneTel`) + JSON-LD `telephone`
- [X] Móvil: **690 19 43 41** → `site.js` (`phoneMobileHuman`), también usado como WhatsApp
- [X] WhatsApp: **690 19 43 41** (confirmado que es el mismo que el móvil) → `site.js` `whatsapp`
- [X] Email: **entreramblasclavelyazahar@gmail.com** → `site.js` `email`

## 3. Dirección exacta y Google Business Profile

- [X] Calle y número: **Avenida de Murcia 61** → `site.js` `address.street` + JSON-LD
- [X] Código postal confirmado: **30589**
- [ ] Coordenadas exactas (en Google Maps: clic derecho sobre la tienda → copiar
  coordenadas). De momento se mantiene el aproximado del centro de Los Ramos
  (`lat: 37.949`, `lng: -1.041`) en `site.js` y en el JSON-LD.
- [ ] **IMPORTANTE (traspaso) — sigue sin confirmar**: la ficha de Google Business de
  *Entrerramblas* debe transferirse y **renombrarse a "Clavel y Azahar"** (así se
  conservan reseñas, antigüedad y posición local). Confirmar el nombre EXACTO con el
  que figura hoy la ficha para añadir con seguridad el `alternateName` del JSON-LD.
  Por ahora se ha omitido ese campo para no publicar un nombre antiguo inventado.
  Nombre y dirección de la web deben coincidir EXACTOS con los de la ficha.

- Dónde: `site.js` → `address.*` + `index.html` JSON-LD (`address`, `geo`, `alternateName`)

## 4. Horario real

- [X] Lunes a viernes 9:30–18:30, sábados 10:00–13:30, abierto en festivos →
  `site.js` `hours` + `index.html` JSON-LD `openingHoursSpecification`
- [ ] Nota: schema.org no tiene forma estándar de marcar "abierto en festivos"
  (varía cada año). Queda solo como texto visible en la web; para que Google
  lo respete en Maps hay que configurarlo aparte como **horario especial** en
  la propia ficha de Google Business.
- [ ] Confirmar el horario de los festivos concretos en Google Business; la web muestra
  "Abierto" porque no se ha facilitado una franja horaria específica.

## 5. Redes sociales

- [X] Confirmado: se crean cuentas **nuevas** de Instagram/Facebook (no se
  conservan las del anterior dueño).
- [ ] En cuanto existan, pegar las URLs definitivas en `site.js` → `social.*`
  y en `index.html` JSON-LD `sameAs`.

- Nota: mientras las URLs estén vacías, los iconos NO se muestran (correcto).

## 6. Formulario de contacto

- [ ] Crear cuenta gratuita en [Formspree](https://formspree.io) con el email del
  negocio y pegar el endpoint en `site.js` → `formEndpoint`.

- Nota: mientras tanto el formulario informa de que no está disponible y no
  simula un envío correcto.

## 7. Imágenes

- [X] La imagen social utiliza provisionalmente el logotipo real
  (`logo-orginal2.png`), por lo que compartir la web no apunta a un archivo
  inexistente. Más adelante se puede sustituir por una fotografía 1200×630.
- [ ] `apple-touch-icon.png` (180×180) → subir a `/public` y descomentar la línea
  correspondiente en `index.html`
- [ ] Nani subirá desde el panel las fotos reales de la tienda y de los productos.
  Hasta entonces, la web pública muestra huecos neutros. El proyecto no incluye
  fotos de demostración.

## 8. Contenido a revisar con la encargada

- [ ] ¿Los servicios mostrados (bodas/eventos, suscripciones, talleres) se ofrecen
  realmente? Ajustar textos y precios en `src/pages/Servicios.jsx`.
- [X] Nombres y descripciones de las colecciones → ya NO están fijos en el código.
  La dueña elige desde el panel (pestaña **Colecciones**) cuántos apartados hay,
  con su título, su breve descripción y sus fotos. Para que funcione en un
  proyecto ya conectado hay que volver a pegar `supabase/schema.sql` (o aplicar
  `supabase/migrations/202609110001_dynamic_collections.sql`) y redesplegar la
  función `publish-photo` — ver SETUP_PANEL.md, paso 6.

## Checklist final antes de publicar

- [ ] Buscar "TODO" en todo el proyecto y confirmar que no queda ninguno
- [ ] Validar el JSON-LD en https://search.google.com/test/rich-results
- [ ] `pnpm build` sin errores y revisar las páginas generadas en `dist/`
- [ ] Dar de alta el sitemap en Google Search Console
