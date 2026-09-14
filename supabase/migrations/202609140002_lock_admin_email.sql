-- Limita la propiedad del panel al correo fijo de la tienda. La ruta oculta y
-- el formulario bloqueado son comodidad; esta comprobación del servidor es la
-- barrera de seguridad que no se puede saltar modificando el navegador.

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
