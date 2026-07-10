import { TASK_STATUSES } from '../constants'

const statusRank = Object.fromEntries(TASK_STATUSES.map((s, i) => [s.value, i]))

// Priority rank lookup: array order in the custom priority list IS the rank
// (first = highest priority).
export function priorityRankMap(priorities) {
  return Object.fromEntries(priorities.map((p, i) => [p.id, i]))
}

function compareField(a, b, field, priorityRank) {
  switch (field) {
    case 'dueDate': {
      // Tasks without a due date always sort last, regardless of direction.
      const av = a.dueDate || '9999-99-99'
      const bv = b.dueDate || '9999-99-99'
      return av < bv ? -1 : av > bv ? 1 : 0
    }
    case 'priority': {
      const av = a.priorityId != null ? (priorityRank[a.priorityId] ?? Infinity) : Infinity
      const bv = b.priorityId != null ? (priorityRank[b.priorityId] ?? Infinity) : Infinity
      return av - bv
    }
    case 'status': {
      const av = statusRank[a.status] ?? Infinity
      const bv = statusRank[b.status] ?? Infinity
      return av - bv
    }
    case 'title':
      return a.title.localeCompare(b.title, 'pt-BR')
    default:
      return 0
  }
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
      compareField(a, b, 'dueDate', priorityRank) || a.title.localeCompare(b.title, 'pt-BR')
    )
  }
}
