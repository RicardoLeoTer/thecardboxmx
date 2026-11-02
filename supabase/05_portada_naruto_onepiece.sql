-- Datos para la portada del catálogo + Naruto y One Piece (ya aplicado en la base)
alter table categories add column if not exists description text;
alter table categories add column if not exists image_url text;

insert into categories (id, parent_id, name, slug, sort_order) values
  (8, null, 'Naruto', 'naruto', 2),
  (9, null, 'One Piece', 'one-piece', 3)
on conflict (id) do nothing;
select setval('categories_id_seq', greatest((select max(id) from categories), 9));
update categories set sort_order = 4 where slug = 'deportes';

update categories set description = d.txt from (values
  ('pokemon',   'Singles, alt arts, SIR y producto sellado de colecciones nuevas y vintage.'),
  ('naruto',    'Cartas coleccionables de Naruto: singles raras y sobres sellados.'),
  ('one-piece', 'One Piece Card Game: líderes, alt arts y producto sellado.'),
  ('deportes',  'MLB, NFL, NBA, fútbol y UFC.'),
  ('mlb',       'Rookies, parallels, autógrafos y hobby boxes de béisbol.'),
  ('nfl',       'Cartas de americano: rookies, patches y producto sellado.'),
  ('nba',       'Basketball: Prizm, Select, rookies y autógrafos.'),
  ('futbol',    'Liga MX, Champions y selecciones: Topps, Panini y más.'),
  ('ufc',       'Peleadores, autógrafos y producto sellado de UFC.')
) as d(slug, txt) where categories.slug = d.slug;

-- Foto de portada de una colección (opcional; si no hay, usa la de un producto o un ícono)
update categories set image_url = '/images/MEGACHARIZARDEX.jpg' where slug = 'pokemon';
