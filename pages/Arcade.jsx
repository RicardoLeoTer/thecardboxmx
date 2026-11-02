import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileMenu from '../src/components/MobileMenu.jsx';
import { createGame, W, H } from '../src/arcade/pinballEngine.js';
import { supabase } from '../src/lib/supabase.js';

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
const IG_KEY = 'tcb-arcade-ig';
const IG_RE = /^[a-z0-9._]{1,30}$/;
const IG_DM = 'https://ig.me/m/thecardboxmx';
const normIg = (v) => v.trim().replace(/^@/, '').toLowerCase();
const readIg = () => { try { return localStorage.getItem(IG_KEY) || ''; } catch { return ''; } };
const saveIg = (v) => { try { localStorage.setItem(IG_KEY, v); } catch { /* sin storage */ } };
const codeFrom = (id) => id.replace(/-/g, '').slice(0, 6).toUpperCase();
const monthName = () => new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric', timeZone: 'America/Mexico_City' });

async function fetchTop(limit = 10) {
  if (!supabase) return [];
  const { data } = await supabase.from('arcade_leaderboard').select('ig_user, score, status').limit(limit);
  return data ?? [];
}
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

  // outlanes más oscuros
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(20, 490, 28, 230); ctx.fillRect(330, 490, 22, 230);

  const blink = Math.floor(s.time / 120);
  const pulse = (Math.sin(s.time / 160) + 1) / 2;

  // foquitos de casino alrededor del arco (efecto marquesina)
  for (let i = 0; i <= 28; i++) {
    const a = Math.PI + 0.12 + (i * (Math.PI - 0.24)) / 28;
    const x = 200 + 168 * Math.cos(a), y = 200 + 168 * Math.sin(a);
    const on = (i + blink) % 4 === 0 || s.status === 'over';
    bulb(ctx, x, y, 2.6, on ? '#ffd27a' : 'rgba(255,210,122,0.18)', on);
  }
  // foquitos en las paredes laterales del campo
  for (let y = 215; y <= 300; y += 17) {
    const on = (Math.floor(y / 17) + blink) % 3 === 0;
    bulb(ctx, 33, y, 2.2, on ? '#ffd27a' : 'rgba(255,210,122,0.15)', on);
    bulb(ctx, 342, y - 10, 2.2, on ? '#ffd27a' : 'rgba(255,210,122,0.15)', on);
  }

  // insertos del multiplicador
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  [2, 3, 4, 5].forEach((m, i) => {
    const x = 161 + i * 26, y = 520;
    const lit = s.mult >= m;
    ctx.fillStyle = lit ? '#e05c2a' : 'rgba(224,92,42,0.12)';
    ctx.shadowColor = '#e05c2a'; ctx.shadowBlur = lit ? 12 : 0;
    ctx.beginPath(); ctx.moveTo(x, y - 11); ctx.lineTo(x + 11, y); ctx.lineTo(x, y + 11); ctx.lineTo(x - 11, y); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = lit ? '#fff' : 'rgba(255,255,255,0.35)'; ctx.font = '800 8px Manrope, sans-serif';
    ctx.fillText(`${m}×`, x, y + 0.5);
  });

  // SHOOT AGAIN (bola salvada activa)
  const saveOn = s.status === 'play' && s.time < s.ballSaveUntil;
  ctx.fillStyle = saveOn && blink % 2 ? '#3fae6c' : 'rgba(63,174,108,0.14)';
  roundRect(ctx, 168, 552, 64, 15, 7); ctx.fill();
  ctx.fillStyle = saveOn ? '#fff' : 'rgba(255,255,255,0.3)'; ctx.font = '800 7.5px Manrope, sans-serif';
  ctx.fillText('SHOOT AGAIN', 200, 560);

  // flechas hacia el JACKPOT
  const armed = s.saucer.armed;
  for (let i = 0; i < 3; i++) {
    const on = armed ? (blink + i) % 3 === 0 || pulse > 0.7 : false;
    const x = 146 - i * 12, y = 346 - i * 11;
    ctx.fillStyle = on ? '#ffd27a' : 'rgba(255,210,122,0.12)';
    ctx.save(); ctx.translate(x, y); ctx.rotate(-2.4);
    ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(-4, -6); ctx.lineTo(-4, 6); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

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

  // postes de goma en las guías
  for (const [x, y] of [[48, 490], [330, 490]]) {
    ctx.fillStyle = '#e4ecf8'; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.fuego; ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
  }

  // dianas de estrella
  for (const st of s.standups) {
    const cy = (st.ay + st.by) / 2;
    ctx.fillStyle = st.lit ? '#ffd27a' : '#8a6fc2';
    ctx.shadowColor = '#ffd27a'; ctx.shadowBlur = st.lit ? 12 : 0;
    roundRect(ctx, 24, st.ay, 7, st.by - st.ay, 2); ctx.fill();
    ctx.shadowBlur = 0;
    star(ctx, 44, cy, 6, st.lit ? '#ffd27a' : 'rgba(255,210,122,0.18)');
  }

  // hoyo JACKPOT
  {
    const sc = s.saucer;
    const on = sc.armed || s.time < sc.flash;
    ctx.fillStyle = '#05070b';
    ctx.strokeStyle = on ? '#ffd27a' : C.platino; ctx.lineWidth = 2.5;
    ctx.shadowColor = '#ffd27a'; ctx.shadowBlur = on ? 18 * (0.5 + pulse / 2) : 0;
    ctx.beginPath(); ctx.arc(sc.x, sc.y, sc.r + 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = on ? '#ffd27a' : C.acero; ctx.font = '800 7px Manrope, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('JACKPOT', sc.x, sc.y - 22);
  }

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

  // banco M · X · ◆ (pared derecha)
  for (const t of s.bank) {
    const cy = (t.ay + t.by) / 2;
    if (t.up) {
      const gr = ctx.createLinearGradient(0, t.ay, 0, t.by);
      gr.addColorStop(0, '#1a6a8a'); gr.addColorStop(1, '#3fb6e0');
      ctx.fillStyle = gr; roundRect(ctx, 339, t.ay, 12, t.by - t.ay, 3); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '800 8px Manrope, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(t.label, 345, cy + 0.5);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; roundRect(ctx, 347, t.ay, 4, t.by - t.ay, 2); ctx.fill();
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

  // RAMPA elevada (va por encima de todo)
  {
    const rp = s.ramp;
    const lit = s.time < rp.flash || rp.riding;
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const trace = () => { ctx.beginPath(); rp.path.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); };
    // sombra de la rampa sobre la mesa
    ctx.translate(4, 6); trace(); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 24; ctx.stroke(); ctx.translate(-4, -6);
    // rieles (borde plateado) + piso semitransparente
    trace(); ctx.strokeStyle = lit ? '#e4ecf8' : 'rgba(228,236,248,0.8)'; ctx.lineWidth = 24; ctx.stroke();
    trace(); ctx.strokeStyle = 'rgba(14,24,44,0.9)'; ctx.lineWidth = 19; ctx.stroke();
    trace(); ctx.strokeStyle = lit ? 'rgba(124,196,224,0.45)' : 'rgba(192,204,216,0.1)'; ctx.lineWidth = 19; ctx.stroke();
    // flechas dentro de la rampa
    ctx.fillStyle = lit ? '#ffd27a' : 'rgba(255,210,122,0.35)';
    for (let i = 1; i < rp.path.length - 1; i++) {
      const [ax, ay] = rp.path[i], [bx, by] = rp.path[i + 1];
      ctx.save(); ctx.translate((ax + bx) / 2, (ay + by) / 2); ctx.rotate(Math.atan2(by - ay, bx - ax));
      ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-3, -4); ctx.lineTo(-3, 4); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    ctx.restore();
    // boca de entrada
    const en = rp.entry;
    ctx.fillStyle = lit ? '#ffd27a' : 'rgba(255,210,122,0.5)';
    ctx.font = '800 8px Manrope, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('▲ RAMPA', (en.x0 + en.x1) / 2, en.y + 14);
    if (rp.count) { ctx.fillStyle = C.acero; ctx.font = '700 7px Manrope, sans-serif'; ctx.fillText(`${rp.count % 3}/3`, (en.x0 + en.x1) / 2, en.y + 24); }
  }

  // bola
  const b = s.ball;
  const br = s.ramp.riding ? 9.5 : 8;
  if (s.ramp.riding) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.arc(b.x + 4, b.y + 6, 8, 0, Math.PI * 2); ctx.fill(); }
  const bg2 = ctx.createRadialGradient(b.x - 3, b.y - 3, 1, b.x, b.y, br);
  bg2.addColorStop(0, '#ffffff'); bg2.addColorStop(0.5, '#c0ccd8'); bg2.addColorStop(1, '#5a6a80');
  ctx.fillStyle = bg2; ctx.shadowColor = 'rgba(255,255,255,0.6)'; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(b.x, b.y, br, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}

function bulb(ctx, x, y, r, color, on) {
  ctx.fillStyle = color; ctx.shadowColor = '#ffd27a'; ctx.shadowBlur = on ? 8 : 0;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
}

function star(ctx, x, y, r, color) {
  ctx.fillStyle = color; ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a));
  }
  ctx.closePath(); ctx.fill();
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
  const [hud, setHud] = useState({ score: 0, balls: 5, mult: 1, status: 'ready', message: null, speed: 0.9 });
  const [best, setBest] = useState(readBest);
  const [started, setStarted] = useState(false);
  const [ig, setIg] = useState(readIg);
  const [igInput, setIgInput] = useState(readIg);
  const igRef = useRef(ig);
  useEffect(() => { igRef.current = ig; }, [ig]);
  const [submit, setSubmit] = useState(null); // { state: 'sending'|'ok'|'error', code, rank, error, at }
  const [top, setTop] = useState([]);
  const [showTop, setShowTop] = useState(false);
  const refreshTop = () => fetchTop().then(setTop);
  useEffect(() => { refreshTop(); }, []);

  const sendScore = async (score, durationMs) => {
    if (score <= 0) { setSubmit({ state: 'zero' }); return; }
    if (durationMs < 15000) { setSubmit({ state: 'short' }); return; }
    if (!supabase || !igRef.current) return;
    setSubmit({ state: 'sending' });
    const { data, error } = await supabase
      .from('arcade_scores')
      .insert({ ig_user: igRef.current, score, duration_ms: Math.round(durationMs) })
      .select('id')
      .single();
    if (error) {
      const msg = /plausible/.test(error.message) ? 'El puntaje no pasó la validación automática.'
        : /Demasiadas/.test(error.message) ? 'Llegaste al límite de partidas registradas por hora. Intenta más tarde.'
        : 'No pudimos registrar tu puntaje. Revisa tu conexión.';
      setSubmit({ state: 'error', error: msg });
      return;
    }
    const board = await fetchTop(50);
    setTop(board.slice(0, 10));
    const rank = board.findIndex((r) => r.ig_user === igRef.current) + 1;
    setSubmit({ state: 'ok', code: codeFrom(data.id), rank, best: board.find((r) => r.ig_user === igRef.current)?.score, at: new Date() });
  };

  useEffect(() => { document.title = 'Pinball TCB | The Card Box MX'; window.scrollTo(0, 0); }, []);

  // motor + bucle de animación
  useEffect(() => {
    const g = createGame({
      onEvent: (e) => {
        if (e.type === 'over') {
          setBest((prev) => { const nb = Math.max(prev, e.score); saveBest(nb); return nb; });
          sendScore(e.score, g.state.playMs);
        }
      },
    });
    gameRef.current = g;
    if (import.meta.env && import.meta.env.DEV) window.__tcbPinball = g; // solo para pruebas locales
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let scale = 1, raf = 0, last = performance.now(), hudTick = 0;

    const resize = () => {
      const box = wrapRef.current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // alto disponible = lo que queda de pantalla debajo del marcador (sin depender del tamaño actual del canvas)
      const availH = Math.max(320, window.innerHeight - box.top - 12);
      const availW = box.width - 16;
      const sc = Math.min(availW / W, availH / H);
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
        setHud({ score: s.score, balls: s.balls, mult: s.mult, status: s.status, message: s.message, speed: s.speed });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // teclado
    const key = (down) => (e) => {
      if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
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

  const igValid = IG_RE.test(normIg(igInput));
  const restart = () => {
    const v = normIg(igInput);
    if (!IG_RE.test(v)) return;
    setIg(v); saveIg(v); igRef.current = v;
    setSubmit(null);
    gameRef.current?.reset(); setStarted(true);
  };

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
        .marquee { position: relative; background: linear-gradient(180deg, #1a1408, #0b0905); border: 2px solid #6b4f1d;
          box-shadow: 0 0 0 4px #0b0905, 0 0 24px rgba(255,190,90,0.18), inset 0 0 18px rgba(255,190,90,0.12); }
        .marquee::before { content: ''; position: absolute; inset: -9px; border-radius: 22px; pointer-events: none;
          background: radial-gradient(circle, #ffd27a 0 2.2px, transparent 2.6px) 0 0 / 14px 14px;
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude;
          padding: 5px; animation: chase 0.9s steps(2) infinite; opacity: .9; }
        @keyframes chase { 0% { background-position: 0 0; } 100% { background-position: 14px 0; } }
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

      {/* marcador estilo marquesina */}
      <div className="marquee" style={{ margin: '10px auto 4px', padding: '8px 16px 10px', borderRadius: 16, maxWidth: 460, width: 'calc(100% - 20px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', gap: 8 }}>
          <Stat label="PUNTOS" value={fmt(hud.score)} big />
          <Stat label="BOLAS" value={'●'.repeat(Math.max(0, hud.balls)) || '—'} />
          <Stat label="MULT" value={`x${hud.mult}`} />
          <Stat label="VEL" value={hud.speed.toFixed(2)} />
          <Stat label="RÉCORD" value={fmt(Math.max(best, hud.status === 'over' ? hud.score : 0))} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 4, fontSize: 12 }}>
        <button className="arc-nav" style={{ fontSize: 12 }} onClick={() => { refreshTop(); setShowTop(true); }}>🏆 Top del mes</button>
        {ig && <span style={{ color: C.acero }}>Jugando como <b style={{ color: C.platino }}>@{ig}</b>{hud.status !== 'play' && <> · <button className="arc-nav" style={{ fontSize: 12, textDecoration: 'underline' }} onClick={() => { setStarted(false); }}>cambiar</button></>}</span>}
      </div>

      {/* mesa */}
      <div
        ref={wrapRef}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
        onContextMenu={(e) => e.preventDefault()}
        style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', padding: '4px 8px 8px' }}
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
            aria-label="Mantén y suelta para lanzar"
            style={{ position: 'absolute', bottom: 70, right: 10, width: 64, height: 64, borderRadius: '50%', background: 'rgba(224,92,42,0.92)', color: '#fff', fontSize: 11, lineHeight: 1.1, boxShadow: '0 8px 24px rgba(224,92,42,0.45)', border: '2px solid rgba(255,255,255,0.35)' }}
          >
            🚀<br />LANZAR
          </button>
        )}

        {/* pantalla inicial / fin */}
        {(!started || hud.status === 'over') && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(6,6,8,0.78)', backdropFilter: 'blur(4px)', padding: 18, overflowY: 'auto' }}>
            <div style={{ textAlign: 'center', maxWidth: 350, width: '100%' }}>
              <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: 3, color: C.fuego, marginBottom: 8 }}>THE CARD BOX ARCADE</p>
              <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: 40, lineHeight: 1, marginBottom: 12 }}>
                {hud.status === 'over' && started ? 'Fin del juego' : 'Pinball TCB'}
              </h1>

              {hud.status === 'over' && started ? (
                <>
                  {/* comprobante para la captura */}
                  <div style={{ margin: '0 auto 14px', padding: '14px 16px', borderRadius: 16, background: 'linear-gradient(180deg, #1a1408, #0b0905)', border: '2px solid #6b4f1d', textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#ffd27a', fontWeight: 800, letterSpacing: 1.5 }}>
                      <span>COMPROBANTE</span><span>{monthName().toUpperCase()}</span>
                    </div>
                    <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: 34, color: '#fff', margin: '4px 0' }}>{fmt(hud.score)} pts</div>
                    <div style={{ fontSize: 14, color: C.platino, fontWeight: 700 }}>@{ig}</div>
                    {submit?.state === 'sending' && <div style={{ fontSize: 12, color: C.acero, marginTop: 6 }}>Registrando puntaje…</div>}
                    {submit?.state === 'ok' && (
                      <div style={{ fontSize: 12, color: C.acero, marginTop: 6, lineHeight: 1.6 }}>
                        Código: <b style={{ color: '#fff', letterSpacing: 2 }}>{submit.code}</b> · {submit.at.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}<br />
                        {submit.rank > 0 && <>Vas en el lugar <b style={{ color: '#fff' }}>#{submit.rank}</b> del mes{submit.best > hud.score ? ` (tu mejor: ${fmt(submit.best)})` : ''}</>}
                      </div>
                    )}
                    {submit?.state === 'error' && <div style={{ fontSize: 12, color: '#f0a07a', marginTop: 6 }}>{submit.error}</div>}
                    {submit?.state === 'short' && <div style={{ fontSize: 12, color: '#f0a07a', marginTop: 6 }}>La partida duró menos de 15 segundos y no se registra.</div>}
                    {submit?.state === 'zero' && <div style={{ fontSize: 12, color: C.acero, marginTop: 6 }}>Sin puntos esta vez. ¡Otra!</div>}
                    {!supabase && <div style={{ fontSize: 12, color: C.acero, marginTop: 6 }}>(Modo de prueba: el puntaje no se registra)</div>}
                  </div>
                  {submit?.state === 'ok' && <p style={{ fontSize: 13, color: C.platino, lineHeight: 1.55, marginBottom: 12 }}>
                    📸 <b style={{ color: '#fff' }}>Toma captura de esta pantalla</b> y mándala por DM a <b style={{ color: '#fff' }}>@TheCardBoxMX</b> desde tu cuenta @{ig} para validar tu puntaje.
                  </p>}
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
                    {submit?.state === 'ok' && <a className="arc-btn" href={IG_DM} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', textDecoration: 'none', background: 'linear-gradient(90deg,#833ab4,#e1306c,#f77737)', color: '#fff', padding: '12px 20px', fontSize: 14 }}>Mandar DM</a>}
                    <button className="arc-btn" onClick={restart} style={{ background: C.azulAcento, color: '#fff', padding: '12px 22px', fontSize: 14 }}>Jugar otra vez</button>
                  </div>
                  <button className="arc-nav" onClick={() => { refreshTop(); setShowTop(true); }}>🏆 Ver top del mes</button>
                </>
              ) : (
                <>
                  <p style={{ color: C.acero, fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
                    Prende <b style={{ color: '#fff' }}>T·C·B</b> para subir el multiplicador, tumba los sobres <b style={{ color: '#fff' }}>P·A·K</b>, pega a las 3 <b style={{ color: '#ffd27a' }}>★</b> para encender el <b style={{ color: '#ffd27a' }}>JACKPOT</b>, sube la <b style={{ color: '#fff' }}>RAMPA</b> y tumba <b style={{ color: '#7cc4e0' }}>M·X·◆</b>. Tienes 5 bolas.
                  </p>
                  <label style={{ display: 'block', textAlign: 'left', fontSize: 12, fontWeight: 800, color: C.platino, marginBottom: 6 }}>Tu usuario de Instagram</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(16,26,46,0.9)', border: `1px solid ${igInput && !igValid ? '#e05c2a' : 'rgba(192,204,216,0.25)'}`, borderRadius: 12, padding: '0 12px', marginBottom: 6 }}>
                    <span style={{ color: C.acero, fontWeight: 800 }}>@</span>
                    <input
                      value={igInput}
                      onChange={(e) => setIgInput(e.target.value.replace(/\s/g, ''))}
                      onKeyDown={(e) => { if (e.key === 'Enter') restart(); }}
                      placeholder="tu_usuario"
                      autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={31}
                      style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 16, padding: '12px 6px', fontFamily: 'Manrope, sans-serif' }}
                    />
                  </div>
                  <p style={{ fontSize: 11, color: igInput && !igValid ? '#f0a07a' : C.acero, textAlign: 'left', marginBottom: 14 }}>
                    {igInput && !igValid ? 'Solo letras, números, punto y guion bajo.' : 'Lo usamos para registrar tu puntaje y validar premios.'}
                  </p>
                  <button className="arc-btn" onClick={restart} disabled={!igValid} style={{ background: igValid ? C.azulAcento : '#2a3445', color: igValid ? '#fff' : C.acero, padding: '14px 34px', fontSize: 16, cursor: igValid ? 'pointer' : 'not-allowed' }}>
                    Jugar
                  </button>
                  <p style={{ fontSize: 13, color: C.platino, margin: '14px 0 4px' }}>🏆 Top 3 del mes: <b style={{ color: '#fff' }}>15% · 10% · 5%</b> de descuento</p>
                  <p style={{ fontSize: 12, color: '#f0a07a', marginBottom: 8 }}>🚫 Prohibido el uso de cheats: descalifica.</p>
                  <button className="arc-nav" onClick={() => { refreshTop(); setShowTop(true); }}>Ver top del mes y bases →</button>
                  <div style={{ marginTop: 12, fontSize: 12, color: C.acero, lineHeight: 1.9 }}>
                    <p className="only-desktop"><span className="arc-kbd">Z</span> / <span className="arc-kbd">←</span> flipper izq · <span className="arc-kbd">M</span> / <span className="arc-kbd">→</span> flipper der · mantén <span className="arc-kbd">Espacio</span> para lanzar</p>
                    <p className="only-touch">Toca la mitad izquierda o derecha de la pantalla para mover cada flipper. Mantén el botón 🚀 para lanzar.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* top del mes + bases */}
        {showTop && (
          <div onClick={() => setShowTop(false)} style={{ position: 'absolute', inset: 0, zIndex: 5, background: 'rgba(6,6,8,0.85)', display: 'grid', placeItems: 'center', padding: 16, overflowY: 'auto' }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, background: 'linear-gradient(180deg, #121a2c, #0b0f18)', border: '1px solid rgba(192,204,216,0.18)', borderRadius: 20, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 24 }}>🏆 Top de {monthName()}</h2>
                <button className="arc-nav" onClick={() => setShowTop(false)} aria-label="Cerrar">✕</button>
              </div>
              {top.length === 0 ? (
                <p style={{ color: C.acero, fontSize: 14, marginBottom: 14 }}>Todavía no hay puntajes este mes. ¡Sé el primero!</p>
              ) : (
                <ol style={{ listStyle: 'none', marginBottom: 16 }}>
                  {top.map((r, i) => (
                    <li key={r.ig_user} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 4px', borderBottom: '1px solid rgba(192,204,216,0.08)', fontSize: 14 }}>
                      <span>
                        <b style={{ display: 'inline-block', width: 30, color: i < 3 ? '#ffd27a' : C.acero }}>{['🥇', '🥈', '🥉'][i] || `${i + 1}.`}</b>
                        <span style={{ color: r.ig_user === ig ? '#7cc4e0' : '#fff', fontWeight: 700 }}>@{r.ig_user}</span>
                        {r.status === 'validado' && <span title="Validado" style={{ marginLeft: 6, fontSize: 12 }}>✅</span>}
                      </span>
                      <b style={{ fontFamily: 'Fraunces, Georgia, serif' }}>{fmt(r.score)}</b>
                    </li>
                  ))}
                </ol>
              )}
              <details style={{ fontSize: 12.5, color: C.acero, lineHeight: 1.6 }} open>
                <summary style={{ cursor: 'pointer', color: C.platino, fontWeight: 800, marginBottom: 6 }}>Bases del concurso</summary>
                <ul style={{ paddingLeft: 18 }}>
                  <li>Para jugar solo registras tu usuario de Instagram.</li>
                  <li>Cuenta el mejor puntaje de cada jugador en el mes calendario (hora de CDMX). La tabla se reinicia el día 1.</li>
                  <li>Premios: 1er lugar 15%, 2º lugar 10% y 3er lugar 5% de descuento en una compra en The Card Box MX.</li>
                  <li>Para validar tu puntaje manda la captura de la pantalla final (con tu código) por DM a @TheCardBoxMX desde la misma cuenta registrada.</li>
                  <li>Prohibido el uso de cheats, bots, trucos o modificaciones del juego: descalifican al jugador.</li>
                  <li>El equipo de The Card Box revisa el top 3 antes de entregar los premios; su decisión es final.</li>
                </ul>
              </details>
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
