-- Los socios necesitan poder "ver" los archivos del bucket para que Supabase les deje borrarlos
-- (sin esto, al optimizar o borrar fotos el archivo viejo se quedaba en el bucket).
create policy socios_ven_fotos on storage.objects
  for select to authenticated
  using (bucket_id = 'product-images' and private.is_partner());
