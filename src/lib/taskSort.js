// Rank lookup for priorities: array order in the custom list IS the rank
// (first = highest priority). Statuses use the same order for the Kanban
// column layout, but are no longer a sort criterion.
export function rankMap(list) {
  return Object.fromEntries(list.map((x, i) => [x.id, i]))
}

// Position of an item's priority in that ranking; anything unranked sorts
// after every ranked one.
export function rankOf(priorityRank, priorityId) {
  return priorityId != null ? (priorityRank[priorityId] ?? Infinity) : Infinity
}

// Compares two ranks. Two unranked items are a tie — returning
// Infinity - Infinity (NaN) here used to stop the sort chain dead, so the
// due-date/title tiebreakers never ran and those items came out in whatever
// order they happened to be stored.
export function compareRanks(a, b) {
  return a === b ? 0 : a - b
}

function compareField(a, b, field, priorityRank) {
  switch (field) {
    case 'dueDate': {
      // Tasks without a due date always sort last, regardless of direction.
      const av = a.dueDate || '9999-99-99'
      const bv = b.dueDate || '9999-99-99'
      return av < bv ? -1 : av > bv ? 1 : 0
    }
    case 'priority':
      return compareRanks(rankOf(priorityRank, a.priorityId), rankOf(priorityRank, b.priorityId))
    case 'title':
      return a.title.localeCompare(b.title, 'pt-BR')
    default:
      return 0
  }
}

export const DEFAULT_SORT_CHAIN = [{ field: 'dueDate', direction: 'asc' }]

// Fields a stored sort chain may name. 'title' is deliberately absent: it is
// only reachable as the fallback tiebreaker below, never as a chain entry.
const CHAIN_FIELDS = new Set(['dueDate', 'priority'])

// Drops chain entries naming a field the toolbar no longer offers — 'status'
// used to be one. Without this, a chain persisted before its removal would go
// on sorting with no chip rendered to switch it off, since toggleSort is the
// only way to drop an entry and it is only reachable from a rendered chip.
export function sanitizeSortChain(chain) {
  if (!Array.isArray(chain)) return DEFAULT_SORT_CHAIN
  const clean = chain.filter((s) => s && CHAIN_FIELDS.has(s.field))
  return clean.length ? clean : DEFAULT_SORT_CHAIN
}

// Builds a comparator from a hierarchical sort chain, e.g.
// [{ field: 'dueDate', direction: 'asc' }, { field: 'priority', direction: 'desc' }].
// Falls back to due date then title for a stable order when the chain is
// empty or every criterion ties.
export function buildTaskComparator(sortChain, priorityRank) {
  return (a, b) => {
    for (const { field, direction } of sortChain) {
      const cmp = compareField(a, b, field, priorityRank)
      if (cmp !== 0) return direction === 'desc' ? -cmp : cmp
    }
    return (
      compareField(a, b, 'dueDate', priorityRank) ||
      a.title.localeCompare(b.title, 'pt-BR')
    )
  }
}
