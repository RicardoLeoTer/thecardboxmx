import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation, useParams, useSearchParams, Navigate } from 'react-router-dom';
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

// ?tipo= en la URL → tipo de producto en la base
const TIPOS = [
  { slug: 'singles', label: '🃏 Singles', type: 'single' },
  { slug: 'gradeadas', label: '💎 Gradeadas', type: 'graded' },
  { slug: 'sellado', label: '📦 Producto cerrado', type: 'sealed' },
  { slug: 'memorabilia', label: '🏆 Memorabilia', type: 'memorabilia' },
  { slug: 'accesorios', label: '🧰 Accesorios', type: 'accessory' },
];

const SECTION_COPY = {
  todo: ['Catálogo', 'Pokémon, deportes y producto cerrado en un solo lugar'],
  pokemon: ['Pokémon', 'Singles, gradeadas y producto cerrado de colecciones antiguas y recientes'],
  deportes: ['Deportes', 'MLB, NFL, NBA, fútbol y más: rookies, parallels y autógrafos'],
  ofertas: ['Ofertas', 'Piezas con precio especial por tiempo limitado'],
};

const inputStyle = {
  width: '100%', padding: '12px 16px', borderRadius: 8, border: `1px solid rgba(192,204,216,0.2)`,
  background: 'rgba(16,26,46,0.5)', color: '#fff', fontSize: 14,
  fontFamily: 'Manrope, sans-serif', outline: 'none',
};

const labelStyle = { display: 'block', fontSize: 12, color: C.acero, marginBottom: 8, fontWeight: 600 };

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

const fmt = (n) => `$${Number(n).toLocaleString('es-MX')}`;

export default function Catalog() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [scrolled, setScrolled] = React.useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const { items, categories, tags, loading } = useCatalog();

  React.useEffect(() => {
    window.scrollTo(0, 0);
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // /catalogo, /catalogo/pokemon, /catalogo/deportes/mlb, /catalogo/ofertas
  const [section = 'todo', liga = null] = (params['*'] || '').split('/').filter(Boolean);
  const tipo = searchParams.get('tipo');
  const segmento = searchParams.get('segmento');

  React.useEffect(() => { setSelectedCollection('all'); }, [section, liga]);

  const roots = categories.filter((c) => !c.parent_id);
  const rootOf = (item) => item.parent_category_slug || item.category_slug;
  const currentRoot = roots.find((c) => c.slug === section);
  const leagues = currentRoot ? categories.filter((c) => c.parent_id === currentRoot.id) : [];

  const setQuery = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    setSearchParams(next, { replace: true });
  };
  const goSection = (path) => navigate(`/catalogo${path ? `/${path}` : ''}`);

  // 1) Sección + liga
  const sectionItems = useMemo(() => items.filter((item) => {
    if (section === 'ofertas') return item.is_on_sale;
    if (section !== 'todo' && rootOf(item) !== section) return false;
    if (liga && item.category_slug !== liga) return false;
    return true;
  }), [items, section, liga]);

  // 2) Tipo y segmento (chips disponibles según lo que hay en la sección)
  const availableTipos = TIPOS.filter((t) => sectionItems.some((i) => i.type === t.type));
  const availableTags = tags.filter((t) => sectionItems.some((i) => i.tags?.includes(t.slug)));

  const tipoType = TIPOS.find((t) => t.slug === tipo)?.type;
  const baseItems = sectionItems.filter((item) =>
    (!tipoType || item.type === tipoType) && (!segmento || item.tags?.includes(segmento))
  );
  const collections = [...new Set(baseItems.map((i) => i.collection_name).filter(Boolean))].sort();

  // 3) Búsqueda, colección y orden
  const results = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = baseItems.filter((item) => {
      const matchesSearch = !q || [item.name, item.subject, item.team, item.collection_name, item.variant]
        .filter(Boolean).some((v) => v.toLowerCase().includes(q));
      const matchesCollection = selectedCollection === 'all' || item.collection_name === selectedCollection;
      return matchesSearch && matchesCollection;
    });
    const priceOr = (p, d) => (p == null ? d : Number(p));
    list.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'price-asc') return priceOr(a.price, Infinity) - priceOr(b.price, Infinity);
      if (sortBy === 'price-desc') return priceOr(b.price, -1) - priceOr(a.price, -1);
      if (sortBy === 'newest') return (b.created_at || '').localeCompare(a.created_at || '');
      // featured: destacados primero, luego más nuevos
      return (b.is_featured - a.is_featured) || (b.created_at || '').localeCompare(a.created_at || '');
    });
    return list;
  }, [baseItems, searchQuery, selectedCollection, sortBy]);

  const leagueName = leagues.find((l) => l.slug === liga)?.name;
  const segmentName = tags.find((t) => t.slug === segmento)?.name;
  const [baseTitle, pageSubtitle] = SECTION_COPY[section] || [currentRoot?.name || 'Catálogo', ''];
  const pageTitle = [leagueName || baseTitle, segmentName].filter(Boolean).join(' · ');

  // Rutas viejas → nuevas (después de los hooks)
  if (section === 'cartas-solas') return <Navigate to="/catalogo/pokemon?tipo=singles" replace />;
  if (section === 'producto-cerrado') return <Navigate to="/catalogo/pokemon?tipo=sellado" replace />;

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
        .card-hover:hover { transform: translateY(-12px) scale(1.02); box-shadow: 0 24px 48px rgba(0,0,0,0.6); }
        .pill:hover { filter: brightness(1.25); }
        .tabs-row { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: none; }
        .tabs-row::-webkit-scrollbar { display: none; }
        .nav-link:hover { color: ${C.platino} !important; }
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
              ['Inicio', '/'],
              ['Pokémon', '/catalogo/pokemon'],
              ['Deportes', '/catalogo/deportes'],
              ['Nosotros', '/nosotros'],
            ].map(([label, to]) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className={`font-body nav-link ${label === 'Inicio' || label === 'Nosotros' ? 'hide-mobile' : ''}`}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, transition: 'color 0.3s',
                  color: location.pathname.startsWith(to) && to !== '/' ? C.platino : C.acero,
                }}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ============ HERO + PESTAÑAS ============ */}
      <section style={{ padding: '140px 24px 40px', background: C.negro }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 className="font-display" style={{
            fontSize: 'clamp(40px, 7vw, 60px)', fontWeight: 900, color: '#fff',
            margin: '0 0 16px', letterSpacing: -1, lineHeight: 1.1,
          }}>
            {pageTitle}
          </h1>
          <p className="font-body" style={{ fontSize: 18, color: C.acero, marginBottom: 32 }}>
            {pageSubtitle}
          </p>

          {/* Pestañas principales */}
          <div className="tabs-row" style={{ marginBottom: 16 }}>
            <Pill active={section === 'todo'} onClick={() => goSection('')}>Todo</Pill>
            {roots.map((c) => (
              <Pill key={c.slug} active={section === c.slug} onClick={() => goSection(c.slug)}>{c.name}</Pill>
            ))}
            <Pill active={section === 'ofertas'} onClick={() => goSection('ofertas')}>🔥 Ofertas</Pill>
          </div>

          {/* Ligas (solo en Deportes) */}
          {leagues.length > 0 && (
            <div className="tabs-row" style={{ marginBottom: 16 }}>
              <Pill small active={!liga} onClick={() => goSection(section)}>Todas las ligas</Pill>
              {leagues.map((l) => (
                <Pill small key={l.slug} active={liga === l.slug} onClick={() => goSection(`${section}/${l.slug}`)}>{l.name}</Pill>
              ))}
            </div>
          )}

          {/* Tipo de producto */}
          {availableTipos.length > 1 && (
            <div className="tabs-row" style={{ marginBottom: 16 }}>
              <Pill small active={!tipo} onClick={() => setQuery('tipo', null)}>Todo tipo</Pill>
              {availableTipos.map((t) => (
                <Pill small key={t.slug} active={tipo === t.slug} onClick={() => setQuery('tipo', t.slug)}>{t.label}</Pill>
              ))}
            </div>
          )}

          {/* Segmentos: SIR, Full Art, Parallels, Autógrafos... */}
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

      {/* ============ FILTROS ============ */}
      <section style={{ padding: '0 24px 24px', background: C.negro }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div>
              <label className="font-body" style={labelStyle}>🔍 Buscar</label>
              <input
                type="text"
                placeholder={section === 'deportes' ? 'Jugador, equipo, set...' : 'Nombre, colección, jugador, pokémon...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label className="font-body" style={labelStyle}>💎 Colección</label>
              <select value={selectedCollection} onChange={(e) => setSelectedCollection(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="all" style={{ background: C.azul }}>Todas las colecciones</option>
                {collections.map((col) => (
                  <option key={col} value={col} style={{ background: C.azul }}>{col}</option>
                ))}
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

      {/* ============ GRID ============ */}
      <section style={{ padding: '24px 24px 100px', background: C.negro }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {!loading && results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <p className="font-display" style={{ fontSize: 28, fontWeight: 600, color: C.acero, marginBottom: 16 }}>
                {sectionItems.length === 0 ? 'Muy pronto ✨' : 'No encontramos resultados 😢'}
              </p>
              <p className="font-body" style={{ fontSize: 14, color: C.acero }}>
                {sectionItems.length === 0
                  ? 'Estamos preparando esta sección. Escríbenos si buscas algo en específico.'
                  : 'Intenta con otro término de búsqueda o filtro.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
              {results.map((item) => <ProductCard key={item.id} item={item} tags={tags} />)}
            </div>
          )}
        </div>
      </section>

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

function ProductCard({ item, tags }) {
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
