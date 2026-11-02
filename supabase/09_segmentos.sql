-- Segmentos (ya aplicado en la base)
-- Pokémon: Full Art, Vintage, Base, Jugable. SIR, IR y Hyper Rare quedan desactivados (no se borran).
update tags set is_active = false where slug in ('sir', 'ir', 'hyper-rare');
update tags set sort_order = 1 where slug = 'full-art';
insert into tags (name, slug, scope, sort_order) values
  ('Vintage',          'vintage',         'pokemon',  2),
  ('Jugable',          'jugable',         'pokemon',  4),
  ('Base',             'base',            'all',      3),
  ('Refractor',        'refractor',       'deportes', 9),
  ('Insert',           'insert',          'deportes', 14),
  ('Image Variation',  'image-variation', 'deportes', 15),
  ('Case Hit',         'case-hit',        'deportes', 16)
on conflict (slug) do update set name = excluded.name, scope = excluded.scope, sort_order = excluded.sort_order, is_active = true;
