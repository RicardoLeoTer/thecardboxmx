import React, { useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams, Navigate } from 'react-router-dom';
import { useCatalog } from '../src/lib/useCatalog.js';

function Logo({ size = 48 }) {
  return (
    <svg viewBox="0 0 400 400" width={size} height={size}>
      <defs>
        <linearGradient id={`lg${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f4f6fa" />
          <stop offset="30%" stopColor="#c0ccd8" />
          <stop offset="55%" stopColor="#e4ecf8" />
          <stop offset="80%" stopColor="#7888a0" />
          <stop offset="100%" stopColor="#ccd8e8" />
        </linearGradient>
      </defs>
      <g opacity="0.97">
        <circle cx="200" cy="200" r="187" fill="none" stroke={`url(#lg${size})`} strokeWidth="3" />
        <rect x="105" y="68" width="190" height="264" rx="18" fill="rgba(13,17,23,0.85)" />
        <polygon points="200,92 222,122 200,148 178,122" fill={`url(#lg${size})`} />
        <text x="200" y="238" textAnchor="middle" fontFamily="Georgia, serif" fontSize="50" fontWeight="900" letterSpacing="9" fill={`url(#lg${size})`}>TCB</text>
      </g>
    </svg>
  );
}

const C = {
  platino: '#c0ccd8',
  platinoClaro: '#e4ecf8',
  acero: '#8898b0',
  azul: '#101a2e',
  azulAcento: '#1a6a8a',
  carbon: '#0d1117',
  negro: '#060608',
  oferta: '#c2410c',
};

const WHATSAPP = '525536513092';

// Ícono y color de cada colección en la portada (si no tiene foto)
const LOOK = {
  pokemon: ['⚡', '#b8860b'],
  naruto: ['🍥', '#c2410c'],
  'one-piece': ['🏴‍☠️', '#9f1239'],
  mlb: ['⚾', '#1d4ed8'],
  nfl: ['🏈', '#166534'],
  nba: ['🏀', '#c2410c'],
  futbol: ['⚽', '#0f766e'],
  ufc: ['🥊', '#991b1b'],
  deportes: ['🏆', '#1a6a8a'],
};

// ?tipo= en la URL. Singles incluye las gradeadas.
const TIPOS = [
  { slug: 'singles', label: '🃏 Singles', types: ['single', 'graded'] },
  { slug: 'sellado', label: '📦 Producto cerrado', types: ['sealed'] },
  { slug: 'memorabilia', label: '🏆 Memorabilia', types: ['memorabilia'], onlyIfStock: true },
];

const inputStyle = {
  width: '100%', padding: '12px 16px', borderRadius: 8, border: `1px solid rgba(192,204,216,0.2)`,
  background: 'rgba(16,26,46,0.5)', color: '#fff', fontSize: 14,
  fontFamily: 'Manrope, sans-serif', outline: 'none',
};

const labelStyle = { display: 'block', fontSize: 12, color: C.acero, marginBottom: 8, fontWeight: 600 };

const fmt = (n) => `$${Number(n).toLocaleString('es-MX')}`;
const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const matchesQuery = (item, q) => {
  if (!q) return true;
  const hay = norm([item.name, item.subject, item.team, item.collection_name, item.variant,
    item.category_name, item.grading_company, ...(item.tags || [])].join(' '));
  return norm(q).split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
};

function Pill({ active, onClick, children, small }) {
  return (
    <button
      onClick={onClick}
      className="font-body pill"
      style={{
        padding: small ? '8px 16px' : '12px 24px', borderRadius: 100, border: 'none',
        fontSize: small ? 13 : 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
        background: active ? C.azulAcento : 'rgba(192,204,216,0.1)',
        color: active ? '#fff' : C.acero,
        transition: 'all 0.3s',
      }}
    >
      {children}
    </button>
  );
}

export default function Catalog() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [scrolled, setScrolled] = React.useState(false);
  const { items, categories, tags, loading } = useCatalog();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // /catalogo → portada · /catalogo/pokemon · /catalogo/deportes/mlb · /catalogo/ofertas
  const [section = null, liga = null] = (params['*'] || '').split('/').filter(Boolean);

  React.useEffect(() => { window.scrollTo(0, 0); }, [section, liga]);

  const q = searchParams.get('q') || '';
  const setQuery = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  // Rutas viejas → nuevas
  if (section === 'cartas-solas') return <Navigate to="/catalogo/pokemon?tipo=singles" replace />;
  if (section === 'producto-cerrado') return <Navigate to="/catalogo/pokemon?tipo=sellado" replace />;
  if (section === 'accesorios') return <Navigate to="/catalogo" replace />;

  return (
    <div style={{
      background: C.negro,
      color: '#fff',
      fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
      minHeight: '100vh',
      WebkitFontSmoothing: 'antialiased',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,900&family=Manrope:wght@400;500;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        ::selection { background: ${C.azulAcento}; color: #fff; }
        .font-display { font-family: 'Fraunces', Georgia, serif; }
        .font-body { font-family: 'Manrope', sans-serif; }
        .card-hover { transition: transform 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.5s; }
        .card-hover:hover { transform: translateY(-8px); box-shadow: 0 24px 48px rgba(0,0,0,0.6); }
        .pill:hover { filter: brightness(1.25); }
        .tabs-row { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: none; }
        .tabs-row::-webkit-scrollbar { display: none; }
        .nav-link:hover { color: ${C.platino} !important; }
        .crumb { background: none; border: none; color: ${C.acero}; cursor: pointer; font-size: 13px; font-weight: 600; }
        .crumb:hover { color: ${C.platino}; }
        .search-big::placeholder { color: #6b7a90; }
        @media (max-width: 640px) { .hide-mobile { display: none; } }
      `}</style>

      {/* ============ HEADER ============ */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: scrolled ? `rgba(6,6,8,0.95)` : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? `1px solid rgba(192,204,216,0.08)` : 'none',
        transition: 'all 0.4s ease',
        padding: '16px 24px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <Logo size={40} />
            <span className="font-display" style={{ fontSize: 16, fontWeight: 600, color: C.platino }}>TCB</span>
          </button>

          <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            {[
              ['Inicio', '/', true],
              ['Catálogo', '/catalogo', false],
              ['Rifas', '/rifas', false],
              ['Nosotros', '/nosotros', true],
            ].map(([label, to, hideMobile]) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className={`font-body nav-link ${hideMobile ? 'hide-mobile' : ''}`}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, transition: 'color 0.3s',
                  color: to === '/catalogo' ? C.platino : C.acero,
                }}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {section
        ? <Section {...{ section, liga, items, categories, tags, loading, searchParams, setQuery, navigate }} />
        : <Hub {...{ items, categories, tags, loading, q, setQuery, navigate }} />}

      {/* ============ FOOTER ============ */}
      <footer style={{ padding: '48px 24px 32px', background: C.carbon, borderTop: `1px solid rgba(192,204,216,0.08)` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Logo size={36} />
            <span className="font-display" style={{ fontSize: 15, fontWeight: 600, color: C.platino }}>The Card Box MX</span>
          </div>
          <p className="font-body" style={{ fontSize: 12, color: '#506070' }}>
            © 2026 The Card Box MX · <a href="https://www.instagram.com/thecardboxmx" target="_blank" rel="noopener noreferrer" style={{ color: '#506070', textDecoration: 'none' }}>@TheCardBoxMX</a> · Cards & Collectibles
          </p>
        </div>
      </footer>
    </div>
  );
}

/* =====================================================================
   PORTADA: buscador + tarjetas de colecciones / deportes
   ===================================================================== */
function Hub({ items, categories, tags, loading, q, setQuery, navigate }) {
  const [text, setText] = useState(q);
  React.useEffect(() => {
    const t = setTimeout(() => setQuery('q', text.trim() || null), 250);
    return () => clearTimeout(t);
  }, [text]);

  const roots = categories.filter((c) => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order);
  const childrenOf = (id) => categories.filter((c) => c.parent_id === id).sort((a, b) => a.sort_order - b.sort_order);

  // Grupos de la portada: franquicias TCG sin subcategorías juntas; las que tienen ligas, en su propio bloque
  const groups = [
    { title: 'Trading Card Games', cats: roots.filter((r) => childrenOf(r.id).length === 0).map((c) => ({ cat: c, path: c.slug })) },
    ...roots.filter((r) => childrenOf(r.id).length > 0).map((r) => ({
      title: r.name, root: r,
      cats: childrenOf(r.id).map((c) => ({ cat: c, path: `${r.slug}/${c.slug}` })),
    })),
  ].filter((g) => g.cats.length > 0);

  const statsFor = (slug) => {
    const list = items.filter((i) => i.category_slug === slug || i.parent_category_slug === slug);
    return {
      total: list.length,
      singles: list.filter((i) => i.type === 'single' || i.type === 'graded').length,
      sealed: list.filter((i) => i.type === 'sealed').length,
      cover: list.find((i) => i.is_featured && i.cover_image)?.cover_image || list.find((i) => i.cover_image)?.cover_image,
    };
  };

  const results = useMemo(() => (q ? items.filter((i) => matchesQuery(i, q)) : []), [items, q]);
  const offers = items.filter((i) => i.is_on_sale).length;

  return (
    <>
      <section style={{ padding: '140px 24px 32px', background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${C.azul} 0%, ${C.negro} 70%)` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 className="font-display" style={{ fontSize: 'clamp(40px, 7vw, 64px)', fontWeight: 900, letterSpacing: -1, lineHeight: 1.05, marginBottom: 12 }}>
            Catálogo
          </h1>
          <p className="font-body" style={{ fontSize: 18, color: C.acero, marginBottom: 28 }}>
            Elige una colección o busca directo la carta que quieres.
          </p>

          <div style={{ position: 'relative', maxWidth: 720 }}>
            <span style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}>🔍</span>
            <input
              className="search-big font-body"
              type="search"
              autoComplete="off"
              placeholder="Charizard, Ohtani, Luffy, PSA 10, booster box…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ ...inputStyle, padding: '18px 20px 18px 52px', fontSize: 16, borderRadius: 100, background: 'rgba(16,26,46,0.8)' }}
            />
          </div>
        </div>
      </section>

      <section style={{ padding: '24px 24px 100px', background: C.negro }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {q ? (
            <>
              <p className="font-body" style={{ fontSize: 13, color: C.acero, marginBottom: 24 }}>
                {results.length} {results.length === 1 ? 'resultado' : 'resultados'} para “{q}”
              </p>
              {results.length === 0 ? (
                <EmptyState title="No lo tenemos… todavía 👀" text="Escríbenos por WhatsApp y te lo conseguimos." />
              ) : (
                <ProductGrid items={results} tags={tags} showCategory />
              )}
            </>
          ) : (
            <>
              {offers > 0 && (
                <button onClick={() => navigate('/catalogo/ofertas')} className="card-hover font-body" style={{
                  width: '100%', marginBottom: 40, padding: '18px 24px', borderRadius: 16, cursor: 'pointer', textAlign: 'left',
                  background: `linear-gradient(90deg, rgba(194,65,12,0.35), rgba(16,26,46,0.6))`, border: '1px solid rgba(194,65,12,0.5)',
                  color: '#fff', fontSize: 16, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span>🔥 Ofertas · {offers} {offers === 1 ? 'pieza' : 'piezas'} con precio especial</span>
                  <span>→</span>
                </button>
              )}

              {loading && <p className="font-body" style={{ color: C.acero }}>Cargando…</p>}

              {groups.map((g) => (
                <div key={g.title} style={{ marginBottom: 48 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20, gap: 12 }}>
                    <h2 className="font-display" style={{ fontSize: 28, fontWeight: 600 }}>{g.title}</h2>
                    {g.root && (
                      <button className="crumb font-body" onClick={() => navigate(`/catalogo/${g.root.slug}`)}>Ver todo {g.root.name} →</button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                    {g.cats.map(({ cat, path }) => (
                      <CollectionCard key={cat.slug} cat={cat} stats={statsFor(cat.slug)} onClick={() => navigate(`/catalogo/${path}`)} />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </section>
    </>
  );
}

function CollectionCard({ cat, stats, onClick }) {
  const [icon, color] = LOOK[cat.slug] || ['🃏', C.azulAcento];
  const image = cat.image_url || stats.cover;
  const soon = stats.total === 0;
  return (
    <button onClick={onClick} className="card-hover" style={{
      textAlign: 'left', cursor: 'pointer', padding: 0, color: '#fff',
      borderRadius: 20, overflow: 'hidden', position: 'relative',
      background: `linear-gradient(165deg, ${C.azul}, ${C.carbon})`,
      border: '1px solid rgba(192,204,216,0.12)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        height: 170, width: '100%', position: 'relative', overflow: 'hidden', display: 'grid', placeItems: 'center',
        background: `radial-gradient(circle at 50% 45%, ${color}66 0%, transparent 70%), linear-gradient(160deg, ${color}33, ${C.carbon})`,
      }}>
        {image
          ? <img src={image} alt={cat.name} loading="lazy" style={{ height: '100%', width: '100%', objectFit: 'cover', objectPosition: 'center 30%', opacity: 0.85 }} />
          : <span style={{ fontSize: 64, filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.5))' }}>{icon}</span>}
        <span className="font-body" style={{
          position: 'absolute', top: 12, right: 12, fontSize: 11, fontWeight: 800, letterSpacing: 0.4,
          padding: '5px 12px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
          background: soon ? 'rgba(0,0,0,0.55)' : 'rgba(26,106,138,0.85)',
        }}>
          {soon ? 'Muy pronto' : `${stats.total} disponibles`}
        </span>
      </div>
      <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <h3 className="font-display" style={{ fontSize: 22, fontWeight: 600 }}>{cat.name}</h3>
        {cat.description && (
          <p className="font-body" style={{ fontSize: 13, color: C.acero, lineHeight: 1.5 }}>{cat.description}</p>
        )}
        {!soon && (
          <p className="font-body" style={{ fontSize: 12, color: C.platino, marginTop: 'auto', paddingTop: 6 }}>
            🃏 {stats.singles} singles · 📦 {stats.sealed} cerrado
          </p>
        )}
      </div>
    </button>
  );
}

/* =====================================================================
   SECCIÓN: Pokémon, Naruto, MLB… con Singles / Producto cerrado
   ===================================================================== */
function Section({ section, liga, items, categories, tags, loading, searchParams, setQuery, navigate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const tipo = searchParams.get('tipo');
  const segmento = searchParams.get('segmento');

  React.useEffect(() => { setSelectedCollection('all'); setSearchQuery(''); }, [section, liga]);

  const root = categories.find((c) => c.slug === section && !c.parent_id);
  const leagues = root ? categories.filter((c) => c.parent_id === root.id).sort((a, b) => a.sort_order - b.sort_order) : [];
  const league = leagues.find((l) => l.slug === liga);
  const current = league || root;
  const isOffers = section === 'ofertas';

  const go = (path, keepTipo = true) =>
    navigate(`/catalogo${path ? `/${path}` : ''}${keepTipo && tipo ? `?tipo=${tipo}` : ''}`);

  const sectionItems = useMemo(() => items.filter((item) => {
    if (isOffers) return item.is_on_sale;
    if ((item.parent_category_slug || item.category_slug) !== section) return false;
    if (liga && item.category_slug !== liga) return false;
    return true;
  }), [items, section, liga, isOffers]);

  const availableTipos = TIPOS.filter((t) =>
    t.onlyIfStock || isOffers ? sectionItems.some((i) => t.types.includes(i.type)) : true
  );
  const availableTags = tags.filter((t) => sectionItems.some((i) => i.tags?.includes(t.slug)));

  const tipoTypes = TIPOS.find((t) => t.slug === tipo)?.types;
  const baseItems = sectionItems.filter((item) =>
    (!tipoTypes || tipoTypes.includes(item.type)) && (!segmento || item.tags?.includes(segmento))
  );
  const collections = [...new Set(baseItems.map((i) => i.collection_name).filter(Boolean))].sort();

  const results = useMemo(() => {
    const list = baseItems.filter((item) =>
      matchesQuery(item, searchQuery) && (selectedCollection === 'all' || item.collection_name === selectedCollection)
    );
    const priceOr = (p, d) => (p == null ? d : Number(p));
    list.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'price-asc') return priceOr(a.price, Infinity) - priceOr(b.price, Infinity);
      if (sortBy === 'price-desc') return priceOr(b.price, -1) - priceOr(a.price, -1);
      if (sortBy === 'newest') return (b.created_at || '').localeCompare(a.created_at || '');
      return (b.is_featured - a.is_featured) || (b.created_at || '').localeCompare(a.created_at || '');
    });
    return list;
  }, [baseItems, searchQuery, selectedCollection, sortBy]);

  if (!loading && !root && !isOffers) return <Navigate to="/catalogo" replace />;

  const tipoName = { singles: 'Singles', sellado: 'Producto cerrado', memorabilia: 'Memorabilia' }[tipo];
  const segmentName = tags.find((t) => t.slug === segmento)?.name;
  const title = [isOffers ? 'Ofertas' : current?.name, tipoName, segmentName].filter(Boolean).join(' · ');
  const subtitle = isOffers ? 'Piezas con precio especial por tiempo limitado' : current?.description;

  return (
    <>
      <section style={{ padding: '120px 24px 32px', background: C.negro }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Migas: Catálogo › Deportes › MLB */}
          <div className="font-body" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
            <button className="crumb" onClick={() => navigate('/catalogo')}>← Catálogo</button>
            {league && (<><span style={{ color: '#3a4656' }}>›</span><button className="crumb" onClick={() => go(root.slug)}>{root.name}</button></>)}
          </div>

          <h1 className="font-display" style={{ fontSize: 'clamp(36px, 7vw, 56px)', fontWeight: 900, letterSpacing: -1, lineHeight: 1.1, marginBottom: 12 }}>
            {title || '…'}
          </h1>
          {subtitle && <p className="font-body" style={{ fontSize: 17, color: C.acero, marginBottom: 28 }}>{subtitle}</p>}

          {/* Ligas (Deportes) */}
          {leagues.length > 0 && (
            <div className="tabs-row" style={{ marginBottom: 16 }}>
              <Pill small active={!liga} onClick={() => go(section)}>Todas</Pill>
              {leagues.map((l) => (
                <Pill small key={l.slug} active={liga === l.slug} onClick={() => go(`${section}/${l.slug}`)}>{l.name}</Pill>
              ))}
            </div>
          )}

          {/* Singles / Producto cerrado */}
          <div className="tabs-row" style={{ marginBottom: 16 }}>
            <Pill active={!tipo} onClick={() => setQuery('tipo', null)}>Todo</Pill>
            {availableTipos.map((t) => (
              <Pill key={t.slug} active={tipo === t.slug} onClick={() => setQuery('tipo', t.slug)}>{t.label}</Pill>
            ))}
          </div>

          {/* Segmentos */}
          {availableTags.length > 0 && (
            <div className="tabs-row">
              <Pill small active={!segmento} onClick={() => setQuery('segmento', null)}>✨ Todos</Pill>
              {availableTags.map((t) => (
                <Pill small key={t.slug} active={segmento === t.slug} onClick={() => setQuery('segmento', t.slug)}>{t.name}</Pill>
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={{ padding: '0 24px 24px', background: C.negro }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div>
              <label className="font-body" style={labelStyle}>🔍 Buscar en {current?.name || 'Ofertas'}</label>
              <input type="search" placeholder="Nombre, jugador, set, PSA 10…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label className="font-body" style={labelStyle}>💎 Colección</label>
              <select value={selectedCollection} onChange={(e) => setSelectedCollection(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="all" style={{ background: C.azul }}>Todas las colecciones</option>
                {collections.map((col) => <option key={col} value={col} style={{ background: C.azul }}>{col}</option>)}
              </select>
            </div>
            <div>
              <label className="font-body" style={labelStyle}>↕️ Ordenar</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="featured" style={{ background: C.azul }}>Destacados</option>
                <option value="newest" style={{ background: C.azul }}>Más nuevos</option>
                <option value="price-asc" style={{ background: C.azul }}>Precio: menor a mayor</option>
                <option value="price-desc" style={{ background: C.azul }}>Precio: mayor a menor</option>
                <option value="name-asc" style={{ background: C.azul }}>Nombre (A-Z)</option>
                <option value="name-desc" style={{ background: C.azul }}>Nombre (Z-A)</option>
              </select>
            </div>
          </div>
          <p className="font-body" style={{ fontSize: 13, color: C.acero, marginTop: 16 }}>
            {loading ? 'Cargando catálogo…' : `${results.length} ${results.length === 1 ? 'producto' : 'productos'} encontrados`}
          </p>
        </div>
      </section>

      <section style={{ padding: '24px 24px 100px', background: C.negro }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {!loading && results.length === 0 ? (
            sectionItems.length === 0
              ? <EmptyState title="Muy pronto ✨" text="Estamos preparando esta sección. Escríbenos si buscas algo en específico." />
              : <EmptyState title="No encontramos resultados 😢" text="Intenta con otro término de búsqueda o filtro." />
          ) : (
            <ProductGrid items={results} tags={tags} showCategory={isOffers || (leagues.length > 0 && !liga)} />
          )}
        </div>
      </section>
    </>
  );
}

function EmptyState({ title, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <p className="font-display" style={{ fontSize: 28, fontWeight: 600, color: C.acero, marginBottom: 16 }}>{title}</p>
      <p className="font-body" style={{ fontSize: 14, color: C.acero, marginBottom: 24 }}>{text}</p>
      <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="font-body" style={{
        display: 'inline-block', fontSize: 13, fontWeight: 700, color: '#fff', background: C.azulAcento,
        padding: '10px 22px', borderRadius: 100, textDecoration: 'none',
      }}>💬 Escríbenos</a>
    </div>
  );
}

function ProductGrid({ items, tags, showCategory }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
      {items.map((item) => <ProductCard key={item.id} item={item} tags={tags} showCategory={showCategory} />)}
    </div>
  );
}

function ProductCard({ item, tags, showCategory }) {
  const tagNames = (item.tags || []).map((slug) => tags.find((t) => t.slug === slug)?.name).filter(Boolean);
  const details = [
    item.grading_company && item.grade != null ? `${item.grading_company} ${Number(item.grade)}` : null,
    item.condition,
    item.variant,
    item.serial_number && `#${item.serial_number}`,
  ].filter(Boolean).join(' · ');
  const msg = encodeURIComponent(`Hola! Me interesa: ${item.name}${item.collection_name ? ` (${item.collection_name})` : ''}`);

  return (
    <div className="card-hover" style={{
      borderRadius: 16, overflow: 'hidden', position: 'relative',
      background: `linear-gradient(165deg, ${C.azul}, ${C.carbon})`,
      border: '1px solid rgba(192,204,216,0.12)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: `radial-gradient(circle at 50% 40%, rgba(138,111,194,0.3) 0%, transparent 65%)`, overflow: 'hidden' }}>
        {item.cover_image
          ? <img src={item.cover_image} alt={item.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'cover' }} loading="lazy" />
          : <span style={{ fontSize: 48, opacity: 0.4 }}>🃏</span>}
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 'calc(100% - 24px)' }}>
          {item.is_on_sale && <Badge color={C.oferta}>Oferta</Badge>}
          {tagNames.map((n) => <Badge key={n}>{n}</Badge>)}
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {showCategory && item.category_name && (
          <p className="font-body" style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: C.azulAcento, textTransform: 'uppercase', marginBottom: 6 }}>
            {item.category_name}
          </p>
        )}
        <h3 className="font-display" style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 4, lineHeight: 1.3 }}>
          {item.name}
        </h3>
        {item.collection_name && (
          <p className="font-body" style={{ fontSize: 12, color: C.acero, marginBottom: 6 }}>{item.collection_name}</p>
        )}
        {(item.subject || item.team) && (
          <p className="font-body" style={{ fontSize: 11, color: C.acero, marginBottom: 6, opacity: 0.7 }}>
            {[item.subject, item.team].filter(Boolean).join(' · ')}
          </p>
        )}
        {details && <p className="font-body" style={{ fontSize: 11, color: C.platino, marginBottom: 6 }}>{details}</p>}

        <div style={{ marginTop: 'auto', paddingTop: 10 }}>
          {item.price != null && (
            <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid rgba(192,204,216,0.2)` }}>
              <p className="font-display" style={{ fontSize: 20, fontWeight: 900, color: C.platinoClaro, margin: 0 }}>
                {fmt(item.price)}
                {item.compare_at_price && (
                  <span className="font-body" style={{ fontSize: 13, fontWeight: 500, color: C.acero, textDecoration: 'line-through', marginLeft: 8 }}>
                    {fmt(item.compare_at_price)}
                  </span>
                )}
              </p>
              {item.quantity > 1 && (
                <p className="font-body" style={{ fontSize: 10, color: C.acero, marginTop: 4 }}>{item.quantity} disponibles</p>
              )}
            </div>
          )}
          <a href={`https://wa.me/${WHATSAPP}?text=${msg}`} target="_blank" rel="noopener noreferrer" className="font-body" style={{
            display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#fff',
            background: C.azulAcento, padding: '10px 16px', borderRadius: 100, textDecoration: 'none',
          }}>
            {item.price != null ? 'Lo quiero →' : 'Consultar precio →'}
          </a>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, color }) {
  return (
    <span className="font-body" style={{
      fontSize: 10, fontWeight: 800, color: '#fff', letterSpacing: 0.4,
      background: color || 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
      padding: '4px 10px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.15)',
    }}>
      {children}
    </span>
  );
}
