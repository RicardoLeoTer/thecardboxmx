// Detecta la carta (o slab / caja) dentro de una foto y calcula el recorte
// para quitar la mesa o el playmat. Trabaja sobre una versión chica de la foto
// ({ data: RGBA, width, height }) y regresa la caja en proporciones 0–1.
//
// Idea: el fondo es lo que toca los bordes de la foto. Se modela con k-means
// sobre el marco exterior, se mide qué tan distinto es cada pixel de ese fondo,
// se umbraliza (Otsu), se limpia y se toma la mancha conectada más grande.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

function kmeans(points, k, iters = 8) {
  const n = points.length / 3
  const cent = []
  for (let c = 0; c < k; c++) {
    const i = Math.floor(((c + 0.5) / k) * n) * 3
    cent.push([points[i], points[i + 1], points[i + 2]])
  }
  const sum = new Float64Array(k * 4)
  for (let it = 0; it < iters; it++) {
    sum.fill(0)
    for (let i = 0; i < n; i++) {
      const r = points[i * 3], g = points[i * 3 + 1], b = points[i * 3 + 2]
      let best = 0, bd = Infinity
      for (let c = 0; c < k; c++) {
        const d = (r - cent[c][0]) ** 2 + (g - cent[c][1]) ** 2 + (b - cent[c][2]) ** 2
        if (d < bd) { bd = d; best = c }
      }
      sum[best * 4] += r; sum[best * 4 + 1] += g; sum[best * 4 + 2] += b; sum[best * 4 + 3]++
    }
    for (let c = 0; c < k; c++) {
      const m = sum[c * 4 + 3]
      if (m) cent[c] = [sum[c * 4] / m, sum[c * 4 + 1] / m, sum[c * 4 + 2] / m]
    }
  }
  return cent
}

function otsu(values, bins = 128) {
  let max = 0
  for (const v of values) if (v > max) max = v
  if (!max) return 0
  const hist = new Float64Array(bins)
  for (const v of values) hist[Math.min(bins - 1, Math.floor((v / max) * bins))]++
  const total = values.length
  let sumAll = 0
  for (let i = 0; i < bins; i++) sumAll += i * hist[i]
  let wB = 0, sumB = 0, best = 0, th = 0
  for (let i = 0; i < bins; i++) {
    wB += hist[i]
    if (!wB) continue
    const wF = total - wB
    if (!wF) break
    sumB += i * hist[i]
    const mB = sumB / wB, mF = (sumAll - sumB) / wF
    const between = wB * wF * (mB - mF) ** 2
    if (between > best) { best = between; th = i }
  }
  return ((th + 0.5) / bins) * max
}

function morph(mask, w, h, r, dilate) {
  // dilatación/erosión cuadrada separable
  const tmp = new Uint8Array(w * h)
  const out = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = dilate ? 0 : 1
      for (let dx = -r; dx <= r; dx++) {
        const xx = x + dx
        const m = xx < 0 || xx >= w ? (dilate ? 0 : 1) : mask[y * w + xx]
        if (dilate ? m : !m) { v = dilate ? 1 : 0; break }
      }
      tmp[y * w + x] = v
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = dilate ? 0 : 1
      for (let dy = -r; dy <= r; dy++) {
        const yy = y + dy
        const m = yy < 0 || yy >= h ? (dilate ? 0 : 1) : tmp[yy * w + x]
        if (dilate ? m : !m) { v = dilate ? 1 : 0; break }
      }
      out[y * w + x] = v
    }
  }
  return out
}

function largestComponent(mask, w, h) {
  const label = new Int32Array(w * h)
  const stack = new Int32Array(w * h)
  let best = null, cur = 0
  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || label[s]) continue
    cur++
    let top = 0, count = 0, x0 = w, y0 = h, x1 = 0, y1 = 0
    stack[top++] = s; label[s] = cur
    while (top) {
      const p = stack[--top]
      const x = p % w, y = (p - x) / w
      count++
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y
      const nb = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]
      for (const q of nb) if (q >= 0 && mask[q] && !label[q]) { label[q] = cur; stack[top++] = q }
    }
    if (!best || count > best.count) best = { id: cur, count, x0, y0, x1, y1 }
  }
  return best && { ...best, label }
}

function detectByRing(img) {
  const { data, width: w, height: h } = img
  // 1) modelo del fondo: marco exterior del 4%
  const ring = Math.max(2, Math.round(Math.min(w, h) * 0.04))
  const pts = []
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x >= ring && x < w - ring && y >= ring && y < h - ring) continue
      const i = (y * w + x) * 4
      pts.push(data[i], data[i + 1], data[i + 2])
    }
  }
  const bg = kmeans(pts, 3)

  // 2) distancia de cada pixel al color de fondo más cercano (suavizada 3x3)
  const raw = new Float32Array(w * h)
  for (let p = 0; p < w * h; p++) {
    const r = data[p * 4], g = data[p * 4 + 1], b = data[p * 4 + 2]
    let d = Infinity
    for (const c of bg) d = Math.min(d, (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2)
    raw[p] = Math.sqrt(d)
  }
  const dist = new Float32Array(w * h)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0, n = 0
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy
      if (xx >= 0 && xx < w && yy >= 0 && yy < h) { s += raw[yy * w + xx]; n++ }
    }
    dist[y * w + x] = s / n
  }

  // 3) umbral: Otsu, con un mínimo para no tomar textura del playmat
  const th = Math.max(otsu(dist), 28)
  let mask = new Uint8Array(w * h)
  for (let p = 0; p < w * h; p++) mask[p] = dist[p] > th ? 1 : 0

  // 4) limpiar: cerrar huecos (zonas de la carta parecidas al fondo) y quitar ruido
  const r = Math.max(1, Math.round(Math.min(w, h) * 0.012))
  mask = morph(morph(mask, w, h, r * 2, true), w, h, r * 2, false) // cierre
  mask = morph(morph(mask, w, h, r, false), w, h, r, true) // apertura

  const comp = largestComponent(mask, w, h)
  if (!comp) return { ok: false, reason: 'No se encontró la carta' }

  // 5) caja robusta: recorta filas/columnas con muy poca carta (puntas de ruido)
  const rows = new Int32Array(h), cols = new Int32Array(w)
  for (let y = comp.y0; y <= comp.y1; y++) for (let x = comp.x0; x <= comp.x1; x++) {
    if (comp.label[y * w + x] === comp.id) { rows[y]++; cols[x]++ }
  }
  const trim = (arr, a, b) => {
    let m = 0
    for (let i = a; i <= b; i++) m = Math.max(m, arr[i])
    const lim = m * 0.04
    while (a < b && arr[a] < lim) a++
    while (b > a && arr[b] < lim) b--
    return [a, b]
  }
  const [x0, x1] = trim(cols, comp.x0, comp.x1)
  const [y0, y1] = trim(rows, comp.y0, comp.y1)

  const bw = x1 - x0 + 1, bh = y1 - y0 + 1
  const areaFrac = (bw * bh) / (w * h)
  // relleno contando los huecos interiores (arte de la carta parecido al fondo)
  const outside = new Uint8Array(w * h)
  const st = []
  const push = (q) => { if (!outside[q] && comp.label[q] !== comp.id) { outside[q] = 1; st.push(q) } }
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x) }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1) }
  while (st.length) {
    const q = st.pop(), x = q % w, y = (q - x) / w
    if (x > 0) push(q - 1); if (x < w - 1) push(q + 1); if (y > 0) push(q - w); if (y < h - 1) push(q + w)
  }
  let solid = 0
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!outside[y * w + x]) solid++
  const fill = solid / (bw * bh)
  const ratio = Math.min(bw, bh) / Math.max(bw, bh)
  const touches = [x0 <= 1, y0 <= 1, x1 >= w - 2, y1 >= h - 2].filter(Boolean).length

  // margen pequeño para no comerse el borde de la carta
  const mx = bw * 0.03, my = bh * 0.03
  const box = {
    x: clamp((x0 - mx) / w, 0, 1),
    y: clamp((y0 - my) / h, 0, 1),
    w: clamp((bw + 2 * mx) / w, 0, 1),
    h: clamp((bh + 2 * my) / h, 0, 1),
  }
  box.w = Math.min(box.w, 1 - box.x)
  box.h = Math.min(box.h, 1 - box.y)

  // fotos que ya vienen recortadas a la carta (proporción 63×88 ≈ 0.716): no tocarlas
  const imgRatio = Math.min(w, h) / Math.max(w, h)
  const alreadyCropped = imgRatio > 0.69 && imgRatio < 0.735

  let ok = true, reason = ''
  if (alreadyCropped) { ok = false; reason = 'Ya está recortada' }
  else if (areaFrac > 0.93) { ok = false; reason = 'Ya está bien encuadrada' }
  else if (areaFrac < 0.12) { ok = false; reason = 'No se detectó bien la carta' }
  else if (fill < 0.72) { ok = false; reason = 'No se detectó bien la carta' }
  else if (ratio < 0.5) { ok = false; reason = 'Forma rara, revisar a mano' }
  else if (touches >= 3) { ok = false; reason = 'La carta toca los bordes de la foto' }

  return { ok, reason, box, confidence: { areaFrac, fill, ratio } }
}

// Nitidez (unsharp mask) sobre ImageData en el navegador o en Node.
export function sharpen(img, amount = 0.55, radius = 1) {
  const { data, width: w, height: h } = img
  const src = new Uint8ClampedArray(data)
  const blur = new Float32Array(w * h * 3)
  const tmp = new Float32Array(w * h * 3)
  const k = 2 * radius + 1
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let c = 0; c < 3; c++) {
    let s = 0
    for (let d = -radius; d <= radius; d++) s += src[(y * w + clamp(x + d, 0, w - 1)) * 4 + c]
    tmp[(y * w + x) * 3 + c] = s / k
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let c = 0; c < 3; c++) {
    let s = 0
    for (let d = -radius; d <= radius; d++) s += tmp[(clamp(y + d, 0, h - 1) * w + x) * 3 + c]
    blur[(y * w + x) * 3 + c] = s / k
  }
  for (let p = 0; p < w * h; p++) for (let c = 0; c < 3; c++) {
    const v = src[p * 4 + c]
    data[p * 4 + c] = clamp(Math.round(v + amount * (v - blur[p * 3 + c])), 0, 255)
  }
  return img
}

// Para fotos donde la carta llena casi todo el cuadro (lo normal con el cel):
// en cada lado se busca, desde la orilla hacia adentro, la primera línea recta
// fuerte (borde de la mica o de la carta). Si no hay una línea clara, ese lado
// no se recorta, así nunca se corta el borde gris de las Pokémon.
function detectByEdges(img) {
  const { data, width: w, height: h } = img
  const g = new Float32Array(w * h)
  for (let p = 0; p < w * h; p++) g[p] = 0.299 * data[p * 4] + 0.587 * data[p * 4 + 1] + 0.114 * data[p * 4 + 2]
  // color (para no depender solo de brillo: café vs gris)
  const col = (p) => [data[p * 4], data[p * 4 + 1], data[p * 4 + 2]]
  const diff = (a, b) => { const x = col(a), y = col(b); return Math.abs(x[0] - y[0]) + Math.abs(x[1] - y[1]) + Math.abs(x[2] - y[2]) }

  const side = (horizontal, fromStart) => {
    // horizontal=true -> buscamos filas (lado de arriba/abajo)
    const n = horizontal ? h : w, span = horizontal ? w : h
    const a = Math.round(span * 0.2), b = Math.round(span * 0.8)
    const maxDepth = Math.round(n * 0.25)
    const prof = new Float32Array(maxDepth)
    for (let d = 1; d < maxDepth - 1; d++) {
      const i0 = fromStart ? d - 1 : n - d, i1 = fromStart ? d + 1 : n - d - 2
      let sum = 0
      for (let t = a; t < b; t++) {
        const p0 = horizontal ? i0 * w + t : t * w + i0
        const p1 = horizontal ? i1 * w + t : t * w + i1
        sum += diff(p0, p1)
      }
      prof[d] = sum / (b - a)
    }
    // umbral relativo al fondo (las primeras líneas), no al máximo: lo de adentro
    // de la carta suele tener bordes más fuertes que la orilla y no queremos llegar ahí
    const base = [prof[1], prof[2], prof[3], prof[4]].sort((x, y) => x - y)[1]
    const th = Math.max(base * 2.2, base + 25, 35)
    const cap = Math.round(n * 0.14) // nunca recortar más de 14% de un lado
    let d = 2
    while (d < cap && prof[d] < th) d++
    if (d >= cap) return 0 // no hay una línea clara cerca de la orilla
    // retrocede al inicio del escalón (máx. 3 px)
    for (let k = 0; k < 3 && d > 1 && prof[d - 1] > th * 0.8; k++) d--
    return Math.max(0, d - 1)
  }

  const top = side(true, true), bottom = side(true, false)
  const left = side(false, true), right = side(false, false)
  const x0 = left, x1 = w - right, y0 = top, y1 = h - bottom
  const bw = x1 - x0, bh = y1 - y0
  const mx = bw * 0.006, my = bh * 0.006
  const box = {
    x: clamp((x0 - mx) / w, 0, 1), y: clamp((y0 - my) / h, 0, 1),
    w: clamp((bw + 2 * mx) / w, 0, 1), h: clamp((bh + 2 * my) / h, 0, 1),
  }
  box.w = Math.min(box.w, 1 - box.x); box.h = Math.min(box.h, 1 - box.y)
  const areaFrac = box.w * box.h
  const ratio = Math.min(bw, bh) / Math.max(bw, bh)
  let ok = true, reason = ''
  if (areaFrac > 0.99) { ok = false; reason = 'Ya está bien encuadrada' }
  else if (areaFrac < 0.5 || ratio < 0.6 || ratio > 0.86) { ok = false; reason = 'No se detectó bien la carta' }
  return { ok, reason, box, confidence: { areaFrac, ratio, sides: { top, bottom, left, right } } }
}

export function detectCard(img) {
  const ring = detectByRing(img)
  // con mucho fondo alrededor funciona mejor el método del marco
  if (ring.ok && ring.confidence.areaFrac < 0.8) return ring
  if (ring.reason === 'Ya está recortada') return ring
  // el método de orillas solo para fotos con proporción de cámara (3:4, 2:3 o 9:16):
  // si la foto ya fue recortada a mano, no la tocamos
  const r = Math.min(img.width, img.height) / Math.max(img.width, img.height)
  const cameraShot = [0.75, 0.6667, 0.5625].some((c) => Math.abs(r - c) < 0.002)
  if (!cameraShot) return ring
  const edges = detectByEdges(img)
  if (edges.ok) return edges
  return ring.ok ? ring : { ...ring, edges }
}
