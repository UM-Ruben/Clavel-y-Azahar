# Cómo poner en marcha el panel de la dueña

El panel privado (`/admin`) permite a la dueña subir fotos, crear eventos y editar
textos y datos del negocio **sin tocar código**. Funciona con **Supabase** (gratis):
guarda las fotos, los eventos y los textos, y controla quién puede entrar.

> Mientras no completes estos pasos, **la web sigue funcionando igual que ahora**
> (con las fotos y textos de ejemplo). El panel mostrará un aviso de «falta
> configurar Supabase». No se rompe nada.

Tiempo estimado: **15 minutos**, una sola vez.

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

## 3. Crear la única cuenta de acceso

1. Menú lateral → **Authentication** → **Users** → **Add user** → **Create new user**.
2. Pon un **email** y una **contraseña** inicial. Marca «Auto confirm user» si
   aparece. Crea el usuario.
   - **No hace falta el correo privado de la dueña.** Ese email es solo el
     *usuario* con el que se entra al panel y el buzón donde llegaría el correo de
     «recuperar contraseña»; no se muestra en ninguna parte pública. **Usa el
     correo de la tienda** (cualquier buzón que controléis vosotros).
3. **Crea SOLO este usuario.** No añadas ninguno más: así ella es la única cuenta.
4. **Importante (seguridad):** ve a **Authentication** → **Providers** (o
   **Sign In / Providers**) → **Email** y **desactiva** «Allow new users to sign up».
   Así nadie puede registrarse por su cuenta y queda **una sola cuenta**.

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
3. Arranca la web: `pnpm dev` y entra en <http://localhost:5173/admin>.
   Inicia sesión con el email y la contraseña de la dueña.

## 6. Conectar la web publicada (en Vercel)

1. En Vercel → tu proyecto → **Settings** → **Environment Variables**.
2. Añade las **mismas dos variables** (`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`)
   con los mismos valores, para **Production** (y Preview si quieres).
3. Vuelve a desplegar (**Deployments** → **Redeploy**) para que tomen efecto.
4. El panel queda en `https://TU-DOMINIO/admin`.

---

## Cómo usa el panel la dueña

- **Galería**: elige una zona de la web (cabeceras, destacados, colecciones…) y
  sube, ordena o borra fotos. Si una colección se queda sin fotos, la web muestra
  las de ejemplo automáticamente (nunca se ve un hueco vacío).
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
- La **seguridad** la garantiza Supabase en el servidor: aunque la clave `anon`
  vaya en la web, **nadie puede modificar nada sin iniciar sesión** como la dueña.
- Hay datos que, por ser críticos para Google, **conviene revisar también en el
  código** (los datos estructurados de `index.html`): el teléfono y la dirección
  que aparecen en la ficha de Google se mantienen ahí. Ver [`PENDIENTES.md`](./PENDIENTES.md).
- Si la dueña olvida la contraseña, puede pulsar «¿Has olvidado la contraseña?»
  en el login y recibirá un email para cambiarla.
