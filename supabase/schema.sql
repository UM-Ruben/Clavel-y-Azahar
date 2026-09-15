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
  phone_mobile_human text,
  whatsapp         text,
  whatsapp_message text,
  email            text,
  address          jsonb,   -- { street, district, postalCode, city, region, country, lat, lng }
  hours            jsonb,   -- [ { days, time, closed } ]
  social           jsonb,   -- { instagram, facebook }
  form_endpoint    text,
  updated_at       timestamptz not null default now()
);

-- Añade el móvil en proyectos que ya crearon la tabla con una versión anterior.
alter table public.business add column if not exists phone_mobile_human text;

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

-- GESTOR DE IMÁGENES V2
-- Esta misma actualización se conserva como migración versionada en
-- supabase/migrations/202609090001_secure_media_manager.sql.
-- Gestor de imágenes v2: propietario único, publicación atómica e historial.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

-- Solo el correo fijo de la tienda puede convertirse en propietario.
insert into public.admin_users (user_id)
select id from auth.users
where lower(email) = 'entreramblasclavelyazahar@gmail.com'
order by created_at asc limit 1
on conflict (user_id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'entreramblasclavelyazahar@gmail.com'
    and exists(select 1 from public.admin_users where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.claim_initial_admin()
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then return false; end if;
  if lower(coalesce(auth.jwt() ->> 'email', '')) <> 'entreramblasclavelyazahar@gmail.com' then
    return false;
  end if;
  perform pg_advisory_xact_lock(hashtext('claim_initial_admin'));
  insert into public.admin_users(user_id) values (auth.uid()) on conflict do nothing;
  return public.is_admin();
end;
$$;
revoke all on function public.claim_initial_admin() from public;
grant execute on function public.claim_initial_admin() to authenticated;

alter table public.photos add column if not exists original_path text;
alter table public.photos add column if not exists crop jsonb not null default '{}'::jsonb;
alter table public.photos add column if not exists revision integer not null default 1;
alter table public.photos add column if not exists status text not null default 'published';
alter table public.photos add column if not exists deleted_at timestamptz;
alter table public.photos add column if not exists updated_at timestamptz not null default now();
alter table public.photos add column if not exists last_operation_id uuid;
alter table public.photos add column if not exists private_image_path text;
alter table public.events add column if not exists original_path text;

update public.photos
set status = case when published then 'published' else 'hidden' end
where deleted_at is null;

alter table public.photos drop constraint if exists photos_status_check;
alter table public.photos add constraint photos_status_check
  check (status in ('published', 'hidden', 'deleted'));
create unique index if not exists photos_last_operation_uidx
  on public.photos(last_operation_id) where last_operation_id is not null;
create index if not exists photos_public_idx
  on public.photos(category, sort_order) where published = true and deleted_at is null;

create table if not exists public.photo_revisions (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos(id) on delete cascade,
  source_revision integer not null,
  action text not null check (action in ('replaced', 'deleted', 'restored')),
  category text not null,
  title text,
  description text,
  alt text,
  badge text,
  image_path text,
  image_url text not null,
  history_path text,
  original_path text,
  crop jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  published boolean not null default true,
  status text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);
alter table public.photo_revisions add column if not exists history_path text;
create index if not exists photo_revisions_photo_idx
  on public.photo_revisions(photo_id, created_at desc);
create index if not exists photo_revisions_expiry_idx
  on public.photo_revisions(expires_at);
alter table public.photo_revisions enable row level security;

create or replace function public.gallery_category_limit(p_category text)
returns integer
language sql
immutable
as $$
  select case p_category
    when 'inicio_hero' then 1
    when 'inicio_destacados' then 3
    when 'colecciones_temporada' then null
    when 'colecciones_centros' then null
    when 'colecciones_exoticas' then null
    when 'servicios_hero' then 1
    when 'servicios_bodas' then 1
    when 'servicios_taller' then 1
    when 'contacto_local' then 1
    else -1
  end;
$$;

create or replace function public.save_photo_revision(p_photo public.photos, p_action text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_id uuid;
begin
  insert into public.photo_revisions (
    photo_id, source_revision, action, category, title, description, alt, badge,
    image_path, image_url, history_path, original_path, crop, sort_order, published, status
  ) values (
    p_photo.id, p_photo.revision, p_action, p_photo.category, p_photo.title,
    p_photo.description, p_photo.alt, p_photo.badge, p_photo.image_path,
    p_photo.image_url, p_photo.private_image_path, p_photo.original_path, p_photo.crop, p_photo.sort_order,
    p_photo.published, p_photo.status
  ) returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.save_photo_revision(public.photos, text) from public;

create or replace function public.publish_photo(
  p_category text,
  p_image_path text,
  p_image_url text,
  p_original_path text,
  p_crop jsonb,
  p_expected_revision integer,
  p_operation_id uuid,
  p_replace_id uuid default null
)
returns public.photos
language plpgsql
security definer
set search_path = public, storage, pg_temp
as $$
declare
  v_photo public.photos;
  v_limit integer;
  v_count integer;
  v_order integer;
  v_uid text := auth.uid()::text;
begin
  if not public.is_admin() then raise exception 'NOT_AUTHORIZED' using errcode = '42501'; end if;
  v_limit := public.gallery_category_limit(p_category);
  if v_limit = -1 then raise exception 'INVALID_CATEGORY' using errcode = '22023'; end if;
  if p_operation_id is null then raise exception 'OPERATION_ID_REQUIRED' using errcode = '22023'; end if;
  if p_image_path not like v_uid || '/%' or p_original_path not like v_uid || '/%' then
    raise exception 'INVALID_STORAGE_PATH' using errcode = '22023';
  end if;
  if not exists(select 1 from storage.objects where bucket_id = 'media' and name = p_image_path)
    or not exists(select 1 from storage.objects where bucket_id = 'media-originals' and name = p_original_path) then
    raise exception 'FILES_NOT_READY' using errcode = '22023';
  end if;

  select * into v_photo from public.photos where last_operation_id = p_operation_id;
  if found then return v_photo; end if;

  perform pg_advisory_xact_lock(hashtext('gallery:' || p_category));

  if p_replace_id is not null then
    select * into v_photo from public.photos
      where id = p_replace_id and category = p_category for update;
    if not found then raise exception 'PHOTO_NOT_FOUND' using errcode = 'P0002'; end if;
    if p_expected_revision is null or v_photo.revision <> p_expected_revision then
      raise exception 'REVISION_CONFLICT' using errcode = '40001';
    end if;
    select count(*) into v_count from public.photos
      where category = p_category and published = true and deleted_at is null and id <> v_photo.id;
    if v_limit is not null and v_count >= v_limit then
      raise exception 'CATEGORY_LIMIT_REACHED' using errcode = '23514';
    end if;
    perform public.save_photo_revision(v_photo, 'replaced');
    update public.photos set
      image_path = p_image_path,
      image_url = p_image_url,
      original_path = p_original_path,
      private_image_path = null,
      crop = coalesce(p_crop, '{}'::jsonb),
      revision = revision + 1,
      status = 'published',
      published = true,
      deleted_at = null,
      updated_at = now(),
      last_operation_id = p_operation_id
    where id = v_photo.id returning * into v_photo;
    return v_photo;
  end if;

  select count(*) into v_count from public.photos
    where category = p_category and published = true and deleted_at is null;
  if v_limit is not null and v_count >= v_limit then
    raise exception 'CATEGORY_LIMIT_REACHED' using errcode = '23514';
  end if;
  select coalesce(max(sort_order), -1) + 1 into v_order from public.photos where category = p_category;
  insert into public.photos (
    category, image_path, image_url, original_path, crop, sort_order,
    published, status, revision, last_operation_id, updated_at
  ) values (
    p_category, p_image_path, p_image_url, p_original_path,
    coalesce(p_crop, '{}'::jsonb), v_order, true, 'published', 1,
    p_operation_id, now()
  ) returning * into v_photo;
  return v_photo;
end;
$$;

create or replace function public.update_photo_metadata(
  p_photo_id uuid,
  p_expected_revision integer,
  p_title text,
  p_description text,
  p_alt text,
  p_badge text
)
returns public.photos
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_photo public.photos;
begin
  if not public.is_admin() then raise exception 'NOT_AUTHORIZED' using errcode = '42501'; end if;
  update public.photos set
    title = p_title, description = p_description, alt = p_alt, badge = p_badge,
    revision = revision + 1, updated_at = now()
  where id = p_photo_id and revision = p_expected_revision
  returning * into v_photo;
  if not found then raise exception 'REVISION_CONFLICT' using errcode = '40001'; end if;
  return v_photo;
end;
$$;

create or replace function public.remove_photo(
  p_photo_id uuid,
  p_expected_revision integer,
  p_operation_id uuid
)
returns public.photos
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_photo public.photos;
begin
  if not public.is_admin() then raise exception 'NOT_AUTHORIZED' using errcode = '42501'; end if;
  select * into v_photo from public.photos where last_operation_id = p_operation_id;
  if found then return v_photo; end if;
  select * into v_photo from public.photos where id = p_photo_id for update;
  if not found then raise exception 'PHOTO_NOT_FOUND' using errcode = 'P0002'; end if;
  if v_photo.revision <> p_expected_revision then raise exception 'REVISION_CONFLICT' using errcode = '40001'; end if;
  perform public.save_photo_revision(v_photo, 'deleted');
  update public.photos set published = false, status = 'deleted', deleted_at = now(),
    revision = revision + 1, updated_at = now(), last_operation_id = p_operation_id
  where id = p_photo_id returning * into v_photo;
  return v_photo;
end;
$$;

drop function if exists public.set_photo_visibility(uuid,integer,boolean);
create or replace function public.set_photo_visibility(
  p_photo_id uuid,
  p_expected_revision integer,
  p_visible boolean,
  p_image_path text,
  p_image_url text,
  p_private_image_path text,
  p_operation_id uuid
)
returns public.photos
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_photo public.photos;
  v_limit integer;
  v_count integer;
begin
  if not public.is_admin() then raise exception 'NOT_AUTHORIZED' using errcode = '42501'; end if;
  if p_operation_id is null then raise exception 'OPERATION_ID_REQUIRED' using errcode = '22023'; end if;
  select * into v_photo from public.photos where last_operation_id = p_operation_id;
  if found then return v_photo; end if;
  select * into v_photo from public.photos where id = p_photo_id and status <> 'deleted' for update;
  if not found or v_photo.revision <> p_expected_revision then
    raise exception 'REVISION_CONFLICT' using errcode = '40001';
  end if;
  if p_visible and not v_photo.published then
    perform pg_advisory_xact_lock(hashtext('gallery:' || v_photo.category));
    v_limit := public.gallery_category_limit(v_photo.category);
    select count(*) into v_count from public.photos
      where category = v_photo.category and published = true and deleted_at is null and id <> v_photo.id;
    if v_limit is not null and v_count >= v_limit then
      raise exception 'CATEGORY_LIMIT_REACHED' using errcode = '23514';
    end if;
  end if;
  if p_visible then
    if p_image_path not like auth.uid()::text || '/%'
      or not exists(select 1 from storage.objects where bucket_id = 'media' and name = p_image_path) then
      raise exception 'FILES_NOT_READY' using errcode = '22023';
    end if;
  else
    if p_private_image_path not like auth.uid()::text || '/%'
      or not exists(select 1 from storage.objects where bucket_id = 'media-history' and name = p_private_image_path) then
      raise exception 'FILES_NOT_READY' using errcode = '22023';
    end if;
  end if;
  update public.photos set published = p_visible,
    status = case when p_visible then 'published' else 'hidden' end,
    image_path = case when p_visible then p_image_path else image_path end,
    image_url = case when p_visible then p_image_url else image_url end,
    private_image_path = case when p_visible then null else p_private_image_path end,
    deleted_at = null, revision = revision + 1, updated_at = now(),
    last_operation_id = p_operation_id
  where id = p_photo_id returning * into v_photo;
  return v_photo;
end;
$$;

create or replace function public.reorder_photos(p_category text, p_ordered_ids uuid[])
returns setof public.photos
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_total integer;
begin
  if not public.is_admin() then raise exception 'NOT_AUTHORIZED' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtext('gallery:' || p_category));
  select count(*) into v_total from public.photos
    where category = p_category and status <> 'deleted';
  if v_total <> coalesce(array_length(p_ordered_ids, 1), 0)
    or exists(
      select 1 from unnest(p_ordered_ids) id
      left join public.photos p on p.id = id and p.category = p_category and p.status <> 'deleted'
      where p.id is null
    ) then raise exception 'ORDER_CONFLICT' using errcode = '40001'; end if;
  update public.photos p set sort_order = ordered.position - 1, updated_at = now()
  from unnest(p_ordered_ids) with ordinality ordered(id, position)
  where p.id = ordered.id;
  return query select * from public.photos
    where category = p_category and status <> 'deleted'
    order by sort_order, created_at;
end;
$$;

drop function if exists public.restore_photo_revision(uuid);
drop function if exists public.restore_photo_revision(uuid,text,text);
create or replace function public.restore_photo_revision(
  p_revision_id uuid,
  p_image_path text,
  p_image_url text,
  p_operation_id uuid
)
returns public.photos
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_history public.photo_revisions;
  v_current public.photos;
  v_limit integer;
  v_count integer;
begin
  if not public.is_admin() then raise exception 'NOT_AUTHORIZED' using errcode = '42501'; end if;
  if p_operation_id is null then raise exception 'OPERATION_ID_REQUIRED' using errcode = '22023'; end if;
  select * into v_current from public.photos where last_operation_id = p_operation_id;
  if found then return v_current; end if;
  if p_image_path not like auth.uid()::text || '/%'
    or not exists(select 1 from storage.objects where bucket_id = 'media' and name = p_image_path) then
    raise exception 'FILES_NOT_READY' using errcode = '22023';
  end if;
  select * into v_history from public.photo_revisions where id = p_revision_id and expires_at > now();
  if not found then raise exception 'REVISION_EXPIRED_OR_MISSING' using errcode = 'P0002'; end if;
  perform pg_advisory_xact_lock(hashtext('gallery:' || v_history.category));
  select * into v_current from public.photos where id = v_history.photo_id for update;
  if not found then raise exception 'PHOTO_NOT_FOUND' using errcode = 'P0002'; end if;
  v_limit := public.gallery_category_limit(v_history.category);
  select count(*) into v_count from public.photos
    where category = v_history.category and published = true and deleted_at is null and id <> v_current.id;
  if v_history.published and v_limit is not null and v_count >= v_limit then
    raise exception 'CATEGORY_LIMIT_REACHED' using errcode = '23514';
  end if;
  perform public.save_photo_revision(v_current, 'restored');
  update public.photos set
    category = v_history.category, title = v_history.title,
    description = v_history.description, alt = v_history.alt, badge = v_history.badge,
    image_path = p_image_path, image_url = p_image_url,
    private_image_path = null,
    original_path = v_history.original_path, crop = v_history.crop,
    sort_order = v_history.sort_order, published = v_history.published,
    status = case when v_history.published then 'published' else 'hidden' end,
    deleted_at = null, revision = v_current.revision + 1, updated_at = now(),
    last_operation_id = p_operation_id
  where id = v_current.id returning * into v_current;
  return v_current;
end;
$$;

revoke all on function public.publish_photo(text,text,text,text,jsonb,integer,uuid,uuid) from public;
revoke all on function public.update_photo_metadata(uuid,integer,text,text,text,text) from public;
revoke all on function public.remove_photo(uuid,integer,uuid) from public;
revoke all on function public.set_photo_visibility(uuid,integer,boolean,text,text,text,uuid) from public;
revoke all on function public.reorder_photos(text,uuid[]) from public;
revoke all on function public.restore_photo_revision(uuid,text,text,uuid) from public;
grant execute on function public.publish_photo(text,text,text,text,jsonb,integer,uuid,uuid) to authenticated;
grant execute on function public.update_photo_metadata(uuid,integer,text,text,text,text) to authenticated;
grant execute on function public.remove_photo(uuid,integer,uuid) to authenticated;
grant execute on function public.set_photo_visibility(uuid,integer,boolean,text,text,text,uuid) to authenticated;
grant execute on function public.reorder_photos(text,uuid[]) to authenticated;
grant execute on function public.restore_photo_revision(uuid,text,text,uuid) to authenticated;

-- ============================================================================
--  APARTADOS DINÁMICOS DE "NUESTRAS COLECCIONES"
-- ----------------------------------------------------------------------------
--  Esta misma actualización se conserva como migración versionada en
--  supabase/migrations/202609110001_dynamic_collections.sql.
--  Antes la página Colecciones tenía 3 zonas fijas en el código (Ramos de
--  Temporada, Centros de Mesa, Plantas Exóticas). Ahora la dueña elige desde
--  el panel cuántos apartados hay, con su título, su breve descripción y sus
--  fotos. Este bloque crea la tabla `collections`, permite que las fotos usen
--  categorías dinámicas `coleccion_<id>` y migra, una sola vez, las 3 zonas
--  fijas antiguas y sus fotos a 3 apartados nuevos, para no perder lo que la
--  dueña ya hubiera subido.
-- ============================================================================

create table if not exists public.collections (
  id          uuid primary key default gen_random_uuid(),
  title       text not null default '',
  description text,
  sort_order  int not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists collections_order_idx on public.collections (sort_order);
alter table public.collections enable row level security;

drop policy if exists "collections_select_public" on public.collections;
drop policy if exists "collections_owner_all" on public.collections;
create policy "collections_select_public" on public.collections for select to anon, authenticated
  using (published = true or public.is_admin());
create policy "collections_owner_all" on public.collections for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Las fotos de un apartado usan la categoría 'coleccion_' || collections.id.
-- Al ser dinámica (no una lista fija), no tiene límite de cantidad.
create or replace function public.gallery_category_limit(p_category text)
returns integer
language sql
immutable
as $$
  select case
    when p_category like 'coleccion\_%' escape '\' then null
    else (case p_category
      when 'inicio_hero' then 1
      when 'inicio_destacados' then 3
      when 'servicios_hero' then 1
      when 'servicios_bodas' then 1
      when 'servicios_taller' then 1
      when 'contacto_local' then 1
      else -1
    end)
  end;
$$;

-- Migración única de las 3 zonas fijas antiguas a apartados nuevos. Se marca
-- con una fila en `content` para no repetirse si este archivo se vuelve a
-- ejecutar (por ejemplo, al pegar de nuevo schema.sql completo).
do $$
declare
  v_temporada uuid;
  v_centros   uuid;
  v_exoticas  uuid;
begin
  if exists (select 1 from public.content where key = 'collections_migrated_v1') then
    return;
  end if;

  insert into public.collections (title, description, sort_order, published)
  values ('Ramos de Temporada', 'Ramos hechos a mano con la flor fresca de cada estación.', 0, true)
  returning id into v_temporada;

  insert into public.collections (title, description, sort_order, published)
  values ('Centros de Mesa', 'Arreglos para tu mesa, del detalle íntimo a la gran celebración.', 1, true)
  returning id into v_centros;

  insert into public.collections (title, description, sort_order, published)
  values ('Plantas Exóticas', 'Plantas raras y exóticas para dar personalidad a cualquier rincón.', 2, true)
  returning id into v_exoticas;

  update public.photos set category = 'coleccion_' || v_temporada where category = 'colecciones_temporada';
  update public.photos set category = 'coleccion_' || v_centros   where category = 'colecciones_centros';
  update public.photos set category = 'coleccion_' || v_exoticas  where category = 'colecciones_exoticas';

  update public.photo_revisions set category = 'coleccion_' || v_temporada where category = 'colecciones_temporada';
  update public.photo_revisions set category = 'coleccion_' || v_centros   where category = 'colecciones_centros';
  update public.photo_revisions set category = 'coleccion_' || v_exoticas  where category = 'colecciones_exoticas';

  insert into public.content (key, value) values ('collections_migrated_v1', 'true'::jsonb)
  on conflict (key) do nothing;
end;
$$;

-- Sustituye las políticas amplias por reglas ligadas a la única propietaria.
drop policy if exists "photos_select_public" on public.photos;
drop policy if exists "photos_all_authenticated" on public.photos;
drop policy if exists "photos_owner_all" on public.photos;
create policy "photos_select_public" on public.photos for select to anon, authenticated
  using ((published = true and status = 'published' and deleted_at is null) or public.is_admin());
-- Photos are changed only through validated RPCs; direct writes bypass limits.
revoke insert, update, delete on public.photos from anon, authenticated;

drop policy if exists "photo_revisions_owner_select" on public.photo_revisions;
create policy "photo_revisions_owner_select" on public.photo_revisions for select to authenticated
  using (public.is_admin());

drop policy if exists "events_select_public" on public.events;
drop policy if exists "events_all_authenticated" on public.events;
drop policy if exists "events_owner_all" on public.events;
create policy "events_select_public" on public.events for select to anon, authenticated
  using (published = true or public.is_admin());
create policy "events_owner_all" on public.events for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "content_select_public" on public.content;
drop policy if exists "content_all_authenticated" on public.content;
drop policy if exists "content_owner_all" on public.content;
create policy "content_select_public" on public.content for select to anon, authenticated using (true);
create policy "content_owner_all" on public.content for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "business_select_public" on public.business;
drop policy if exists "business_all_authenticated" on public.business;
drop policy if exists "business_owner_all" on public.business;
create policy "business_select_public" on public.business for select to anon, authenticated using (true);
create policy "business_owner_all" on public.business for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 6291456, array['image/jpeg'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media-originals', 'media-originals', false, 20971520,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media-staging', 'media-staging', false, 20971520,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media-history', 'media-history', false, 6291456, array['image/jpeg'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media_insert_auth" on storage.objects;
drop policy if exists "media_update_auth" on storage.objects;
drop policy if exists "media_delete_auth" on storage.objects;
drop policy if exists "media_owner_insert" on storage.objects;
drop policy if exists "media_owner_update" on storage.objects;
drop policy if exists "media_owner_delete" on storage.objects;
drop policy if exists "staging_owner_all" on storage.objects;
drop policy if exists "originals_owner_select" on storage.objects;
drop policy if exists "history_owner_select" on storage.objects;

create policy "staging_owner_all" on storage.objects for all to authenticated
  using (bucket_id = 'media-staging' and public.is_admin() and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'media-staging' and public.is_admin() and (storage.foldername(name))[1] = auth.uid()::text);
create policy "originals_owner_select" on storage.objects for select to authenticated
  using (bucket_id = 'media-originals' and public.is_admin() and (storage.foldername(name))[1] = auth.uid()::text);
create policy "history_owner_select" on storage.objects for select to authenticated
  using (bucket_id = 'media-history' and public.is_admin() and (storage.foldername(name))[1] = auth.uid()::text);

-- Las escrituras definitivas las hace la Edge Function con service_role.
-- El bucket público no permite listar objetos mediante la anon key.
-- Conflicts are application errors, not retryable database serialization failures.
-- 40001 triggers automatic infrastructure retries and can leave the panel waiting.
do $$
declare fn record;
begin
  for fn in
    select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (
      'publish_photo', 'update_photo_metadata', 'remove_photo',
      'set_photo_visibility', 'reorder_photos', 'restore_photo_revision'
    )
  loop
    execute replace(pg_get_functiondef(fn.oid), 'errcode = ''40001''', 'errcode = ''P0001''');
  end loop;
end;
$$;

-- Una instalación actualizada nunca publica las antiguas fotos de muestra.
update public.content
set value = (
  select jsonb_agg(
    case
      when item->>'img' like '/demo/%' then
        (item - 'image_path' - 'original_path') || jsonb_build_object('img', '')
      else item
    end
    order by position
  )
  from jsonb_array_elements(value) with ordinality as cards(item, position)
)
where key = 'servicios_suscripciones'
  and jsonb_typeof(value) = 'array'
  and exists (
    select 1
    from jsonb_array_elements(value) as card(item)
    where item->>'img' like '/demo/%'
  );

