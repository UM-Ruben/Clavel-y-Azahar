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
