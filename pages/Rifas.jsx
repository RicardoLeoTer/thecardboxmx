import React from 'react';
import MobileMenu from '../src/components/MobileMenu.jsx';
import { useNavigate } from 'react-router-dom';

const C = {
  platino: '#c0ccd8',
  platinoClaro: '#e4ecf8',
  acero: '#8898b0',
  azul: '#101a2e',
  azulAcento: '#1a6a8a',
  carbon: '#0d1117',
  negro: '#060608',
  fuego: '#e05c2a',
};

function Logo({ size = 48 }) {
  return (
    <svg viewBox="0 0 400 400" width={size} height={size}>
      <defs>
        <linearGradient id={`rlg${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f4f6fa" />
          <stop offset="30%" stopColor="#c0ccd8" />
          <stop offset="55%" stopColor="#e4ecf8" />
          <stop offset="80%" stopColor="#7888a0" />
          <stop offset="100%" stopColor="#ccd8e8" />
        </linearGradient>
      </defs>
      <g opacity="0.97">
        <circle cx="200" cy="200" r="187" fill="none" stroke={`url(#rlg${size})`} strokeWidth="3" />
        <rect x="105" y="68" width="190" height="264" rx="18" fill="rgba(13,17,23,0.85)" />
        <polygon points="200,92 222,122 200,148 178,122" fill={`url(#rlg${size})`} />
        <text x="200" y="238" textAnchor="middle" fontFamily="Georgia, serif" fontSize="50" fontWeight="900" letterSpacing="9" fill={`url(#rlg${size})`}>TCB</text>
      </g>
    </svg>
  );
}

const PILARES = [
  { icon: '🎁', title: 'Sorteos', text: 'Dinámicas en redes para llevarte cartas y producto sin costo.' },
  { icon: '🎟️', title: 'Rifas', text: 'Boletos accesibles por piezas premium, con transmisión en vivo.' },
  { icon: '📦', title: 'Breaks', text: 'Abrimos cajas en vivo de Pokémon y deportes: tú eliges tu spot.' },
];

export default function Rifas() {
  const navigate = useNavigate();
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    window.scrollTo(0, 0);
    setLoaded(true);
  }, []);

  const appear = (delay) => ({
    opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(24px)',
    transition: `all 1s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
  });

  return (
    <div style={{
      background: C.negro, color: '#fff', minHeight: '100vh',
      fontFamily: "'Helvetica Neue', Helvetica, sans-serif", WebkitFontSmoothing: 'antialiased', overflowX: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,900&family=Manrope:wght@400;500;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        ::selection { background: ${C.azulAcento}; color: #fff; }
        .font-display { font-family: 'Fraunces', Georgia, serif; }
        .font-body { font-family: 'Manrope', sans-serif; }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
        .shimmer-text {
          background: linear-gradient(90deg, ${C.acero} 0%, ${C.platinoClaro} 50%, ${C.acero} 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
          animation: shimmer 6s linear infinite;
        }
        .btn { transition: all 0.4s cubic-bezier(0.16,1,0.3,1); cursor: pointer; }
        .btn:hover { transform: translateY(-3px); }
        .nav-link { transition: color 0.3s; cursor: pointer; }
        .nav-link:hover { color: ${C.platinoClaro} !important; }
      `}</style>

      {/* HEADER */}
      <header style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: '16px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <Logo size={40} />
            <span className="font-display" style={{ fontSize: 17, fontWeight: 600, color: C.platino }}>The Card Box</span>
          </div>
          <nav className="desk-nav" style={{ display: 'flex', gap: 24 }}>
            <span className="nav-link font-body" style={{ fontSize: 14, fontWeight: 500, color: C.acero }} onClick={() => navigate('/')}>Inicio</span>
            <span className="nav-link font-body" style={{ fontSize: 14, fontWeight: 500, color: C.acero }} onClick={() => navigate('/catalogo')}>Catálogo</span>
          </nav>
          <MobileMenu />
        </div>
      </header>

      {/* HERO */}
      <section style={{
        minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '120px 24px 80px', textAlign: 'center',
        background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${C.azul} 0%, ${C.carbon} 45%, ${C.negro} 100%)`,
      }}>
        <div style={{ position: 'absolute', top: '12%', left: '10%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(224,92,42,0.14) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '8%', right: '8%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,106,138,0.18) 0%, transparent 70%)', filter: 'blur(40px)' }} />

        <div style={{ maxWidth: 960, position: 'relative', zIndex: 2 }}>
          <div style={appear(0)}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 100, border: '1px solid rgba(192,204,216,0.2)', background: 'rgba(192,204,216,0.04)', marginBottom: 32 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.fuego, boxShadow: `0 0 8px ${C.fuego}`, animation: 'pulse 1.6s ease-in-out infinite' }} />
              <span className="font-body" style={{ fontSize: 12, fontWeight: 700, color: C.acero, letterSpacing: 2 }}>ESPÉRALO PRONTO</span>
            </div>
          </div>

          <h1 className="font-display" style={{
            fontSize: 'clamp(48px, 11vw, 120px)', fontWeight: 900, lineHeight: 0.98, letterSpacing: -3, ...appear(0.1),
          }}>
            <span style={{ color: '#fff' }}>Sorteos,</span><br />
            <span style={{ color: '#fff' }}>rifas y </span>
            <span className="shimmer-text">breaks</span>
          </h1>

          <p className="font-body" style={{
            fontSize: 'clamp(16px, 2.5vw, 21px)', color: C.acero, maxWidth: 560, margin: '32px auto 0', lineHeight: 1.6, ...appear(0.2),
          }}>
            Estamos preparando algo grande para la comunidad. Muy pronto vas a poder participar desde aquí.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 56, textAlign: 'left', ...appear(0.3) }}>
            {PILARES.map((p) => (
              <div key={p.title} style={{
                padding: 24, borderRadius: 20, background: `linear-gradient(165deg, rgba(16,26,46,0.7), rgba(13,17,23,0.7))`,
                border: '1px solid rgba(192,204,216,0.12)',
              }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{p.icon}</div>
                <h3 className="font-display" style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>{p.title}</h3>
                <p className="font-body" style={{ fontSize: 14, color: C.acero, lineHeight: 1.5 }}>{p.text}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 48, ...appear(0.4) }}>
            <a href="https://www.instagram.com/thecardboxmx" target="_blank" rel="noopener noreferrer" className="btn font-body" style={{
              fontSize: 15, fontWeight: 700, color: '#fff', background: C.azulAcento, padding: '15px 32px', borderRadius: 100, textDecoration: 'none',
            }}>
              Síguenos para enterarte primero →
            </a>
            <a href="https://wa.me/525536513092?text=Hola!%20Quiero%20que%20me%20avisen%20de%20las%20rifas%20y%20breaks" target="_blank" rel="noopener noreferrer" className="btn font-body" style={{
              fontSize: 15, fontWeight: 700, color: C.platino, padding: '15px 32px', borderRadius: 100, border: '1px solid rgba(192,204,216,0.25)', textDecoration: 'none',
            }}>
              💬 Avísame por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '48px 24px 32px', background: C.carbon, borderTop: '1px solid rgba(192,204,216,0.08)' }}>
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
