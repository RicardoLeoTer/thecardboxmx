import { useCallback, useEffect, useRef, useState } from 'react'
import { detectByEdges, detectByRing, sharpen } from '../lib/cardCrop'

// Cámara con guía: muestra la silueta de la carta, avisa cuando la carta está
// alineada (las 4 orillas coinciden con la guía), puede disparar sola y guarda
// solo la carta: recorte a la guía + ajuste fino a las orillas + nitidez.

const MODES = {
  carta: { label: 'Carta', ratio: 63 / 88 },
  slab: { label: 'Gradeada', ratio: 0.62 },
  libre: { label: 'Caja / libre', ratio: null },
}
const PAD = 0.05 // margen extra alrededor de la guía al capturar (luego se ajusta)
const HOLD_MS = 1200 // tiempo alineada antes de disparar sola

function guideRect(vw, vh, ratio) {
  // rectángulo de la guía en pixeles de pantalla
  if (!ratio) {
    const w = vw * 0.88, h = vh * 0.62
    return { x: (vw - w) / 2, y: (vh - h) / 2 - vh * 0.04, w, h }
  }
  let w = vw * 0.8
  let h = w / ratio
  if (h > vh * 0.66) { h = vh * 0.66; w = h * ratio }
  return { x: (vw - w) / 2, y: (vh - h) / 2 - vh * 0.04, w, h }
}

// convierte un rectángulo de pantalla a pixeles del video (object-fit: cover)
function toVideo(rect, video, box) {
  const vw = video.videoWidth, vh = video.videoHeight
  const s = Math.max(box.width / vw, box.height / vh)
  const ox = (box.width - vw * s) / 2, oy = (box.height - vh * s) / 2
  const x = (rect.x - ox) / s, y = (rect.y - oy) / s
  return { x, y, w: rect.w / s, h: rect.h / s }
}

function clampRect(r, W, H) {
  const x = Math.max(0, r.x), y = Math.max(0, r.y)
  return { x, y, w: Math.min(W - x, r.w - (x - r.x)), h: Math.min(H - y, r.h - (y - r.y)) }
}

// fuerza de la orilla a lo largo de cada lado de la guía (diferencia de color afuera vs adentro)
function sideStrength(img, inset) {
  const { data, width: w, height: h } = img
  const px = (x, y) => (Math.round(y) * w + Math.round(x)) * 4
  const diff = (a, b) => Math.abs(data[a] - data[b]) + Math.abs(data[a + 1] - data[b + 1]) + Math.abs(data[a + 2] - data[b + 2])
  const gx0 = inset * w, gx1 = w - inset * w, gy0 = inset * h, gy1 = h - inset * h
  const tol = Math.max(3, Math.round(Math.min(w, h) * 0.035)) // la orilla puede estar un poco adentro o afuera
  const k = 3
  const best = (pointsAt) => {
    let m = 0
    for (let o = -tol; o <= tol; o++) {
      let s = 0, n = 0
      for (const [a, b] of pointsAt(o)) { s += diff(a, b); n++ }
      m = Math.max(m, s / n)
    }
    return m
  }
  const samples = (a, b, f) => { const out = []; for (let t = 0.2; t <= 0.8; t += 0.04) out.push(f(a + (b - a) * t)); return out }
  const top = best((o) => samples(gx0, gx1, (x) => [px(x, gy0 + o - k), px(x, gy0 + o + k)]))
  const bottom = best((o) => samples(gx0, gx1, (x) => [px(x, gy1 + o - k), px(x, gy1 + o + k)]))
  const left = best((o) => samples(gy0, gy1, (y) => [px(gx0 + o - k, y), px(gx0 + o + k, y)]))
  const right = best((o) => samples(gy0, gy1, (y) => [px(gx1 + o - k, y), px(gx1 + o + k, y)]))
  return { top, bottom, left, right }
}

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null)
  const boxRef = useRef(null)
  const streamRef = useRef(null)
  const alignedSince = useRef(0)
  const busyRef = useRef(false)
  const [mode, setMode] = useState('carta')
  const [auto, setAuto] = useState(true)
  const [error, setError] = useState('')
  const [sides, setSides] = useState({ top: false, bottom: false, left: false, right: false })
  const [progress, setProgress] = useState(0)
  const [shot, setShot] = useState(null) // { file, url }
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [count, setCount] = useState(0)

  const ratio = MODES[mode].ratio
  const guide = guideRect(size.w, size.h, ratio)

  // cámara de atrás
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 3840 }, height: { ideal: 2160 } },
        })
        if (cancelled) return stream.getTracks().forEach((t) => t.stop())
        streamRef.current = stream
        const v = videoRef.current
        v.srcObject = stream
        await v.play().catch(() => {})
        // enfoque continuo si el cel lo permite
        const track = stream.getVideoTracks()[0]
        const caps = track.getCapabilities?.() ?? {}
        if (caps.focusMode?.includes('continuous')) track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {})
      } catch (e) {
        setError(e?.name === 'NotAllowedError'
          ? 'No hay permiso para usar la cámara. Actívalo en los ajustes del navegador.'
          : 'No se pudo abrir la cámara en este dispositivo.')
      }
    })()
    return () => { cancelled = true; streamRef.current?.getTracks().forEach((t) => t.stop()) }
  }, [])

  useEffect(() => {
    const measure = () => {
      const b = boxRef.current?.getBoundingClientRect()
      if (b) setSize({ w: b.width, h: b.height })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const grab = useCallback((maxSide) => {
    // recorta del video la zona de la guía + margen
    const v = videoRef.current, box = boxRef.current?.getBoundingClientRect()
    if (!v?.videoWidth || !box) return null
    const g = guideRect(box.width, box.height, ratio)
    const padded = { x: g.x - g.w * PAD, y: g.y - g.h * PAD, w: g.w * (1 + 2 * PAD), h: g.h * (1 + 2 * PAD) }
    const r = clampRect(toVideo(padded, v, box), v.videoWidth, v.videoHeight)
    const k = maxSide ? Math.min(1, maxSide / Math.max(r.w, r.h)) : 1
    const c = document.createElement('canvas')
    c.width = Math.round(r.w * k); c.height = Math.round(r.h * k)
    const ctx = c.getContext('2d', { willReadFrequently: true })
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(v, r.x, r.y, r.w, r.h, 0, 0, c.width, c.height)
    return { canvas: c, ctx }
  }, [ratio])

  const capture = useCallback(async () => {
    if (busyRef.current) return
    busyRef.current = true
    try {
      const full = grab(2000)
      if (!full) return
      const { canvas, ctx } = full
      let out = canvas
      // ajuste fino a las orillas reales de la carta
      const small = document.createElement('canvas')
      const s = Math.min(1, 360 / Math.max(canvas.width, canvas.height))
      small.width = Math.round(canvas.width * s); small.height = Math.round(canvas.height * s)
      const sctx = small.getContext('2d', { willReadFrequently: true })
      sctx.drawImage(canvas, 0, 0, small.width, small.height)
      const det = detectByEdges(sctx.getImageData(0, 0, small.width, small.height))
      let b = { x: PAD / (1 + 2 * PAD), y: PAD / (1 + 2 * PAD), w: 1 / (1 + 2 * PAD), h: 1 / (1 + 2 * PAD) } // la guía
      if (det.ok && det.box.w * det.box.h > 0.7) b = det.box
      else {
        // la carta quedó más chica que la guía: buscarla con el fondo alrededor
        const ring = detectByRing(sctx.getImageData(0, 0, small.width, small.height), { allowCardRatio: true })
        if (ring.ok) b = ring.box
      }
      // margen mínimo para no comerse la orilla
      const m = 0.008
      b = { x: Math.max(0, b.x - m), y: Math.max(0, b.y - m), w: Math.min(1, b.w + 2 * m), h: Math.min(1, b.h + 2 * m) }
      b.w = Math.min(b.w, 1 - b.x); b.h = Math.min(b.h, 1 - b.y)
      const c2 = document.createElement('canvas')
      c2.width = Math.round(b.w * canvas.width); c2.height = Math.round(b.h * canvas.height)
      const ctx2 = c2.getContext('2d', { willReadFrequently: true })
      ctx2.drawImage(canvas, b.x * canvas.width, b.y * canvas.height, c2.width, c2.height, 0, 0, c2.width, c2.height)
      out = c2
      void ctx
      const img = ctx2.getImageData(0, 0, out.width, out.height)
      sharpen(img, 0.5, 1)
      ctx2.putImageData(img, 0, 0)
      const blob = await new Promise((r) => out.toBlob(r, 'image/jpeg', 0.9))
      const file = new File([blob], `camara-${Date.now()}.jpg`, { type: 'image/jpeg' })
      navigator.vibrate?.(40)
      setShot({ file, url: URL.createObjectURL(blob) })
    } finally {
      busyRef.current = false
      alignedSince.current = 0
      setProgress(0)
    }
  }, [grab])

  // revisión en vivo de la alineación (~4 veces por segundo)
  useEffect(() => {
    if (shot || error) return
    const id = setInterval(() => {
      const g = grab(320)
      if (!g) return
      const img = g.ctx.getImageData(0, 0, g.canvas.width, g.canvas.height)
      const st = sideStrength(img, PAD / (1 + 2 * PAD))
      const th = 55
      const ok = { top: st.top > th, bottom: st.bottom > th, left: st.left > th, right: st.right > th }
      setSides(ok)
      const all = ok.top && ok.bottom && ok.left && ok.right
      const now = performance.now()
      if (all) {
        if (!alignedSince.current) alignedSince.current = now
        const p = Math.min(1, (now - alignedSince.current) / HOLD_MS)
        setProgress(p)
        if (auto && p >= 1) capture()
      } else {
        alignedSince.current = 0
        setProgress(0)
      }
    }, 250)
    return () => clearInterval(id)
  }, [grab, capture, auto, shot, error])

  const use = (again) => {
    onCapture(shot.file)
    setCount((n) => n + 1)
    setShot(null)
    if (!again) onClose()
  }

  const allOk = sides.top && sides.bottom && sides.left && sides.right
  const color = allOk ? '#22c55e' : '#ffffff'
  const edge = (on) => (on ? '#22c55e' : 'rgba(255,255,255,0.85)')

  return (
    <div className="cam-wrap">
      <div className="cam-view" ref={boxRef}>
        <video ref={videoRef} playsInline muted autoPlay className="cam-video" />
        {!shot && !error && size.w > 0 && (
          <div className="cam-guide" style={{
            left: guide.x, top: guide.y, width: guide.w, height: guide.h,
            borderRadius: mode === 'libre' ? 10 : guide.w * 0.05,
            borderTopColor: edge(sides.top), borderBottomColor: edge(sides.bottom),
            borderLeftColor: edge(sides.left), borderRightColor: edge(sides.right),
          }}>
            {progress > 0 && <div className="cam-progress" style={{ width: `${progress * 100}%`, background: color }} />}
          </div>
        )}
        {!shot && !error && (
          <p className="cam-hint">
            {allOk ? (auto ? 'Quieto… tomando foto' : 'Alineada: toma la foto') : 'Acomoda la carta dentro de la guía'}
          </p>
        )}
        {error && <div className="cam-error"><p>{error}</p><button className="btn" onClick={onClose}>Cerrar</button></div>}
        {shot && (
          <div className="cam-review">
            <img src={shot.url} alt="Foto tomada" />
          </div>
        )}
      </div>

      <div className="cam-bar">
        {shot ? (
          <>
            <button className="btn ghost cam-light" onClick={() => setShot(null)}>Repetir</button>
            <button className="btn ghost cam-light" onClick={() => use(true)}>Usar y otra</button>
            <button className="btn primary" onClick={() => use(false)}>Usar foto</button>
          </>
        ) : (
          <>
            <div className="cam-modes">
              {Object.entries(MODES).map(([k, m]) => (
                <button key={k} className={`cam-mode${mode === k ? ' on' : ''}`} onClick={() => setMode(k)}>{m.label}</button>
              ))}
            </div>
            <div className="cam-row">
              <button className="btn ghost cam-light" onClick={onClose}>{count ? `Listo (${count})` : 'Cerrar'}</button>
              <button className="cam-shutter" aria-label="Tomar foto" onClick={capture} disabled={!!error} />
              <label className="cam-auto"><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Auto</label>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
