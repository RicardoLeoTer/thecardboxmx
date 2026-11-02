import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';

const LINKS = [
  ['Inicio', '/'],
  ['Catálogo', '/catalogo'],
  ['Blog', '/blog'],
  ['Arcade 🎮', '/arcade'],
  ['Sorteos, rifas y breaks', '/rifas'],
  ['Nosotros', '/nosotros'],
];

const WHATSAPP = 'https://wa.me/525536513092';
const INSTAGRAM = 'https://www.instagram.com/thecardboxmx';

// Botón ☰ + menú a pantalla completa. Solo se ve en pantallas < 768px;
// en esas pantallas se ocultan los menús de escritorio (.desk-nav).
export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open]);

  const isActive = (to) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

  return (
    <>
      <style>{`
        @media (max-width: 767px) { .desk-nav { display: none !important; } }
        .mm-btn { display: none; width: 44px; height: 44px; border-radius: 12px; border: 1px solid rgba(192,204,216,0.2);
          background: rgba(16,26,46,0.6); cursor: pointer; align-items: center; justify-content: center; flex-direction: column; gap: 5px;
          -webkit-tap-highlight-color: transparent; }
        @media (max-width: 767px) { .mm-btn { display: inline-flex; } }
        .mm-btn span { display: block; width: 20px; height: 2px; border-radius: 2px; background: #e4ecf8; transition: transform .3s, opacity .3s; }
        .mm-btn.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .mm-btn.open span:nth-child(2) { opacity: 0; }
        .mm-btn.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
        .mm-panel { position: fixed; inset: 0; z-index: 1000; background: rgba(6,6,8,0.97); backdrop-filter: blur(16px);
          display: flex; flex-direction: column; padding: 88px 28px calc(28px + env(safe-area-inset-bottom));
          opacity: 0; pointer-events: none; transition: opacity .3s ease; }
        .mm-panel.open { opacity: 1; pointer-events: auto; }
        .mm-link { background: none; border: none; text-align: left; cursor: pointer; padding: 14px 0;
          font-family: 'Fraunces', Georgia, serif; font-size: 30px; font-weight: 600; color: #8898b0;
          border-bottom: 1px solid rgba(192,204,216,0.08); transform: translateY(12px); opacity: 0;
          transition: transform .45s cubic-bezier(.16,1,.3,1), opacity .45s, color .2s; }
        .mm-panel.open .mm-link { transform: none; opacity: 1; }
        .mm-link.on, .mm-link:active { color: #fff; }
        .mm-cta { display: block; text-align: center; text-decoration: none; padding: 15px; border-radius: 100px;
          font-family: 'Manrope', sans-serif; font-size: 16px; font-weight: 800; }
      `}</style>

      <button
        type="button"
        className={`mm-btn ${open ? 'open' : ''}`}
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span /><span /><span />
      </button>

      {typeof document !== 'undefined' && createPortal(
      <div className={`mm-panel ${open ? 'open' : ''}`} role="dialog" aria-modal="true" aria-hidden={!open}>
        <div style={{ position: 'absolute', top: 18, left: 28, right: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 18, fontWeight: 600, color: '#c0ccd8' }}>The Card Box</span>
          <button type="button" className="mm-btn open" aria-label="Cerrar menú" tabIndex={open ? 0 : -1}
            onClick={() => setOpen(false)} style={{ display: 'inline-flex' }}>
            <span /><span /><span />
          </button>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column' }}>
          {LINKS.map(([label, to], i) => (
            <button
              key={to}
              className={`mm-link ${isActive(to) ? 'on' : ''}`}
              style={{ transitionDelay: open ? `${0.05 + i * 0.05}s` : '0s' }}
              tabIndex={open ? 0 : -1}
              onClick={() => { setOpen(false); navigate(to); }}
            >
              {label}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <a className="mm-cta" href={WHATSAPP} target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1}
            style={{ background: '#25D366', color: '#fff' }}>
            💬 Escríbenos por WhatsApp
          </a>
          <a className="mm-cta" href={INSTAGRAM} target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1}
            style={{ color: '#c0ccd8', border: '1px solid rgba(192,204,216,0.25)' }}>
            📱 @TheCardBoxMX
          </a>
        </div>
      </div>,
      document.body)}
    </>
  );
}
