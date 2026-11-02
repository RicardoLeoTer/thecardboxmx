import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { FALLBACK_CATEGORIES, FALLBACK_ITEMS, FALLBACK_TAGS } from '../data/fallbackCatalog'

const LOCAL = { items: FALLBACK_ITEMS, categories: FALLBACK_CATEGORIES, tags: FALLBACK_TAGS, source: 'local' }

// Lee el catálogo público (vista `catalog`) + categorías + segmentos.
// Sin Supabase configurado o si falla la conexión, usa el catálogo local.
export function useCatalog() {
  const [state, setState] = useState(supabase ? { ...LOCAL, items: [], loading: true } : { ...LOCAL, loading: false })

  useEffect(() => {
    if (!supabase) return
    let alive = true
    Promise.all([
      supabase.from('catalog').select('*'),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('tags').select('*').order('sort_order'),
    ]).then(([items, categories, tags]) => {
      if (!alive) return
      if (items.error || categories.error || tags.error) {
        console.error('Catálogo: error con Supabase, usando respaldo local', items.error || categories.error || tags.error)
        setState({ ...LOCAL, loading: false })
        return
      }
      setState({ items: items.data, categories: categories.data, tags: tags.data, source: 'db', loading: false })
    })
    return () => { alive = false }
  }, [])

  return state
}
