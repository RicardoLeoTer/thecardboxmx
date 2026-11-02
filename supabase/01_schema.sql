-- =====================================================================
-- The Card Box MX — Esquema de inventario + catálogo (Supabase / Postgres)
-- Pokémon TCG + Deportes (MLB, NFL, NBA, Fútbol, etc.)
-- =====================================================================

-- ---------- ENUMS ----------
create type product_type as enum (
  'single',       -- carta individual raw
  'graded',       -- carta gradeada (PSA, BGS, SGC, CGC...)
  'sealed',       -- producto sellado (booster box, hobby box, ETB, blaster)
  'memorabilia',  -- jerseys, pelotas firmadas, etc.
  'accessory'     -- micas, toploaders, carpetas, cajas
);

create type item_status as enum (
  'disponible',   -- en inventario, aún no publicado
  'publicado',    -- visible en la web / redes
  'apartado',     -- reservado para un cliente
  'vendido',
  'retirado'      -- se sacó de venta (uso personal, dañado, etc.)
);

create type sales_channel as enum (
  'web', 'instagram', 'facebook', 'whatsapp', 'evento', 'otro'
);

create type card_condition as enum ('NM', 'LP', 'MP', 'HP', 'DMG');

-- ---------- SOCIOS ----------
create table partners (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid unique references auth.users(id),  -- login de Supabase
  name        text not null,
  created_at  timestamptz not null default now()
);

-- ---------- CATEGORÍAS (pestañas) ----------
-- Jerárquicas: "Deportes" > "MLB", "NFL"...  /  "Pokémon"
create table categories (
  id          serial primary key,
  parent_id   int references categories(id) on delete restrict,
  name        text not null,
  slug        text not null unique,        -- para la URL: /pokemon, /deportes/mlb
  sort_order  int not null default 0,
  is_active   boolean not null default true
);

-- ---------- COLECCIONES / SETS ----------
-- "Prismatic Evolutions", "2025 Topps Chrome", "2024 Panini Prizm Football"
create table collections (
  id           serial primary key,
  category_id  int not null references categories(id),
  name         text not null,
  slug         text not null unique,
  brand        text,                 -- Pokémon Co., Topps, Panini, Upper Deck
  year         int,
  release_date date,
  image_url    text,
  is_active    boolean not null default true
);

-- ---------- PRODUCTOS / INVENTARIO ----------
create table products (
  id               uuid primary key default gen_random_uuid(),
  sku              text unique,                -- tu código interno
  type             product_type not null,
  category_id      int not null references categories(id),
  collection_id    int references collections(id),

  name             text not null,              -- "Charizard ex SIR" / "Shohei Ohtani Rookie"
  subject          text,                       -- Pokémon o jugador
  team             text,                       -- solo deportes
  card_number      text,                       -- "199/165", "#27"
  variant          text,                       -- parallel/foil: "Refractor", "Reverse Holo"
  serial_number    text,                       -- numeradas: "12/99"
  language         text default 'EN',

  -- Condición / gradeo
  condition        card_condition,             -- singles raw
  grading_company  text,                       -- PSA, BGS, SGC, CGC
  grade            numeric(3,1),               -- 10, 9.5...
  cert_number      text,                       -- número de certificado
  description      text,

  -- Precio
  price            numeric(10,2) check (price >= 0),   -- vacío = "Consultar precio"
  compare_at_price numeric(10,2)
                   check (compare_at_price is null or (price is not null and compare_at_price > price)),
                                               -- precio "antes" → alimenta Ofertas
  cost             numeric(10,2),              -- privado, solo socios

  -- Control interno
  quantity         int not null default 1 check (quantity >= 0),  -- singles = 1, sellado puede ser >1
  status           item_status not null default 'disponible',
  owner_id         uuid references partners(id),  -- quién lo aportó (null = del negocio)
  is_consignment   boolean not null default false,
  location         text,                       -- "Caja A", "con Ricardo"
  is_featured      boolean not null default false,

  created_by       uuid references partners(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  unique (grading_company, cert_number)
);

create index on products (category_id, status);
create index on products (collection_id);
create index on products (status);

-- ---------- SEGMENTOS / ETIQUETAS ----------
-- SIR, Full Art, Parallel, Autógrafo, Rookie... Un producto puede tener varios.
-- Para agregar un segmento nuevo solo insertas una fila aquí.
create table tags (
  id          serial primary key,
  name        text not null,
  slug        text not null unique,          -- para la URL: /segmento/sir
  scope       text not null default 'all'
              check (scope in ('all', 'pokemon', 'deportes')),  -- en qué pestañas aplica
  sort_order  int not null default 0,
  is_active   boolean not null default true
);

create table product_tags (
  product_id  uuid not null references products(id) on delete cascade,
  tag_id      int  not null references tags(id) on delete cascade,
  primary key (product_id, tag_id)
);
create index on product_tags (tag_id);

-- Fotos (varias por producto)
create table product_images (
  id          serial primary key,
  product_id  uuid not null references products(id) on delete cascade,
  url         text not null,
  sort_order  int not null default 0
);

-- ---------- APARTADOS ----------
create table reservations (
  id             serial primary key,
  product_id     uuid not null references products(id),
  customer_name  text not null,
  contact        text,                       -- IG / WhatsApp
  quantity       int not null default 1,
  reserved_by    uuid references partners(id),
  expires_at     timestamptz,                -- hasta cuándo se respeta
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

-- ---------- VENTAS ----------
create table sales (
  id             serial primary key,
  product_id     uuid not null references products(id),
  quantity       int not null default 1 check (quantity > 0),
  sale_price     numeric(10,2) not null,     -- precio final real (por pieza)
  channel        sales_channel not null,
  sold_by        uuid references partners(id),
  customer_name  text,
  notes          text,
  sold_at        timestamptz not null default now()
);

-- ---------- HISTORIAL DE MOVIMIENTOS ----------
create table inventory_log (
  id          bigserial primary key,
  product_id  uuid not null references products(id) on delete cascade,
  old_status  item_status,
  new_status  item_status,
  old_qty     int,
  new_qty     int,
  changed_by  uuid,                          -- auth.uid()
  changed_at  timestamptz not null default now()
);

-- =====================================================================
-- TRIGGERS
-- =====================================================================

-- updated_at + log automático de cambios de estado/cantidad
create or replace function trg_products_log()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if new.status is distinct from old.status or new.quantity is distinct from old.quantity then
    insert into inventory_log (product_id, old_status, new_status, old_qty, new_qty, changed_by)
    values (new.id, old.status, new.status, old.quantity, new.quantity, auth.uid());
  end if;
  return new;
end $$;

create trigger products_log
before update on products
for each row execute function trg_products_log();

-- Al apartar: el producto pasa a 'apartado' (si es pieza única)
create or replace function trg_reservation_apply()
returns trigger language plpgsql as $$
begin
  update products
     set status = 'apartado'
   where id = new.product_id and quantity <= new.quantity;
  return new;
end $$;

create trigger reservation_apply
after insert on reservations
for each row execute function trg_reservation_apply();

-- Al registrar venta: descuenta cantidad, marca vendido si llega a 0
-- y cierra el apartado activo. Evita vender lo que ya no hay.
create or replace function trg_sale_apply()
returns trigger language plpgsql as $$
declare v_qty int;
begin
  select quantity into v_qty from products where id = new.product_id for update;
  if v_qty is null or v_qty < new.quantity then
    raise exception 'Stock insuficiente para el producto %', new.product_id;
  end if;

  update products
     set quantity = quantity - new.quantity,
         status   = case when quantity - new.quantity = 0 then 'vendido'::item_status else status end
   where id = new.product_id;

  update reservations set is_active = false
   where product_id = new.product_id and is_active;
  return new;
end $$;

create trigger sale_apply
before insert on sales
for each row execute function trg_sale_apply();

-- =====================================================================
-- VISTAS PÚBLICAS (lo que consume la web)
-- =====================================================================

-- Catálogo: solo lo publicado, sin costo ni datos internos
create view catalog as
select p.id, p.sku, p.type, p.name, p.subject, p.team, p.card_number,
       p.variant, p.serial_number, p.language, p.condition, p.grading_company, p.grade, p.cert_number,
       p.description, p.price, p.compare_at_price, p.quantity, p.is_featured,
       p.created_at,
       c.slug  as category_slug,  c.name  as category_name,
       pc.slug as parent_category_slug,
       col.slug as collection_slug, col.name as collection_name, col.year as collection_year,
       (p.compare_at_price is not null) as is_on_sale,
       coalesce((select array_agg(t.slug order by t.sort_order)
                   from product_tags pt join tags t on t.id = pt.tag_id
                  where pt.product_id = p.id and t.is_active), '{}') as tags,
       (select url from product_images i where i.product_id = p.id
         order by sort_order limit 1) as cover_image
  from products p
  join categories c        on c.id = p.category_id
  left join categories pc  on pc.id = c.parent_id
  left join collections col on col.id = p.collection_id
 where p.status = 'publicado' and p.quantity > 0;

-- Pestaña "Ofertas"
create view catalog_offers as
select * from catalog where is_on_sale;

-- Utilidad por socio (solo para el panel admin)
create view partner_profit as
select coalesce(pt.name, 'Negocio') as owner,
       count(*)                                  as piezas_vendidas,
       sum(s.sale_price * s.quantity)            as venta,
       sum(coalesce(p.cost,0) * s.quantity)      as costo,
       sum((s.sale_price - coalesce(p.cost,0)) * s.quantity) as utilidad
  from sales s
  join products p on p.id = s.product_id
  left join partners pt on pt.id = p.owner_id
 group by pt.name;

-- =====================================================================
-- SEGURIDAD (RLS)
-- Público: solo lee el catálogo. Socios: leen y escriben todo.
-- =====================================================================

create or replace function is_partner()
returns boolean language sql stable security definer as $$
  select exists (select 1 from partners where user_id = auth.uid());
$$;

alter table partners       enable row level security;
alter table categories     enable row level security;
alter table collections    enable row level security;
alter table products       enable row level security;
alter table product_images enable row level security;
alter table tags           enable row level security;
alter table product_tags   enable row level security;
alter table reservations   enable row level security;
alter table sales          enable row level security;
alter table inventory_log  enable row level security;

-- Lectura pública de lo necesario para navegar
create policy pub_read_categories  on categories     for select using (is_active);
create policy pub_read_collections on collections    for select using (is_active);
create policy pub_read_images      on product_images for select using (true);
create policy pub_read_tags        on tags           for select using (is_active);
create policy pub_read_ptags       on product_tags   for select using (true);
create policy pub_read_products    on products       for select
  using (status = 'publicado' or is_partner());

-- Socios: acceso total
create policy partner_all_partners     on partners       for all using (is_partner()) with check (is_partner());
create policy partner_all_categories   on categories     for all using (is_partner()) with check (is_partner());
create policy partner_all_collections  on collections    for all using (is_partner()) with check (is_partner());
create policy partner_all_products     on products       for all using (is_partner()) with check (is_partner());
create policy partner_all_images       on product_images for all using (is_partner()) with check (is_partner());
create policy partner_all_tags         on tags           for all using (is_partner()) with check (is_partner());
create policy partner_all_ptags        on product_tags   for all using (is_partner()) with check (is_partner());
create policy partner_all_reservations on reservations   for all using (is_partner()) with check (is_partner());
create policy partner_all_sales        on sales          for all using (is_partner()) with check (is_partner());
create policy partner_read_log         on inventory_log  for select using (is_partner());

-- Las vistas respetan el RLS de quien consulta
alter view catalog        set (security_invoker = true);
alter view catalog_offers set (security_invoker = true);
alter view partner_profit set (security_invoker = true);

-- Columnas internas (costo, dueño, ubicación) NO salen al público:
-- se quita el acceso a la tabla y se da solo a columnas públicas.
revoke select on products from anon;
grant select (id, sku, type, category_id, collection_id, name, subject, team,
              card_number, variant, serial_number, language, condition, grading_company, grade, cert_number, description,
              price, compare_at_price, quantity, status, is_featured, created_at)
  on products to anon;

-- =====================================================================
-- SEED: pestañas iniciales
-- =====================================================================
insert into categories (id, parent_id, name, slug, sort_order) values
  (1, null, 'Pokémon',     'pokemon',            1),
  (2, null, 'Deportes',    'deportes',           2),
  (3, 2,    'MLB',         'mlb',                1),
  (4, 2,    'NFL',         'nfl',                2),
  (5, 2,    'NBA',         'nba',                3),
  (6, 2,    'Fútbol',      'futbol',             4),
  (7, 2,    'UFC',         'ufc',                5);
select setval('categories_id_seq', 7);

-- Segmentos iniciales
insert into tags (name, slug, scope, sort_order) values
  ('SIR',                         'sir',         'pokemon',  1),
  ('Illustration Rare',           'ir',          'pokemon',  2),
  ('Full Art',                    'full-art',    'pokemon',  3),
  ('Hyper Rare / Gold',           'hyper-rare',  'pokemon',  4),
  ('Parallel',                    'parallel',    'deportes', 10),
  ('Autógrafo',                   'autografo',   'all',      11),
  ('Rookie',                      'rookie',      'deportes', 12),
  ('Patch / Relic',               'patch',       'deportes', 13);
