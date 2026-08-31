function compareField(a, b, field) {
  switch (field) {
    case 'dueDate': {
      const av = a.dueDate || '9999-99-99'
      const bv = b.dueDate || '9999-99-99'
      return av < bv ? -1 : av > bv ? 1 : 0
    }
    case 'amount':
      return (a.amount ?? 0) - (b.amount ?? 0)
    case 'title':
      return a.title.localeCompare(b.title, 'pt-BR')
    default:
      return 0
  }
}

export const DEFAULT_SORT_CHAIN = [{ field: 'dueDate', direction: 'asc' }]

// Fields a stored sort chain may name. 'title' is deliberately absent: it is
// only reachable as the fallback tiebreaker below, never as a chain entry.
// 'category' used to be one too — the category filter already covers that
// need, and sorting by it added a second, redundant way to do the same thing.
const CHAIN_FIELDS = new Set(['dueDate', 'amount'])

// Drops chain entries naming a field the toolbar no longer offers. Without
// this, a chain persisted before 'category' was retired would go on sorting
// by it with no chip left to switch it off — toggleSort is the only way to
// drop an entry, and it's only reachable from a rendered chip.
export function sanitizeSortChain(chain) {
  if (!Array.isArray(chain)) return DEFAULT_SORT_CHAIN
  const clean = chain.filter((s) => s && CHAIN_FIELDS.has(s.field))
  return clean.length ? clean : DEFAULT_SORT_CHAIN
}

// Builds a comparator from a hierarchical sort chain, e.g.
// [{ field: 'dueDate', direction: 'asc' }, { field: 'amount', direction: 'desc' }].
// Falls back to due date then title for a stable order.
export function buildBillComparator(sortChain) {
  return (a, b) => {
    for (const { field, direction } of sortChain) {
      const cmp = compareField(a, b, field)
      if (cmp !== 0) return direction === 'desc' ? -cmp : cmp
    }
    return compareField(a, b, 'dueDate') || a.title.localeCompare(b.title, 'pt-BR')
  }
}
