import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const fmt = (n) => Number(n).toLocaleString('es-MX')
const codeFrom = (id) => id.replace(/-/g, '').slice(0, 6).toUpperCase()
const PRIZES = ['15%', '10%', '5%']
const STATUS = { pendiente: 'Pendiente', validado: 'Validado ✅', descalificado: 'Descalificado' }

const currentPeriod = () => {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
const shiftPeriod = (p, delta) => {
  const [y, m] = p.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
const periodLabel = (p) => {
  const [y, m] = p.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
}

export default function Arcade() {
  const [period, setPeriod] = useState(currentPeriod)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [openUser, setOpenUser] = useState(null)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('arcade_scores')
      .select('id, ig_user, score, duration_ms, status, created_at')
      .eq('period', period)
      .order('score', { ascending: false })
      .limit(500)
    if (error) alert(error.message)
    setRows(data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [period])

  // mejor puntaje vigente (no descalificado) por jugador
  const byUser = new Map()
  for (const r of rows) {
    if (!byUser.has(r.ig_user)) byUser.set(r.ig_user, [])
    byUser.get(r.ig_user).push(r)
  }
  const ranking = [...byUser.entries()]
    .map(([user, list]) => ({ user, list, best: list.find((r) => r.status !== 'descalificado') }))
    .filter((x) => x.best)
    .sort((a, b) => b.best.score - a.best.score || a.best.created_at.localeCompare(b.best.created_at))

  const setStatus = async (row, status) => {
    if (status === 'descalificado' && !confirm(`¿Descalificar este puntaje de @${row.ig_user}?`)) return
    const { error } = await supabase.from('arcade_scores').update({ status }).eq('id', row.id)
    if (error) return alert(error.message)
    load()
  }

  const disqualifyUser = async (user) => {
    if (!confirm(`¿Descalificar TODOS los puntajes de @${user} en ${periodLabel(period)}?`)) return
    const { error } = await supabase.from('arcade_scores').update({ status: 'descalificado' }).eq('period', period).eq('ig_user', user)
    if (error) return alert(error.message)
    load()
  }

  return (
    <div>
      <h2>Arcade · Pinball</h2>
      <div className="row" style={{ alignItems: 'center', marginBottom: 10 }}>
        <button className="btn" onClick={() => setPeriod(shiftPeriod(period, -1))}>←</button>
        <b style={{ flex: 1, textAlign: 'center', textTransform: 'capitalize' }}>{periodLabel(period)}</b>
        <button className="btn" onClick={() => setPeriod(shiftPeriod(period, 1))} disabled={period >= currentPeriod()}>→</button>
      </div>
      <p className="muted small" style={{ marginBottom: 12 }}>
        Para validar: el jugador manda por DM a @TheCardBoxMX la captura con su <b>código</b>. Revisa que el código, el usuario y el puntaje coincidan, y que la duración sea razonable.
      </p>

      {loading ? <p className="muted">Cargando…</p> : ranking.length === 0 ? <p className="muted">Sin puntajes en este mes.</p> : (
        <ul className="list">
          {ranking.slice(0, 30).map(({ user, list, best }, i) => (
            <li key={user} className="card item">
              <div className="item-top" onClick={() => setOpenUser(openUser === user ? null : user)} style={{ cursor: 'pointer' }}>
                <div className="item-info">
                  <div className="item-name">{['🥇', '🥈', '🥉'][i] || `${i + 1}.`} @{user}</div>
                  <div className="muted small">
                    {fmt(best.score)} pts · código <b>{codeFrom(best.id)}</b> · {Math.round(best.duration_ms / 1000)} s de juego · {list.length} partida{list.length === 1 ? '' : 's'}
                  </div>
                  {i < 3 && <div className="small"><b>Premio: {PRIZES[i]} de descuento</b></div>}
                </div>
                <span className={`badge ${best.status === 'validado' ? 's-publicado' : 's-apartado'}`}>{STATUS[best.status]}</span>
              </div>
              <div className="actions">
                <a className="btn ghost" href={`https://instagram.com/${user}`} target="_blank" rel="noopener noreferrer">Ver perfil</a>
                {best.status !== 'validado' && <button className="btn primary" onClick={() => setStatus(best, 'validado')}>Validar</button>}
                {best.status === 'validado' && <button className="btn" onClick={() => setStatus(best, 'pendiente')}>Quitar validación</button>}
                <button className="btn" onClick={() => setStatus(best, 'descalificado')}>Descalificar puntaje</button>
                <button className="btn ghost" onClick={() => disqualifyUser(user)}>Descalificar jugador</button>
              </div>
              {openUser === user && (
                <ul className="plain" style={{ marginTop: 8 }}>
                  {list.map((r) => (
                    <li key={r.id}>
                      <div className="small">
                        <b>{fmt(r.score)}</b> · {codeFrom(r.id)} · {Math.round(r.duration_ms / 1000)} s · {new Date(r.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                      <span className="muted small">{STATUS[r.status]}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
