-- Correr DESPUÉS de 01 y 02: carga a la base los productos que ya estaban en la página.
-- Las fotos siguen saliendo de /public/images del repo.
-- Las cartas sin precio salen como "Consultar precio"; ponles precio desde el panel admin.

insert into collections (category_id, name, slug) values
  (1, 'Phantasmal Flames', 'phantasmal-flames'),
  (1, 'Top Sun', 'top-sun'),
  (1, '25th Anniversary', '25th-anniversary'),
  (1, 'Crown Zenith', 'crown-zenith'),
  (1, 'Stellar Crown', 'stellar-crown'),
  (1, 'Destined Rivals', 'destined-rivals'),
  (1, 'Ninja Spinner', 'ninja-spinner'),
  (1, 'Mega Dream ex', 'mega-dream-ex'),
  (1, 'The Glory Of Team Rocket', 'the-glory-of-team-rocket'),
  (1, 'Ascended Heroes', 'ascended-heroes')
on conflict (slug) do nothing;

with nuevos (type, name, subject, price, collection, image) as (values
  ('single'::product_type, 'Mega Charizard EX', 'Charizard', null::numeric, 'phantasmal-flames', '/images/MEGACHARIZARDEX.jpg'),
  ('single'::product_type, 'Charmander', 'Charmander', null::numeric, 'top-sun', '/images/CHARMANDERTOPSUN.jpg'),
  ('single'::product_type, 'Pikachu', 'Pikachu', null::numeric, '25th-anniversary', '/images/BIRTHDAYPIKA.jpg'),
  ('single'::product_type, 'Entei', 'Entei', null::numeric, 'crown-zenith', '/images/ENTEIV.jpg'),
  ('single'::product_type, 'Bulbasaur', 'Bulbasaur', null::numeric, 'stellar-crown', '/images/SLEEPYBULBASAUR.jpg'),
  ('single'::product_type, 'Mimikyu', 'Mimikyu', null::numeric, 'destined-rivals', '/images/TEAMRMIMIKYU.jpg'),
  ('single'::product_type, 'Froakie', 'Froakie', null::numeric, 'ninja-spinner', '/images/FROAKIE.jpg'),
  ('single'::product_type, 'Frogadier', 'Frogadier', null::numeric, 'ninja-spinner', '/images/FROGADIER.jpg'),
  ('single'::product_type, 'Psyduck', 'Psyduck', null::numeric, 'mega-dream-ex', '/images/PYSDUCK.jpg'),
  ('single'::product_type, 'Murkrow', 'Murkrow', null::numeric, 'the-glory-of-team-rocket', '/images/TEAMRMURK.jpg'),
  ('single'::product_type, 'Eevee', 'Eevee', null::numeric, 'top-sun', '/images/EEVEETOPSUN.jpg'),
  ('single'::product_type, 'Jolteon', 'Jolteon', null::numeric, 'top-sun', '/images/JOLTEONTOPSUN.jpg'),
  ('single'::product_type, 'Blastoise', 'Blastoise', null::numeric, 'top-sun', '/images/BLASTOISETOPSUN.jpg'),
  ('sealed'::product_type, 'Meganium ex Mega EX Box', null, 750::numeric, 'ascended-heroes', '/images/meganiumexbox.jpg'),
  ('sealed'::product_type, 'Feraligatr ex Mega EX Box', null, 750::numeric, 'ascended-heroes', '/images/feraligatrexbox.jpg'),
  ('sealed'::product_type, 'Emboar ex Mega EX Box', null, 750::numeric, 'ascended-heroes', '/images/emboarexbox.jpg'),
  ('sealed'::product_type, 'Pokeball Tin', null, 350::numeric, null, '/images/pokeballtin.jpg'),
  ('sealed'::product_type, 'Ascended Heroes Booster Bundle', null, 900::numeric, 'ascended-heroes', '/images/boosterbundleASC.jpg'),
  ('sealed'::product_type, 'Team Rocket´s Nidoking Tin', null, 650::numeric, null, '/images/trnidotin.jpg'),
  ('sealed'::product_type, 'Paradox Destinies Iron Crown Tin', null, 500::numeric, null, '/images/paradoxtin.jpg'),
  ('sealed'::product_type, 'Mega Symphonia Booster Box', null, 1600::numeric, null, '/images/megasympho.jpg')
),
ins as (
  insert into products (type, category_id, collection_id, name, subject, price, status, quantity)
  select n.type, 1, c.id, n.name, n.subject, n.price, 'publicado', 1
    from nuevos n left join collections c on c.slug = n.collection
  returning id, name
)
insert into product_images (product_id, url, sort_order)
select ins.id, n.image, 0 from ins join nuevos n on n.name = ins.name;
