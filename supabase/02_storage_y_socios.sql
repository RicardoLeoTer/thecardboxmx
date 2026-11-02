-- Correr DESPUÉS de thecardbox_schema.sql

-- 1) Bucket público para fotos de productos
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "fotos_publicas" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "socios_suben_fotos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_partner());

create policy "socios_borran_fotos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and public.is_partner());

-- 2) Dar de alta a los socios
--    Primero crea los dos usuarios (correo + contraseña) en Supabase > Authentication > Users,
--    luego cambia los correos y nombres aquí y corre esto:
insert into partners (user_id, name)
select id, 'Ricardo' from auth.users where email = 'CORREO_RICARDO@ejemplo.com';

insert into partners (user_id, name)
select id, 'NOMBRE_SOCIO' from auth.users where email = 'CORREO_SOCIO@ejemplo.com';
