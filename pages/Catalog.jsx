import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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

export default function Catalog() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = React.useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpansion, setSelectedExpansion] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');

  React.useEffect(() => {
    window.scrollTo(0, 0);
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const C = {
    platino: '#c0ccd8',
    platinoClaro: '#e4ecf8',
    acero: '#8898b0',
    azul: '#101a2e',
    azulAcento: '#1a6a8a',
    carbon: '#0d1117',
    negro: '#060608',
  };

  // All individual cards
  const allCards = [
    { name: 'Mega Charizard EX', set: 'Phantasmal Flames', pokemon: 'Charizard', image: '/images/MEGACHARIZARDEX.jpg', type: 'individual' },
    { name: 'Charmander', set: 'Top Sun', pokemon: 'Charmander', image: '/images/CHARMANDERTOPSUN.jpg', type: 'individual' },
    { name: 'Pikachu', set: '25th Anniversary', pokemon: 'Pikachu', image: '/images/BIRTHDAYPIKA.jpg', type: 'individual' },
    { name: 'Entei', set: 'Crown Zenith', pokemon: 'Entei', image: '/images/ENTEIV.jpg', type: 'individual' },
    { name: 'Bulbasaur', set: 'Stellar Crown', pokemon: 'Bulbasaur', image: '/images/SLEEPYBULBASAUR.jpg', type: 'individual' },
    { name: 'Mimikyu', set: 'Destined Rivals', pokemon: 'Mimikyu', image: '/images/TEAMRMIMIKYU.jpg', type: 'individual' },
    { name: 'Froakie', set: 'Ninja Spinner', pokemon: 'Froakie', image: '/images/FROAKIE.jpg', type: 'individual' },
    { name: 'Frogadier', set: 'Ninja Spinner', pokemon: 'Frogadier', image: '/images/FROGADIER.jpg', type: 'individual' },
    { name: 'Psyduck', set: 'Mega Dream ex', pokemon: 'Psyduck', image: '/images/PYSDUCK.jpg', type: 'individual' },
    { name: 'Murkrow', set: 'The Glory Of Team Rocket', pokemon: 'Murkrow', image: '/images/TEAMRMURK.jpg', type: 'individual' },
    { name: 'Eevee', set: 'Top Sun', pokemon: 'Eevee', image: '/images/EEVEETOPSUN.jpg', type: 'individual' },
    { name: 'Jolteon', set: 'Top Sun', pokemon: 'Jolteon', image: '/images/JOLTEONTOPSUN.jpg', type: 'individual' },
    { name: 'Blastoise', set: 'Top Sun', pokemon: 'Blastoise', image: '/images/BLASTOISETOPSUN.jpg', type: 'individual' },
  ];

  // Closed products (boxes, collections, etc.)
  const closedProducts = [
    { name: 'Meganium ex Mega EX Box', set: 'Ascended Heroes', pokemon: 'Pokémon TCG', price: 750, image: '/images/meganiumexbox.jpg', type: 'closed' },
    { name: 'Feraligatr ex Mega EX Box', set: 'Ascended Heroes', pokemon: 'Pokémon TCG', price: 750, image: '/images/feraligatrexbox.jpg', type: 'closed' },
    { name: 'Emboar ex Mega EX Box', set: 'Ascended Heroes', pokemon: 'Pokémon TCG', price: 750, image: '/images/emboarexbox.jpg', type: 'closed' },
    { name: 'Pokeball Tin', set: 'Mix', pokemon: 'Pokémon TCG', price: 350, image: '/images/pokeballtin.jpg', type: 'closed' },
    { name: 'Ascended Heroes Booster Bundle', set: 'Ascended Heroes', pokemon: 'Pokémon TCG', price: 900, image: '/images/boosterbundleASC.jpg', type: 'closed' },
    { name: 'Team Rocket´s Nidoking Tin', set: 'Mix', pokemon: 'Pokémon TCG', price: 650, image: '/images/trnidotin.jpg', type: 'closed' },
    { name: 'Paradox Destinies Iron Crown Tin', set: 'Mix', pokemon: 'Pokémon TCG', price: 500, image: '/images/paradoxtin.jpg', type: 'closed' },
    { name: 'Mega Symphonia Booster Box', set: 'Mix', pokemon: 'Pokémon TCG', price: 1650, image: '/images/megasympho.jpg', type: 'closed' },
    { name: 'Chaos Rising Build & Battle Box', set: 'Mix', pokemon: 'Pokémon TCG', price: 560, image: '/images/chaosrisingbb.jpg', type: 'closed' },
  ];

  // Determine which product list based on route
  const isSoloCards = location.pathname === '/catalogo/cartas-solas';
  const cards = isSoloCards ? allCards : closedProducts;
  const pageTitle = isSoloCards ? 'Cartas Solas' : 'Producto Cerrado';
  const pageSubtitle = isSoloCards 
    ? 'Encuentra cartas individuales de colecciones antiguas y recientes'
    : 'Booster boxes, set boxes y colecciones completas';

  // Get unique expansions
  const uniqueExpansions = ['all', ...new Set(cards.map(c => c.set))].sort();
  const uniquePokemon = ['all', ...new Set(cards.map(c => c.pokemon))].sort();

  // Apply filters and sorting
  const filteredAndSortedCards = useMemo(() => {
    let filtered = cards.filter(card => {
      const matchesSearch = 
        card.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        card.set.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.pokemon.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesExpansion = selectedExpansion === 'all' || card.set === selectedExpansion;
      return matchesSearch && matchesExpansion;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'set-asc') return a.set.localeCompare(b.set);
      if (sortBy === 'set-desc') return b.set.localeCompare(a.set);
      return 0;
    });

    return filtered;
  }, [searchQuery, selectedExpansion, sortBy, cards]);

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
            style={{
              display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none',
              cursor: 'pointer', transition: 'transform 0.3s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Logo size={40} />
            <span className="font-display" style={{ fontSize: 16, fontWeight: 600, color: C.platino }}>TCB</span>
          </button>

          <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <button
              onClick={() => navigate('/')}
              className="font-body"
              style={{
                background: 'none', border: 'none', color: C.acero, cursor: 'pointer',
                fontSize: 14, fontWeight: 500, transition: 'color 0.3s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = C.platino}
              onMouseLeave={(e) => e.currentTarget.style.color = C.acero}
            >
              Inicio
            </button>
            <button
              onClick={() => navigate('/nosotros')}
              className="font-body"
              style={{
                background: 'none', border: 'none', color: C.acero, cursor: 'pointer',
                fontSize: 14, fontWeight: 500, transition: 'color 0.3s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = C.platino}
              onMouseLeave={(e) => e.currentTarget.style.color = C.acero}
            >
              Nosotros
            </button>
          </nav>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section style={{ padding: '160px 24px 60px', background: C.negro }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 className="font-display" style={{
            fontSize: 'clamp(40px, 7vw, 60px)', fontWeight: 900, color: '#fff',
            margin: '0 0 16px', letterSpacing: -1, lineHeight: 1.1,
          }}>
            {pageTitle}
          </h1>
          <p className="font-body" style={{ fontSize: 18, color: C.acero, marginBottom: 40 }}>
            {pageSubtitle}
          </p>

          {/* Tab navigation to switch between Cartas Solas and Producto Cerrado */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 40 }}>
            <button
              onClick={() => navigate('/catalogo/cartas-solas')}
              className="font-body"
              style={{
                padding: '12px 24px', borderRadius: 100, border: 'none',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                background: isSoloCards ? C.azulAcento : 'rgba(192,204,216,0.1)',
                color: isSoloCards ? '#fff' : C.acero,
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => !isSoloCards && (e.currentTarget.style.background = 'rgba(192,204,216,0.2)')}
              onMouseLeave={(e) => !isSoloCards && (e.currentTarget.style.background = 'rgba(192,204,216,0.1)')}
            >
              🃏 Singles
            </button>
            <button
              onClick={() => navigate('/catalogo/producto-cerrado')}
              className="font-body"
              style={{
                padding: '12px 24px', borderRadius: 100, border: 'none',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                background: !isSoloCards ? C.azulAcento : 'rgba(192,204,216,0.1)',
                color: !isSoloCards ? '#fff' : C.acero,
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => isSoloCards && (e.currentTarget.style.background = 'rgba(192,204,216,0.2)')}
              onMouseLeave={(e) => isSoloCards && (e.currentTarget.style.background = 'rgba(192,204,216,0.1)')}
            >
              📦 Producto Cerrado
            </button>
          </div>
        </div>
      </section>

      {/* ============ FILTERS ============ */}
      <section style={{ padding: '0 24px 40px', background: C.negro }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {/* Search */}
            <div>
              <label className="font-body" style={{ display: 'block', fontSize: 12, color: C.acero, marginBottom: 8, fontWeight: 600 }}>
                🔍 Buscar
              </label>
              <input
                type="text"
                placeholder="Nombre, expansión, pokémon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 8, border: `1px solid rgba(192,204,216,0.2)`,
                  background: 'rgba(16,26,46,0.5)', color: '#fff', fontSize: 14,
                  fontFamily: 'Manrope, sans-serif', transition: 'all 0.3s',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(192,204,216,0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(192,204,216,0.2)'}
              />
            </div>

            {/* Expansion filter */}
            <div>
              <label className="font-body" style={{ display: 'block', fontSize: 12, color: C.acero, marginBottom: 8, fontWeight: 600 }}>
                💎 Expansión
              </label>
              <select
                value={selectedExpansion}
                onChange={(e) => setSelectedExpansion(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 8, border: `1px solid rgba(192,204,216,0.2)`,
                  background: 'rgba(16,26,46,0.5)', color: '#fff', fontSize: 14,
                  fontFamily: 'Manrope, sans-serif', cursor: 'pointer',
                }}
              >
                <option value="all" style={{ background: C.azul }}>Todas las expansiones</option>
                {uniqueExpansions.filter(e => e !== 'all').map(exp => (
                  <option key={exp} value={exp} style={{ background: C.azul }}>
                    {exp}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort by */}
            <div>
              <label className="font-body" style={{ display: 'block', fontSize: 12, color: C.acero, marginBottom: 8, fontWeight: 600 }}>
                ↕️ Ordenar
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 8, border: `1px solid rgba(192,204,216,0.2)`,
                  background: 'rgba(16,26,46,0.5)', color: '#fff', fontSize: 14,
                  fontFamily: 'Manrope, sans-serif', cursor: 'pointer',
                }}
              >
                <option value="name-asc" style={{ background: C.azul }}>Nombre (A-Z)</option>
                <option value="name-desc" style={{ background: C.azul }}>Nombre (Z-A)</option>
                <option value="set-asc" style={{ background: C.azul }}>Expansión (A-Z)</option>
                <option value="set-desc" style={{ background: C.azul }}>Expansión (Z-A)</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          <p className="font-body" style={{ fontSize: 13, color: C.acero, marginTop: 16 }}>
            {filteredAndSortedCards.length} {filteredAndSortedCards.length === 1 ? 'producto' : 'productos'} encontrados
          </p>
        </div>
      </section>

      {/* ============ CARDS GRID ============ */}
      <section style={{ padding: '40px 24px 100px', background: C.negro }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {filteredAndSortedCards.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <p className="font-display" style={{ fontSize: 28, fontWeight: 600, color: C.acero, marginBottom: 16 }}>
                No encontramos resultados 😢
              </p>
              <p className="font-body" style={{ fontSize: 14, color: C.acero }}>
                Intenta con otro término de búsqueda o expansión.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
              {filteredAndSortedCards.map((card, i) => (
                <div key={i} className="card-hover" style={{
                  borderRadius: 16, overflow: 'hidden', position: 'relative',
                  background: `linear-gradient(165deg, ${C.azul}, ${C.carbon})`,
                  border: '1px solid rgba(192,204,216,0.12)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}>
                  {/* Card image */}
                  <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: `radial-gradient(circle at 50% 40%, rgba(138,111,194,0.3) 0%, transparent 65%)`, overflow: 'hidden' }}>
                    <img src={card.image} alt={card.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'cover' }} loading="lazy" />
                  </div>

                  {/* Card info */}
                  <div style={{ padding: 16 }}>
                    <h3 className="font-display" style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 4, lineHeight: 1.3 }}>
                      {card.name}
                    </h3>
                    <p className="font-body" style={{ fontSize: 12, color: C.acero, marginBottom: 12 }}>
                      {card.set}
                    </p>
                    <p className="font-body" style={{ fontSize: 11, color: C.acero, marginBottom: 16, opacity: 0.7 }}>
                      {card.pokemon}
                    </p>
                    {card.price && (
                      <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid rgba(192,204,216,0.2)` }}>
                        <p className="font-display" style={{ fontSize: 20, fontWeight: 900, color: C.platinoClaro, margin: 0 }}>
                          ${card.price.toLocaleString('es-MX')}
                        </p>
                        <p className="font-body" style={{ fontSize: 10, color: C.acero, marginTop: 4 }}>
                          Precio estimado
                        </p>
                      </div>
                    )}
                    <a href="https://wa.me/525536513092" target="_blank" rel="noopener noreferrer" className="font-body" style={{
                      display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#fff',
                      background: C.azulAcento, padding: '10px 16px', borderRadius: 100, textDecoration: 'none',
                      transition: 'transform 0.3s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      Consultar →
                    </a>
                  </div>
                </div>
              ))}
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
