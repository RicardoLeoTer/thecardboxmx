import React, { useState, useEffect, useRef } from 'react';

// ============================================================
// Hook: reveal on scroll (Intersection Observer = ligero, gama baja OK)
// ============================================================
function useReveal(options = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold: 0.15, ...options }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ children, delay = 0, y = 30 }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : `translateY(${y}px)`,
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ============================================================
// Logo
// ============================================================
function Logo({ size = 48, glow = false }) {
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
        {glow && (
          <filter id={`gl${size}`}>
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        )}
      </defs>
      <g opacity="0.97" filter={glow ? `url(#gl${size})` : undefined}>
        <circle cx="200" cy="200" r="187" fill="none" stroke={`url(#lg${size})`} strokeWidth="3" />
        <circle cx="200" cy="200" r="181" fill="none" stroke={`url(#lg${size})`} strokeWidth="1" opacity="0.3" />
        <rect x="105" y="68" width="190" height="264" rx="18" fill="rgba(13,17,23,0.85)" />
        <rect x="109" y="72" width="182" height="256" rx="15" fill="none" stroke={`url(#lg${size})`} strokeWidth="2" />
        <polygon points="200,92 222,122 200,148 178,122" fill={`url(#lg${size})`} />
        <polygon points="200,92 222,122 200,120" fill="rgba(255,255,255,0.45)" />
        <text x="200" y="238" textAnchor="middle" fontFamily="Georgia, serif" fontSize="50" fontWeight="900" letterSpacing="9" fill={`url(#lg${size})`}>TCB</text>
        <text x="200" y="276" textAnchor="middle" fontFamily="Georgia, serif" fontSize="12" fontWeight="700" letterSpacing="4" fill={`url(#lg${size})`} opacity="0.85">THE CARD BOX</text>
      </g>
    </svg>
  );
}

// ============================================================
// Main
// ============================================================
export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    setHeroLoaded(true);
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

  const featured = [
    { name: 'Mega Charizard EX', set: 'Phantasmal Flames', image: '/images/MEGACHARIZARDEX.jpg', tag: 'Más buscada', glow: 'rgba(224,92,42,0.4)' },
   { name: 'Charmander', set: 'Top Sun',image: '/images/CHARMANDERTOPSUN.jpg', tag: 'Vintage', glow: 'rgba(138,111,194,0.4)' },
    { name: 'Pikachu', set: '25th Anniversary',image: '/images/BIRTHDAYPIKA.jpg', tag: 'Edición limitada', glow: 'rgba(138,111,194,0.4)' },
    { name: 'Entei', set: 'Crown Zenith',image: '/images/ENTEIV.jpg', tag: 'Alt Art', glow: 'rgba(138,111,194,0.4)' },
    { name: 'Bulbasaur', set: 'Stellar Crown',image: '/images/SLEEPYBULBASAUR.jpg', tag: 'Alt Art', glow: 'rgba(138,111,194,0.4)' },
    { name: 'Mimikyu', set: 'Destined Rivals',image: '/images/TEAMRMIMIKYU.jpg', tag: 'Alt Art', glow: 'rgba(138,111,194,0.4)' },
    { name: 'Froakie', set: 'Ninja Spinner', image: '/images/FROAKIE.jpg', tag: 'Alt Art Japanese', glow: 'rgba(138,111,194,0.4)' },
    { name: 'Frogadier', set: 'Ninja Spinner', image: '/images/FROGADIER.jpg', tag: 'Alt Art Japanese', glow: 'rgba(138,111,194,0.4)' },
    { name: 'Psyduck', set: 'Mega Dream ex', image: '/images/PYSDUCK.jpg', tag: 'Alt Art Japanese', glow: 'rgba(138,111,194,0.4)' },
    { name: 'Murkrow', set: 'The Glory Of Team Rocket', image: '/images/TEAMRMURK.jpg', tag: 'Alt Art Japanese', glow: 'rgba(138,111,194,0.4)' },
    { name: 'Eevee', set: 'Top Sun',image: '/images/EEVEETOPSUN.jpg', tag: 'Vintage', glow: 'rgba(138,111,194,0.4)' },
    { name: 'Jolteon', set: 'Top Sun',image: '/images/JOLTEONTOPSUN.jpg', tag: 'Vintage', glow: 'rgba(138,111,194,0.4)' },
    { name: 'Blastoise', set: 'Top Sun',image: '/images/BLASTOISETOPSUN.jpg', tag: 'Vintage', glow: 'rgba(138,111,194,0.4)' },
  ];

  return (
    <div style={{
      background: C.negro,
      color: '#fff',
      fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
      overflowX: 'hidden',
      WebkitFontSmoothing: 'antialiased',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,900&family=Manrope:wght@400;500;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        ::selection { background: ${C.azulAcento}; color: #fff; }
        @keyframes float { 0%,100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-16px) rotate(2deg); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes pulse-ring { 0% { transform: scale(0.95); opacity: 0.5; } 50% { opacity: 0.15; } 100% { transform: scale(1.3); opacity: 0; } }
        .font-display { font-family: 'Fraunces', Georgia, serif; }
        .font-body { font-family: 'Manrope', sans-serif; }
        .shimmer-text {
          background: linear-gradient(90deg, ${C.acero} 0%, ${C.platinoClaro} 50%, ${C.acero} 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 6s linear infinite;
        }
        .card-hover { transition: transform 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.5s; }
        .card-hover:hover { transform: translateY(-12px) scale(1.02); }
        .btn { transition: all 0.4s cubic-bezier(0.16,1,0.3,1); cursor: pointer; }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(26,106,138,0.5); }
        .btn-ghost:hover { background: rgba(192,204,216,0.08); border-color: ${C.platino}; }
        .nav-link { transition: color 0.3s; cursor: pointer; }
        .nav-link:hover { color: ${C.platinoClaro} !important; }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* ============ NAV ============ */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: scrolled ? '12px 24px' : '20px 24px',
        background: scrolled ? 'rgba(6,6,8,0.72)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(192,204,216,0.1)' : '1px solid transparent',
        transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Logo size={scrolled ? 36 : 42} />
            <span className="font-display" style={{ fontSize: 17, fontWeight: 600, color: C.platino, letterSpacing: 0.5 }}>
              The Card Box
            </span>
          </div>
          <nav style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            {['Pokémon', 'Rifas', 'Blog', 'Nosotros'].map((l) => (
              <span key={l} className="nav-link font-body" style={{ fontSize: 14, fontWeight: 500, color: C.acero, display: window.innerWidth < 640 ? 'none' : 'block' }}>
                {l}
              </span>
            ))}
            <span className="btn btn-primary font-body" style={{
              fontSize: 13, fontWeight: 700, color: '#fff',
              background: C.azulAcento, padding: '9px 20px', borderRadius: 100,
            }}>
              Contacto
            </span>
          </nav>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section style={{
        minHeight: '100vh', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '120px 24px 80px',
        background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${C.azul} 0%, ${C.carbon} 45%, ${C.negro} 100%)`,
        overflow: 'hidden',
      }}>
        {/* Ambient glow orbs */}
        <div style={{ position: 'absolute', top: '10%', left: '15%', width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, rgba(26,106,138,0.15) 0%, transparent 70%)`, filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '5%', right: '10%', width: 350, height: 350, borderRadius: '50%', background: `radial-gradient(circle, rgba(138,111,194,0.12) 0%, transparent 70%)`, filter: 'blur(40px)' }} />

        {/* Floating card emojis */}
        <div style={{ position: 'absolute', top: '22%', left: '8%', fontSize: 48, opacity: 0.18, animation: 'float 7s ease-in-out infinite' }}>🎴</div>
        <div style={{ position: 'absolute', bottom: '20%', right: '12%', fontSize: 40, opacity: 0.15, animation: 'float 9s ease-in-out infinite 1s' }}>✦</div>
        <div style={{ position: 'absolute', top: '60%', left: '14%', fontSize: 32, opacity: 0.12, animation: 'float 8s ease-in-out infinite 0.5s' }}>💎</div>

        <div style={{ maxWidth: 860, textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <div style={{
            opacity: heroLoaded ? 1 : 0, transform: heroLoaded ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.9s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 100, border: `1px solid rgba(192,204,216,0.2)`, background: 'rgba(192,204,216,0.04)', marginBottom: 32 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2A7A4A', boxShadow: '0 0 8px #2A7A4A' }} />
              <span className="font-body" style={{ fontSize: 12, fontWeight: 600, color: C.acero, letterSpacing: 1 }}>CARTAS POKÉMON · MÉXICO</span>
            </div>
          </div>

          <h1 className="font-display" style={{
            fontSize: 'clamp(40px, 9vw, 88px)', fontWeight: 900, lineHeight: 1.02, letterSpacing: -2,
            opacity: heroLoaded ? 1 : 0, transform: heroLoaded ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.1s',
          }}>
            <span style={{ color: '#fff' }}>Tu próxima joya</span><br />
            <span className="shimmer-text">te está esperando</span>
          </h1>

          <p className="font-body" style={{
            fontSize: 'clamp(16px, 2.5vw, 21px)', color: C.acero, maxWidth: 540, margin: '28px auto 0', lineHeight: 1.6, fontWeight: 400,
            opacity: heroLoaded ? 1 : 0, transform: heroLoaded ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.2s',
          }}>
            No solo vendemos cartas. Buscamos y cuidamos las piezas que tu colección merece — auténticas, verificadas, y elegidas con el ojo de un coleccionista.
          </p>

          <div style={{
            display: 'flex', gap: 14, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap',
            opacity: heroLoaded ? 1 : 0, transform: heroLoaded ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.3s',
          }}>
            <span className="btn btn-primary font-body" style={{ fontSize: 15, fontWeight: 700, color: '#fff', background: C.azulAcento, padding: '15px 32px', borderRadius: 100 }}>
              Explorar colección
            </span>
            <span className="btn btn-ghost font-body" style={{ fontSize: 15, fontWeight: 700, color: C.platino, background: 'transparent', padding: '15px 32px', borderRadius: 100, border: `1px solid rgba(192,204,216,0.25)` }}>
              Ver rifas activas →
            </span>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', color: C.acero, fontSize: 12, opacity: 0.6 }} className="font-body">
          <div style={{ textAlign: 'center', letterSpacing: 2 }}>SCROLL</div>
        </div>
      </section>

      {/* ============ MANIFESTO / WHY US ============ */}
      <section style={{ padding: '120px 24px', background: C.negro, position: 'relative' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <span className="font-body" style={{ fontSize: 13, fontWeight: 700, color: C.azulAcento, letterSpacing: 3, textTransform: 'uppercase' }}>
              Por qué nosotros
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-display" style={{ fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 600, lineHeight: 1.15, margin: '24px 0', letterSpacing: -1, color: '#fff' }}>
              Cada carta cuenta una historia.<br />
              <span style={{ color: C.acero }}>Nosotros cuidamos la tuya.</span>
            </h2>
          </Reveal>
        </div>

        <div style={{ maxWidth: 1000, margin: '80px auto 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
          {[
            { icon: '🛡️', title: 'Autenticidad garantizada', desc: 'Cada pieza verificada. Sin sorpresas, sin falsificaciones. Tu confianza es nuestro inventario más valioso.' },
            { icon: '👁️', title: 'Ojo de coleccionista', desc: 'No vendemos lo que sea. Seleccionamos las cartas que nosotros mismos querríamos en nuestra colección.' },
            { icon: '🤝', title: 'De coleccionista a coleccionista', desc: 'Hablamos tu idioma. Entendemos la emoción de completar un set y la cacería de esa carta soñada.' },
          ].map((item, i) => (
            <Reveal key={i} delay={i * 0.12}>
              <div className="card-hover" style={{
                padding: 32, borderRadius: 20, height: '100%',
                background: `linear-gradient(160deg, rgba(26,106,138,0.08), rgba(13,17,23,0.4))`,
                border: '1px solid rgba(192,204,216,0.1)',
              }}>
                <div style={{ fontSize: 40, marginBottom: 20 }}>{item.icon}</div>
                <h3 className="font-display" style={{ fontSize: 22, fontWeight: 600, color: C.platino, marginBottom: 12 }}>{item.title}</h3>
                <p className="font-body" style={{ fontSize: 15, color: C.acero, lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ FEATURED CARDS ============ */}
      <section style={{ padding: '120px 24px', background: `linear-gradient(180deg, ${C.negro} 0%, ${C.carbon} 50%, ${C.negro} 100%)` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <span className="font-body" style={{ fontSize: 13, fontWeight: 700, color: C.azulAcento, letterSpacing: 3, textTransform: 'uppercase' }}>
                Destacadas esta semana
              </span>
              <h2 className="font-display" style={{ fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 600, color: '#fff', marginTop: 16, letterSpacing: -1 }}>
                Piezas que no duran
              </h2>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 28 }}>
            {featured.map((card, i) => (
              <Reveal key={i} delay={i * 0.12} y={50}>
                <div className="card-hover" style={{
                  borderRadius: 24, overflow: 'hidden', position: 'relative',
                  background: `linear-gradient(165deg, ${C.azul}, ${C.carbon})`,
                  border: '1px solid rgba(192,204,216,0.12)',
                  boxShadow: `0 20px 60px rgba(0,0,0,0.5)`,
                }}>
                  {/* Card image area */}
                  <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: `radial-gradient(circle at 50% 40%, ${card.glow} 0%, transparent 65%)`, overflow: 'hidden' }}>
                    <img src={card.image} alt={card.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'cover', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))' }} loading="lazy" />
                    <span className="font-body" style={{ position: 'absolute', top: 16, left: 16, fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', padding: '6px 14px', borderRadius: 100, letterSpacing: 0.5, border: '1px solid rgba(255,255,255,0.15)' }}>
                      {card.tag}
                    </span>
                  </div>
                  {/* Card info */}
                  <div style={{ padding: 24 }}>
                    <h3 className="font-display" style={{ fontSize: 24, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{card.name}</h3>
                    <p className="font-body" style={{ fontSize: 14, color: C.acero, marginBottom: 20 }}>{card.set}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="font-body" style={{ fontSize: 13, color: C.acero }}>Disponible</span>
                      <span className="btn font-body" style={{ fontSize: 13, fontWeight: 700, color: C.platino, border: `1px solid rgba(192,204,216,0.25)`, padding: '8px 18px', borderRadius: 100 }}>
                        Lo quiero →
                      </span>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ RIFA HIGHLIGHT ============ */}
      <section style={{ padding: '100px 24px', background: C.negro }}>
        <Reveal>
          <div style={{
            maxWidth: 1000, margin: '0 auto', borderRadius: 32, overflow: 'hidden', position: 'relative',
            background: `linear-gradient(135deg, ${C.azulAcento} 0%, #0d3a5a 60%, ${C.azul} 100%)`,
            padding: 'clamp(40px, 6vw, 72px)',
          }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', animation: 'pulse-ring 4s ease-out infinite' }} />
            <div style={{ position: 'relative', zIndex: 2, maxWidth: 560 }}>
              <span className="font-body" style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: 3, textTransform: 'uppercase' }}>
                🔥 Rifa activa
              </span>
              <h2 className="font-display" style={{ fontSize: 'clamp(32px, 6vw, 54px)', fontWeight: 900, color: '#fff', margin: '20px 0', lineHeight: 1.05, letterSpacing: -1 }}>
                Mega EX Boxes<br />Ascended Heroes
              </h2>
              <p className="font-body" style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: 32 }}>
                3 ganadores. Sobres, cartas EX y jumbo. El set que está subiendo de precio cada semana — y tú podrías llevártelo.
              </p>
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 36 }}>
                <div><div className="font-display" style={{ fontSize: 36, fontWeight: 900, color: '#fff' }}>25</div><div className="font-body" style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', letterSpacing: 1 }}>BOLETOS</div></div>
                <div><div className="font-display" style={{ fontSize: 36, fontWeight: 900, color: '#fff' }}>$210</div><div className="font-body" style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', letterSpacing: 1 }}>POR BOLETO</div></div>
                <div><div className="font-display" style={{ fontSize: 36, fontWeight: 900, color: '#fff' }}>3</div><div className="font-body" style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', letterSpacing: 1 }}>GANADORES</div></div>
              </div>
              <span className="btn font-body" style={{ display: 'inline-block', fontSize: 15, fontWeight: 800, color: C.azulAcento, background: '#fff', padding: '15px 36px', borderRadius: 100, boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                Reservar mi boleto
              </span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============ TESTIMONIAL / TRUST ============ */}
      <section style={{ padding: '100px 24px', background: `linear-gradient(180deg, ${C.negro}, ${C.carbon})` }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <div style={{ fontSize: 56, marginBottom: 24, opacity: 0.9 }}>“</div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="font-display" style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 400, lineHeight: 1.4, color: C.platinoClaro, letterSpacing: -0.5, fontStyle: 'italic' }}>
              Encontrar a alguien que cuida las cartas como tú las cuidarías — eso no tiene precio. Aquí lo encontré.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="font-body" style={{ fontSize: 14, color: C.acero, marginTop: 32, letterSpacing: 1 }}>
              — Lo que queremos que sientas en cada compra
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section style={{ padding: '120px 24px', background: C.negro, textAlign: 'center' }}>
        <Reveal>
          <Logo size={72} glow />
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="font-display" style={{ fontSize: 'clamp(32px, 7vw, 64px)', fontWeight: 900, color: '#fff', margin: '32px 0 20px', letterSpacing: -1.5, lineHeight: 1.05 }}>
            Siempre tenemos algo<br />para tu colección
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="font-body" style={{ fontSize: 18, color: C.acero, maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.6 }}>
            Escríbenos hoy. La carta que buscas quizá ya está aquí.
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', flexDirection: 'column', alignItems: 'center', maxWidth: 280, margin: '0 auto' }}>
            <a href="https://wa.me/525536513092" target="_blank" rel="noopener noreferrer" className="btn btn-primary font-body" style={{ width: '100%', textAlign: 'center', fontSize: 16, fontWeight: 800, color: '#fff', background: '#25D366', padding: '16px 36px', borderRadius: 100, textDecoration: 'none' }}>
              💬 WhatsApp
            </a>
            <a href="https://instagram.com/thecarboxmx" target="_blank" rel="noopener noreferrer" className="btn btn-ghost font-body" style={{ width: '100%', textAlign: 'center', fontSize: 16, fontWeight: 700, color: C.platino, padding: '16px 36px', borderRadius: 100, border: `1px solid rgba(192,204,216,0.25)`, textDecoration: 'none' }}>
              📱 @TheCardBoxMX
            </a>
          </div>
        </Reveal>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{ padding: '48px 24px 32px', background: C.carbon, borderTop: '1px solid rgba(192,204,216,0.08)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Logo size={36} />
            <span className="font-display" style={{ fontSize: 15, fontWeight: 600, color: C.platino }}>The Card Box MX</span>
          </div>
          <p className="font-body" style={{ fontSize: 12, color: '#506070' }}>
            © 2026 The Card Box MX · <a href="https://instagram.com/thecardboxmx" target="_blank" rel="noopener noreferrer" style={{ color: '#506070', textDecoration: 'none' }}>@TheCardBoxMX</a> · Pokémon © Nintendo / GameFreak
          </p>
        </div>
      </footer>
    </div>
  );
}
