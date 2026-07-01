-- ============================================================================
--  ESQUEMA DE BASE DE DATOS  —  Clavel y Azahar (panel de la dueña)
-- ----------------------------------------------------------------------------
--  Pega TODO este archivo en:  Supabase → tu proyecto → SQL Editor → New query
--  y pulsa «Run». Es idempotente: puedes ejecutarlo varias veces sin problema.
--
--  Crea 4 tablas (photos, events, content, business), el bucket de fotos
--  «media», y las políticas de seguridad (RLS) que garantizan que:
--    · CUALQUIERA puede LEER el contenido publicado (la web pública).
--    · SOLO la dueña, tras iniciar sesión, puede CREAR / EDITAR / BORRAR.
--  Esta seguridad la impone Postgres en el servidor, así que aunque la
--  «anon key» sea pública, nadie puede modificar nada sin la sesión de la dueña.
-- ============================================================================

-- ----------------------------------------------------------------------------
--  1. TABLAS
-- ----------------------------------------------------------------------------

-- Fotos de la galería y de los huecos de imagen de cada página.
create table if not exists public.photos (
  id          uuid primary key default gen_random_uuid(),
  category    text not null,              -- p. ej. 'colecciones_temporada' (ver app)
  title       text,
  description text,
  alt         text,                       -- texto alternativo (accesibilidad/SEO)
  badge       text,                       -- etiqueta opcional (ej. «De temporada»)
  image_path  text,                       -- ruta en Storage (para poder borrar el archivo)
  image_url   text not null,              -- URL pública para mostrar
  sort_order  int  not null default 0,    -- orden dentro de la categoría
  published   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists photos_category_order_idx
  on public.photos (category, sort_order);

-- Eventos / talleres / fechas señaladas.
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  location    text,
  image_path  text,
  image_url   text,
  start_date  date,
  end_date    date,                       -- la web muestra los que aún no han pasado
  published   boolean not null default true,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists events_dates_idx on public.events (start_date, end_date);

-- Textos editables de las páginas (clave -> valor). El valor es JSONB para
-- poder guardar tanto un texto simple como estructuras (listas de tarjetas).
create table if not exists public.content (
  key        text primary key,
  value      jsonb,
  updated_at timestamptz not null default now()
);

-- Datos del negocio (fila única, id = 1). Refleja src/config/site.js.
create table if not exists public.business (
  id               int primary key default 1 check (id = 1),
  name             text,
  slogan           text,
  former_name      text,
  tagline          text,
  phone_human      text,
  phone_tel        text,
  whatsapp         text,
  whatsapp_message text,
  email            text,
  address          jsonb,   -- { street, district, postalCode, city, region, country, lat, lng }
  hours            jsonb,   -- [ { days, time, closed } ]
  social           jsonb,   -- { instagram, facebook }
  form_endpoint    text,
  updated_at       timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
--  2. SEGURIDAD A NIVEL DE FILA (RLS)
-- ----------------------------------------------------------------------------
alter table public.photos   enable row level security;
alter table public.events   enable row level security;
alter table public.content  enable row level security;
alter table public.business enable row level security;

-- PHOTOS: público lee solo las publicadas; la dueña (autenticada) hace de todo.
drop policy if exists "photos_select_public"   on public.photos;
drop policy if exists "photos_all_authenticated" on public.photos;
create policy "photos_select_public" on public.photos
  for select using (published = true);
create policy "photos_all_authenticated" on public.photos
  for all to authenticated using (true) with check (true);

-- EVENTS: igual que photos.
drop policy if exists "events_select_public"   on public.events;
drop policy if exists "events_all_authenticated" on public.events;
create policy "events_select_public" on public.events
  for select using (published = true);
create policy "events_all_authenticated" on public.events
  for all to authenticated using (true) with check (true);

-- CONTENT: público lee todo; la dueña edita.
drop policy if exists "content_select_public"   on public.content;
drop policy if exists "content_all_authenticated" on public.content;
create policy "content_select_public" on public.content
  for select using (true);
create policy "content_all_authenticated" on public.content
  for all to authenticated using (true) with check (true);

-- BUSINESS: público lee; la dueña edita.
drop policy if exists "business_select_public"   on public.business;
drop policy if exists "business_all_authenticated" on public.business;
create policy "business_select_public" on public.business
  for select using (true);
create policy "business_all_authenticated" on public.business
  for all to authenticated using (true) with check (true);

-- Fila única de business (vacía; se rellena desde el panel). El public.business
-- arranca con los valores por defecto de site.js si esta fila no existe.
insert into public.business (id) values (1) on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
--  3. ALMACENAMIENTO DE FOTOS (Storage)
-- ----------------------------------------------------------------------------
-- Bucket público «media»: al ser «public», las fotos se ven por su URL pública
-- (getPublicUrl) SIN pasar por RLS — por eso no hace falta (ni conviene) una
-- política de SELECT abierta a cualquiera: esta app nunca usa `.list()`, así
-- que esa política solo serviría para que cualquiera (con la anon key, que es
-- pública) pudiera listar TODOS los archivos del bucket. La quitamos: subir/
-- borrar sigue requiriendo sesión de la dueña, y ver las fotos por su URL no
-- se ve afectado.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media_read_public"     on storage.objects;
drop policy if exists "media_insert_auth"     on storage.objects;
drop policy if exists "media_update_auth"     on storage.objects;
drop policy if exists "media_delete_auth"     on storage.objects;

create policy "media_insert_auth" on storage.objects
  for insert to authenticated with check (bucket_id = 'media');
create policy "media_update_auth" on storage.objects
  for update to authenticated using (bucket_id = 'media');
create policy "media_delete_auth" on storage.objects
  for delete to authenticated using (bucket_id = 'media');

-- ============================================================================
--  LISTO. Ahora crea la usuaria de la dueña en: Authentication → Users → Add
--  user (email + contraseña), y desactiva el alta pública en
--  Authentication → Providers → Email → «Allow new users to sign up» = OFF.
-- ============================================================================
