function compareField(a, b, field, categoryLabelById) {
  switch (field) {
    case 'dueDate': {
      const av = a.dueDate || '9999-99-99'
      const bv = b.dueDate || '9999-99-99'
      return av < bv ? -1 : av > bv ? 1 : 0
    }
    case 'amount':
      return (a.amount ?? 0) - (b.amount ?? 0)
    case 'category': {
      // Uncategorized bills always sort last, regardless of direction.
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
// [{ field: 'dueDate', direction: 'asc' }, { field: 'amount', direction: 'desc' }].
// Falls back to due date then title for a stable order.
export function buildBillComparator(sortChain, categoryLabelById) {
  return (a, b) => {
    for (const { field, direction } of sortChain) {
      const cmp = compareField(a, b, field, categoryLabelById)
      if (cmp !== 0) return direction === 'desc' ? -cmp : cmp
    }
    return (
      compareField(a, b, 'dueDate', categoryLabelById) ||
      a.title.localeCompare(b.title, 'pt-BR')
    )
  }
}
