import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MobileMenu from '../src/components/MobileMenu.jsx';
import { supabase } from '../src/lib/supabase.js';
import { useSeo } from '../src/seo/useSeo.js';
import { productMeta } from '../src/seo/meta.js';

const C = {
  platino: '#c0ccd8', platinoClaro: '#e4ecf8', acero: '#8898b0', azul: '#101a2e',
  azulAcento: '#1a6a8a', carbon: '#0d1117', negro: '#060608', oferta: '#c2410c',
};
const WHATSAPP = '525536513092';
const TYPE = { single: 'Carta individual', graded: 'Carta gradeada', sealed: 'Producto sellado', memorabilia: 'Memorabilia', accessory: 'Accesorio' };
const fmt = (n) => `$${Number(n).toLocaleString('es-MX')}`;

export default function Product() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, item: null, related: [], tags: [] });
  const [img, setImg] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0); setImg(0);
    if (!supabase) { setState({ loading: false, item: null, related: [], tags: [] }); return; }
    let alive = true;
    (async () => {
      const [{ data: item }, { data: tags }] = await Promise.all([
        supabase.from('catalog').select('*').eq('slug', slug).maybeSingle(),
        supabase.from('tags').select('slug, name'),
      ]);
      let related = [];
      if (item) {
        const { data } = await supabase.from('catalog').select('slug, name, price, cover_image, collection_name, type')
          .eq('category_slug', item.category_slug).neq('slug', slug).limit(4);
        related = data ?? [];
      }
      if (alive) setState({ loading: false, item, related, tags: tags ?? [] });
    })();
    return () => { alive = false; };
  }, [slug]);

  const { loading, item, related, tags } = state;
  useSeo(item ? productMeta(item) : loading ? null : { path: `/carta/${slug}`, title: 'Carta no disponible | The Card Box MX', description: 'Esta carta ya no está disponible. Revisa el catálogo.', noindex: true });

  const images = item ? (item.images?.length ? item.images : [item.cover_image]).filter(Boolean) : [];
  const tagNames = item ? (item.tags || []).map((s) => tags.find((t) => t.slug === s)?.name).filter(Boolean) : [];
  const catPath = item ? `/catalogo/${item.parent_category_slug ? `${item.parent_category_slug}/` : ''}${item.category_slug}` : '/catalogo';
  const details = item ? [
    ['Tipo', TYPE[item.type]],
    ['Colección', item.collection_name],
    [item.team ? 'Jugador' : 'Personaje', item.subject],
    ['Equipo', item.team],
    ['Número', item.card_number],
    ['Variante', item.variant],
    ['Numerada', item.serial_number],
    ['Gradeo', item.grading_company && item.grade != null ? `${item.grading_company} ${Number(item.grade)}` : null],
    ['Certificado', item.cert_number],
    ['Condición', item.condition],
    ['Idioma', item.language],
    ['Disponibles', item.quantity > 1 ? item.quantity : null],
  ].filter(([, v]) => v != null && v !== '') : [];
  const msg = item ? encodeURIComponent(`Hola! Me interesa: ${item.name}${item.collection_name ? ` (${item.collection_name})` : ''} — https://www.thecardboxmx.com/carta/${item.slug}`) : '';

  return (
    <div style={{ background: C.negro, color: '#fff', minHeight: '100vh', fontFamily: "'Manrope', 'Helvetica Neue', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,900&family=Manrope:wght@400;500;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .font-display { font-family: 'Fraunces', Georgia, serif; }
        .nav-link { background: none; border: none; cursor: pointer; font-size: 14px; font-weight: 500; color: ${C.acero}; }
        .nav-link:hover { color: ${C.platino}; }
        .crumb { background: none; border: none; color: ${C.acero}; cursor: pointer; font-size: 13px; font-weight: 600; }
        .crumb:hover { color: ${C.platino}; }
        .rel:hover { transform: translateY(-4px); }
      `}</style>

      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(6,6,8,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(192,204,216,0.08)', padding: '14px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => navigate('/')} className="font-display" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 17, fontWeight: 600, color: C.platino }}>The Card Box</button>
          <nav className="desk-nav" style={{ display: 'flex', gap: 22 }}>
            <button className="nav-link" onClick={() => navigate('/catalogo')}>Catálogo</button>
            <button className="nav-link" onClick={() => navigate('/blog')}>Blog</button>
            <button className="nav-link" onClick={() => navigate('/arcade')}>Arcade</button>
          </nav>
          <MobileMenu />
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 80px' }}>
        <nav aria-label="Ruta" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 22 }}>
          <button className="crumb" onClick={() => navigate('/catalogo')}>Catálogo</button>
          {item && <><span style={{ color: '#3a4656' }}>›</span><button className="crumb" onClick={() => navigate(catPath)}>{item.category_name}</button></>}
        </nav>

        {loading ? (
          <p style={{ color: C.acero, padding: '80px 0', textAlign: 'center' }}>Cargando…</p>
        ) : !item ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <h1 className="font-display" style={{ fontSize: 32, marginBottom: 12 }}>Esta carta ya no está disponible</h1>
            <p style={{ color: C.acero, marginBottom: 22 }}>Puede que ya se haya vendido. Revisa el catálogo o escríbenos.</p>
            <button onClick={() => navigate('/catalogo')} style={{ background: C.azulAcento, color: '#fff', border: 'none', borderRadius: 100, padding: '12px 26px', fontWeight: 700, cursor: 'pointer' }}>Ver catálogo</button>
          </div>
        ) : (
          <>
            <article style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, alignItems: 'start' }}>
              {/* fotos */}
              <div>
                <div style={{ borderRadius: 22, overflow: 'hidden', background: `radial-gradient(circle at 50% 40%, rgba(138,111,194,0.3) 0%, transparent 65%), linear-gradient(165deg, ${C.azul}, ${C.carbon})`, border: '1px solid rgba(192,204,216,0.12)', display: 'grid', placeItems: 'center', aspectRatio: '3 / 4' }}>
                  {images[img]
                    ? <img src={images[img]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 18 }} />
                    : <span style={{ fontSize: 80, opacity: 0.4 }}>🃏</span>}
                </div>
                {images.length > 1 && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                    {images.map((src, i) => (
                      <button key={src} onClick={() => setImg(i)} aria-label={`Foto ${i + 1}`} style={{ width: 64, height: 84, borderRadius: 10, overflow: 'hidden', border: i === img ? `2px solid ${C.azulAcento}` : '1px solid rgba(192,204,216,0.2)', background: C.azul, cursor: 'pointer', padding: 0 }}>
                        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* información */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, color: C.azulAcento, textTransform: 'uppercase', marginBottom: 10 }}>{item.category_name}{item.collection_name ? ` · ${item.collection_name}` : ''}</p>
                <h1 className="font-display" style={{ fontSize: 'clamp(30px, 5vw, 46px)', fontWeight: 900, lineHeight: 1.08, marginBottom: 14 }}>{item.name}</h1>
                {(item.is_on_sale || tagNames.length > 0) && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                    {item.is_on_sale && <span style={{ fontSize: 11, fontWeight: 800, padding: '5px 12px', borderRadius: 100, background: C.oferta }}>Oferta</span>}
                    {tagNames.map((n) => <span key={n} style={{ fontSize: 11, fontWeight: 800, padding: '5px 12px', borderRadius: 100, background: 'rgba(192,204,216,0.12)', border: '1px solid rgba(192,204,216,0.2)' }}>{n}</span>)}
                  </div>
                )}

                <div style={{ padding: '18px 0', borderTop: '1px solid rgba(192,204,216,0.12)', borderBottom: '1px solid rgba(192,204,216,0.12)', marginBottom: 20 }}>
                  {item.price != null ? (
                    <p className="font-display" style={{ fontSize: 34, fontWeight: 900, color: C.platinoClaro }}>
                      {fmt(item.price)} <span style={{ fontSize: 14, color: C.acero, fontFamily: 'Manrope', fontWeight: 600 }}>MXN</span>
                      {item.compare_at_price && <span style={{ fontSize: 16, color: C.acero, textDecoration: 'line-through', marginLeft: 10, fontFamily: 'Manrope' }}>{fmt(item.compare_at_price)}</span>}
                    </p>
                  ) : (
                    <p className="font-display" style={{ fontSize: 24, fontWeight: 700, color: C.platinoClaro }}>Pregunta el precio</p>
                  )}
                  <p style={{ fontSize: 13, color: C.acero, marginTop: 6 }}>Envíos a todo México · Aparta por WhatsApp o Instagram</p>
                </div>

                <a href={`https://wa.me/${WHATSAPP}?text=${msg}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', background: '#25D366', color: '#fff', fontWeight: 800, fontSize: 16, padding: '16px', borderRadius: 100, marginBottom: 12 }}>
                  💬 {item.price != null ? 'Lo quiero' : 'Preguntar precio'} por WhatsApp
                </a>
                <a href="https://ig.me/m/thecardboxmx" target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', color: C.platino, fontWeight: 700, fontSize: 15, padding: '14px', borderRadius: 100, border: '1px solid rgba(192,204,216,0.25)', marginBottom: 26 }}>
                  📱 Mandar DM en Instagram
                </a>

                {details.length > 0 && (
                  <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px 20px', fontSize: 14 }}>
                    {details.map(([k, v]) => (
                      <React.Fragment key={k}>
                        <dt style={{ color: C.acero, fontWeight: 600 }}>{k}</dt>
                        <dd style={{ color: '#fff', fontWeight: 700 }}>{v}</dd>
                      </React.Fragment>
                    ))}
                  </dl>
                )}
                {item.description && <p style={{ marginTop: 22, color: '#d6dde8', lineHeight: 1.7, fontSize: 15 }}>{item.description}</p>}
              </div>
            </article>

            {related.length > 0 && (
              <section style={{ marginTop: 64 }}>
                <h2 className="font-display" style={{ fontSize: 26, fontWeight: 600, marginBottom: 18 }}>Más de {item.category_name}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 18 }}>
                  {related.map((r) => (
                    <a key={r.slug} href={`/carta/${r.slug}`} onClick={(e) => { e.preventDefault(); navigate(`/carta/${r.slug}`); }} className="rel" style={{ textDecoration: 'none', color: '#fff', borderRadius: 16, overflow: 'hidden', background: `linear-gradient(165deg, ${C.azul}, ${C.carbon})`, border: '1px solid rgba(192,204,216,0.12)', transition: 'transform .3s' }}>
                      <div style={{ height: 180, overflow: 'hidden', background: 'rgba(138,111,194,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {r.cover_image ? <img src={r.cover_image} alt={r.name} loading="lazy" style={{ height: '100%', width: '100%', objectFit: 'contain', padding: 8 }} /> : <span style={{ fontSize: 40, opacity: .4 }}>🃏</span>}
                      </div>
                      <div style={{ padding: 12 }}>
                        <p className="font-display" style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.3 }}>{r.name}</p>
                        <p style={{ fontSize: 13, color: C.acero, marginTop: 4 }}>{r.price != null ? fmt(r.price) : 'Pregunta el precio'}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
