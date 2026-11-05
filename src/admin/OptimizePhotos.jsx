import { useState } from 'react'
import { IMAGES_BUCKET, supabase } from '../lib/supabase'
import { compressImage } from '../lib/compressImage'

// Recomprime las fotos que ya están subidas y pesan de más (fotos directas del cel).
// Sube la versión ligera, cambia la liga en product_images y borra la original.
const LIMIT_KB = 500

export default function OptimizePhotos() {
  const [state, setState] = useState({ running: false, done: 0, total: 0, saved: 0, errors: 0, finished: false })

  async function run() {
    if (!confirm('Vamos a hacer más ligeras las fotos pesadas del catálogo. Se ven igual, solo cargan más rápido. ¿Continuamos?')) return
    const { data: rows, error } = await supabase.from('product_images').select('id, product_id, url')
    if (error) return alert(error.message)
    const ours = (rows ?? []).filter((r) => r.url?.includes(`/${IMAGES_BUCKET}/`))
    setState({ running: true, done: 0, total: ours.length, saved: 0, errors: 0, finished: false })

    let saved = 0
    let errors = 0
    for (let i = 0; i < ours.length; i++) {
      const r = ours[i]
      try {
        const res = await fetch(r.url, { cache: 'no-store' })
        const original = await res.blob()
        if (original.size > LIMIT_KB * 1024) {
          const { blob, ext, type } = await compressImage(original)
          if (blob.size < original.size) {
            const oldPath = decodeURIComponent(r.url.split(`/${IMAGES_BUCKET}/`)[1].split('?')[0])
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
      } catch (e) {
        console.error('No se pudo optimizar', r.url, e)
        errors++
      }
      setState((s) => ({ ...s, done: i + 1, saved, errors }))
    }
    setState((s) => ({ ...s, running: false, finished: true }))
  }

  const mb = (b) => (b / 1024 / 1024).toFixed(1)

  return (
    <section className="card">
      <h4>Fotos del catálogo</h4>
      <p className="muted small">Hace más ligeras las fotos de más de {LIMIT_KB} KB para que la página cargue rápido. Solo hay que correrlo una vez; las fotos nuevas ya se suben optimizadas.</p>
      {state.running || state.finished ? (
        <p>
          {state.done} / {state.total} revisadas · {mb(state.saved)} MB menos
          {state.errors > 0 && ` · ${state.errors} con error (revisa la consola)`}
          {state.finished && ' · ¡Listo!'}
        </p>
      ) : null}
      <button type="button" className="btn primary" onClick={run} disabled={state.running}>
        {state.running ? 'Optimizando…' : 'Optimizar fotos'}
      </button>
    </section>
  )
}
