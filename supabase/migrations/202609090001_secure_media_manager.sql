-- Gestor de imágenes v2: propietario único, publicación atómica e historial.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

-- Al aplicar la migración a un proyecto que ya tiene la cuenta de la dueña,
-- registra como propietaria la cuenta más antigua. No concede permisos a
-- cuentas futuras.
insert into public.admin_users (user_id)
select id from auth.users order by created_at asc limit 1
on conflict (user_id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists(select 1 from public.admin_users where user_id = auth.uid());
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
  perform pg_advisory_xact_lock(hashtext('claim_initial_admin'));
  if not exists(select 1 from public.admin_users) then
    insert into public.admin_users(user_id) values (auth.uid()) on conflict do nothing;
  end if;
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
