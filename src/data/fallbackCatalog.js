// Catálogo local de respaldo: se usa mientras no estén configuradas las variables de Supabase.
// Tiene la misma forma que la vista `catalog` de la base de datos.
// Estos mismos productos se cargan a la base con supabase/03_productos_actuales.sql

export const FALLBACK_CATEGORIES = [
  { id: 1, parent_id: null, name: 'Pokémon', slug: 'pokemon', sort_order: 1, image_url: '/images/MEGACHARIZARDEX.jpg', description: 'Singles, alt arts, SIR y producto sellado de colecciones nuevas y vintage.' },
  { id: 8, parent_id: null, name: 'Naruto', slug: 'naruto', sort_order: 2, description: 'Cartas coleccionables de Naruto: singles raras y sobres sellados.' },
  { id: 9, parent_id: null, name: 'One Piece', slug: 'one-piece', sort_order: 3, description: 'One Piece Card Game: líderes, alt arts y producto sellado.' },
  { id: 2, parent_id: null, name: 'Deportes', slug: 'deportes', sort_order: 4, description: 'MLB, NFL, NBA, fútbol y UFC.' },
  { id: 3, parent_id: 2, name: 'MLB', slug: 'mlb', sort_order: 1, description: 'Rookies, parallels, autógrafos y hobby boxes de béisbol.' },
  { id: 4, parent_id: 2, name: 'NFL', slug: 'nfl', sort_order: 2, description: 'Cartas de americano: rookies, patches y producto sellado.' },
  { id: 5, parent_id: 2, name: 'NBA', slug: 'nba', sort_order: 3, description: 'Basketball: Prizm, Select, rookies y autógrafos.' },
  { id: 6, parent_id: 2, name: 'Fútbol', slug: 'futbol', sort_order: 4, description: 'Liga MX, Champions y selecciones: Topps, Panini y más.' },
  { id: 7, parent_id: 2, name: 'UFC', slug: 'ufc', sort_order: 5, description: 'Peleadores, autógrafos y producto sellado de UFC.' },
]

export const FALLBACK_TAGS = [
  { id: 3, name: 'Full Art', slug: 'full-art', scope: 'pokemon', sort_order: 1 },
  { id: 9, name: 'Vintage', slug: 'vintage', scope: 'pokemon', sort_order: 2 },
  { id: 11, name: 'Base', slug: 'base', scope: 'all', sort_order: 3 },
  { id: 10, name: 'Jugable', slug: 'jugable', scope: 'pokemon', sort_order: 4 },
  { id: 12, name: 'Refractor', slug: 'refractor', scope: 'deportes', sort_order: 9 },
  { id: 5, name: 'Parallel', slug: 'parallel', scope: 'deportes', sort_order: 10 },
  { id: 6, name: 'Autógrafo', slug: 'autografo', scope: 'all', sort_order: 11 },
  { id: 7, name: 'Rookie', slug: 'rookie', scope: 'deportes', sort_order: 12 },
  { id: 8, name: 'Patch / Relic', slug: 'patch', scope: 'deportes', sort_order: 13 },
  { id: 13, name: 'Insert', slug: 'insert', scope: 'deportes', sort_order: 14 },
  { id: 14, name: 'Image Variation', slug: 'image-variation', scope: 'deportes', sort_order: 15 },
  { id: 15, name: 'Case Hit', slug: 'case-hit', scope: 'deportes', sort_order: 16 },
]

const single = (name, collection, subject, image) => ({ type: 'single', name, collection, subject, image, price: null })
const sealed = (name, collection, price, image) => ({ type: 'sealed', name, collection, subject: null, image, price })

// Productos que estaban en la página antes de la base de datos
export const LEGACY_PRODUCTS = [
  single('Mega Charizard EX', 'Phantasmal Flames', 'Charizard', '/images/MEGACHARIZARDEX.jpg'),
  single('Charmander', 'Top Sun', 'Charmander', '/images/CHARMANDERTOPSUN.jpg'),
  single('Pikachu', '25th Anniversary', 'Pikachu', '/images/BIRTHDAYPIKA.jpg'),
  single('Entei', 'Crown Zenith', 'Entei', '/images/ENTEIV.jpg'),
  single('Bulbasaur', 'Stellar Crown', 'Bulbasaur', '/images/SLEEPYBULBASAUR.jpg'),
  single('Mimikyu', 'Destined Rivals', 'Mimikyu', '/images/TEAMRMIMIKYU.jpg'),
  single('Froakie', 'Ninja Spinner', 'Froakie', '/images/FROAKIE.jpg'),
  single('Frogadier', 'Ninja Spinner', 'Frogadier', '/images/FROGADIER.jpg'),
  single('Psyduck', 'Mega Dream ex', 'Psyduck', '/images/PYSDUCK.jpg'),
  single('Murkrow', 'The Glory Of Team Rocket', 'Murkrow', '/images/TEAMRMURK.jpg'),
  single('Eevee', 'Top Sun', 'Eevee', '/images/EEVEETOPSUN.jpg'),
  single('Jolteon', 'Top Sun', 'Jolteon', '/images/JOLTEONTOPSUN.jpg'),
  single('Blastoise', 'Top Sun', 'Blastoise', '/images/BLASTOISETOPSUN.jpg'),
  sealed('Meganium ex Mega EX Box', 'Ascended Heroes', 750, '/images/meganiumexbox.jpg'),
  sealed('Feraligatr ex Mega EX Box', 'Ascended Heroes', 750, '/images/feraligatrexbox.jpg'),
  sealed('Emboar ex Mega EX Box', 'Ascended Heroes', 750, '/images/emboarexbox.jpg'),
  sealed('Pokeball Tin', null, 350, '/images/pokeballtin.jpg'),
  sealed('Ascended Heroes Booster Bundle', 'Ascended Heroes', 900, '/images/boosterbundleASC.jpg'),
  sealed('Team Rocket´s Nidoking Tin', null, 650, '/images/trnidotin.jpg'),
  sealed('Paradox Destinies Iron Crown Tin', null, 500, '/images/paradoxtin.jpg'),
  sealed('Mega Symphonia Booster Box', null, 1600, '/images/megasympho.jpg'),
]

export const FALLBACK_ITEMS = LEGACY_PRODUCTS.map((p, i) => ({
  id: `local-${i}`,
  type: p.type,
  name: p.name,
  subject: p.subject,
  team: null,
  price: p.price,
  compare_at_price: null,
  is_on_sale: false,
  quantity: 1,
  grading_company: null,
  grade: null,
  condition: null,
  variant: null,
  serial_number: null,
  category_slug: 'pokemon',
  category_name: 'Pokémon',
  parent_category_slug: null,
  collection_slug: null,
  collection_name: p.collection,
  tags: [],
  cover_image: p.image,
  is_featured: false,
  created_at: null,
}))
