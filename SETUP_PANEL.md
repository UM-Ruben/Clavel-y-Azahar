# Cómo poner en marcha el panel de la dueña

El panel privado (`/naniPanel`) permite a la dueña subir fotos, crear eventos y editar
textos y datos del negocio **sin tocar código**. Funciona con **Supabase** (gratis):
guarda las fotos, los eventos y los textos, y controla quién puede entrar.

> Mientras no completes estos pasos, **la web sigue funcionando igual que ahora**
> (con las fotos y textos de ejemplo). El panel mostrará un aviso de «falta
> configurar Supabase». No se rompe nada.

Tiempo estimado: **25–35 minutos**, una sola vez.

---

## 1. Crear el proyecto en Supabase

1. Entra en <https://supabase.com> y crea una cuenta gratuita.
2. Pulsa **New project**. Ponle un nombre (ej. `clavel-y-azahar`), elige una
   contraseña de base de datos (guárdala) y la región **West EU (Ireland)** o la
   más cercana. Crea el proyecto (tarda ~1 minuto).

## 2. Crear las tablas y la seguridad

1. En el menú lateral de Supabase, abre **SQL Editor** → **New query**.
2. Abre el archivo [`supabase/schema.sql`](./supabase/schema.sql) de este proyecto,
   copia **todo** su contenido y pégalo en el editor.
3. Pulsa **Run**. Debe decir «Success». (Puedes ejecutarlo más de una vez sin
   problema.) Esto crea las tablas, el almacén de fotos y las reglas de seguridad.

> **Si ya tenías el panel funcionando** y solo quieres recoger una actualización
> del código (como los apartados dinámicos de "Colecciones"), vuelve a pegar
> `supabase/schema.sql` entero y pulsa **Run**: es idempotente, no borra nada
> de lo que ya hubiera. Después repite el **paso 6** (redesplegar `publish-photo`)
> para que el panel acepte lo nuevo.

## 3. Crear la única cuenta de acceso

1. Menú lateral → **Authentication** → **Users** → **Add user** → **Create new user**.
2. Usa exactamente **entreramblasclavelyazahar@gmail.com** y pon una contraseña
   inicial. Marca «Auto confirm user» si aparece. Crea el usuario.
   - Ese es el único correo que acepta el panel y el único destinatario de
     «recuperar contraseña». Se muestra bloqueado y no puede cambiarse desde
     el formulario de acceso.
3. **Crea SOLO este usuario.** No añadas ninguno más: así ella es la única cuenta.
4. **Importante (seguridad):** ve a **Authentication** → **Providers** (o
   **Sign In / Providers**) → **Email**. Mantén el proveedor Email activado para
   que funcionen el acceso y la recuperación. El alta pública queda bloqueada
   por la configuración global del proyecto y por la protección del servidor,
   que solo reconoce el correo fijo de la tienda.
5. La primera cuenta que inicie sesión después de aplicar el esquema se registra
   como propietaria. A partir de ese momento ninguna otra cuenta puede reclamar
   el panel, aunque consiga autenticarse.

## 4. Copiar las claves de conexión

1. Menú lateral → **Project Settings** → **API** (o **Data API**).
2. Copia estos dos valores:
   - **Project URL** (algo como `https://abcdxyz.supabase.co`) — **solo el dominio**,
     sin nada más al final. Si Supabase te enseña la URL con `/rest/v1/` pegado
     detrás, **no copies esa parte**: con ella el login y el panel no funcionan
     aunque el usuario y la contraseña sean correctos.
   - **anon public** key (una cadena larga). *No uses la `service_role`.*

## 5. Conectar la web (en local)

1. En la carpeta del proyecto, copia el archivo `.env.example` a `.env.local`.
2. Pega dentro tus dos valores:
   ```
   VITE_SUPABASE_URL=https://abcdxyz.supabase.co
   VITE_SUPABASE_ANON_KEY=la_clave_anon_larga
   ```
3. Arranca la web: `pnpm dev` y entra en <http://localhost:5173/naniPanel>.
   Escribe la contraseña de la dueña; el correo ya aparece fijado.

## 6. Desplegar las funciones seguras de imágenes

Las fotos se validan y publican en una función de Supabase. Desde esta carpeta,
con la [CLI de Supabase](https://supabase.com/docs/guides/local-development/cli/getting-started):

```bash
pnpm dlx supabase login
pnpm dlx supabase link --project-ref TU_PROJECT_REF
pnpm dlx supabase functions deploy publish-photo
```

Para activar la limpieza de la papelera y archivos temporales, crea un secreto
aleatorio largo y despliega la segunda función:

```bash
pnpm dlx supabase secrets set CLEANUP_SECRET=UN_SECRETO_LARGO_Y_ALEATORIO
pnpm dlx supabase functions deploy cleanup-media --no-verify-jwt
```

En **Supabase → Integrations → Cron**, programa una petición `POST` diaria a
`https://TU_PROJECT_REF.supabase.co/functions/v1/cleanup-media` con la cabecera
`x-cleanup-secret: EL_MISMO_SECRETO`. No pongas ese secreto en variables `VITE_`
ni en Vercel: solo pertenece a Supabase Cron.

## 7. Conectar la web publicada (en Vercel)

1. En Vercel → tu proyecto → **Settings** → **Environment Variables**.
2. Añade las **mismas dos variables** (`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`)
   con los mismos valores, para **Production** (y Preview si quieres).
3. Vuelve a desplegar (**Deployments** → **Redeploy**) para que tomen efecto.
4. El panel queda en `https://TU-DOMINIO/naniPanel`.
5. En **Supabase → Authentication → URL Configuration**, añade también
   `https://TU-DOMINIO/naniPanel` a **Redirect URLs**. Sin este paso, los enlaces
   de recuperación de contraseña no podrán regresar al panel publicado.

---

## Cómo usa el panel la dueña

- **Galería**: elige una zona de la web (cabeceras, destacados…) y sube,
  reencuadra, sustituye, ordena, oculta o retira fotos. Admite JPG, PNG,
  WebP y HEIC de iPhone hasta 20 MB. La imagen publicada no cambia hasta pulsar
  **Publicar** y, si algo falla, la anterior permanece visible. Las versiones
  retiradas o sustituidas se pueden restaurar durante 30 días. Si una zona
  se queda sin fotos, esa parte de la web muestra un
  hueco neutro, nunca una foto de mentira (para ver el diseño ya «relleno» de
  fotos de ejemplo, arranca `pnpm dev` y entra en `/demo` — esa vista no existe
  en la web publicada).
- **Colecciones**: la página "Nuestras Colecciones" no tiene apartados fijos —
  la dueña crea, borra y reordena los que quiera, cada uno con su título, su
  breve descripción y sus propias fotos (mismo editor que en Galería). Si no
  hay ningún apartado creado, esa parte de la web no enseña nada de mentira:
  simplemente no aparece, hasta que se crea el primero.
- **Eventos**: crea talleres y fechas especiales con foto, fecha y descripción.
  Los eventos pasados desaparecen solos de la web.
- **Textos**: cambia títulos y descripciones de las páginas. Si deja un campo
  vacío, se usa el texto original.
- **Datos del negocio**: teléfono, WhatsApp, email, dirección, horario y redes.
  Alimentan el pie de página, la página de contacto y el botón de WhatsApp.

Los cambios se ven en la web **al instante**, sin necesidad de volver a desplegar.

## Notas importantes

- Las fotos se **comprimen automáticamente** al subirlas, así que la dueña puede
  subir fotos directas del móvil sin preocuparse del tamaño.
- El original se guarda en privado. La web pública recibe un JPEG optimizado,
  sin los metadatos ni la ubicación GPS de la foto original.
- La **seguridad** la garantiza Supabase en el servidor: aunque la clave `anon`
  vaya en la web, **nadie puede modificar nada sin iniciar sesión** como la dueña.
- Hay datos que, por ser críticos para Google, **conviene revisar también en el
  código** (los datos estructurados de `index.html`): el teléfono y la dirección
  que aparecen en la ficha de Google se mantienen ahí. Ver [`PENDIENTES.md`](./PENDIENTES.md).
- Si la dueña olvida la contraseña, puede pulsar «¿Has olvidado la contraseña?»
  y el enlace se enviará únicamente a **entreramblasclavelyazahar@gmail.com**.

## Copias y recuperación

Antes de aplicar el esquema sobre datos reales, exporta la base de datos y
descarga por separado los buckets `media`, `media-originals`, `media-history` y
`media-staging`.
Las copias de base de datos de Supabase no incluyen los objetos de Storage.

Para recuperar una foto durante los 30 días de retención, entra en la zona
correspondiente de **Galería**, abre **Historial y papelera** y pulsa
**Restaurar**. La restauración volverá a comprobar el límite de esa zona; en
“Destacados del escaparate” nunca podrá haber más de tres fotos visibles.
