-- Retocar fotos: guarda la foto original para poder deshacer (ya aplicado en Supabase)
alter table product_images add column if not exists original_url text;
