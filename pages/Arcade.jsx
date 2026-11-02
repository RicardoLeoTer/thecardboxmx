import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileMenu from '../src/components/MobileMenu.jsx';
import { createGame, W, H } from '../src/arcade/pinballEngine.js';

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

const BEST_KEY = 'tcb-pinball-best';
const readBest = () => { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; } };
const saveBest = (v) => { try { localStorage.setItem(BEST_KEY, String(v)); } catch { /* sin storage */ } };
const fmt = (n) => n.toLocaleString('es-MX');

// ---------------------------------------------------------------- dibujo
function draw(ctx, g, scale) {
  const s = g.state;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, W, H);

  // fondo
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#132039'); bg.addColorStop(0.6, '#0b1220'); bg.addColorStop(1, '#060608');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(20, 720); ctx.lineTo(20, 200); ctx.arc(200, 200, 180, Math.PI, 0); ctx.lineTo(380, 720); ctx.closePath();
  ctx.fill();

  // marca de agua: carta + diamante + TCB
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.strokeStyle = C.platino; ctx.lineWidth = 3;
  roundRect(ctx, 140, 380, 120, 166, 12); ctx.stroke();
  ctx.fillStyle = C.platino;
  ctx.beginPath(); ctx.moveTo(200, 400); ctx.lineTo(214, 420); ctx.lineTo(200, 438); ctx.lineTo(186, 420); ctx.closePath(); ctx.fill();
  ctx.font = '900 34px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('TCB', 200, 494);
  ctx.font = '700 9px Georgia, serif'; ctx.fillText('THE CARD BOX', 200, 516);
  ctx.restore();

  // carril del lanzador
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(352, 236, 28, 452);

  // paredes
  ctx.lineCap = 'round';
  for (const w of s.walls) {
    ctx.strokeStyle = w.kick ? C.fuego : w.oneWay ? 'rgba(192,204,216,0.35)' : C.platino;
    ctx.lineWidth = w.kick ? 5 : (w.r ? 4 : 3);
    ctx.shadowColor = w.kick ? C.fuego : 'rgba(192,204,216,0.6)';
    ctx.shadowBlur = w.kick ? 10 : 6;
    ctx.beginPath(); ctx.moveTo(w.ax, w.ay); ctx.lineTo(w.bx, w.by); ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // carriles T C B
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const l of s.lanes) {
    const cx = (l.x0 + l.x1) / 2;
    ctx.fillStyle = l.lit ? C.azulAcento : 'rgba(255,255,255,0.06)';
    ctx.shadowColor = '#3fb6e0'; ctx.shadowBlur = l.lit ? 14 : 0;
    ctx.beginPath(); ctx.arc(cx, 98, 10, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = l.lit ? '#fff' : C.acero; ctx.font = '800 11px Manrope, sans-serif';
    ctx.fillText(l.label, cx, 98.5);
  }

  // dianas P A K (sobres)
  for (const t of s.targets) {
    const cx = (t.ax + t.bx) / 2;
    if (t.up) {
      const gr = ctx.createLinearGradient(t.ax, 0, t.bx, 0);
      gr.addColorStop(0, '#2a7a4a'); gr.addColorStop(1, '#3fae6c');
      ctx.fillStyle = gr; roundRect(ctx, t.ax, 143, t.bx - t.ax, 12, 3); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '800 9px Manrope, sans-serif'; ctx.fillText(t.label, cx, 149.5);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; roundRect(ctx, t.ax, 149, t.bx - t.ax, 4, 2); ctx.fill();
    }
  }

  // bumpers
  for (const bp of s.bumpers) {
    const lit = s.time < bp.flash;
    const gr = ctx.createRadialGradient(bp.x - 6, bp.y - 6, 2, bp.x, bp.y, bp.r);
    gr.addColorStop(0, lit ? '#ffffff' : '#e4ecf8'); gr.addColorStop(0.55, lit ? '#7cc4e0' : '#8898b0'); gr.addColorStop(1, '#1a2a44');
    ctx.fillStyle = gr;
    ctx.shadowColor = lit ? '#7cc4e0' : 'rgba(192,204,216,0.4)'; ctx.shadowBlur = lit ? 24 : 8;
    ctx.beginPath(); ctx.arc(bp.x, bp.y, bp.r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = lit ? '#fff' : 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(bp.x, bp.y, bp.r - 4, 0, Math.PI * 2); ctx.stroke();
    if (bp.icon === '◆') {
      ctx.fillStyle = '#0d1117';
      ctx.beginPath(); ctx.moveTo(bp.x, bp.y - 12); ctx.lineTo(bp.x + 9, bp.y); ctx.lineTo(bp.x, bp.y + 12); ctx.lineTo(bp.x - 9, bp.y); ctx.closePath(); ctx.fill();
    } else {
      ctx.font = `${Math.round(bp.r * 0.95)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
      ctx.fillText(bp.icon, bp.x, bp.y + 1);
    }
  }

  // flippers
  for (const f of s.flippers) {
    const tx = f.px + Math.cos(f.a) * f.len, ty = f.py + Math.sin(f.a) * f.len;
    ctx.strokeStyle = C.platinoClaro; ctx.lineWidth = f.r * 2;
    ctx.shadowColor = 'rgba(228,236,248,0.6)'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.moveTo(f.px, f.py); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = C.azulAcento; ctx.beginPath(); ctx.arc(f.px, f.py, 3, 0, Math.PI * 2); ctx.fill();
  }

  // lanzador (resorte)
  const pull = s.status === 'ready' ? s.plunger : 0;
  ctx.fillStyle = C.fuego;
  roundRect(ctx, 357, 690 + pull * 18, 18, 6, 2); ctx.fill();
  ctx.strokeStyle = 'rgba(192,204,216,0.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= 6; i++) { const y = 696 + pull * 18 + i * ((24 - pull * 18) / 6); ctx.lineTo(i % 2 ? 360 : 372, y); }
  ctx.stroke();

  // bola
  const b = s.ball;
  const bg2 = ctx.createRadialGradient(b.x - 3, b.y - 3, 1, b.x, b.y, 8);
  bg2.addColorStop(0, '#ffffff'); bg2.addColorStop(0.5, '#c0ccd8'); bg2.addColorStop(1, '#5a6a80');
  ctx.fillStyle = bg2; ctx.shadowColor = 'rgba(255,255,255,0.6)'; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(b.x, b.y, 8, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

// ---------------------------------------------------------------- página
export default function Arcade() {
  const navigate = useNavigate();
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const [hud, setHud] = useState({ score: 0, balls: 3, mult: 1, status: 'ready', message: null });
  const [best, setBest] = useState(readBest);
  const [started, setStarted] = useState(false);

  useEffect(() => { document.title = 'Pinball TCB | The Card Box MX'; window.scrollTo(0, 0); }, []);

  // motor + bucle de animación
  useEffect(() => {
    const g = createGame({
      onEvent: (e) => {
        if (e.type === 'over') {
          setBest((prev) => { const nb = Math.max(prev, e.score); saveBest(nb); return nb; });
        }
      },
    });
    gameRef.current = g;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let scale = 1, raf = 0, last = performance.now(), hudTick = 0;

    const resize = () => {
      const box = wrapRef.current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const sc = Math.min(box.width / W, box.height / H);
      canvas.style.width = `${W * sc}px`; canvas.style.height = `${H * sc}px`;
      canvas.width = Math.round(W * sc * dpr); canvas.height = Math.round(H * sc * dpr);
      scale = sc * dpr;
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (now) => {
      const dt = (now - last) / 1000; last = now;
      g.update(dt);
      draw(ctx, g, scale);
      hudTick += dt;
      if (hudTick > 0.08) {
        hudTick = 0;
        const s = g.state;
        setHud({ score: s.score, balls: s.balls, mult: s.mult, status: s.status, message: s.message });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // teclado
    const key = (down) => (e) => {
      const k = e.key.toLowerCase();
      if (['arrowleft', 'z', 'a', 'shift'].includes(k)) { g.input.left = down; e.preventDefault(); }
      if (['arrowright', 'm', 'l', '/'].includes(k)) { g.input.right = down; e.preventDefault(); }
      if ([' ', 'arrowdown', 'enter'].includes(k)) { g.input.plunger = down; e.preventDefault(); }
    };
    const kd = key(true), ku = key(false);
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
    };
  }, []);

  // controles táctiles: mitad izquierda / derecha de la pantalla
  const touches = useRef(new Map());
  const updateTouch = () => {
    const g = gameRef.current; if (!g) return;
    let l = false, r = false;
    touches.current.forEach((side) => { if (side === 'L') l = true; if (side === 'R') r = true; });
    g.input.left = l; g.input.right = r;
  };
  const onPointerDown = (e) => {
    if (e.target.closest('[data-launch]')) return;
    const side = e.clientX < window.innerWidth / 2 ? 'L' : 'R';
    touches.current.set(e.pointerId, side); updateTouch();
  };
  const onPointerUp = (e) => { touches.current.delete(e.pointerId); updateTouch(); };

  const launchDown = (e) => { e.preventDefault(); if (gameRef.current) gameRef.current.input.plunger = true; };
  const launchUp = (e) => { e.preventDefault(); if (gameRef.current) gameRef.current.input.plunger = false; };

  const restart = () => { gameRef.current?.reset(); setStarted(true); };

  return (
    <div style={{ background: C.negro, color: '#fff', minHeight: '100dvh', display: 'flex', flexDirection: 'column', fontFamily: "'Manrope', 'Helvetica Neue', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,900&family=Manrope:wght@500;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .arc-btn { border: none; border-radius: 100px; font-family: Manrope, sans-serif; font-weight: 800; cursor: pointer; }
        .arc-nav { background: none; border: none; color: ${C.acero}; font-size: 14px; font-weight: 600; cursor: pointer; }
        .arc-nav:hover { color: ${C.platino}; }
        .arc-kbd { display: inline-block; padding: 2px 7px; border-radius: 6px; border: 1px solid rgba(192,204,216,0.3); font-size: 11px; color: ${C.platino}; }
        @media (pointer: coarse) { .only-desktop { display: none !important; } }
        @media (pointer: fine) { .only-touch { display: none !important; } }
      `}</style>

      <header style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(192,204,216,0.08)' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Fraunces, Georgia, serif', fontWeight: 600, fontSize: 17, color: C.platino }}>
          The Card Box <span style={{ color: C.fuego, fontFamily: 'Manrope', fontSize: 12, fontWeight: 800, letterSpacing: 2, marginLeft: 6 }}>ARCADE</span>
        </button>
        <nav className="desk-nav" style={{ display: 'flex', gap: 20 }}>
          <button className="arc-nav" onClick={() => navigate('/catalogo')}>Catálogo</button>
          <button className="arc-nav" onClick={() => navigate('/blog')}>Blog</button>
          <button className="arc-nav" onClick={() => navigate('/rifas')}>Rifas</button>
        </nav>
        <MobileMenu />
      </header>

      {/* marcador */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 18, padding: '10px 12px 6px', flexWrap: 'wrap', fontSize: 13 }}>
        <Stat label="PUNTOS" value={fmt(hud.score)} big />
        <Stat label="BOLAS" value={'●'.repeat(Math.max(0, hud.balls)) || '—'} />
        <Stat label="MULT" value={`x${hud.mult}`} />
        <Stat label="RÉCORD" value={fmt(Math.max(best, hud.status === 'over' ? hud.score : 0))} />
      </div>

      {/* mesa */}
      <div
        ref={wrapRef}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
        onContextMenu={(e) => e.preventDefault()}
        style={{ flex: 1, minHeight: 360, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', padding: '4px 8px 8px' }}
      >
        <canvas ref={canvasRef} style={{ display: 'block', borderRadius: 18, boxShadow: '0 0 0 1px rgba(192,204,216,0.12), 0 30px 80px rgba(0,0,0,0.6)' }} />

        {hud.message && hud.status !== 'over' && (
          <div style={{ position: 'absolute', top: '38%', left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
            <span style={{ background: 'rgba(6,6,8,0.75)', padding: '8px 18px', borderRadius: 100, fontWeight: 800, letterSpacing: 1, color: C.platinoClaro, border: '1px solid rgba(192,204,216,0.25)' }}>{hud.message}</span>
          </div>
        )}

        {/* botón de lanzar (touch) */}
        {hud.status === 'ready' && started && (
          <button
            data-launch
            className="arc-btn only-touch"
            onPointerDown={launchDown}
            onPointerUp={launchUp}
            onPointerCancel={launchUp}
            style={{ position: 'absolute', bottom: 18, right: 14, background: C.fuego, color: '#fff', padding: '14px 18px', fontSize: 14, boxShadow: '0 8px 24px rgba(224,92,42,0.45)' }}
          >
            Mantén y suelta 🚀
          </button>
        )}

        {/* pantalla inicial / fin */}
        {(!started || hud.status === 'over') && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(6,6,8,0.72)', backdropFilter: 'blur(4px)', padding: 20 }}>
            <div style={{ textAlign: 'center', maxWidth: 340 }}>
              <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: 3, color: C.fuego, marginBottom: 8 }}>THE CARD BOX ARCADE</p>
              <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: 44, lineHeight: 1, marginBottom: 14 }}>
                {hud.status === 'over' && started ? 'Fin del juego' : 'Pinball TCB'}
              </h1>
              {hud.status === 'over' && started ? (
                <p style={{ color: C.platino, marginBottom: 18 }}>Hiciste <b style={{ color: '#fff' }}>{fmt(hud.score)}</b> puntos{hud.score >= best && hud.score > 0 ? ' · ¡nuevo récord! 🏆' : ''}</p>
              ) : (
                <p style={{ color: C.acero, fontSize: 14, lineHeight: 1.6, marginBottom: 18 }}>
                  Prende las letras <b style={{ color: '#fff' }}>T·C·B</b> para subir el multiplicador y tumba los 3 sobres <b style={{ color: '#fff' }}>P·A·K</b> para el bonus.
                </p>
              )}
              <button className="arc-btn" onClick={restart} style={{ background: C.azulAcento, color: '#fff', padding: '14px 34px', fontSize: 16 }}>
                {hud.status === 'over' && started ? 'Jugar otra vez' : 'Jugar'}
              </button>
              <div style={{ marginTop: 18, fontSize: 12, color: C.acero, lineHeight: 1.9 }}>
                <p className="only-desktop"><span className="arc-kbd">Z</span> / <span className="arc-kbd">←</span> flipper izq · <span className="arc-kbd">M</span> / <span className="arc-kbd">→</span> flipper der · mantén <span className="arc-kbd">Espacio</span> para lanzar</p>
                <p className="only-touch">Toca la mitad izquierda o derecha de la pantalla para mover cada flipper. Mantén el botón 🚀 para lanzar.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, big }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 64 }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: C.acero }}>{label}</div>
      <div style={{ fontFamily: big ? 'Fraunces, Georgia, serif' : 'Manrope, sans-serif', fontWeight: 800, fontSize: big ? 22 : 15, color: big ? '#fff' : C.platino }}>{value}</div>
    </div>
  );
}
