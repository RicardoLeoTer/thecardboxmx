// Pre-render para SEO: después de `vite build` genera un index.html por página
// (inicio, catálogo, cada colección/liga, cada carta y cada artículo del blog) con su
// título, descripción, canonical, Open Graph, datos estructurados y el contenido en HTML.
// Así Google y los previews de WhatsApp/Facebook ven la información sin ejecutar JavaScript.
// Si la base de datos no responde, genera solo las páginas fijas y NO rompe el build.

import fs from 'node:fs/promises';
import path from 'node:path';
import { SITE, DEFAULT_IMAGE, staticMeta, productMeta, postMeta, abs } from '../src/seo/meta.js';
import { FALLBACK_CATEGORIES } from '../src/data/fallbackCatalog.js';

const DIST = path.resolve('dist');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (n) => `$${Number(n).toLocaleString('es-MX')} MXN`;

async function rest(q) {
  const base = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!base || !key) return null;
  try {
    const r = await fetch(`${base}/rest/v1/${q}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

function headTags(meta) {
  const url = `${SITE}${meta.path === '/' ? '/' : meta.path}`;
  const img = meta.image || DEFAULT_IMAGE;
  const type = meta.type === 'article' ? 'article' : meta.type === 'product' ? 'product' : 'website';
  return [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:site_name" content="The Card Box MX" />`,
    `<meta property="og:locale" content="es_MX" />`,
    `<meta property="og:image" content="${esc(img)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    `<meta name="twitter:image" content="${esc(img)}" />`,
    ...(meta.jsonLd || []).map((o) => `<script type="application/ld+json" data-seo-ld>${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`),
  ].join('\n    ');
}

function render(template, meta, body) {
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+(name|property)="(description|robots|og:[^"]+|twitter:[^"]+)"[^>]*>\s*/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '');
  html = html.replace('</head>', `    ${headTags(meta)}\n  </head>`);
  const shell = `<div style="background:#060608;color:#e4ecf8;font-family:Helvetica,Arial,sans-serif;min-height:100vh;padding:24px;line-height:1.6">${NAV}${body}</div>`;
  return html.replace(/<div id="root"><\/div>/, `<div id="root">${shell}</div>`);
}

const NAV = `<nav style="margin-bottom:24px"><a href="/" style="color:#c0ccd8">The Card Box MX</a> · <a href="/catalogo" style="color:#8898b0">Catálogo</a> · <a href="/blog" style="color:#8898b0">Blog</a> · <a href="/arcade" style="color:#8898b0">Arcade</a> · <a href="/nosotros" style="color:#8898b0">Nosotros</a></nav>`;
const link = (href, text) => `<a href="${esc(href)}" style="color:#7cc4e0">${esc(text)}</a>`;

function productItem(p) {
  return `<li>${link(`/carta/${p.slug}`, p.name)}${p.collection_name ? ` — ${esc(p.collection_name)}` : ''}${p.price != null ? ` · ${money(p.price)}` : ''}</li>`;
}

async function write(route, html) {
  const file = route === '/' ? path.join(DIST, 'index.html') : path.join(DIST, route.replace(/^\//, ''), 'index.html');
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, html);
}

async function main() {
  const template = await fs.readFile(path.join(DIST, 'index.html'), 'utf8');
  const [cats, products, posts] = await Promise.all([
    rest('categories?select=id,parent_id,name,slug,description,claim,singles_text,sealed_text,sort_order&is_active=eq.true&order=sort_order'),
    rest('catalog?select=*'),
    rest('blog_posts?select=slug,title,excerpt,body_md,cover_url,published_at,updated_at&status=eq.publicado&order=published_at.desc'),
  ]);
  const categories = cats || FALLBACK_CATEGORIES;
  const items = (products || []).filter((p) => p.slug);
  const blog = (posts || []).filter((p) => p.slug);
  let count = 0;

  // Inicio
  {
    const roots = categories.filter((c) => !c.parent_id);
    const body = `<h1>The Card Box MX: cartas y coleccionables en México</h1>
<p>Cartas Pokémon, One Piece, Naruto y cartas deportivas (MLB, NFL, NBA, fútbol y UFC). Singles, cartas gradeadas y producto sellado, auténticos y verificados. Envíos a todo México.</p>
<h2>Colecciones</h2><ul>${roots.map((c) => `<li>${link(`/catalogo/${c.slug}`, c.name)}${c.description ? ` — ${esc(c.description)}` : ''}</li>`).join('')}</ul>
${items.length ? `<h2>Disponibles</h2><ul>${items.slice(0, 24).map(productItem).join('')}</ul>` : ''}
${blog.length ? `<h2>Del blog</h2><ul>${blog.slice(0, 5).map((p) => `<li>${link(`/blog/${p.slug}`, p.title)}</li>`).join('')}</ul>` : ''}
<p>${link('/arcade', 'Juega Pinball TCB y gana descuentos')}</p>`;
    await write('/', render(template, staticMeta('/'), body)); count++;
  }

  // Páginas fijas
  for (const route of ['/catalogo', '/catalogo/ofertas', '/blog', '/arcade', '/rifas', '/nosotros']) {
    const meta = staticMeta(route, categories);
    let body = `<h1>${esc(meta.title.split(' | ')[0])}</h1><p>${esc(meta.description)}</p>`;
    if (route === '/catalogo') body += `<ul>${categories.map((c) => { const parent = categories.find((x) => x.id === c.parent_id); return `<li>${link(parent ? `/catalogo/${parent.slug}/${c.slug}` : `/catalogo/${c.slug}`, c.name)}</li>`; }).join('')}</ul><ul>${items.map(productItem).join('')}</ul>`;
    if (route === '/catalogo/ofertas') body += `<ul>${items.filter((p) => p.is_on_sale).map(productItem).join('')}</ul>`;
    if (route === '/blog') body += `<ul>${blog.map((p) => `<li>${link(`/blog/${p.slug}`, p.title)}${p.excerpt ? ` — ${esc(p.excerpt)}` : ''}</li>`).join('')}</ul>`;
    await write(route, render(template, meta, body)); count++;
  }

  // Colecciones y ligas
  for (const c of categories) {
    const parent = categories.find((x) => x.id === c.parent_id);
    const route = parent ? `/catalogo/${parent.slug}/${c.slug}` : `/catalogo/${c.slug}`;
    const meta = staticMeta(route, categories);
    const own = items.filter((p) => p.category_slug === c.slug || p.parent_category_slug === c.slug);
    const subs = categories.filter((x) => x.parent_id === c.id);
    const body = `<h1>${esc(meta.title.split(' | ')[0])}</h1>${c.claim ? `<p><i>${esc(c.claim)}</i></p>` : ''}<p>${esc(meta.description)}</p>
${c.singles_text ? `<h2>Singles</h2><p>${esc(c.singles_text)}</p>` : ''}${c.sealed_text ? `<h2>Producto cerrado</h2><p>${esc(c.sealed_text)}</p>` : ''}
${subs.length ? `<ul>${subs.map((s) => `<li>${link(`/catalogo/${c.slug}/${s.slug}`, s.name)}</li>`).join('')}</ul>` : ''}
${own.length ? `<ul>${own.map(productItem).join('')}</ul>` : '<p>Muy pronto.</p>'}`;
    await write(route, render(template, meta, body)); count++;
  }

  // Cada carta
  for (const p of items) {
    const meta = productMeta(p);
    const grade = p.grading_company && p.grade != null ? `${p.grading_company} ${Number(p.grade)}` : null;
    const rows = [['Colección', p.collection_name], ['Categoría', p.category_name], ['Gradeo', grade], ['Condición', p.condition], ['Variante', p.variant], ['Número', p.card_number]]
      .filter(([, v]) => v).map(([k, v]) => `<li><b>${esc(k)}:</b> ${esc(v)}</li>`).join('');
    const body = `<p>${link('/catalogo', 'Catálogo')}${p.category_name ? ` › ${link(`/catalogo/${p.parent_category_slug ? `${p.parent_category_slug}/` : ''}${p.category_slug}`, p.category_name)}` : ''}</p>
<h1>${esc(p.name)}</h1>
${p.cover_image ? `<img src="${esc(abs(p.cover_image))}" alt="${esc(p.name)}" width="300" />` : ''}
<p><b>${p.price != null ? money(p.price) : 'Pregunta el precio'}</b> · Envíos a todo México</p>
<ul>${rows}</ul>${p.description ? `<p>${esc(p.description)}</p>` : ''}
<p><a href="https://wa.me/525536513092" style="color:#25D366">Lo quiero por WhatsApp</a></p>`;
    await write(meta.path, render(template, meta, body)); count++;
  }

  // Cada artículo del blog
  let marked = null;
  try { ({ marked } = await import('marked')); } catch { /* sin markdown, se manda el resumen */ }
  for (const post of blog) {
    const meta = postMeta(post);
    const content = marked ? marked.parse((post.body_md || '').replace(/<[^>]+>/g, '')) : `<p>${esc(post.excerpt)}</p>`;
    const body = `<p>${link('/blog', 'Blog')}</p><article><h1>${esc(post.title)}</h1>${post.excerpt ? `<p>${esc(post.excerpt)}</p>` : ''}${content}</article>`;
    await write(meta.path, render(template, meta, body)); count++;
  }

  console.log(`[prerender] ${count} páginas (${items.length} cartas, ${blog.length} artículos${products ? '' : ', sin conexión a la base'})`);
}

main().catch((e) => { console.warn('[prerender] omitido:', e.message); });
