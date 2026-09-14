-- Permite guardar y editar por separado el móvil visible del negocio.
alter table public.business
  add column if not exists phone_mobile_human text;
