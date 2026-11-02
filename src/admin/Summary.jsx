import { useEffect, useState } from 'react'
import { CHANNELS, money, supabase } from '../lib/supabase'
import { useAdmin } from './AdminApp'

const channelLabel = Object.fromEntries(CHANNELS)

export default function Summary() {
  const { partners } = useAdmin()
  const [days, setDays] = useState(7)
  const [sales, setSales] = useState([])
  const [profit, setProfit] = useState([])
  const [stock, setStock] = useState({ piezas: 0, valor: 0, costo: 0, apartados: 0 })

  useEffect(() => {
    const since = new Date()
    since.setDate(since.getDate() - days)
    supabase
      .from('sales')
      .select('*, products(name, cost)')
      .gte('sold_at', since.toISOString())
      .order('sold_at', { ascending: false })
      .then(({ data }) => setSales(data ?? []))
  }, [days])

  useEffect(() => {
    supabase.from('partner_profit').select('*').then(({ data }) => setProfit(data ?? []))
    supabase
      .from('products')
      .select('price, cost, quantity, status')
      .in('status', ['disponible', 'publicado', 'apartado'])
      .then(({ data }) => {
        const rows = data ?? []
        setStock({
          piezas: rows.reduce((s, r) => s + r.quantity, 0),
          valor: rows.reduce((s, r) => s + r.price * r.quantity, 0),
          costo: rows.reduce((s, r) => s + (r.cost ?? 0) * r.quantity, 0),
          apartados: rows.filter((r) => r.status === 'apartado').length,
        })
      })
  }, [])

  const total = sales.reduce((s, r) => s + r.sale_price * r.quantity, 0)
  const util = sales.reduce((s, r) => s + (r.sale_price - (r.products?.cost ?? 0)) * r.quantity, 0)
  const seller = (id) => partners.find((p) => p.id === id)?.name ?? '—'

  return (
    <div>
      <h2>Resumen</h2>

      <div className="kpis">
        <div className="card kpi"><span>Piezas en stock</span><b>{stock.piezas}</b></div>
        <div className="card kpi"><span>Valor a precio venta</span><b>{money(stock.valor)}</b></div>
        <div className="card kpi"><span>Invertido (costo)</span><b>{money(stock.costo)}</b></div>
        <div className="card kpi"><span>Apartados</span><b>{stock.apartados}</b></div>
      </div>

      <div className="chips">
        {[7, 30, 90].map((d) => (
          <button key={d} className={`chip ${days === d ? 'on' : ''}`} onClick={() => setDays(d)}>{d} días</button>
        ))}
      </div>

      <div className="kpis">
        <div className="card kpi"><span>Vendido</span><b>{money(total)}</b></div>
        <div className="card kpi"><span>Utilidad</span><b>{money(util)}</b></div>
      </div>

      <section className="card">
        <h4>Ventas</h4>
        {sales.length === 0 ? <p className="muted">Sin ventas en este periodo.</p> : (
          <ul className="plain">
            {sales.map((s) => (
              <li key={s.id}>
                <div>
                  <b>{s.products?.name}</b>{s.quantity > 1 && ` x${s.quantity}`}
                  <div className="muted small">
                    {new Date(s.sold_at).toLocaleDateString('es-MX')} · {channelLabel[s.channel]} · vendió {seller(s.sold_by)}
                    {s.customer_name && ` · ${s.customer_name}`}
                  </div>
                </div>
                <b>{money(s.sale_price * s.quantity)}</b>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h4>Utilidad histórica por dueño</h4>
        <ul className="plain">
          {profit.map((p) => (
            <li key={p.owner}>
              <div>
                <b>{p.owner}</b>
                <div className="muted small">{p.piezas_vendidas} ventas · venta {money(p.venta)}</div>
              </div>
              <b>{money(p.utilidad)}</b>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
