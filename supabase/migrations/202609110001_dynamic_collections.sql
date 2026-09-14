-- ============================================================================
--  APARTADOS DINÁMICOS DE "NUESTRAS COLECCIONES"
-- ----------------------------------------------------------------------------
--  Antes la página Colecciones tenía 3 zonas fijas en el código (Ramos de
--  Temporada, Centros de Mesa, Plantas Exóticas). Ahora la dueña elige desde
--  el panel cuántos apartados hay, con su título, su breve descripción y sus
--  fotos. Esta migración:
--    1. Crea la tabla `collections` (un apartado = una fila) con su RLS.
--    2. Permite que las fotos usen categorías dinámicas `coleccion_<id>`
--       (antes solo se aceptaba una lista fija de categorías).
--    3. Migra, UNA SOLA VEZ, las 3 zonas fijas antiguas y sus fotos a 3
--       apartados nuevos, para no perder lo que la dueña ya hubiera subido.
--  Es idempotente: se puede pegar y ejecutar más de una vez sin problema
--  (igual que supabase/schema.sql, del que este bloque también forma parte).
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
