import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const [scrolled, setScrolled] = React.useState(false);
  const [activeTab, setActiveTab] = useState('individuales');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSet, setSelectedSet] = useState('all');

  React.useEffect(() => {
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
    { name: 'Mega Charizard EX', set: 'Phantasmal Flames', image: '/images/MEGACHARIZARDEX.jpg', type: 'individual' },
    { name: 'Charmander', set: 'Top Sun', image: '/images/CHARMANDERTOPSUN.jpg', type: 'individual' },
    { name: 'Pikachu', set: '25th Anniversary', image: '/images/BIRTHDAYPIKA.jpg', type: 'individual' },
    { name: 'Entei', set: 'Crown Zenith', image: '/images/ENTEI.jpg', type: 'individual' },
    { name: 'Bulbasaur', set: 'Stellar Crown', image: '/images/SLEEPYBULBASAUR.jpg', type: 'individual' },
    { name: 'Mimikyu', set: 'Destined Rivals', image: '/images/TEAMPRIMIKYU.jpg', type: 'individual' },
    { name: 'Froakie', set: 'Ninja Spinner', image: '/images/FROAKIE.jpg', type: 'individual' },
    { name: 'Frogadier', set: 'Ninja Spinner', image: '/images/FROGADIER.jpg', type: 'individual' },
    { name: 'Psyduck', set: 'Mega Dream ex', image: '/images/PSYDUCK.jpg', type: 'individual' },
    { name: 'Murkrow', set: 'The Glory Of Team Rocket', image: '/images/TEAMMURK.jpg', type: 'individual' },
    { name: 'Eevee', set: 'Top Sun', image: '/images/EEVEETOPSUN.jpg', type: 'individual' },
    { name: 'Jolteon', set: 'Top Sun', image: '/images/JOLTEON.jpg', type: 'individual' },
    { name: 'Blastoise', set: 'Top Sun', image: '/images/BLASTOSETOPSUN.jpg', type: 'individual' },
  ];

  // Closed products (boxes, collections, etc.)
  const closedProducts = [
    { name: 'Ascended Heroes Mega EX Box', set: 'Ascended Heroes', image: '/images/MEGACHARIZARDEX.jpg', type: 'closed' },
    // Añade más productos cerrados aquí
  ];

  const cards = activeTab === 'individuales' ? allCards : closedProducts;
  const uniqueSets = ['all', ...new Set(cards.map(c => c.set))];

  // Filter by search and set
  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           card.set.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSet = selectedSet === 'all' || card.set === selectedSet;
      return matchesSearch && matchesSet;
    });
  }, [searchQuery, selectedSet, cards]);

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
        .card-hover:hover { transform: translateY(-12px) scale(1.02); }
        .btn { transition: all 0.4s cubic-bezier(0.16,1,0.3,1); cursor: pointer; }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* HEADER */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: scrolled ? '12px 24px' : '20px 24px',
        background: scrolled ? 'rgba(6,6,8,0.72)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(192,204,216,0.1)' : '1px solid transparent',
        transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <Logo size={scrolled ? 36 : 42} />
            <span className="font-display" style={{ fontSize: 17, fontWeight: 600, color: C.platino, letterSpacing: 0.5 }}>
              The Card Box
            </span>
          </div>
        </div>
      </header>

      {/* CATALOG */}
      <section style={{ padding: '120px 24px 80px', background: C.negro }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h1 className="font-display" style={{ fontSize: 'clamp(40px, 7vw, 72px)', fontWeight: 900, color: '#fff', marginBottom: 12, letterSpacing: -1.5 }}>
              Catálogo Completo
            </h1>
            <p className="font-body" style={{ fontSize: 16, color: C.acero }}>
              {filteredCards.length} {activeTab === 'individuales' ? 'cartas individuales' : 'productos'} disponibles
            </p>
          </div>

          {/* TABS */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 40, borderBottom: `1px solid rgba(192,204,216,0.1)` }}>
            {[
              { id: 'individuales', label: 'Cartas Individuales' },
              { id: 'cerrados', label: 'Productos Cerrados' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedSet('all'); setSearchQuery(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '16px 24px',
                  fontSize: 15,
                  fontWeight: 700,
                  color: activeTab === tab.id ? C.platino : C.acero,
                  cursor: 'pointer',
                  borderBottom: activeTab === tab.id ? `3px solid ${C.azulAcento}` : 'none',
                  transition: 'all 0.3s',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* SEARCH & FILTERS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 40 }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Buscar por nombre o expansión..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: 14,
                  background: 'rgba(192,204,216,0.08)',
                  border: '1px solid rgba(192,204,216,0.2)',
                  borderRadius: 12,
                  color: '#fff',
                  fontFamily: "'Manrope', sans-serif",
                }}
              />
            </div>

            {/* Set Filter */}
            <select
              value={selectedSet}
              onChange={(e) => setSelectedSet(e.target.value)}
              style={{
                padding: '12px 16px',
                fontSize: 14,
                background: 'rgba(192,204,216,0.08)',
                border: '1px solid rgba(192,204,216,0.2)',
                borderRadius: 12,
                color: '#fff',
                fontFamily: "'Manrope', sans-serif",
                cursor: 'pointer',
              }}
            >
              <option value="all" style={{ background: C.carbon, color: '#fff' }}>Todas las expansiones</option>
              {uniqueSets.filter(s => s !== 'all').map(set => (
                <option key={set} value={set} style={{ background: C.carbon, color: '#fff' }}>
                  {set}
                </option>
              ))}
            </select>
          </div>

          {/* CARDS GRID */}
          {filteredCards.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
              {filteredCards.map((card, i) => (
                <div key={i} className="card-hover" style={{
                  borderRadius: 16, overflow: 'hidden', position: 'relative',
                  background: `linear-gradient(165deg, ${C.azul}, ${C.carbon})`,
                  border: '1px solid rgba(192,204,216,0.12)',
                  boxShadow: `0 12px 40px rgba(0,0,0,0.3)`,
                }}>
                  <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', background: 'rgba(26,106,138,0.1)' }}>
                    <img src={card.image} alt={card.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'cover' }} loading="lazy" />
                  </div>
                  <div style={{ padding: 16 }}>
                    <h3 className="font-display" style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 4, lineHeight: 1.2 }}>{card.name}</h3>
                    <p className="font-body" style={{ fontSize: 12, color: C.acero, marginBottom: 12 }}>{card.set}</p>
                    <a href="#contacto" className="btn font-body" style={{ fontSize: 12, fontWeight: 700, color: C.platino, border: `1px solid rgba(192,204,216,0.25)`, padding: '8px 14px', borderRadius: 100, textDecoration: 'none', display: 'inline-block' }}>
                      Quiero →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: C.acero }}>
              <p className="font-body" style={{ fontSize: 16 }}>No encontramos cartas que coincidan con tu búsqueda.</p>
              <p className="font-body" style={{ fontSize: 14, marginTop: 8 }}>Intenta con otros términos.</p>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '48px 24px 32px', background: C.carbon, borderTop: '1px solid rgba(192,204,216,0.08)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <Logo size={36} />
            <span className="font-display" style={{ fontSize: 15, fontWeight: 600, color: C.platino }}>The Card Box MX</span>
          </div>
          <p className="font-body" style={{ fontSize: 12, color: '#506070' }}>
            © 2026 The Card Box MX
          </p>
        </div>
      </footer>
    </div>
  );
}
