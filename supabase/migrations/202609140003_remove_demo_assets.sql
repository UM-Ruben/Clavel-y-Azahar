-- Retira de la configuración publicada cualquier foto de demostración que
-- hubiera quedado guardada en las tarjetas de suscripción. Las tarjetas y sus
-- textos se conservan; Nani podrá subir las fotos reales desde el panel.
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
