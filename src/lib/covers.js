// Portada de una colección/liga: carta elegida en Admin → Portadas,
// luego foto propia, luego la primera destacada y, si no, cualquier producto con foto.
export function itemsOfCategory(items, slug) {
  return items.filter((i) => i.category_slug === slug || i.parent_category_slug === slug)
}

export function coverFor(cat, items) {
  const list = itemsOfCategory(items, cat.slug)
  const chosen = cat.cover_product_id && list.find((i) => i.id === cat.cover_product_id && i.cover_image)
  return (
    chosen?.cover_image ||
    cat.image_url ||
    list.find((i) => i.is_featured && i.cover_image)?.cover_image ||
    list.find((i) => i.cover_image)?.cover_image ||
    null
  )
}

// Vitrina del inicio: las elegidas en el admin; si no hay, las más nuevas
// alternando categorías para que no sea puro Pokémon.
export function showcaseItems(items, max = 12) {
  const withPhoto = items.filter((i) => i.cover_image)
  const picked = withPhoto.filter((i) => i.show_on_home)
  if (picked.length) return picked.slice(0, max)
  const byCat = new Map()
  for (const i of [...withPhoto].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))) {
    const k = i.category_slug
    if (!byCat.has(k)) byCat.set(k, [])
    byCat.get(k).push(i)
  }
  const queues = [...byCat.values()]
  const out = []
  while (out.length < max && queues.some((q) => q.length)) {
    for (const q of queues) if (q.length && out.length < max) out.push(q.shift())
  }
  return out
}
