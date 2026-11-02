import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CHANNELS, STATUS_LABEL, TYPE_LABEL, money, supabase } from '../lib/supabase'
import { useAdmin } from './AdminApp'

const STATUS_FILTERS = [
  ['activos', 'Activos'],
  ['disponible', 'Disponibles'],
  ['publicado', 'Publicados'],
  ['apartado', 'Apartados'],
  ['vendido', 'Vendidos'],
  ['retirado', 'Retirados'],
]

export default function Inventory() {
  const { categories, partners, tags } = useAdmin()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('activos')
  const [cat, setCat] = useState('')
  const [q, setQ] = useState('')
  const [tag, setTag] = useState('')
  const [action, setAction] = useState(null) // { type: 'apartar'|'vender', product }

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('products')
      .select('*, product_images(url, sort_order), categories(name, parent_id), collections(name), product_tags(tag_id), reservations(id, customer_name, contact, expires_at, is_active)')
      .order('created_at', { ascending: false })

    if (status === 'activos') query = query.in('status', ['disponible', 'publicado', 'apartado'])
    else query = query.eq('status', status)

    if (cat) {
      const id = Number(cat)
      const ids = [id, ...categories.filter((c) => c.parent_id === id).map((c) => c.id)]
      query = query.in('category_id', ids)
    }

    const { data, error } = await query
    if (error) alert(error.message)
    setItems(data ?? [])
    setLoading(false)
  }, [status, cat, categories])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    const byTag = tag ? items.filter((p) => p.product_tags?.some((x) => x.tag_id === Number(tag))) : items
    if (!t) return byTag
    return byTag.filter((p) =>
      [p.name, p.subject, p.team, p.sku, p.cert_number, p.collections?.name]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(t))
    )
  }, [items, q, tag])

  const ownerName = (id) => partners.find((p) => p.id === id)?.name ?? 'Negocio'

  const setProductStatus = async (p, newStatus) => {
    const { error } = await supabase.from('products').update({ status: newStatus }).eq('id', p.id)
    if (error) return alert(error.message)
    load()
  }

  const liberar = async (p) => {
    if (!confirm('¿Liberar el apartado? Vuelve a quedar publicado.')) return
    await supabase.from('reservations').update({ is_active: false }).eq('product_id', p.id).eq('is_active', true)
    setProductStatus(p, 'publicado')
  }

  const topCats = categories.filter((c) => !c.parent_id)

  return (
    <div>
      <div className="toolbar">
        <input className="search" placeholder="Buscar nombre, jugador, cert…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Todas</option>
          {topCats.map((c) => (
            <optgroup key={c.id} label={c.name}>
              <option value={c.id}>{c.name} (todo)</option>
              {categories.filter((s) => s.parent_id === c.id).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="chips">
        <button className={`chip ${!tag ? 'on' : ''}`} onClick={() => setTag('')}>Todos los segmentos</button>
        {tags.map((t) => (
          <button key={t.id} className={`chip ${tag === String(t.id) ? 'on' : ''}`} onClick={() => setTag(String(t.id))}>{t.name}</button>
        ))}
      </div>

      <div className="chips">
        {STATUS_FILTERS.map(([v, l]) => (
          <button key={v} className={`chip ${status === v ? 'on' : ''}`} onClick={() => setStatus(v)}>{l}</button>
        ))}
      </div>

      {loading ? (
        <p className="muted">Cargando…</p>
      ) : filtered.length === 0 ? (
        <p className="muted">No hay productos aquí.</p>
      ) : (
        <ul className="list">
          {filtered.map((p) => {
            const img = [...(p.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]
            const res = p.reservations?.find((r) => r.is_active)
            const expired = res?.expires_at && new Date(res.expires_at) < new Date()
            return (
              <li key={p.id} className="card item">
                <div className="item-top">
                  <div className="thumb">{img ? <img src={img.url} alt="" /> : <span>🃏</span>}</div>
                  <div className="item-info">
                    <div className="item-name">{p.name}</div>
                    <div className="muted small">
                      {[p.categories?.name, p.collections?.name, TYPE_LABEL[p.type]].filter(Boolean).join(' · ')}
                    </div>
                    <div className="small">
                      {p.grading_company && <b>{p.grading_company} {p.grade} · </b>}
                      {p.condition && <b>{p.condition} · </b>}
                      {money(p.price)}
                      {p.compare_at_price && <span className="strike"> {money(p.compare_at_price)}</span>}
                      {p.quantity > 1 && <> · x{p.quantity}</>}
                    </div>
                    {p.product_tags?.length > 0 && (
                      <div className="tags">
                        {p.product_tags.map((x) => tags.find((t) => t.id === x.tag_id)).filter(Boolean)
                          .map((t) => <span key={t.id} className="tag">{t.name}</span>)}
                      </div>
                    )}
                    <div className="muted small">
                      {ownerName(p.owner_id)}{p.is_consignment && ' (consigna)'}{p.location && ` · 📍 ${p.location}`}
                    </div>
                  </div>
                  <span className={`badge s-${p.status}`}>{STATUS_LABEL[p.status]}</span>
                </div>

                {res && (
                  <div className={`res ${expired ? 'expired' : ''}`}>
                    Apartado para <b>{res.customer_name}</b>{res.contact && ` (${res.contact})`}
                    {res.expires_at && <> · hasta {new Date(res.expires_at).toLocaleDateString('es-MX')}</>}
                    {expired && ' · VENCIDO'}
                  </div>
                )}

                <div className="actions">
                  {p.status === 'disponible' && <button className="btn" onClick={() => setProductStatus(p, 'publicado')}>Publicar</button>}
                  {p.status === 'publicado' && <button className="btn" onClick={() => setProductStatus(p, 'disponible')}>Ocultar</button>}
                  {['disponible', 'publicado'].includes(p.status) && (
                    <button className="btn" onClick={() => setAction({ type: 'apartar', product: p })}>Apartar</button>
                  )}
                  {p.status === 'apartado' && <button className="btn" onClick={() => liberar(p)}>Liberar</button>}
                  {['disponible', 'publicado', 'apartado'].includes(p.status) && (
                    <button className="btn primary" onClick={() => setAction({ type: 'vender', product: p })}>Vender</button>
                  )}
                  {['vendido', 'retirado'].includes(p.status) && p.quantity > 0 && (
                    <button className="btn" onClick={() => setProductStatus(p, 'disponible')}>Reactivar</button>
                  )}
                  <Link className="btn ghost" to={`editar/${p.id}`}>Editar</Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {action && (
        <ActionSheet
          {...action}
          onClose={() => setAction(null)}
          onDone={() => { setAction(null); load() }}
        />
      )}
    </div>
  )
}

function ActionSheet({ type, product, onClose, onDone }) {
  const { partner } = useAdmin()
  const activeRes = product.reservations?.find((r) => r.is_active)
  const [f, setF] = useState({
    customer_name: activeRes?.customer_name ?? '',
    contact: activeRes?.contact ?? '',
    quantity: 1,
    days: 3,
    sale_price: product.price,
    channel: 'instagram',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    let error
    if (type === 'apartar') {
      const expires = new Date()
      expires.setDate(expires.getDate() + Number(f.days))
      ;({ error } = await supabase.from('reservations').insert({
        product_id: product.id,
        customer_name: f.customer_name,
        contact: f.contact || null,
        quantity: Number(f.quantity),
        reserved_by: partner.id,
        expires_at: expires.toISOString(),
      }))
    } else {
      ;({ error } = await supabase.from('sales').insert({
        product_id: product.id,
        quantity: Number(f.quantity),
        sale_price: Number(f.sale_price),
        channel: f.channel,
        customer_name: f.customer_name || null,
        notes: f.notes || null,
        sold_by: partner.id,
      }))
    }
    setSaving(false)
    if (error) return alert(error.message)
    onDone()
  }

  return (
    <div className="sheet-bg" onClick={onClose}>
      <form className="sheet" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>{type === 'apartar' ? 'Apartar' : 'Registrar venta'}</h3>
        <p className="muted small">{product.name}</p>

        <label>Cliente
          <input value={f.customer_name} onChange={set('customer_name')} required={type === 'apartar'} />
        </label>

        {type === 'apartar' ? (
          <>
            <label>Contacto (IG / WhatsApp)
              <input value={f.contact} onChange={set('contact')} />
            </label>
            <label>¿Cuántos días se respeta?
              <input type="number" min="1" value={f.days} onChange={set('days')} />
            </label>
          </>
        ) : (
          <>
            <label>Precio final por pieza (MXN)
              <input type="number" min="0" step="0.01" value={f.sale_price} onChange={set('sale_price')} required />
            </label>
            <label>Canal
              <select value={f.channel} onChange={set('channel')}>
                {CHANNELS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label>Notas
              <input value={f.notes} onChange={set('notes')} placeholder="Envío, intercambio, etc." />
            </label>
          </>
        )}

        {product.quantity > 1 && (
          <label>Cantidad (hay {product.quantity})
            <input type="number" min="1" max={product.quantity} value={f.quantity} onChange={set('quantity')} />
          </label>
        )}

        <div className="actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn primary" disabled={saving}>{saving ? 'Guardando…' : 'Confirmar'}</button>
        </div>
      </form>
    </div>
  )
}
