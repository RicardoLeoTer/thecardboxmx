import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { FALLBACK_CATEGORIES, FALLBACK_ITEMS, FALLBACK_TAGS } from '../data/fallbackCatalog'

const LOCAL = { items: FALLBACK_ITEMS, categories: FALLBACK_CATEGORIES, tags: FALLBACK_TAGS, formats: [], source: 'local' }

// Lee el catálogo público (vista `catalog`) + categorías + segmentos.
// Para que cargue rápido: se guarda una copia en el navegador y se muestra al
// instante en la siguiente visita mientras se actualiza por detrás. Todas las
// secciones comparten una sola descarga.
// Sin Supabase configurado o si falla la conexión, usa el catálogo local.
const CACHE_KEY = 'tcb-catalog-v1'
const CACHE_MAX_AGE = 1000 * 60 * 60 * 24 // copia de máx. 1 día

let memory = null // { data, at }
let inflight = null
const listeners = new Set()

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const c = JSON.parse(raw)
    return Date.now() - c.at < CACHE_MAX_AGE ? c : null
  } catch { return null }
}

function writeCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, at: Date.now() })) } catch { /* sin espacio o modo privado */ }
}

function fetchCatalog() {
  if (inflight) return inflight
  inflight = Promise.all([
    supabase.from('catalog').select('*'),
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('tags').select('*').order('sort_order'),
    supabase.from('sealed_formats').select('*').order('sort_order'),
  ]).then(([items, categories, tags, formats]) => {
    if (items.error || categories.error || tags.error) {
      console.error('Catálogo: error con Supabase, usando respaldo local', items.error || categories.error || tags.error)
      return null
    }
    const data = { items: items.data, categories: categories.data, tags: tags.data, formats: formats.data ?? [], source: 'db' }
    memory = { data, at: Date.now() }
    writeCache(data)
    listeners.forEach((fn) => fn(data))
    return data
  }).finally(() => { setTimeout(() => { inflight = null }, 30000) })
  return inflight
}

export function useCatalog() {
  const [state, setState] = useState(() => {
    if (!supabase) return { ...LOCAL, loading: false }
    const cached = memory ?? readCache()
    if (cached) { memory = cached; return { ...cached.data, loading: false } }
    return { ...LOCAL, items: [], loading: true }
  })

  useEffect(() => {
    if (!supabase) return
    let alive = true
    const onData = (data) => alive && setState({ ...data, loading: false })
    listeners.add(onData)
    // si la copia es reciente (menos de 1 min, misma visita) no vuelve a descargar
    if (!memory || Date.now() - memory.at > 60000) {
      fetchCatalog().then((data) => {
        if (alive && !data) setState((s) => (s.source === 'db' ? s : { ...LOCAL, loading: false }))
      })
    }
    return () => { alive = false; listeners.delete(onData) }
  }, [])

  return state
}
