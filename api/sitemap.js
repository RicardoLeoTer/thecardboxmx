// Sitemap dinámico: páginas fijas + cada carta publicada + cada artículo del blog.
// Vercel lo sirve en /sitemap.xml (ver vercel.json). Se actualiza solo al publicar algo.
const SITE = 'https://www.thecardboxmx.com';

const STATIC = [
  ['/', 'daily', '1.0'],
  ['/catalogo', 'daily', '0.9'],
  ['/catalogo/ofertas', 'daily', '0.7'],
  ['/blog', 'weekly', '0.8'],
  ['/arcade', 'monthly', '0.5'],
  ['/rifas', 'monthly', '0.4'],
  ['/nosotros', 'yearly', '0.4'],
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const url = (loc, lastmod, changefreq, priority) =>
  `  <url><loc>${esc(SITE + loc)}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ''}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;

async function rest(path) {
  const base = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!base || !key) return [];
  const r = await fetch(`${base}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  return r.ok ? r.json() : [];
}

export default async function handler(req, res) {
  let categories = [], products = [], posts = [];
  try {
    [categories, products, posts] = await Promise.all([
      rest('categories?select=slug,parent_id,id&is_active=eq.true'),
      rest('catalog?select=slug,created_at'),
      rest('blog_posts?select=slug,published_at,updated_at&status=eq.publicado'),
    ]);
  } catch { /* si falla la base, se manda al menos el sitemap fijo */ }

  const bySlug = Object.fromEntries(categories.map((c) => [c.id, c.slug]));
  const catUrls = categories.map((c) => (c.parent_id ? `/catalogo/${bySlug[c.parent_id]}/${c.slug}` : `/catalogo/${c.slug}`));

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...STATIC.map(([p, f, pr]) => url(p, null, f, pr)),
    ...catUrls.map((p) => url(p, null, 'daily', '0.8')),
    ...products.filter((p) => p.slug).map((p) => url(`/carta/${p.slug}`, p.created_at, 'weekly', '0.7')),
    ...posts.filter((p) => p.slug).map((p) => url(`/blog/${p.slug}`, p.updated_at || p.published_at, 'monthly', '0.6')),
    '</urlset>',
  ].join('\n');

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
}
