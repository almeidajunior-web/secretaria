function compareField(a, b, field, categoryLabelById) {
  switch (field) {
    case 'date': {
      const av = a.date || '9999-99-99'
      const bv = b.date || '9999-99-99'
      return av < bv ? -1 : av > bv ? 1 : 0
    }
    case 'amount':
      return (a.amount ?? 0) - (b.amount ?? 0)
    case 'category': {
      // Uncategorized entries always sort last, regardless of direction.
      const av = a.categoryId ? categoryLabelById[a.categoryId] : null
      const bv = b.categoryId ? categoryLabelById[b.categoryId] : null
      if (!av && !bv) return 0
      if (!av) return 1
      if (!bv) return -1
      return av.localeCompare(bv, 'pt-BR')
    }
    case 'title':
      return a.title.localeCompare(b.title, 'pt-BR')
    default:
      return 0
  }
}

// Builds a comparator from a hierarchical sort chain, e.g.
// [{ field: 'date', direction: 'desc' }, { field: 'amount', direction: 'desc' }].
// Falls back to date then title for a stable order. `categoryLabelById`
// should be a merged map of both expense and income category labels — an
// entry's categoryId points into whichever list matches its `type`, but ids
// never collide across the two lists, so one merged map keeps this sort
// (and the table's category column) agnostic to income vs. expense.
export function buildFinanceComparator(sortChain, categoryLabelById) {
  return (a, b) => {
    for (const { field, direction } of sortChain) {
      const cmp = compareField(a, b, field, categoryLabelById)
      if (cmp !== 0) return direction === 'desc' ? -cmp : cmp
    }
    return (
      compareField(a, b, 'date', categoryLabelById) || a.title.localeCompare(b.title, 'pt-BR')
    )
  }
}
