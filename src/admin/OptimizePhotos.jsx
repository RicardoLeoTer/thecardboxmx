import { useState } from 'react'
import { IMAGES_BUCKET, supabase } from '../lib/supabase'
import { compressImage } from '../lib/compressImage'

// Recomprime las fotos que ya están subidas y pesan de más (fotos directas del cel),
// y al final borra del bucket las fotos que ya no usa ningún producto.
const LIMIT_KB = 350

const pathOf = (url) => decodeURIComponent(url.split(`/${IMAGES_BUCKET}/`)[1].split('?')[0])

async function cleanOrphans() {
  const { data: rows } = await supabase.from('product_images').select('url, original_url')
  // también cuentan los originales guardados por "Retocar fotos" (para poder deshacer)
  const urls = (rows ?? []).flatMap((r) => [r.url, r.original_url]).filter((u) => u?.includes(`/${IMAGES_BUCKET}/`))
  const used = new Set(urls.map(pathOf))
  const bucket = supabase.storage.from(IMAGES_BUCKET)
  const { data: folders, error } = await bucket.list('', { limit: 1000 })
  if (error) throw error
  const orphans = []
  for (const f of folders ?? []) {
    if (f.id) continue // archivo suelto en la raíz, no carpeta
    if (f.name === 'portadas') continue // portadas propias de colecciones (Admin → Portadas)
    const { data: files } = await bucket.list(f.name, { limit: 1000 })
    for (const file of files ?? []) {
      const p = `${f.name}/${file.name}`
      if (!used.has(p)) orphans.push(p)
    }
  }
  for (let i = 0; i < orphans.length; i += 100) {
    const { error: e } = await bucket.remove(orphans.slice(i, i + 100))
    if (e) throw e
  }
  return orphans.length
}

export default function OptimizePhotos() {
  const [state, setState] = useState({ running: false, done: 0, total: 0, saved: 0, errors: [], cleaned: null, finished: false })

  async function run() {
    if (!confirm('Vamos a hacer más ligeras las fotos pesadas y borrar las copias viejas que ya no se usan. Se ven igual, solo cargan más rápido. ¿Continuamos?')) return
    const { data: rows, error } = await supabase.from('product_images').select('id, product_id, url, products(name)')
    if (error) return alert(error.message)
    const ours = (rows ?? []).filter((r) => r.url?.includes(`/${IMAGES_BUCKET}/`))
    setState({ running: true, done: 0, total: ours.length, saved: 0, errors: [], cleaned: null, finished: false })

    let saved = 0
    const errors = []
    for (let i = 0; i < ours.length; i++) {
      const r = ours[i]
      // hasta 2 intentos por foto
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const res = await fetch(r.url, { cache: 'no-store' })
          if (!res.ok) throw new Error(`descarga ${res.status}`)
          const original = await res.blob()
          if (original.size > LIMIT_KB * 1024) {
            const { blob, ext, type } = await compressImage(original)
            if (blob.size < original.size) {
              const oldPath = pathOf(r.url)
              const newPath = `${r.product_id}/${Date.now()}-opt-${i}.${ext}`
              const up = await supabase.storage.from(IMAGES_BUCKET).upload(newPath, blob, { contentType: type, cacheControl: '31536000' })
              if (up.error) throw up.error
              const { data: pub } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(newPath)
              const upd = await supabase.from('product_images').update({ url: pub.publicUrl }).eq('id', r.id)
              if (upd.error) throw upd.error
              await supabase.storage.from(IMAGES_BUCKET).remove([oldPath])
              saved += original.size - blob.size
            }
          }
          break
        } catch (e) {
          if (attempt === 2) {
            console.error('No se pudo optimizar', r.url, e)
            errors.push(`${r.products?.name ?? 'Producto'}: ${e.message ?? e}`)
          }
        }
      }
      setState((s) => ({ ...s, done: i + 1, saved, errors: [...errors] }))
    }

    let cleaned = null
    try {
      cleaned = await cleanOrphans()
    } catch (e) {
      console.error('No se pudo limpiar', e)
      errors.push(`Limpieza de copias viejas: ${e.message ?? e}`)
    }
    setState((s) => ({ ...s, running: false, finished: true, cleaned, errors: [...errors] }))
  }

  const mb = (b) => (b / 1024 / 1024).toFixed(1)

  return (
    <section className="card">
      <h4>Fotos del catálogo</h4>
      <p className="muted small">Hace más ligeras las fotos de más de {LIMIT_KB} KB y borra las copias viejas que ya no usa ningún producto. Las fotos nuevas ya se suben optimizadas.</p>
      {state.running || state.finished ? (
        <p>
          {state.done} / {state.total} revisadas · {mb(state.saved)} MB menos
          {state.cleaned !== null && ` · ${state.cleaned} copias viejas borradas`}
          {state.finished && ' · ¡Listo!'}
        </p>
      ) : null}
      {state.errors.length > 0 && (
        <ul className="plain small">
          {state.errors.map((e, i) => <li key={i} className="muted">Error: {e}</li>)}
        </ul>
      )}
      <button type="button" className="btn primary" onClick={run} disabled={state.running}>
        {state.running ? 'Optimizando…' : 'Optimizar fotos'}
      </button>
    </section>
  )
}
