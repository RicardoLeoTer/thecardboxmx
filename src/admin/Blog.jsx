import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const fmt = (d) => (d ? new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : '')

export default function Blog() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState(null)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, slug, title, status, week_of, created_at, published_at')
      .order('created_at', { ascending: false })
    if (error) alert(error.message)
    setPosts(data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  if (openId) return <Editor id={openId} onClose={() => { setOpenId(null); load() }} />

  const drafts = posts.filter((p) => p.status === 'borrador')
  return (
    <div>
      <h2>Blog</h2>
      <p className="muted small" style={{ marginTop: -6, marginBottom: 14 }}>
        Cada lunes el agente deja aquí el Top 5 de la semana como borrador, con el guión del reel.
      </p>
      {loading ? <p className="muted">Cargando…</p> : posts.length === 0 ? (
        <p className="muted">Todavía no hay artículos. El primero llega el lunes.</p>
      ) : (
        <ul className="list">
          {drafts.length > 0 && <li className="muted small" style={{ margin: '4px 0 8px' }}>📝 {drafts.length} por revisar</li>}
          {posts.map((p) => (
            <li key={p.id} className="card item" onClick={() => setOpenId(p.id)} style={{ cursor: 'pointer' }}>
              <div className="item-top">
                <div className="item-info">
                  <div className="item-name">{p.title}</div>
                  <div className="muted small">
                    {p.status === 'publicado' ? `Publicado ${fmt(p.published_at)}` : `Creado ${fmt(p.created_at)}`}
                    {p.week_of && ` · semana del ${fmt(p.week_of)}`}
                  </div>
                </div>
                <span className={`badge ${p.status === 'publicado' ? 's-publicado' : 's-apartado'}`}>
                  {p.status === 'publicado' ? 'Publicado' : 'Borrador'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function CopyBox({ label, value, rows = 6 }) {
  const [copied, setCopied] = useState(false)
  if (!value) return null
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* sin portapapeles */ }
  }
  return (
    <label>
      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {label}
        <button type="button" className="btn ghost" style={{ minHeight: 30, padding: '4px 10px', fontSize: 12 }} onClick={copy}>
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>
      </span>
      <textarea readOnly rows={rows} value={value} />
    </label>
  )
}

function Editor({ id, onClose }) {
  const [post, setPost] = useState(null)
  const [kit, setKit] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('blog_posts').select('*').eq('id', id).single(),
      supabase.from('blog_reel_kits').select('*').eq('post_id', id).maybeSingle(),
    ]).then(([p, k]) => {
      if (p.error) return alert(p.error.message)
      setPost(p.data)
      setKit(k.data)
    })
  }, [id])

  if (!post) return <p className="muted">Cargando…</p>

  const set = (key) => (e) => setPost({ ...post, [key]: e.target.value })

  const save = async (status) => {
    setSaving(true)
    const { error } = await supabase
      .from('blog_posts')
      .update({
        title: post.title,
        excerpt: post.excerpt || null,
        body_md: post.body_md,
        cover_url: post.cover_url || null,
        ...(status ? { status } : {}),
      })
      .eq('id', id)
    setSaving(false)
    if (error) return alert(error.message)
    if (status) onClose()
    else alert('Guardado')
  }

  const remove = async () => {
    if (!confirm('¿Borrar este artículo? No se puede deshacer.')) return
    const { error } = await supabase.from('blog_posts').delete().eq('id', id)
    if (error) return alert(error.message)
    onClose()
  }

  const sources = Array.isArray(post.sources) ? post.sources : []
  const isPublished = post.status === 'publicado'

  return (
    <div className="form">
      <button className="link small" onClick={onClose}>← Blog</button>
      <h2 style={{ marginTop: 10 }}>{isPublished ? 'Artículo publicado' : 'Revisar borrador'}</h2>

      {kit && (
        <section className="card">
          <h4>🎬 Para el reel</h4>
          <CopyBox label="Guión" value={kit.script} rows={10} />
          <CopyBox label="Caption" value={kit.caption} rows={5} />
          <CopyBox label="Hashtags" value={kit.hashtags} rows={3} />
          <CopyBox label="Ideas de stories" value={kit.story_ideas} rows={4} />
        </section>
      )}

      <section className="card">
        <h4>Artículo</h4>
        <label>Título<input value={post.title} onChange={set('title')} /></label>
        <label>Resumen<textarea rows="2" value={post.excerpt || ''} onChange={set('excerpt')} /></label>
        <label>Imagen de portada (URL, opcional)<input value={post.cover_url || ''} onChange={set('cover_url')} placeholder="https://…" /></label>
        <label>Contenido <span className="muted small">(Markdown: ## subtítulo, **negritas**, [texto](link))</span>
          <textarea rows="18" value={post.body_md} onChange={set('body_md')} style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13 }} />
        </label>
        {sources.length > 0 && (
          <div className="small">
            <b>Fuentes ({sources.length})</b>
            <ul style={{ margin: '6px 0 0 18px' }}>
              {sources.map((s, i) => <li key={i}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title || s.url}</a></li>)}
            </ul>
          </div>
        )}
      </section>

      <div className="actions sticky">
        <button className="btn ghost" onClick={remove} disabled={saving}>Borrar</button>
        <button className="btn" onClick={() => save()} disabled={saving}>Guardar</button>
        {isPublished ? (
          <>
            <a className="btn" href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">Ver</a>
            <button className="btn" onClick={() => save('borrador')} disabled={saving}>Despublicar</button>
          </>
        ) : (
          <button className="btn primary" onClick={() => save('publicado')} disabled={saving}>✓ Publicar</button>
        )}
      </div>
    </div>
  )
}
