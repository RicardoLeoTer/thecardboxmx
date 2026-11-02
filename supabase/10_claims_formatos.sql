-- Claims por colección y formatos de producto sellado (ya aplicado en la base)
alter table categories add column if not exists claim text;
alter table categories add column if not exists singles_text text;
alter table categories add column if not exists sealed_text text;

create table if not exists sealed_formats (
  id serial primary key, name text not null, slug text not null unique,
  scope text not null check (scope in ('all', 'pokemon', 'deportes', 'naruto', 'one-piece')),
  sort_order int not null default 0, is_active boolean not null default true
);
alter table sealed_formats enable row level security;
create policy pub_read_formats on sealed_formats for select using (is_active);
create policy partner_all_formats on sealed_formats for all using (private.is_partner()) with check (private.is_partner());
alter table products add column if not exists format_id int references sealed_formats(id);
grant select (format_id) on products to anon;

insert into sealed_formats (name, slug, scope, sort_order) values
  ('Value Box','value-box','deportes',1), ('Mega Box','mega-box','deportes',2), ('Hanger Box','hanger-box','deportes',3),
  ('Sobre','sobre','deportes',4), ('Hobby Box','hobby-box','deportes',5), ('Jumbo Box','jumbo-box','deportes',6),
  ('ETB','etb','pokemon',1), ('Binder Collection','binder-collection','pokemon',2), ('Booster Bundle','booster-bundle','pokemon',3),
  ('Booster Box','booster-box','pokemon',4), ('Build & Battle','build-battle','pokemon',5), ('Tin','tin','pokemon',6),
  ('Poster Collection','poster-collection','pokemon',7), ('Mega EX Box','mega-ex-box','pokemon',8), ('First Partner','first-partner','pokemon',9)
on conflict (slug) do nothing;
-- La vista catalog suma al final: f.slug as format_slug, f.name as format_name (left join sealed_formats)
-- Los textos de cada colección se editan en la tabla categories (claim, singles_text, sealed_text, description).
