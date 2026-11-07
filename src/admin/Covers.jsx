import { useEffect, useMemo, useState } from 'react'
import { IMAGES_BUCKET, supabase } from '../lib/supabase'
import { compressOrOriginal } from '../lib/compressImage'
import { useAdmin } from './AdminApp'

const MAX_HOME = 12

// Admin → Portadas: elige la foto de portada de cada colección/liga en el catálogo
// y qué cartas salen en la vitrina en movimiento de la página de inicio.
export default function Covers() {
  const { categories, reloadLookups } = useAdmin()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(null) // slug de la categoría abierta o 'home'
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)

  const loadItems = async () => {
    const { data, error } = await supabase
      .from('catalog')
      .select('id, name, subject, cover_image, category_slug, parent_category_slug, show_on_home, price, created_at')
      .not('cover_image', 'is', null)
      .order('created_at', { ascending: false })
    if (error) alert(error.message)
    setItems(data ?? [])
    setLoading(false)
  }
  useEffect(() => { loadItems() }, [])

  const roots = categories.filter((c) => !c.parent_id && c.is_active !== false)
  const childrenOf = (id) => categories.filter((c) => c.parent_id === id && c.is_active !== false)
  const ordered = roots.flatMap((r) => [r, ...childrenOf(r.id)])
  const itemsOf = (cat) => items.filter((i) => i.category_slug === cat.slug || i.parent_category_slug === cat.slug)
  const homeItems = items.filter((i) => i.show_on_home)

  const coverOf = (cat) => {
    const list = itemsOf(cat)
    const chosen = cat.cover_product_id && list.find((i) => i.id === cat.cover_product_id)
    if (chosen) return { url: chosen.cover_image, how: `Carta: ${chosen.name}` }
    if (cat.image_url) return { url: cat.image_url, how: 'Foto propia' }
    const auto = list[0]
    return auto ? { url: auto.cover_image, how: 'Automática' } : { url: null, how: 'Sin productos: no se muestra' }
  }

  const updateCat = async (cat, patch) => {
    setBusy(true)
    const { error } = await supabase.from('categories').update(patch).eq('id', cat.id)
    if (error) alert(error.message)
    await reloadLookups()
    setBusy(false)
  }

  const uploadOwn = async (cat, file) => {
    if (!file) return
    setBusy(true)
    const { blob, ext, type } = await compressOrOriginal(file, { maxSide: 1400, quality: 0.8 })
    const path = `portadas/${cat.slug}-${Date.now()}.${ext}`
    const up = await supabase.storage.from(IMAGES_BUCKET).upload(path, blob, { contentType: type, cacheControl: '31536000' })
    if (up.error) { setBusy(false); return alert(up.error.message) }
    const { data: pub } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(path)
    await updateCat(cat, { image_url: pub.publicUrl, cover_product_id: null })
  }

  const toggleHome = async (item) => {
    if (!item.show_on_home && homeItems.length >= MAX_HOME) return alert(`La vitrina lleva máximo ${MAX_HOME} cartas. Quita una primero.`)
    setBusy(true)
    const { error } = await supabase.from('products').update({ show_on_home: !item.show_on_home }).eq('id', item.id)
    if (error) alert(error.message)
    await loadItems()
    setBusy(false)
  }

  const filter = (list) => {
    const t = q.trim().toLowerCase()
    return (t ? list.filter((i) => `${i.name} ${i.subject ?? ''}`.toLowerCase().includes(t)) : list).slice(0, 60)
  }

  // función (no componente) para que el buscador no pierda el foco al escribir
  const picker = (list, isOn, onPick) => (
    <>
      <input placeholder="Buscar carta…" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 10 }} />
      <div className="cover-grid">
        {filter(list).map((i) => (
          <button type="button" key={i.id} disabled={busy} onClick={() => onPick(i)} className={`cover-pick${isOn(i) ? ' on' : ''}`}>
            <img src={i.cover_image} alt={i.name} loading="lazy" />
            <span>{i.name}</span>
          </button>
        ))}
      </div>
      {!filter(list).length && <p className="muted small">No hay cartas publicadas con foto.</p>}
    </>
  )

  const toggleOpen = (key) => { setOpen(open === key ? null : key); setQ('') }

  if (loading) return <p className="muted">Cargando…</p>

  return (
    <div>
      <h2>Portadas</h2>

      <div className="card">
        <h3>Vitrina del inicio</h3>
        <p className="muted small">
          {homeItems.length}/{MAX_HOME} cartas elegidas. Si no eliges ninguna, se muestran las más nuevas de cada categoría.
          Las vendidas se quitan solas.
        </p>
        {homeItems.length > 0 && (
          <div className="cover-strip">
            {homeItems.map((i) => <img key={i.id} src={i.cover_image} alt={i.name} title={i.name} />)}
          </div>
        )}
        <button className="btn" onClick={() => toggleOpen('home')}>{open === 'home' ? 'Cerrar' : 'Elegir cartas'}</button>
        {open === 'home' && (
          <div style={{ marginTop: 12 }}>
            <p className="muted small">Toca una carta para agregarla o quitarla.</p>
            {picker(items, (i) => i.show_on_home, toggleHome)}
          </div>
        )}
      </div>

      <h4 style={{ marginTop: 20 }}>Portada de cada colección</h4>
      {ordered.map((cat) => {
        const cover = coverOf(cat)
        const list = itemsOf(cat)
        return (
          <div className="card" key={cat.id}>
            <div className="cover-row">
              <div className="cover-thumb">{cover.url ? <img src={cover.url} alt={cat.name} /> : <span>—</span>}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3>{cat.parent_id ? '↳ ' : ''}{cat.name}</h3>
                <p className="muted small">{cover.how}</p>
                <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {list.length > 0 && <button className="btn" onClick={() => toggleOpen(cat.slug)}>{open === cat.slug ? 'Cerrar' : 'Elegir carta'}</button>}
                  <label className="btn ghost" style={{ cursor: 'pointer' }}>
                    Subir foto
                    <input type="file" accept="image/*" hidden onChange={(e) => uploadOwn(cat, e.target.files?.[0])} />
                  </label>
                  {(cat.cover_product_id || cat.image_url) && (
                    <button className="btn ghost" disabled={busy} onClick={() => updateCat(cat, { cover_product_id: null, image_url: null })}>Automática</button>
                  )}
                </div>
              </div>
            </div>
            {open === cat.slug && (
              <div style={{ marginTop: 12 }}>
                {picker(list, (i) => i.id === cat.cover_product_id,
                  (i) => updateCat(cat, { cover_product_id: i.id, image_url: null }).then(() => setOpen(null)))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
