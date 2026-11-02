// Pinball TCB — motor de física propio (sin librerías).
// Coordenadas lógicas: tablero de 400 x 720. La vista escala a la pantalla.

export const W = 400;
export const H = 720;
const R = 8;              // radio de la bola
const G = 1100;           // gravedad (inclinación de la mesa)
const DT = 1 / 480;       // paso fijo de física
const MAX_SPEED = 1800;
const BALLS = 3;
const BALL_SAVE_MS = 5000;

const seg = (ax, ay, bx, by, o = {}) => ({ ax, ay, bx, by, r: 0, e: 0.45, kick: 0, ...o });

function buildTable() {
  const walls = [];
  // Arco superior (centro 200,200 r=180) de izquierda a derecha
  const N = 18;
  let prev = null;
  for (let i = 0; i <= N; i++) {
    const a = Math.PI - (i * Math.PI) / N;
    const p = [200 + 180 * Math.cos(a), 200 - 180 * Math.sin(a)];
    if (prev) walls.push(seg(prev[0], prev[1], p[0], p[1], { e: 0.3 }));
    prev = p;
  }
  walls.push(
    seg(20, 200, 20, 720),                        // pared exterior izquierda (outlane)
    // --- lado izquierdo: inlane + resortera ---
    seg(48, 490, 48, 575, { r: 2 }),              // guía inlane/outlane izq.
    seg(48, 575, 128.4, 613.9, { e: 0.3 }),       // inlane hacia flipper izq.
    seg(70, 480, 106, 580, { kick: 430, id: 'slingL' }), // cara de la resortera izq.
    seg(70, 480, 70, 545),
    seg(70, 545, 106, 580),
    // --- lado derecho ---
    seg(352, 262, 352, 700),                      // pared derecha del campo (y del carril)
    seg(330, 490, 330, 575, { r: 2 }),            // guía inlane/outlane der.
    seg(330, 575, 271.6, 613.9, { e: 0.3 }),      // inlane hacia flipper der.
    seg(310, 480, 294, 580, { kick: 430, id: 'slingR' }), // cara de la resortera der.
    seg(310, 480, 310, 545),
    seg(310, 545, 294, 580),
    // --- carril de lanzamiento ---
    seg(380, 200, 380, 700),
    seg(352, 688, 380, 688, { e: 0.1 }),
    seg(352, 262, 380, 236, { e: 0.3, oneWay: true }), // compuerta de salida
    // guías de los carriles T · C · B
    seg(150, 46, 150, 80, { r: 2 }),
    seg(183, 46, 183, 80, { r: 2 }),
    seg(217, 46, 217, 80, { r: 2 }),
    seg(250, 46, 250, 80, { r: 2 }),
  );

  // dianas de estrella en la pared izquierda (encienden el JACKPOT)
  const standups = [340, 385, 430].map((y) => ({ ...seg(27, y - 13, 27, y + 13, { r: 3, e: 0.5 }), lit: false }));

  // hoyo JACKPOT (atrapa y escupe la bola)
  const saucer = { x: 80, y: 300, r: 12, armed: false, holdUntil: 0, holding: false, flash: 0 };

  const bumpers = [
    { x: 135, y: 250, r: 24, icon: '⚽', flash: 0 },
    { x: 265, y: 250, r: 24, icon: '🏀', flash: 0 },
    { x: 200, y: 330, r: 26, icon: '◆', flash: 0 },
    { x: 200, y: 205, r: 18, icon: '⚾', flash: 0 },
  ];

  const targets = [140, 200, 260].map((cx, i) => ({
    ...seg(cx - 18, 150, cx + 18, 150, { r: 3, e: 0.4 }), up: true, label: ['P', 'A', 'K'][i],
  }));

  const lanes = [
    { x0: 150, x1: 183, label: 'T', lit: false },
    { x0: 183, x1: 217, label: 'C', lit: false },
    { x0: 217, x1: 250, label: 'B', lit: false },
  ];

  const flippers = [
    { side: 'L', px: 125, py: 620, len: 66, rest: 0.5, up: -0.5, a: 0.5, w: 0, r: 7 },
    { side: 'R', px: 275, py: 620, len: 66, rest: Math.PI - 0.5, up: Math.PI + 0.5, a: Math.PI - 0.5, w: 0, r: 7 },
    { side: 'R', px: 344, py: 332, len: 44, rest: Math.PI - 0.2, up: Math.PI + 0.55, a: Math.PI - 0.2, w: 0, r: 5, mini: true },
  ];

  return { walls, bumpers, targets, lanes, flippers, standups, saucer };
}

export function createGame({ onEvent = () => {} } = {}) {
  const t = buildTable();
  const s = {
    ...t,
    ball: { x: 366, y: 688 - R - 1, vx: 0, vy: 0 },
    status: 'ready',        // ready (en lanzador) | play | over
    score: 0,
    balls: BALLS,
    mult: 1,
    plunger: 0,
    ballSaveUntil: 0,
    time: 0,
    message: null,
    messageUntil: 0,
    targetsResetAt: 0,
  };
  const input = { left: false, right: false, plunger: false };
  let prevPlunger = false;
  let acc = 0;

  const say = (text, ms = 1600) => { s.message = text; s.messageUntil = s.time + ms; };
  const add = (pts) => { s.score += pts * s.mult; };

  function placeInLane() {
    s.ball.x = 366; s.ball.y = 688 - R - 1; s.ball.vx = 0; s.ball.vy = 0;
    s.status = 'ready'; s.plunger = 0;
  }

  function reset() {
    s.score = 0; s.balls = BALLS; s.mult = 1; s.time = 0; s.saveUsed = false; s.ballSaveUntil = 0;
    s.lanes.forEach((l) => { l.lit = false; });
    s.targets.forEach((tg) => { tg.up = true; });
    s.standups.forEach((x) => { x.lit = false; });
    s.saucer.armed = false; s.saucer.holding = false;
    s.message = null;
    placeInLane();
    onEvent({ type: 'reset' });
  }

  // --- colisiones ---------------------------------------------------------
  function closest(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const L2 = dx * dx + dy * dy || 1;
    let u = ((px - ax) * dx + (py - ay) * dy) / L2;
    u = Math.max(0, Math.min(1, u));
    return [ax + u * dx, ay + u * dy];
  }

  function collideSeg(b, sg, vpx = 0, vpy = 0) {
    const [cx, cy] = closest(b.x, b.y, sg.ax, sg.ay, sg.bx, sg.by);
    let nx = b.x - cx, ny = b.y - cy;
    const d = Math.hypot(nx, ny);
    const minD = R + (sg.r || 0);
    if (d >= minD || d === 0) return 0;
    nx /= d; ny /= d;
    b.x = cx + nx * minD; b.y = cy + ny * minD;
    const rvx = b.vx - vpx, rvy = b.vy - vpy;
    const vn = rvx * nx + rvy * ny;
    if (vn >= 0) return 0;
    const e = sg.e ?? 0.45;
    b.vx = vpx + rvx - (1 + e) * vn * nx;
    b.vy = vpy + rvy - (1 + e) * vn * ny;
    // fricción tangencial ligera
    b.vx *= 0.995; b.vy *= 0.995;
    return -vn; // fuerza del impacto
  }

  function physicsStep() {
    const b = s.ball;
    const dt = DT;

    // flippers
    for (const f of s.flippers) {
      const pressed = f.side === 'L' ? input.left : input.right;
      const target = pressed ? f.up : f.rest;
      const dir = Math.sign(target - f.a);
      const speed = 22; // rad/s
      if (Math.abs(target - f.a) < speed * dt) { f.w = 0; f.a = target; }
      else { f.w = dir * speed; f.a += f.w * dt; }
    }

    if (s.status === 'over') return;

    // lanzador
    const inShooter = b.x > 352 && b.y > 600;
    if (s.status === 'ready') {
      if (input.plunger) s.plunger = Math.min(1, s.plunger + dt * 1.1);
      if (!input.plunger && prevPlunger && inShooter) {
        b.vy = -(950 + 900 * s.plunger);
        s.status = 'play';
        if (!s.saveUsed) s.ballSaveUntil = s.time + BALL_SAVE_MS; // una sola vez por bola
        s.plunger = 0;
        onEvent({ type: 'launch' });
      }
      prevPlunger = input.plunger;
      if (s.status === 'ready') { b.vx = 0; b.vy = 0; b.x = 366; b.y = 688 - R - 1; return; }
    }
    prevPlunger = input.plunger;

    // hoyo JACKPOT: mientras sostiene la bola, no hay física
    const sc = s.saucer;
    if (sc.holding) {
      b.x = sc.x; b.y = sc.y; b.vx = 0; b.vy = 0;
      if (s.time >= sc.holdUntil) {
        sc.holding = false;
        b.vx = 260 + Math.random() * 80; b.vy = 180; b.x = sc.x + sc.r + R + 2; b.y = sc.y + 4;
        onEvent({ type: 'kickout' });
      }
      return;
    }

    // integración
    b.vy += G * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // paredes
    for (const w of s.walls) {
      if (w.oneWay && b.vy < 0) continue;
      const hit = collideSeg(b, w);
      if (hit && w.kick && hit > 120) {
        const dx = w.bx - w.ax, dy = w.by - w.ay;
        let nx = -dy, ny = dx; const L = Math.hypot(nx, ny); nx /= L; ny /= L;
        if ((b.x - w.ax) * nx + (b.y - w.ay) * ny < 0) { nx = -nx; ny = -ny; }
        b.vx += nx * w.kick; b.vy += ny * w.kick;
        add(10);
        onEvent({ type: 'sling' });
      }
    }

    // dianas de estrella
    for (const st of s.standups) {
      const hit = collideSeg(b, st);
      if (hit > 60 && !st.lit) {
        st.lit = true; add(150); onEvent({ type: 'star' });
        if (s.standups.every((x) => x.lit) && !sc.armed) {
          sc.armed = true; say('¡JACKPOT ENCENDIDO!'); onEvent({ type: 'armed' });
        }
      } else if (hit > 60) add(20);
    }

    // entrada al hoyo JACKPOT
    {
      const d = Math.hypot(b.x - sc.x, b.y - sc.y);
      if (d < sc.r - 2 && Math.hypot(b.vx, b.vy) < 1300 && s.time > (sc.cooldown || 0)) {
        sc.holding = true; sc.holdUntil = s.time + 1100; sc.cooldown = s.time + 1800; sc.flash = s.time + 1100;
        if (sc.armed) {
          add(5000); say(`¡JACKPOT! +${(5000 * s.mult).toLocaleString('es-MX')}`);
          sc.armed = false; s.standups.forEach((x) => { x.lit = false; });
          onEvent({ type: 'jackpot' });
        } else { add(500); say('CAJA +500'); onEvent({ type: 'saucer' }); }
        b.x = sc.x; b.y = sc.y; b.vx = 0; b.vy = 0;
        return;
      }
    }

    // dianas (sobres)
    for (const tg of s.targets) {
      if (!tg.up) continue;
      const hit = collideSeg(b, tg);
      if (hit > 40) {
        tg.up = false; add(250); onEvent({ type: 'target' });
        if (s.targets.every((x) => !x.up)) {
          add(1500); say('¡PACK ABIERTO! +1500'); s.targetsResetAt = s.time + 1200;
          onEvent({ type: 'pack' });
        }
      }
    }
    if (s.lanesResetAt && s.time >= s.lanesResetAt) {
      s.lanes.forEach((x) => { x.lit = false; }); s.lanesResetAt = 0;
    }
    if (s.targetsResetAt && s.time >= s.targetsResetAt) {
      s.targets.forEach((x) => { x.up = true; }); s.targetsResetAt = 0;
    }

    // bumpers
    for (const bp of s.bumpers) {
      const dx = b.x - bp.x, dy = b.y - bp.y;
      const d = Math.hypot(dx, dy);
      const minD = R + bp.r;
      if (d < minD && d > 0) {
        const nx = dx / d, ny = dy / d;
        b.x = bp.x + nx * minD; b.y = bp.y + ny * minD;
        const sp = Math.max(720, Math.hypot(b.vx, b.vy) * 0.85);
        b.vx = nx * sp; b.vy = ny * sp;
        bp.flash = s.time + 120;
        add(100); onEvent({ type: 'bumper' });
      }
    }

    // flippers (cápsulas que se mueven)
    for (const f of s.flippers) {
      const tx = f.px + Math.cos(f.a) * f.len, ty = f.py + Math.sin(f.a) * f.len;
      const [cx, cy] = closest(b.x, b.y, f.px, f.py, tx, ty);
      const rx = cx - f.px, ry = cy - f.py;
      const vpx = -f.w * ry, vpy = f.w * rx;
      collideSeg(b, { ax: f.px, ay: f.py, bx: tx, by: ty, r: f.r, e: 0.25 }, vpx, vpy);
    }

    // carriles T C B
    if (b.vy > 0 && b.y > 62 && b.y - b.vy * dt <= 62) {
      for (const l of s.lanes) {
        if (b.x > l.x0 && b.x < l.x1 && !l.lit) {
          l.lit = true; add(50); onEvent({ type: 'lane' });
          if (s.lanes.every((x) => x.lit)) {
            s.mult = Math.min(5, s.mult + 1);
            say(`MULTIPLICADOR x${s.mult}`);
            s.lanesResetAt = s.time + 600;
            onEvent({ type: 'mult', mult: s.mult });
          }
        }
      }
    }

    // si la bola regresa al carril del lanzador y se detiene, se puede volver a lanzar
    if (b.x > 352 && b.y > 660 && Math.abs(b.vy) < 30 && Math.abs(b.vx) < 30) {
      placeInLane(); return;
    }

    // límite de velocidad
    const sp = Math.hypot(b.vx, b.vy);
    if (sp > MAX_SPEED) { b.vx *= MAX_SPEED / sp; b.vy *= MAX_SPEED / sp; }

    // red de seguridad contra "túneles" a través de las paredes laterales
    if (b.x < 20 + R && b.y > 200 && b.y < 470) { b.x = 20 + R; b.vx = Math.abs(b.vx) * 0.5; }
    if (b.x > 380 - R) { b.x = 380 - R; b.vx = -Math.abs(b.vx) * 0.5; }

    // seguridad: si algo raro la saca del tablero, regrésala al lanzador
    if (!Number.isFinite(b.x) || !Number.isFinite(b.y) || b.x < 0 || b.x > W || b.y < -40) {
      placeInLane(); return;
    }

    // se fue por el drenaje
    if (b.y > H + 20) {
      if (s.time < s.ballSaveUntil) {
        s.ballSaveUntil = 0; s.saveUsed = true;
        say('¡BOLA SALVADA!'); placeInLane(); onEvent({ type: 'save' });
      } else {
        s.balls -= 1;
        onEvent({ type: 'drain', balls: s.balls });
        if (s.balls <= 0) { s.status = 'over'; onEvent({ type: 'over', score: s.score }); }
        else { s.saveUsed = false; say(`Bola ${BALLS - s.balls + 1} de ${BALLS}`); placeInLane(); }
      }
    }
  }

  function update(seconds) {
    acc += Math.min(seconds, 0.05);
    while (acc >= DT) { physicsStep(); s.time += DT * 1000; acc -= DT; }
    if (s.message && s.time > s.messageUntil) s.message = null;
  }

  return { state: s, input, update, reset, constants: { R, W, H, BALLS } };
}
