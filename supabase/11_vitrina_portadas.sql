-- Vitrina del inicio y portadas elegidas desde el admin (ya aplicado en Supabase)
alter table products add column if not exists show_on_home boolean not null default false;
grant select (show_on_home) on products to anon, authenticated;
alter table categories add column if not exists cover_product_id uuid references products(id) on delete set null;
-- La vista `catalog` se recreó agregando p.show_on_home al final.
