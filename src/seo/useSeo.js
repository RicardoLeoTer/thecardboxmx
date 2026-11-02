import { useEffect } from 'react';
import { SITE, DEFAULT_IMAGE } from './meta.js';

function setMeta(attr, key, value) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!value) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute('content', value);
}

// Actualiza título, descripción, canonical, Open Graph y datos estructurados de la página actual.
export function useSeo(meta) {
  const key = meta ? `${meta.path}|${meta.title}|${meta.description}` : '';
  useEffect(() => {
    if (!meta) return;
    const url = `${SITE}${meta.path === '/' ? '/' : meta.path}`;
    document.title = meta.title;
    setMeta('name', 'description', meta.description);
    setMeta('property', 'og:title', meta.title);
    setMeta('property', 'og:description', meta.description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:type', meta.type === 'article' ? 'article' : meta.type === 'product' ? 'product' : 'website');
    setMeta('property', 'og:image', meta.image || DEFAULT_IMAGE);
    setMeta('name', 'twitter:title', meta.title);
    setMeta('name', 'twitter:description', meta.description);
    setMeta('name', 'twitter:image', meta.image || DEFAULT_IMAGE);
    setMeta('name', 'robots', meta.noindex ? 'noindex, nofollow' : 'index, follow');

    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = url;

    document.head.querySelectorAll('script[data-seo-ld]').forEach((s) => s.remove());
    (meta.jsonLd || []).forEach((obj) => {
      const s = document.createElement('script');
      s.type = 'application/ld+json'; s.setAttribute('data-seo-ld', '');
      s.textContent = JSON.stringify(obj);
      document.head.appendChild(s);
    });
  }, [key]);
}
