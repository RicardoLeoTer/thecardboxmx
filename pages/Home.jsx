import React, { useState, useEffect } from 'react';
import MobileMenu from '../src/components/MobileMenu.jsx';
import { useNavigate } from 'react-router-dom';

function useReveal(options = {}) {
  const ref = React.useRef(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
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

function Logo({ size = 48, glow = false, id }) {
  const uid = id || `l${String(size).replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg viewBox="0 0 400 400" width={size} height={size} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`lg${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f4f6fa" />
          <stop offset="30%" stopColor="#c0ccd8" />
          <stop offset="55%" stopColor="#e4ecf8" />
          <stop offset="80%" stopColor="#7888a0" />
          <stop offset="100%" stopColor="#ccd8e8" />
        </linearGradient>
        {glow && (
          <filter id={`gl${uid}`}>
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        )}
      </defs>
      <g opacity="0.97" filter={glow ? `url(#gl${uid})` : undefined}>
        <circle cx="200" cy="200" r="187" fill="none" stroke={`url(#lg${uid})`} strokeWidth="3" />
        <circle cx="200" cy="200" r="181" fill="none" stroke={`url(#lg${uid})`} strokeWidth="1" opacity="0.3" />
        <rect x="105" y="68" width="190" height="264" rx="18" fill="rgba(13,17,23,0.85)" />
        <rect x="109" y="72" width="182" height="256" rx="15" fill="none" stroke={`url(#lg${uid})`} strokeWidth="2" />
        <polygon points="200,92 222,122 200,148 178,122" fill={`url(#lg${uid})`} />
        <polygon points="200,92 222,122 200,120" fill="rgba(255,255,255,0.45)" />
        <text x="200" y="238" textAnchor="middle" fontFamily="Georgia, serif" fontSize="50" fontWeight="900" letterSpacing="9" fill={`url(#lg${uid})`}>TCB</text>
        <text x="200" y="276" textAnchor="middle" fontFamily="Georgia, serif" fontSize="12" fontWeight="700" letterSpacing="4" fill={`url(#lg${uid})`} opacity="0.85">THE CARD BOX</text>
      </g>
    </svg>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = React.useState(false);
  const [heroLoaded, setHeroLoaded] = React.useState(false);

  React.useEffect(() => {
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

  // Top 6 featured cards (your best ones)
  const featured = [
    { name: 'Mega Charizard EX', set: 'Phantasmal Flames', image: '/images/MEGACHARIZARDEX.jpg', tag: 'Más buscada', glow: 'rgba(224,92,42,0.4)' },
    { name: 'Charmander', set: 'Top Sun', image: '/images/CHARMANDERTOPSUN.jpg', tag: 'Vintage', glow: 'rgba(138,111,194,0.4)' },
    { name: 'Pikachu', set: '25th Anniversary', image: '/images/BIRTHDAYPIKA.jpg', tag: 'Edición limitada', glow: 'rgba(138,111,194,0.4)' },
    { name: 'Entei', set: 'Crown Zenith', image: '/images/ENTEIV.jpg', tag: 'Alt Art', glow: 'rgba(138,111,194,0.4)' },
    { name: 'Bulbasaur', set: 'Stellar Crown', image: '/images/SLEEPYBULBASAUR.jpg', tag: 'Alt Art', glow: 'rgba(138,111,194,0.4)' },
    { name: 'Mimikyu', set: 'Destined Rivals', image: '/images/TEAMRMIMIKYU.jpg', tag: 'Alt Art', glow: 'rgba(138,111,194,0.4)' },
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
        @keyframes watermark-float { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-14px) scale(1.015); } }
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
          <nav className="desk-nav" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            {[
              { label: 'Catálogo', action: () => navigate('/catalogo') },
              { label: 'Arcade', action: () => navigate('/arcade') },
              { label: 'Rifas', action: () => navigate('/rifas') },
              { label: 'Blog', action: () => navigate('/blog') },
              { label: 'Nosotros', action: () => navigate('/nosotros') },
            ].map((l) => (
              <span key={l.label} className="nav-link font-body" style={{ fontSize: 14, fontWeight: 500, color: C.acero, display: 'block', cursor: 'pointer' }} onClick={l.action}>
                {l.label}
              </span>
            ))}
            <span className="btn btn-primary font-body" style={{
              fontSize: 13, fontWeight: 700, color: '#fff',
              background: C.azulAcento, padding: '9px 20px', borderRadius: 100, cursor: 'pointer'
            }} onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}>
              Contacto
            </span>
          </nav>
          <MobileMenu />
        </div>
      </header>

      {/* HERO */}
      <section style={{
        minHeight: '100vh', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '120px 24px 80px',
        background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${C.azul} 0%, ${C.carbon} 45%, ${C.negro} 100%)`,
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '10%', left: '15%', width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, rgba(26,106,138,0.15) 0%, transparent 70%)`, filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '5%', right: '10%', width: 350, height: 350, borderRadius: '50%', background: `radial-gradient(circle, rgba(138,111,194,0.12) 0%, transparent 70%)`, filter: 'blur(40px)' }} />

        {/* Logo de fondo (marca de agua) */}
        <div aria-hidden="true" className="hero-watermark" style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 'min(820px, 115vw)', aspectRatio: '1',
          transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 1,
          opacity: heroLoaded ? 0.09 : 0, transition: 'opacity 1.6s ease 0.2s',
        }}>
          <div style={{ width: '100%', height: '100%', animation: 'watermark-float 14s ease-in-out infinite' }}>
            <Logo size="100%" id="watermark" />
          </div>
        </div>

        <div style={{ maxWidth: 860, textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <div style={{
            opacity: heroLoaded ? 1 : 0, transform: heroLoaded ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.9s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 100, border: `1px solid rgba(192,204,216,0.2)`, background: 'rgba(192,204,216,0.04)', marginBottom: 32 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2A7A4A', boxShadow: '0 0 8px #2A7A4A' }} />
              <span className="font-body" style={{ fontSize: 12, fontWeight: 600, color: C.acero, letterSpacing: 1 }}>POKÉMON · NARUTO · ONE PIECE · DEPORTES</span>
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
            <span className="btn btn-primary font-body" style={{ fontSize: 15, fontWeight: 700, color: '#fff', background: C.azulAcento, padding: '15px 32px', borderRadius: 100, cursor: 'pointer' }} onClick={() => navigate('/catalogo')}>
              Explorar colección
            </span>
            <span className="btn btn-ghost font-body" style={{ fontSize: 15, fontWeight: 700, color: C.platino, background: 'transparent', padding: '15px 32px', borderRadius: 100, border: `1px solid rgba(192,204,216,0.25)`, cursor: 'pointer' }} onClick={() => navigate('/rifas')}>
              Sorteos, rifas y breaks →
            </span>
          </div>
        </div>
      </section>

      {/* FEATURED CARDS */}
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
                  cursor: 'pointer',
                }}>
                  <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: `radial-gradient(circle at 50% 40%, ${card.glow} 0%, transparent 65%)`, overflow: 'hidden' }}>
                    <img src={card.image} alt={card.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'cover', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))' }} loading="lazy" />
                    <span className="font-body" style={{ position: 'absolute', top: 16, left: 16, fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', padding: '6px 14px', borderRadius: 100, letterSpacing: 0.5, border: '1px solid rgba(255,255,255,0.15)' }}>
                      {card.tag}
                    </span>
                  </div>
                  <div style={{ padding: 24 }}>
                    <h3 className="font-display" style={{ fontSize: 24, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{card.name}</h3>
                    <p className="font-body" style={{ fontSize: 14, color: C.acero, marginBottom: 20 }}>{card.set}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="font-body" style={{ fontSize: 13, color: C.acero }}>Disponible</span>
                      <a href="#contacto" className="btn font-body" style={{ fontSize: 13, fontWeight: 700, color: C.platino, border: `1px solid rgba(192,204,216,0.25)`, padding: '8px 18px', borderRadius: 100, textDecoration: 'none', display: 'inline-block' }}>
                        Lo quiero →
                      </a>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <span className="btn btn-primary font-body" style={{ fontSize: 15, fontWeight: 700, color: '#fff', background: C.azulAcento, padding: '15px 32px', borderRadius: 100, cursor: 'pointer' }} onClick={() => navigate('/catalogo')}>
              Ver catálogo completo →
            </span>
          </div>
        </div>
      </section>

      {/* JUEGA Y GANA (Arcade) */}
      <section style={{ padding: '110px 24px', background: `radial-gradient(ellipse 70% 60% at 50% 40%, rgba(224,92,42,0.10) 0%, transparent 70%), ${C.negro}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 56, alignItems: 'center' }}>
          <Reveal>
            <div onClick={() => navigate('/arcade')} className="card-hover" style={{ cursor: 'pointer', maxWidth: 340, margin: '0 auto', borderRadius: 26, padding: 14, background: 'linear-gradient(180deg, #1a1408, #0b0905)', border: '2px solid #6b4f1d', boxShadow: '0 0 0 5px #0b0905, 0 0 40px rgba(255,190,90,0.18)' }}>
              <PinballArt />
            </div>
          </Reveal>
          <div>
            <Reveal>
              <span className="font-body" style={{ fontSize: 13, fontWeight: 700, color: C.fuego, letterSpacing: 3, textTransform: 'uppercase' }}>
                🎮 The Card Box Arcade
              </span>
              <h2 className="font-display" style={{ fontSize: 'clamp(40px, 7vw, 64px)', fontWeight: 900, color: '#fff', margin: '14px 0 18px', letterSpacing: -1.5, lineHeight: 1.02 }}>
                Juega y gana
              </h2>
              <p className="font-body" style={{ fontSize: 18, color: C.acero, lineHeight: 1.6, marginBottom: 28, maxWidth: 520 }}>
                Juega <b style={{ color: '#fff' }}>Pinball TCB</b>, sube la rampa, enciende el jackpot y pelea el primer lugar. Solo registra tu <b style={{ color: '#fff' }}>usuario de Instagram</b> para jugar. Cada mes, los 3 mejores puntajes se llevan un descuento.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 26, maxWidth: 460 }}>
                {[['🥇', '1er lugar', '15%'], ['🥈', '2º lugar', '10%'], ['🥉', '3er lugar', '5%']].map(([m, l, d]) => (
                  <div key={l} style={{ textAlign: 'center', padding: '16px 8px', borderRadius: 16, background: `linear-gradient(165deg, ${C.azul}, ${C.carbon})`, border: '1px solid rgba(192,204,216,0.14)' }}>
                    <div style={{ fontSize: 26 }}>{m}</div>
                    <div className="font-display" style={{ fontSize: 30, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>{d}</div>
                    <div className="font-body" style={{ fontSize: 12, color: C.acero, fontWeight: 600 }}>{l}</div>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="font-body" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', borderRadius: 14, background: 'rgba(224,92,42,0.08)', border: '1px solid rgba(224,92,42,0.3)', marginBottom: 28, maxWidth: 520 }}>
                <span style={{ fontSize: 18 }}>🚫</span>
                <p style={{ fontSize: 14, color: C.platino, lineHeight: 1.55 }}>
                  <b style={{ color: '#fff' }}>Prohibido el uso de cheats.</b> Bots, trucos, modificaciones o cualquier otra forma de alterar el juego o el puntaje descalifican al jugador. Revisamos los 3 primeros lugares antes de entregar los premios.
                </p>
              </div>
              <div className="font-body" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', borderRadius: 14, background: 'rgba(225,48,108,0.08)', border: '1px solid rgba(225,48,108,0.3)', marginTop: -14, marginBottom: 28, maxWidth: 520 }}>
                <span style={{ fontSize: 18 }}>📸</span>
                <p style={{ fontSize: 14, color: C.platino, lineHeight: 1.55 }}>
                  <b style={{ color: '#fff' }}>Valida tu puntaje por Instagram.</b> Al terminar tu partida toma captura de la pantalla final (trae tu código) y mándala por DM a <b style={{ color: '#fff' }}>@TheCardBoxMX</b> desde la cuenta con la que te registraste.
                </p>
              </div>
              <span className="btn btn-primary font-body" onClick={() => navigate('/arcade')} style={{ display: 'inline-block', fontSize: 16, fontWeight: 800, color: '#fff', background: C.fuego, padding: '16px 34px', borderRadius: 100, cursor: 'pointer' }}>
                Jugar Pinball TCB →
              </span>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section id="contacto" style={{ padding: '120px 24px', background: C.negro, textAlign: 'center' }}>
        <Reveal>
          <div style={{ width: 'clamp(150px, 32vw, 220px)', margin: '0 auto', filter: 'drop-shadow(0 0 40px rgba(192,204,216,0.18))' }}>
            <Logo size="100%" glow id="cta" />
          </div>
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
            <a href="https://www.instagram.com/thecardboxmx?igsh=endjdmZ3cnU0MWFm&utm_source=Website" target="_blank" rel="noopener noreferrer" className="btn btn-ghost font-body" style={{ width: '100%', textAlign: 'center', fontSize: 16, fontWeight: 700, color: C.platino, padding: '16px 36px', borderRadius: 100, border: `1px solid rgba(192,204,216,0.25)`, textDecoration: 'none' }}>
              📱 @TheCardBoxMX
            </a>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '48px 24px 32px', background: C.carbon, borderTop: '1px solid rgba(192,204,216,0.08)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Logo size={36} />
            <span className="font-display" style={{ fontSize: 15, fontWeight: 600, color: C.platino }}>The Card Box MX</span>
          </div>
          <p className="font-body" style={{ fontSize: 12, color: '#506070' }}>
            © 2026 The Card Box MX · <a href="https://www.instagram.com/thecardboxmx?igsh=endjdmZ3cnU0MWFm&utm_source=Website" target="_blank" rel="noopener noreferrer" style={{ color: '#506070', textDecoration: 'none' }}>@TheCardBoxMX</a> · Cartas, coleccionables y más
          </p>
        </div>
      </footer>
    </div>
  );
}

// Ilustración del pinball para la sección "Juega y gana"
function PinballArt() {
  const bulbs = Array.from({ length: 21 }, (_, i) => {
    const a = Math.PI + 0.15 + (i * (Math.PI - 0.3)) / 20;
    return [150 + 118 * Math.cos(a), 150 + 118 * Math.sin(a), i];
  });
  return (
    <svg viewBox="0 0 300 440" style={{ width: '100%', display: 'block', borderRadius: 16 }}>
      <defs>
        <linearGradient id="pbBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#132039" /><stop offset="1" stopColor="#060608" /></linearGradient>
        <radialGradient id="pbBump" cx="0.35" cy="0.35" r="0.8"><stop offset="0" stopColor="#ffffff" /><stop offset="0.55" stopColor="#8898b0" /><stop offset="1" stopColor="#1a2a44" /></radialGradient>
        <radialGradient id="pbBall" cx="0.35" cy="0.35" r="0.7"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#5a6a80" /></radialGradient>
      </defs>
      <style>{`.pb-bulb{animation:pbChase 1.2s steps(1) infinite}@keyframes pbChase{0%,100%{opacity:.25}50%{opacity:1}}`}</style>
      <path d="M20 440 V150 A130 130 0 0 1 280 150 V440 Z" fill="url(#pbBg)" stroke="#c0ccd8" strokeWidth="3" />
      {bulbs.map(([x, y, i]) => (
        <circle key={i} className="pb-bulb" cx={x} cy={y} r="3" fill="#ffd27a" style={{ animationDelay: `${(i % 3) * 0.4}s` }} />
      ))}
      <path d="M48 330 Q40 230 70 150 Q95 105 125 95" fill="none" stroke="#e4ecf8" strokeOpacity="0.7" strokeWidth="16" strokeLinecap="round" />
      <path d="M48 330 Q40 230 70 150 Q95 105 125 95" fill="none" stroke="#0e182c" strokeWidth="12" strokeLinecap="round" />
      {[[108, 200, '⚽'], [192, 200, '🏀'], [150, 150, '⚾']].map(([x, y, e]) => (
        <g key={e}><circle cx={x} cy={y} r="19" fill="url(#pbBump)" /><text x={x} y={y + 6} textAnchor="middle" fontSize="17">{e}</text></g>
      ))}
      <circle cx="150" cy="262" r="22" fill="url(#pbBump)" />
      <path d="M150 248 L159 262 L150 276 L141 262 Z" fill="#0d1117" />
      {[118, 150, 182].map((x, i) => <rect key={x} x={x - 13} y="104" width="26" height="9" rx="2" fill="#3fae6c" opacity={i === 1 ? 0.5 : 1} />)}
      {[0, 1, 2].map((i) => <rect key={i} x="262" y={250 + i * 24} width="9" height="18" rx="2" fill="#3fb6e0" />)}
      <text x="150" y="330" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="900" fontSize="30" fill="#c0ccd8" opacity="0.18">TCB</text>
      <line x1="60" y1="330" x2="88" y2="385" stroke="#e05c2a" strokeWidth="5" strokeLinecap="round" />
      <line x1="240" y1="330" x2="212" y2="385" stroke="#e05c2a" strokeWidth="5" strokeLinecap="round" />
      <line x1="98" y1="398" x2="140" y2="418" stroke="#e4ecf8" strokeWidth="12" strokeLinecap="round" />
      <line x1="202" y1="398" x2="160" y2="418" stroke="#e4ecf8" strokeWidth="12" strokeLinecap="round" />
      <circle cx="172" cy="318" r="8" fill="url(#pbBall)">
        <animate attributeName="cy" values="318;230;300;318" dur="3.2s" repeatCount="indefinite" />
        <animate attributeName="cx" values="172;120;190;172" dur="3.2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
