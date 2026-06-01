import React from 'react';
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

export default function About() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = React.useState(false);

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
    fuego: '#e05c2a',
  };

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
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            <span className="font-display" style={{ fontSize: 16, fontWeight: 600, color: C.platino }}>The Card Box MX</span>
          </button>

          <nav style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
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
              onClick={() => navigate('/catalogo/cartas-solas')}
              className="font-body"
              style={{
                background: 'none', border: 'none', color: C.platino, cursor: 'pointer',
                fontSize: 14, fontWeight: 500,
              }}
            >
              Catálogo
            </button>
            <button
              onClick={() => navigate('/nosotros')}
              className="font-body"
              style={{
                background: 'none', border: 'none', color: C.platino, cursor: 'pointer',
                fontSize: 14, fontWeight: 500,
              }}
            >
              Nosotros
            </button>
          </nav>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section style={{ padding: '160px 24px 100px', background: C.negro, marginTop: 0 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ marginBottom: 40 }}>
            <Logo size={80} />
          </div>
          <h1 className="font-display" style={{
            fontSize: 'clamp(40px, 8vw, 72px)', fontWeight: 900, color: '#fff',
            margin: '0 0 24px', letterSpacing: -1.5, lineHeight: 1.1,
          }}>
            The Card Box MX
          </h1>
          <p className="font-body" style={{
            fontSize: 20, color: C.platinoClaro, lineHeight: 1.6,
            marginBottom: 40,
          }}>
            Pasión por las cartas coleccionables, dedicación en cada transacción
          </p>
          <div style={{ height: 2, width: 60, background: C.fuego, margin: '0 auto 40px' }} />
        </div>
      </section>

      {/* ============ ABOUT SECTION 1 ============ */}
      <section style={{ padding: '100px 24px', background: `linear-gradient(180deg, ${C.negro}, ${C.azul})` }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 className="font-display" style={{
            fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 900, color: '#fff',
            marginBottom: 40, letterSpacing: -0.5, lineHeight: 1.2,
          }}>
            ¿Quiénes somos?
          </h2>
          
          <div style={{ display: 'grid', gap: 40 }}>
            <div>
              <h3 className="font-display" style={{ fontSize: 24, fontWeight: 600, color: C.platinoClaro, marginBottom: 16 }}>
                🎯 Nuestra misión
              </h3>
              <p className="font-body" style={{ fontSize: 16, color: C.acero, lineHeight: 1.8 }}>
                En The Card Box MX, creemos que cada carta tiene una historia. Nos dedicamos a conectar coleccionistas apasionados con las piezas que más desean. Nuestro compromiso es simple: calidad, autenticidad y respeto por tu colección.
              </p>
            </div>

            <div>
              <h3 className="font-display" style={{ fontSize: 24, fontWeight: 600, color: C.platinoClaro, marginBottom: 16 }}>
                💎 Lo que nos diferencia
              </h3>
              <p className="font-body" style={{ fontSize: 16, color: C.acero, lineHeight: 1.8 }}>
                No somos solo una tienda. Somos coleccionistas como tú. Verificamos cada carta meticulosamente, cuidamos el empaque como si fueran nuestras joyas, y garantizamos la autenticidad de cada pieza. Trabajamos solo con proveedores de confianza y mantenemos estándares de calidad que van más allá de lo común.
              </p>
            </div>

            <div>
              <h3 className="font-display" style={{ fontSize: 24, fontWeight: 600, color: C.platinoClaro, marginBottom: 16 }}>
                🌟 Nuestro catálogo
              </h3>
              <p className="font-body" style={{ fontSize: 16, color: C.acero, lineHeight: 1.8 }}>
                Ofrecemos cartas individuales de Pokémon TCG desde sets clásicos hasta los más recientes. También contamos con productos cerrados (booster boxes, set boxes y colecciones especiales) para los coleccionistas que buscan experiencias completas. Cada mes añadimos piezas nuevas y raras a nuestro inventario.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ VALUES SECTION ============ */}
      <section style={{ padding: '100px 24px', background: C.negro }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 className="font-display" style={{
            fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 900, color: '#fff',
            marginBottom: 60, textAlign: 'center', letterSpacing: -0.5,
          }}>
            Nuestros valores
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40 }}>
            {[
              { icon: '🔐', title: 'Autenticidad', desc: 'Cada carta es verificada. Garantizamos 100% originalidad en todas nuestras piezas.' },
              { icon: '📦', title: 'Cuidado', desc: 'Empaquetamos como si fueran nuestras cartas. Protección máxima en cada envío.' },
              { icon: '🤝', title: 'Confianza', desc: 'Transparencia total. Descripción detallada, fotos reales y comunicación constante.' },
              { icon: '⚡', title: 'Velocidad', desc: 'Respuestas rápidas. Envíos ágiles. El proceso más fluido posible.' },
              { icon: '💰', title: 'Precio justo', desc: 'Cotizaciones competitivas basadas en el mercado actual de coleccionables.' },
              { icon: '❤️', title: 'Pasión', desc: 'Amamos lo que hacemos. Cada interacción es con el corazón.' },
            ].map((value, i) => (
              <div key={i} style={{
                padding: 32, borderRadius: 16,
                background: `linear-gradient(135deg, rgba(26,106,138,0.1), rgba(192,204,216,0.05))`,
                border: `1px solid rgba(192,204,216,0.15)`,
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>{value.icon}</div>
                <h3 className="font-display" style={{ fontSize: 20, fontWeight: 600, color: C.platinoClaro, marginBottom: 12 }}>
                  {value.title}
                </h3>
                <p className="font-body" style={{ fontSize: 14, color: C.acero, lineHeight: 1.6 }}>
                  {value.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA SECTION ============ */}
      <section style={{ padding: '100px 24px', background: `linear-gradient(135deg, ${C.azulAcento}, #0d3a5a)`, textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 className="font-display" style={{
            fontSize: 'clamp(32px, 6vw, 48px)', fontWeight: 900, color: '#fff',
            marginBottom: 24, letterSpacing: -0.5,
          }}>
            Explora nuestro catálogo
          </h2>
          <p className="font-body" style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: 40 }}>
            Encuentra las cartas que buscas. Cartas individuales, productos cerrados, rarezas y piezas únicas.
          </p>
          <button
            onClick={() => navigate('/catalogo/cartas-solas')}
            className="font-body"
            style={{
              fontSize: 16, fontWeight: 800, color: C.azulAcento, background: '#fff',
              padding: '16px 40px', borderRadius: 100, border: 'none', cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(0,0,0,0.3)', transition: 'transform 0.3s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Ver catálogo →
          </button>
        </div>
      </section>

      {/* ============ CONTACT SECTION ============ */}
      <section style={{ padding: '100px 24px', background: C.negro, textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 className="font-display" style={{
            fontSize: 'clamp(32px, 6vw, 48px)', fontWeight: 900, color: '#fff',
            marginBottom: 40, letterSpacing: -0.5,
          }}>
            ¿Preguntas?
          </h2>
          <p className="font-body" style={{ fontSize: 16, color: C.acero, lineHeight: 1.6, marginBottom: 40 }}>
            Contáctanos directamente. Responderemos en el menor tiempo posible.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', flexDirection: 'column', alignItems: 'center', maxWidth: 280, margin: '0 auto' }}>
            <a href="https://wa.me/525536513092" target="_blank" rel="noopener noreferrer" className="font-body" style={{
              width: '100%', textAlign: 'center', fontSize: 16, fontWeight: 800, color: '#fff',
              background: '#25D366', padding: '16px 36px', borderRadius: 100, textDecoration: 'none',
              transition: 'transform 0.3s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              💬 WhatsApp
            </a>
            <a href="https://www.instagram.com/thecardboxmx" target="_blank" rel="noopener noreferrer" className="font-body" style={{
              width: '100%', textAlign: 'center', fontSize: 16, fontWeight: 700, color: C.platino,
              padding: '16px 36px', borderRadius: 100, border: `1px solid rgba(192,204,216,0.25)`,
              textDecoration: 'none', transition: 'transform 0.3s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              📱 Instagram
            </a>
          </div>
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
