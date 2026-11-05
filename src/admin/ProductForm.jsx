import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { IMAGES_BUCKET, TYPE_LABEL, slugify, supabase } from '../lib/supabase'
import { compressOrOriginal } from '../lib/compressImage'
import { useAdmin } from './AdminApp'

const EMPTY = {
  type: 'single',
  category_id: '',
  collection_id: '',
  name: '',
  subject: '',
  team: '',
  card_number: '',
  variant: '',
  serial_number: '',
  language: 'EN',
  condition: 'NM',
  grading_company: 'PSA',
  grade: '',
  cert_number: '',
  description: '',
  price: '',
  compare_at_price: '',
  cost: '',
  quantity: 1,
  status: 'disponible',
  owner_id: '',
  is_consignment: false,
  location: '',
  is_featured: false,
  sku: '',
  format_id: '',
}

// Campos que se mandan vacíos como null
const NULLABLE = ['price', 'format_id', 'collection_id', 'subject', 'team', 'card_number', 'variant', 'serial_number', 'condition',
  'grading_company', 'grade', 'cert_number', 'description', 'compare_at_price', 'cost', 'owner_id', 'location', 'sku']

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { partner, partners, categories, collections, tags, formats = [], reloadLookups } = useAdmin()
  const [f, setF] = useState({ ...EMPTY, owner_id: partner.id })
  const [images, setImages] = useState([]) // existentes
  const [files, setFiles] = useState([]) // nuevas
  const [saving, setSaving] = useState(false)
  const [newCol, setNewCol] = useState(null) // { name, year }
  const [tagIds, setTagIds] = useState([])

  useEffect(() => {
    if (!id) return
    supabase.from('products').select('*, product_images(*), product_tags(tag_id)').eq('id', id).single().then(({ data, error }) => {
      if (error) return alert(error.message)
      const { product_images, product_tags, ...p } = data
      setTagIds(product_tags.map((x) => x.tag_id))
      const clean = Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v ?? '']))
      setF({ ...EMPTY, ...clean })
      setImages([...product_images].sort((a, b) => a.sort_order - b.sort_order))
    })
  }, [id])

  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const category = categories.find((c) => c.id === Number(f.category_id))
  const sportsRoot = categories.find((c) => c.slug === 'deportes')
  const isSports = category && sportsRoot && (category.id === sportsRoot.id || category.parent_id === sportsRoot.id)
  const isCard = ['single', 'graded'].includes(f.type)
  const rootSlug = category && (category.parent_id ? categories.find((c) => c.id === category.parent_id)?.slug : category.slug)
  const availableFormats = formats.filter((fm) => fm.scope === 'all' || fm.scope === rootSlug)
  const availableTags = tags.filter((t) => t.scope === 'all' || t.scope === rootSlug)
  const toggleTag = (tid) => setTagIds(tagIds.includes(tid) ? tagIds.filter((x) => x !== tid) : [...tagIds, tid])
  const catCollections = useMemo(
    () => collections.filter((c) => c.category_id === Number(f.category_id)),
    [collections, f.category_id]
  )

  const createCollection = async () => {
    if (!newCol?.name) return
    const { data, error } = await supabase
      .from('collections')
      .insert({
        category_id: Number(f.category_id),
        name: newCol.name,
        year: newCol.year ? Number(newCol.year) : null,
        slug: slugify(`${newCol.name}-${newCol.year ?? ''}`),
      })
      .select()
      .single()
    if (error) return alert(error.message)
    await reloadLookups()
    setF({ ...f, collection_id: data.id })
    setNewCol(null)
  }

  const removeImage = async (img) => {
    if (!confirm('¿Borrar esta foto?')) return
    await supabase.from('product_images').delete().eq('id', img.id)
    const path = img.url.split(`/${IMAGES_BUCKET}/`)[1]
    if (path) await supabase.storage.from(IMAGES_BUCKET).remove([path])
    setImages(images.filter((i) => i.id !== img.id))
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)

    const payload = { ...f }
    delete payload.id
    delete payload.created_at
    delete payload.updated_at
    delete payload.created_by
    for (const k of NULLABLE) if (payload[k] === '') payload[k] = null
    payload.category_id = Number(payload.category_id)
    if (payload.price != null) payload.price = Number(payload.price)
    if (payload.compare_at_price != null) payload.compare_at_price = Number(payload.compare_at_price)
    if (payload.cost != null) payload.cost = Number(payload.cost)
    payload.quantity = Number(payload.quantity)
    // Limpia campos que no aplican al tipo
    if (f.type !== 'graded') { payload.grading_company = null; payload.grade = null; payload.cert_number = null }
    if (f.type !== 'single') payload.condition = null
    if (f.type !== 'sealed') payload.format_id = null
    else if (payload.format_id != null) payload.format_id = Number(payload.format_id)
    if (f.type === 'single' || f.type === 'graded') payload.quantity = Math.min(payload.quantity, 1) || 1

    let productId = id
    if (id) {
      const { error } = await supabase.from('products').update(payload).eq('id', id)
      if (error) { setSaving(false); return alert(error.message) }
    } else {
      const { data, error } = await supabase
        .from('products')
        .insert({ ...payload, created_by: partner.id })
        .select('id')
        .single()
      if (error) { setSaving(false); return alert(error.message) }
      productId = data.id
    }

    // Segmentos: se reemplazan completos (solo los que aplican a la categoría)
    const validTags = tagIds.filter((tid) => availableTags.some((t) => t.id === tid))
    await supabase.from('product_tags').delete().eq('product_id', productId)
    if (validTags.length) {
      const { error } = await supabase.from('product_tags').insert(validTags.map((tag_id) => ({ product_id: productId, tag_id })))
      if (error) alert(`No se guardaron los segmentos: ${error.message}`)
    }

    // Subir fotos nuevas
    let order = images.length
    for (const file of files) {
      const { blob, ext, type } = await compressOrOriginal(file)
      const path = `${productId}/${Date.now()}-${order}.${ext}`
      const up = await supabase.storage.from(IMAGES_BUCKET).upload(path, blob, { contentType: type, cacheControl: '31536000' })
      if (up.error) { alert(`No se subió ${file.name}: ${up.error.message}`); continue }
      const { data: pub } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(path)
      await supabase.from('product_images').insert({ product_id: productId, url: pub.publicUrl, sort_order: order++ })
    }

    setSaving(false)
    navigate('..')
  }

  return (
    <form className="form" onSubmit={save}>
      <h2>{id ? 'Editar producto' : 'Nuevo producto'}</h2>

      <section className="card">
        <label>Tipo
          <select value={f.type} onChange={set('type')}>
            {Object.entries(TYPE_LABEL).filter(([v]) => v !== 'accessory' || f.type === 'accessory').map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>

        <label>Categoría
          <select value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value, collection_id: '' })} required>
            <option value="">Elige…</option>
            {categories.filter((c) => !c.parent_id).map((c) => {
              const subs = categories.filter((s) => s.parent_id === c.id)
              return subs.length ? (
                <optgroup key={c.id} label={c.name}>
                  {subs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </optgroup>
              ) : (
                <option key={c.id} value={c.id}>{c.name}</option>
              )
            })}
          </select>
        </label>

        {f.category_id && (
          <label>Colección / set
            {newCol ? (
              <div className="row">
                <input placeholder="Nombre (ej. Topps Chrome)" value={newCol.name} onChange={(e) => setNewCol({ ...newCol, name: e.target.value })} />
                <input className="w-90" type="number" placeholder="Año" value={newCol.year} onChange={(e) => setNewCol({ ...newCol, year: e.target.value })} />
                <button type="button" className="btn" onClick={createCollection}>OK</button>
              </div>
            ) : (
              <div className="row">
                <select value={f.collection_id} onChange={set('collection_id')}>
                  <option value="">Sin colección</option>
                  {catCollections.map((c) => <option key={c.id} value={c.id}>{c.name}{c.year ? ` (${c.year})` : ''}</option>)}
                </select>
                <button type="button" className="btn" onClick={() => setNewCol({ name: '', year: new Date().getFullYear() })}>＋</button>
              </div>
            )}
          </label>
        )}

        <label>Nombre del producto
          <input value={f.name} onChange={set('name')} required placeholder={isSports ? 'Shohei Ohtani Rookie Refractor' : 'Charizard ex SIR'} />
        </label>
      </section>

      {isCard && (
        <section className="card">
          <h4>Detalle de la carta</h4>
          <label>{isSports ? 'Jugador' : 'Pokémon'}
            <input value={f.subject} onChange={set('subject')} />
          </label>
          {isSports && (
            <label>Equipo
              <input value={f.team} onChange={set('team')} />
            </label>
          )}
          <div className="row">
            <label>Número<input value={f.card_number} onChange={set('card_number')} placeholder="199/165" /></label>
            <label>Variante / parallel<input value={f.variant} onChange={set('variant')} placeholder="Refractor, Reverse Holo" /></label>
          </div>
          <div className="row">
            <label>Numerada<input value={f.serial_number} onChange={set('serial_number')} placeholder="12/99" /></label>
            <label>Idioma
              <select value={f.language} onChange={set('language')}>
                <option>EN</option><option>ES</option><option>JP</option><option>Otro</option>
              </select>
            </label>
          </div>

          {f.type === 'single' && (
            <label>Condición
              <select value={f.condition} onChange={set('condition')}>
                {['NM', 'LP', 'MP', 'HP', 'DMG'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
          )}
          {f.type === 'graded' && (
            <div className="row">
              <label>Empresa
                <select value={f.grading_company} onChange={set('grading_company')}>
                  {['PSA', 'BGS', 'SGC', 'CGC', 'Otra'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label>Grado<input type="number" step="0.5" min="1" max="10" value={f.grade} onChange={set('grade')} required /></label>
              <label>Certificado<input value={f.cert_number} onChange={set('cert_number')} /></label>
            </div>
          )}
        </section>
      )}

      {f.type === 'sealed' && (
        <section className="card">
          <h4>Formato</h4>
          {availableFormats.length === 0 ? (
            <p className="muted small">Esta colección todavía no tiene formatos. Elige primero la categoría (Pokémon o una liga de deportes).</p>
          ) : (
            <div className="chips wrap">
              <button type="button" className={`chip ${!f.format_id ? 'on' : ''}`} onClick={() => setF({ ...f, format_id: '' })}>Sin formato</button>
              {availableFormats.map((fm) => (
                <button type="button" key={fm.id} className={`chip ${Number(f.format_id) === fm.id ? 'on' : ''}`} onClick={() => setF({ ...f, format_id: fm.id })}>
                  {Number(f.format_id) === fm.id ? '✓ ' : ''}{fm.name}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {availableTags.length > 0 && (
        <section className="card">
          <h4>Segmentos</h4>
          <div className="chips wrap">
            {availableTags.map((t) => (
              <button type="button" key={t.id} className={`chip ${tagIds.includes(t.id) ? 'on' : ''}`} onClick={() => toggleTag(t.id)}>
                {tagIds.includes(t.id) ? '✓ ' : ''}{t.name}
              </button>
            ))}
          </div>
          <p className="muted small">Así aparece en las pestañas de SIR, Full Art, Parallels, Autógrafos, etc.</p>
        </section>
      )}

      <section className="card">
        <h4>Precio</h4>
        <div className="row">
          <label>Precio de venta <span className="muted small">(vacío = "Consultar")</span>
            <input type="number" min="0" step="0.01" value={f.price} onChange={set('price')} />
          </label>
          <label>Precio antes <span className="muted small">(→ Ofertas)</span>
            <input type="number" min="0" step="0.01" value={f.compare_at_price} onChange={set('compare_at_price')} />
          </label>
        </div>
        <div className="row">
          <label>Costo <span className="muted small">(privado)</span>
            <input type="number" min="0" step="0.01" value={f.cost} onChange={set('cost')} />
          </label>
          {!isCard && <label>Cantidad<input type="number" min="0" value={f.quantity} onChange={set('quantity')} /></label>}
        </div>
      </section>

      <section className="card">
        <h4>Control interno</h4>
        <div className="row">
          <label>¿De quién es?
            <select value={f.owner_id} onChange={set('owner_id')}>
              <option value="">Del negocio</option>
              {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label>Ubicación<input value={f.location} onChange={set('location')} placeholder="Caja A / con Ricardo" /></label>
        </div>
        <div className="checks">
          <label><input type="checkbox" checked={f.is_consignment} onChange={set('is_consignment')} /> En consignación</label>
          <label><input type="checkbox" checked={f.is_featured} onChange={set('is_featured')} /> Destacado en la web</label>
        </div>
        {!id && (
          <label>Al guardar
            <select value={f.status} onChange={set('status')}>
              <option value="disponible">Dejar en inventario (no visible)</option>
              <option value="publicado">Publicar en la web</option>
            </select>
          </label>
        )}
        <label>Descripción
          <textarea rows="3" value={f.description} onChange={set('description')} />
        </label>
        <label>SKU <span className="muted small">(opcional)</span>
          <input value={f.sku} onChange={set('sku')} />
        </label>
      </section>

      <section className="card">
        <h4>Fotos</h4>
        <div className="photos">
          {images.map((img) => (
            <div key={img.id} className="photo">
              <img src={img.url} alt="" />
              <button type="button" onClick={() => removeImage(img)}>✕</button>
            </div>
          ))}
          {files.map((file, i) => (
            <div key={i} className="photo">
              <img src={URL.createObjectURL(file)} alt="" />
              <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
          <label className="photo add">
            📷
            <input type="file" accept="image/*" multiple hidden onChange={(e) => setFiles([...files, ...e.target.files])} />
          </label>
        </div>
      </section>

      <div className="actions sticky">
        <button type="button" className="btn ghost" onClick={() => navigate('..')}>Cancelar</button>
        <button className="btn primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </form>
  )
}
