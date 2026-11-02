-- URL amigable por producto (/carta/<slug>) y vista del catálogo con slug e imágenes (ya aplicado en la base)
create extension if not exists unaccent with schema extensions;
alter table products add column if not exists slug text;

create or replace function private.make_slug(txt text, uid uuid)
returns text language sql immutable set search_path = public, extensions as $$
  select trim(both '-' from regexp_replace(lower(extensions.unaccent(coalesce(txt, ''))), '[^a-z0-9]+', '-', 'g'))
         || '-' || substr(replace(uid::text, '-', ''), 1, 6)
$$;

create or replace function private.products_slug()
returns trigger language plpgsql set search_path = public, private as $$
begin
  if new.slug is null or tg_op = 'INSERT' or new.name is distinct from old.name then
    new.slug := private.make_slug(new.name, new.id);
  end if;
  return new;
end $$;
create trigger products_slug before insert or update on products
for each row execute function private.products_slug();

update products set slug = private.make_slug(name, id) where slug is null;
create unique index if not exists products_slug_key on products (slug);
grant select (slug) on products to anon;

-- vista catalog: se agregan al final las columnas slug e images (ver 01_schema.sql para el resto)
