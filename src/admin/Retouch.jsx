import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { IMAGES_BUCKET, supabase } from '../lib/supabase'
import { detectCard, sharpen } from '../lib/cardCrop'

// Admin → Portadas → Retocar fotos
// Recorta la mesa / playmat alrededor de la carta, le da nitidez y deja que
// los socios aprueben antes de reemplazar. Guarda la foto original para deshacer.

const BATCH = 12
const MAX_SIDE = 1400
const pathOf = (url) => decodeURIComponent(url.split(`/${IMAGES_BUCKET}/`)[1].split('?')[0])

async function loadBitmap(url) {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`descarga ${res.status}`)
  return createImageBitmap(await res.blob())
}

async function processPhoto(url) {
  const bmp = await loadBitmap(url)
  // 1) detección sobre una copia chica
  const s = Math.min(1, 360 / Math.max(bmp.width, bmp.height))
  const sc = document.createElement('canvas')
  sc.width = Math.round(bmp.width * s)
  sc.height = Math.round(bmp.height * s)
  const sctx = sc.getContext('2d', { willReadFrequently: true })
  sctx.drawImage(bmp, 0, 0, sc.width, sc.height)
  const det = detectCard(sctx.getImageData(0, 0, sc.width, sc.height))

  // 2) recorte (si se detectó bien) + nitidez
  const b = det.ok ? det.box : { x: 0, y: 0, w: 1, h: 1 }
  const sx = Math.round(b.x * bmp.width), sy = Math.round(b.y * bmp.height)
  const sw = Math.round(b.w * bmp.width), sh = Math.round(b.h * bmp.height)
  const k = Math.min(1, MAX_SIDE / Math.max(sw, sh))
  const out = document.createElement('canvas')
  out.width = Math.round(sw * k)
  out.height = Math.round(sh * k)
  const ctx = out.getContext('2d', { willReadFrequently: true })
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bmp, sx, sy, sw, sh, 0, 0, out.width, out.height)
  bmp.close?.()
  const img = ctx.getImageData(0, 0, out.width, out.height)
  sharpen(img, 0.6, 1)
  ctx.putImageData(img, 0, 0)
  const blob = await new Promise((r) => out.toBlob(r, 'image/jpeg', 0.88))
  return { det, blob, preview: URL.createObjectURL(blob) }
}

export default function Retouch() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [withSealed, setWithSealed] = useState(false)
  const [results, setResults] = useState({}) // id -> { det, blob, preview, checked, error }
  const [busy, setBusy] = useState('')
  const urls = useRef([])

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('product_images')
      .select('id, product_id, url, original_url, sort_order, products(name, type)')
      .order('product_id')
      .order('sort_order')
    if (error) alert(error.message)
    setRows((data ?? []).filter((r) => r.url?.includes(`/${IMAGES_BUCKET}/`)))
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), [])

  const isCard = (r) => ['single', 'graded'].includes(r.products?.type)
  const pending = rows.filter((r) => !r.original_url && (withSealed || isCard(r)) && !results[r.id]?.applied)
  const toAnalyze = pending.filter((r) => !results[r.id])
  const analyzed = pending.filter((r) => results[r.id] && !results[r.id].applied)
  const retouched = rows.filter((r) => r.original_url)
  const selected = analyzed.filter((r) => results[r.id].checked)

  const analyze = async () => {
    const batch = toAnalyze.slice(0, BATCH)
    for (let i = 0; i < batch.length; i++) {
      const r = batch[i]
      setBusy(`Analizando ${i + 1} de ${batch.length}…`)
      try {
        const res = await processPhoto(r.url)
        urls.current.push(res.preview)
        setResults((m) => ({ ...m, [r.id]: { ...res, checked: res.det.ok } }))
      } catch (e) {
        setResults((m) => ({ ...m, [r.id]: { error: e.message ?? String(e), checked: false } }))
      }
    }
    setBusy('')
  }

  const apply = async () => {
    if (!selected.length) return
    if (!confirm(`¿Reemplazar ${selected.length} foto(s) por la versión retocada? Puedes deshacerlo después.`)) return
    for (let i = 0; i < selected.length; i++) {
      const r = selected[i]
      const res = results[r.id]
      setBusy(`Guardando ${i + 1} de ${selected.length}…`)
      const path = `${r.product_id}/${Date.now()}-ret-${i}.jpg`
      const up = await supabase.storage.from(IMAGES_BUCKET).upload(path, res.blob, { contentType: 'image/jpeg', cacheControl: '31536000' })
      if (up.error) { alert(`${r.products?.name}: ${up.error.message}`); continue }
      const { data: pub } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(path)
      const { error } = await supabase.from('product_images').update({ url: pub.publicUrl, original_url: r.url }).eq('id', r.id)
      if (error) { alert(`${r.products?.name}: ${error.message}`); await supabase.storage.from(IMAGES_BUCKET).remove([path]); continue }
      setResults((m) => ({ ...m, [r.id]: { ...m[r.id], applied: true } }))
    }
    setBusy('')
    load()
  }

  const undo = async (r) => {
    if (!confirm(`¿Regresar la foto original de ${r.products?.name ?? 'este producto'}?`)) return
    setBusy('Regresando original…')
    const { error } = await supabase.from('product_images').update({ url: r.original_url, original_url: null }).eq('id', r.id)
    if (error) alert(error.message)
    else await supabase.storage.from(IMAGES_BUCKET).remove([pathOf(r.url)])
    setResults((m) => { const n = { ...m }; delete n[r.id]; return n })
    setBusy('')
    load()
  }

  const toggle = (id) => setResults((m) => ({ ...m, [id]: { ...m[id], checked: !m[id].checked } }))

  if (loading) return <p className="muted">Cargando…</p>

  return (
    <div>
      <p className="small"><Link to="../portadas">← Portadas</Link></p>
      <h2>Retocar fotos</h2>
      <p className="muted small">
        Quita la mesa o el playmat alrededor de la carta con un ligero zoom, sin cortar la carta, y le da nitidez.
        Primero ves el antes y después; solo se reemplazan las que apruebes. La original se guarda para deshacer.
      </p>

      <div className="card">
        <div className="checks" style={{ marginBottom: 10 }}>
          <label><input type="checkbox" checked={withSealed} onChange={(e) => setWithSealed(e.target.checked)} /> Incluir producto sellado</label>
        </div>
        <p className="small">{pending.length} fotos por retocar · {retouched.length} ya retocadas</p>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className="btn primary" disabled={!!busy || !toAnalyze.length} onClick={analyze}>
            {toAnalyze.length ? `Analizar ${Math.min(BATCH, toAnalyze.length)} fotos` : 'Todas analizadas'}
          </button>
          {analyzed.length > 0 && (
            <button className="btn" disabled={!!busy || !selected.length} onClick={apply}>Aplicar {selected.length} seleccionadas</button>
          )}
        </div>
        {busy && <p className="muted small" style={{ marginTop: 8 }}>{busy}</p>}
      </div>

      {analyzed.length > 0 && (
        <>
          <h4>Revisa antes de aplicar</h4>
          <p className="muted small">Toca una foto para incluirla o quitarla. Las que no se detectaron bien vienen sin palomita: si las incluyes, solo se les da nitidez (sin recorte).</p>
          <div className="retouch-grid">
            {analyzed.map((r) => {
              const res = results[r.id]
              return (
                <button type="button" key={r.id} className={`retouch-item${res.checked ? ' on' : ''}`} onClick={() => !res.error && toggle(r.id)}>
                  <div className="retouch-pair">
                    <img src={r.url} alt="Antes" loading="lazy" />
                    {res.preview ? <img src={res.preview} alt="Después" /> : <div className="retouch-err">✕</div>}
                  </div>
                  <span className="retouch-name">{res.checked ? '✅ ' : '◻️ '}{r.products?.name}</span>
                  <span className="retouch-note">
                    {res.error ? `Error: ${res.error}` : res.det.ok ? 'Recorte + nitidez' : `${res.det.reason} · solo nitidez`}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}

      {retouched.length > 0 && (
        <>
          <h4 style={{ marginTop: 20 }}>Ya retocadas</h4>
          <div className="retouch-grid">
            {retouched.map((r) => (
              <div key={r.id} className="retouch-item">
                <div className="retouch-pair">
                  <img src={r.original_url} alt="Original" loading="lazy" />
                  <img src={r.url} alt="Retocada" loading="lazy" />
                </div>
                <span className="retouch-name">{r.products?.name}</span>
                <button className="btn ghost" disabled={!!busy} onClick={() => undo(r)}>Deshacer</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
