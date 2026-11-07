import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { coverFor, itemsOfCategory, showcaseItems } from '../lib/covers.js'

const C = {
  platino: '#c0ccd8',
  acero: '#8898b0',
  azul: '#101a2e',
  azulAcento: '#1a6a8a',
  carbon: '#0d1117',
  negro: '#060608',
  fuego: '#e05c2a',
}

const LOOK = {
  pokemon: ['⚡', '#b8860b'],
  naruto: ['🍥', '#c2410c'],
  'one-piece': ['🏴‍☠️', '#9f1239'],
  mlb: ['⚾', '#1d4ed8'],
  nfl: ['🏈', '#166534'],
  nba: ['🏀', '#c2410c'],
  futbol: ['⚽', '#0f766e'],
  ufc: ['🥊', '#991b1b'],
  deportes: ['🏆', '#1a6a8a'],
}

const money = (n) => (n == null ? 'Consultar' : `$${Number(n).toLocaleString('es-MX')}`)

const Kicker = ({ children, color = C.azulAcento }) => (
  <span className="font-body" style={{ fontSize: 13, fontWeight: 700, color, letterSpacing: 3, textTransform: 'uppercase' }}>{children}</span>
)

/* ------------------------------------------------------------------
   ¿QUÉ BUSCAS?  Accesos directos a cada colección / liga con producto
------------------------------------------------------------------- */
export function QueBuscas({ catalog }) {
  const navigate = useNavigate()
  const { items, categories, loading } = catalog
  const active = categories.filter((c) => c.is_active !== false)
  const roots = active.filter((c) => !c.parent_id)
  const kids = (id) => active.filter((c) => c.parent_id === id)

  // TCGs sin subcategorías + cada liga de deportes, solo si tienen producto
  const tiles = roots
    .flatMap((r) => (kids(r.id).length ? kids(r.id).map((c) => ({ cat: c, path: `${r.slug}/${c.slug}` })) : [{ cat: r, path: r.slug }]))
    .filter(({ cat }) => itemsOfCategory(items, cat.slug).length > 0)
  const offers = items.filter((i) => i.is_on_sale).length

  if (loading || !tiles.length) return null

  return (
    <section style={{ padding: '72px 20px 40px', background: C.negro }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Kicker>Encuentra lo tuyo</Kicker>
          <h2 className="font-display" style={{ fontSize: 'clamp(30px, 6vw, 48px)', fontWeight: 600, color: '#fff', marginTop: 12, letterSpacing: -1 }}>
            ¿Qué buscas?
          </h2>
        </div>
        <div className="qb-grid">
          {tiles.map(({ cat, path }) => {
            const [icon, color] = LOOK[cat.slug] || ['🃏', C.azulAcento]
            const img = coverFor(cat, items)
            return (
              <button key={cat.slug} className="qb-tile card-hover" onClick={() => navigate(`/catalogo/${path}`)}
                style={{ background: `radial-gradient(circle at 50% 35%, ${color}55 0%, transparent 70%), linear-gradient(160deg, ${color}33, ${C.carbon})` }}>
                {img && <img src={img} alt="" loading="lazy" decoding="async" />}
                <span className="qb-shade" />
                <span className="qb-label font-display"><span className="qb-icon">{icon}</span>{cat.name}</span>
              </button>
            )
          })}
          {offers > 0 && (
            <button className="qb-tile card-hover" onClick={() => navigate('/catalogo/ofertas')}
              style={{ background: 'linear-gradient(160deg, rgba(194,65,12,0.55), #0d1117)' }}>
              <span className="qb-shade" />
              <span className="qb-label font-display"><span className="qb-icon">🔥</span>Ofertas</span>
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------
   VITRINA: banda de cartas que se desplaza sola. Se pausa al tocarla
   o pasar el mouse, y también se puede deslizar con el dedo.
------------------------------------------------------------------- */
function useAutoScroll(ref, enabled, speed = 38) {
  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    let paused = false
    let resumeT
    let pos = el.scrollLeft
    let last = performance.now()
    let raf
    const half = () => el.scrollWidth / 2
    const tick = (now) => {
      const dt = Math.min(now - last, 64) / 1000
      last = now
      if (!paused && half() > el.clientWidth / 2) {
        pos += speed * dt
        if (pos >= half()) pos -= half()
        el.scrollLeft = pos
      }
      raf = requestAnimationFrame(tick)
    }
    const pause = () => { paused = true; clearTimeout(resumeT) }
    const resume = (delay) => {
      clearTimeout(resumeT)
      resumeT = setTimeout(() => {
        // retoma desde donde lo dejó la persona, dentro del rango repetido
        pos = el.scrollLeft
        if (pos >= half()) pos -= half()
        if (pos <= 0) pos += half()
        paused = false
      }, delay)
    }
    const onEnter = (e) => { if (e.pointerType === 'mouse') pause() }
    const onLeave = (e) => { if (e.pointerType === 'mouse') resume(300) }
    const onTouchStart = () => pause()
    const onTouchEnd = () => resume(2500)
    const onWheel = () => { pause(); resume(2000) }
    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointerleave', onLeave)
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('wheel', onWheel, { passive: true })
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(resumeT)
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointerleave', onLeave)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('wheel', onWheel)
    }
  }, [ref, enabled, speed])
}

export function Vitrina({ catalog, fallback = [] }) {
  const navigate = useNavigate()
  const ref = useRef(null)
  const fromDb = showcaseItems(catalog.items, 12).map((i) => ({
    key: i.id, name: i.name, sub: i.category_name, image: i.cover_image, price: money(i.price),
    onClick: () => navigate(i.slug ? `/carta/${i.slug}` : '/catalogo'),
  }))
  const list = fromDb.length
    ? fromDb
    : catalog.loading ? [] : fallback.map((c) => ({ key: c.name, name: c.name, sub: c.set, image: c.image, price: c.tag, onClick: () => navigate('/catalogo') }))

  useAutoScroll(ref, list.length > 2)

  if (!list.length) return null
  // la lista se repite para que el desplazamiento sea infinito
  const loop = list.length > 2 ? [...list, ...list] : list

  return (
    <section style={{ padding: '56px 0 96px', background: `linear-gradient(180deg, ${C.negro} 0%, ${C.carbon} 50%, ${C.negro} 100%)` }}>
      <div style={{ textAlign: 'center', marginBottom: 28, padding: '0 20px' }}>
        <Kicker>En vitrina</Kicker>
        <h2 className="font-display" style={{ fontSize: 'clamp(30px, 6vw, 48px)', fontWeight: 600, color: '#fff', marginTop: 12, letterSpacing: -1 }}>
          Piezas que no duran
        </h2>
      </div>

      <div className="vitrina" ref={ref} aria-label="Cartas en vitrina">
        {loop.map((c, idx) => (
          <button key={`${c.key}-${idx}`} className="vitrina-card card-hover" onClick={c.onClick} aria-hidden={idx >= list.length ? 'true' : undefined} tabIndex={idx >= list.length ? -1 : 0}>
            <div className="vitrina-img"><img src={c.image} alt={c.name} loading="lazy" decoding="async" draggable="false" /></div>
            <div className="vitrina-info">
              <span className="vitrina-name font-display">{c.name}</span>
              {c.sub && <span className="vitrina-sub font-body">{c.sub}</span>}
              <span className="vitrina-price font-body">{c.price}</span>
            </div>
          </button>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 36 }}>
        <span className="btn btn-primary font-body" style={{ fontSize: 15, fontWeight: 700, color: '#fff', background: C.azulAcento, padding: '15px 32px', borderRadius: 100, cursor: 'pointer' }} onClick={() => navigate('/catalogo')}>
          Ver catálogo completo →
        </span>
      </div>
    </section>
  )
}

export const showcaseCss = `
  .qb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; }
  @media (max-width: 560px) { .qb-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; } }
  .qb-tile { position: relative; height: 150px; border-radius: 18px; overflow: hidden; cursor: pointer; padding: 0;
    border: 1px solid rgba(192,204,216,0.14); box-shadow: 0 8px 24px rgba(0,0,0,0.4); color: #fff; text-align: left; }
  .qb-tile img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 30%; opacity: 0.8; }
  .qb-shade { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 35%, rgba(6,6,8,0.92) 100%); }
  .qb-label { position: absolute; left: 14px; right: 14px; bottom: 12px; font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
  .qb-icon { font-size: 18px; }

  .vitrina { display: flex; gap: 16px; overflow-x: auto; padding: 8px 20px 18px; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
  .vitrina::-webkit-scrollbar { display: none; }
  .vitrina-card { flex: 0 0 178px; border-radius: 18px; overflow: hidden; cursor: pointer; padding: 0; text-align: left; color: #fff;
    background: linear-gradient(165deg, #101a2e, #0d1117); border: 1px solid rgba(192,204,216,0.12); box-shadow: 0 12px 32px rgba(0,0,0,0.45); }
  .vitrina-img { aspect-ratio: 3 / 4; display: grid; place-items: center; padding: 10px;
    background: radial-gradient(circle at 50% 40%, rgba(26,106,138,0.35) 0%, transparent 70%); }
  .vitrina-img img { max-width: 100%; max-height: 100%; object-fit: contain; filter: drop-shadow(0 8px 18px rgba(0,0,0,0.5)); user-select: none; }
  .vitrina-info { padding: 10px 12px 14px; display: flex; flex-direction: column; gap: 3px; }
  .vitrina-name { font-size: 15px; font-weight: 600; line-height: 1.2; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .vitrina-sub { font-size: 12px; color: #8898b0; }
  .vitrina-price { font-size: 14px; font-weight: 800; color: #c0ccd8; margin-top: 2px; }
  @media (min-width: 900px) { .vitrina-card { flex-basis: 210px; } }
`
