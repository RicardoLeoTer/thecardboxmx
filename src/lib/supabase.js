import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Si aún no hay variables de entorno, la tienda usa el catálogo local (src/data/fallbackCatalog.js)
export const supabase = url && key ? createClient(url, key) : null

export const IMAGES_BUCKET = 'product-images'

export const STATUS_LABEL = {
  disponible: 'Disponible',
  publicado: 'Publicado',
  apartado: 'Apartado',
  vendido: 'Vendido',
  retirado: 'Retirado',
}

export const TYPE_LABEL = {
  single: 'Single',
  graded: 'Gradeada',
  sealed: 'Sellado',
  memorabilia: 'Memorabilia',
  accessory: 'Accesorio',
}

export const CHANNELS = [
  ['instagram', 'Instagram'],
  ['whatsapp', 'WhatsApp'],
  ['evento', 'Evento / bazar'],
  ['web', 'Página web'],
  ['facebook', 'Facebook'],
  ['otro', 'Otro'],
]

export const money = (n) =>
  n == null ? '—' : Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })

export const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
