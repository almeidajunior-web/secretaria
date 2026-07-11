// Buckets already-sorted items into per-category sections, ordered
// alphabetically by category label — items without a category land in a
// "Sem classificação" section, always last. Each bucket keeps the items'
// existing relative order (whatever the active sort produced upstream).
export function groupItemsByCategory(items, categories) {
  const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]))
  const buckets = new Map()
  const uncategorized = []

  for (const it of items) {
    const cat = it.categoryId ? categoryById[it.categoryId] : null
    if (!cat) {
      uncategorized.push(it)
      continue
    }
    if (!buckets.has(cat.id)) buckets.set(cat.id, { key: cat.id, label: cat.label, items: [] })
    buckets.get(cat.id).items.push(it)
  }

  const groups = [...buckets.values()].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
  if (uncategorized.length) {
    groups.push({ key: 'semClassificacao', label: 'Sem classificação', items: uncategorized })
  }
  return groups
}
