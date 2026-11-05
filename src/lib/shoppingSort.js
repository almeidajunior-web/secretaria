import { rankMap, rankOf, compareRanks } from './taskSort'

export { rankMap }

function compareField(a, b, field, priorityRank, categoryLabelById) {
  switch (field) {
    case 'category': {
      // Uncategorized items always sort last, regardless of direction —
      // same convention as Tarefas' due-date sort putting "no date" last.
      const av = a.categoryId ? categoryLabelById[a.categoryId] : null
      const bv = b.categoryId ? categoryLabelById[b.categoryId] : null
      if (!av && !bv) return 0
      if (!av) return 1
      if (!bv) return -1
      return av.localeCompare(bv, 'pt-BR')
    }
    case 'priority':
      return compareRanks(rankOf(priorityRank, a.priorityId), rankOf(priorityRank, b.priorityId))
    case 'title':
      return a.title.localeCompare(b.title, 'pt-BR')
    default:
      return 0
  }
}

// Builds a comparator from a hierarchical sort chain, e.g.
// [{ field: 'category', direction: 'asc' }, { field: 'priority', direction: 'desc' }].
// Falls back to title for a stable order when the chain is empty or ties.
export function buildShoppingComparator(sortChain, priorityRank, categoryLabelById) {
  return (a, b) => {
    for (const { field, direction } of sortChain) {
      const cmp = compareField(a, b, field, priorityRank, categoryLabelById)
      if (cmp !== 0) return direction === 'desc' ? -cmp : cmp
    }
    return a.title.localeCompare(b.title, 'pt-BR')
  }
}
