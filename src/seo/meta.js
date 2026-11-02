// Títulos, descripciones y datos estructurados de cada página.
// Lo usan la página (en el navegador) y el pre-render (scripts/prerender.mjs) al construir el sitio.

export const SITE = 'https://www.thecardboxmx.com';
export const BRAND = 'The Card Box MX';
export const DEFAULT_IMAGE = `${SITE}/brand/TheCardBoxMX-logo-1200.png`;
export const INSTAGRAM = 'https://www.instagram.com/thecardboxmx';
export const WHATSAPP = 'https://wa.me/525536513092';

export const abs = (url) => (!url ? DEFAULT_IMAGE : /^https?:/i.test(url) ? url : `${SITE}${url.startsWith('/') ? '' : '/'}${url}`);
const clip = (s, n = 158) => { const t = (s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t; };

// Cómo se nombra cada colección/liga en búsquedas
const SEARCH_NAME = {
  pokemon: 'Pokémon', naruto: 'Naruto', 'one-piece': 'One Piece', deportes: 'deportivas',
  mlb: 'MLB de béisbol', nfl: 'NFL de americano', nba: 'NBA de basquetbol', futbol: 'de fútbol', ufc: 'de UFC',
};

export const organizationLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: BRAND,
  url: SITE,
  logo: DEFAULT_IMAGE,
  image: DEFAULT_IMAGE,
  description: 'Tienda de cartas coleccionables en México: Pokémon, One Piece, Naruto y cartas deportivas. Singles, cartas gradeadas y producto sellado.',
  sameAs: [INSTAGRAM],
  areaServed: 'MX',
  currenciesAccepted: 'MXN',
  contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', url: WHATSAPP, availableLanguage: ['es'] },
});

const websiteLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: BRAND,
  url: SITE,
  inLanguage: 'es-MX',
  potentialAction: { '@type': 'SearchAction', target: `${SITE}/catalogo?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
});

// --- Páginas fijas -------------------------------------------------------
export function staticMeta(path, categories = []) {
  const clean = path.replace(/\/+$/, '') || '/';
  if (clean === '/') {
    return {
      path: '/',
      title: 'The Card Box MX | Cartas y coleccionables en México',
      description: 'Cartas coleccionables auténticas en México: Pokémon, One Piece, Naruto y cartas deportivas (MLB, NFL, NBA, fútbol). Singles, gradeadas y producto sellado. Envíos a todo México.',
      jsonLd: [organizationLd(), websiteLd()],
    };
  }
  const fixed = {
    '/catalogo': ['Catálogo de cartas coleccionables en México | The Card Box MX', 'Explora cartas Pokémon, One Piece, Naruto y deportivas: singles, cartas gradeadas PSA y producto sellado. Busca la tuya y aparta por WhatsApp.'],
    '/catalogo/ofertas': ['Ofertas en cartas coleccionables | The Card Box MX', 'Cartas y producto sellado con precio especial por tiempo limitado. Pokémon, One Piece, Naruto y deportes.'],
    '/blog': ['Blog de cartas coleccionables: noticias TCG cada semana | The Card Box MX', 'El Top 5 de noticias de la semana en Pokémon TCG, One Piece, Naruto y cartas deportivas: lanzamientos, preventas y precios.'],
    '/arcade': ['Pinball TCB: juega y gana descuentos | The Card Box MX', 'Juega el pinball de The Card Box. Los 3 mejores puntajes del mes ganan 15%, 10% y 5% de descuento.'],
    '/rifas': ['Sorteos, rifas y breaks de cartas | The Card Box MX', 'Muy pronto: sorteos, rifas y breaks en vivo de cartas Pokémon y deportivas.'],
    '/nosotros': ['Nosotros | The Card Box MX', 'Somos coleccionistas en México. Buscamos y cuidamos cartas auténticas y verificadas para tu colección.'],
  };
  if (fixed[clean]) return { path: clean, title: fixed[clean][0], description: fixed[clean][1] };

  // /catalogo/<coleccion> o /catalogo/<coleccion>/<liga>
  const m = clean.match(/^\/catalogo\/([^/]+)(?:\/([^/]+))?$/);
  if (m) {
    const slug = m[2] || m[1];
    const cat = categories.find((c) => c.slug === slug);
    const name = SEARCH_NAME[slug] || cat?.name || slug;
    const title = slug === 'deportes'
      ? 'Cartas deportivas en México: MLB, NFL, NBA, fútbol y UFC | The Card Box MX'
      : `Cartas ${name} en México: singles y producto sellado | The Card Box MX`;
    const description = clip(`${cat?.description ? `${cat.description} ` : ''}Compra cartas ${name} auténticas en México. Envíos a todo el país y apartados por WhatsApp.`);
    return { path: clean, title, description };
  }
  return null;
}

// --- Producto ------------------------------------------------------------
export function productMeta(p) {
  const grade = p.grading_company && p.grade != null ? `${p.grading_company} ${Number(p.grade)}` : '';
  const kind = p.type === 'sealed' ? 'producto sellado' : grade ? `carta gradeada ${grade}` : 'carta';
  const where = [p.collection_name, p.category_name].filter(Boolean).join(' · ');
  const title = `${p.name}${grade ? ` ${grade}` : ''}${p.collection_name ? ` – ${p.collection_name}` : ''} | ${BRAND}`;
  const price = p.price != null ? ` Precio: $${Number(p.price).toLocaleString('es-MX')} MXN.` : ' Pregunta el precio por WhatsApp.';
  const description = clip(`${p.name} (${kind}${where ? `, ${where}` : ''}) disponible en The Card Box MX.${price} Envíos a todo México.`);
  const images = (p.images && p.images.length ? p.images : [p.cover_image]).filter(Boolean).map(abs);
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    image: images.length ? images : [DEFAULT_IMAGE],
    description: p.description || description,
    sku: p.sku || p.slug,
    brand: { '@type': 'Brand', name: p.category_name || BRAND },
    category: p.category_name,
    ...(p.price != null ? {
      offers: {
        '@type': 'Offer',
        url: `${SITE}/carta/${p.slug}`,
        priceCurrency: 'MXN',
        price: Number(p.price).toFixed(2),
        availability: 'https://schema.org/InStock',
        itemCondition: p.type === 'sealed' ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition',
        seller: { '@type': 'Organization', name: BRAND },
      },
    } : {}),
  };
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Catálogo', item: `${SITE}/catalogo` },
      ...(p.category_name ? [{ '@type': 'ListItem', position: 2, name: p.category_name, item: `${SITE}/catalogo/${p.parent_category_slug ? `${p.parent_category_slug}/` : ''}${p.category_slug}` }] : []),
      { '@type': 'ListItem', position: p.category_name ? 3 : 2, name: p.name, item: `${SITE}/carta/${p.slug}` },
    ],
  };
  // Google pide precio para mostrar el producto como resultado enriquecido; sin precio solo mandamos la ruta
  return { path: `/carta/${p.slug}`, title, description, image: images[0], type: 'product', jsonLd: p.price != null ? [ld, breadcrumb] : [breadcrumb] };
}

// --- Artículo del blog ---------------------------------------------------
export function postMeta(post) {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || undefined,
    image: abs(post.cover_url),
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    inLanguage: 'es-MX',
    author: { '@type': 'Organization', name: BRAND, url: SITE },
    publisher: { '@type': 'Organization', name: BRAND, logo: { '@type': 'ImageObject', url: DEFAULT_IMAGE } },
    mainEntityOfPage: `${SITE}/blog/${post.slug}`,
  };
  return {
    path: `/blog/${post.slug}`,
    title: `${post.title} | ${BRAND}`,
    description: clip(post.excerpt || post.body_md?.replace(/[#*>\[\]()_`-]/g, ' ')),
    image: abs(post.cover_url),
    type: 'article',
    jsonLd: [ld],
  };
}
