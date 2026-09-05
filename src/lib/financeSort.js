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
// Falls back to date, then to the order the entries were actually recorded in.
//
// That last tiebreaker is deliberate: entries are typed in while reading a
// bank statement top to bottom, so two lançamentos on the same day should stay
// in the order they were entered — sorting them alphabetically instead broke
// the one-to-one reading against the statement. `entryOrderById` maps entry id
// to its index in the stored collection (which is append-ordered); it stays
// ascending regardless of the chain's direction, since "the order I typed
// them" doesn't invert when you flip the date column.
//
// `categoryLabelById` should be a merged map of both expense and income
// category labels — an entry's categoryId points into whichever list matches
// its `type`, but ids never collide across the two lists, so one merged map
// keeps this sort (and the table's category column) agnostic to income vs.
// expense.
export function buildFinanceComparator(sortChain, categoryLabelById, entryOrderById) {
  const seq = (e) => entryOrderById?.get(e.id) ?? 0
  return (a, b) => {
    for (const { field, direction } of sortChain) {
      const cmp = compareField(a, b, field, categoryLabelById)
      if (cmp !== 0) return direction === 'desc' ? -cmp : cmp
    }
    return compareField(a, b, 'date', categoryLabelById) || seq(a) - seq(b)
  }
}

// The canonical "as recorded" order: by date, then by the order entries were
// added. Independent of whatever sort the user has applied to the table, so
// panels that mean "the most recent lançamentos" get the same answer either
// way.
export function compareByRecordOrder(entryOrderById) {
  return (a, b) => {
    const av = a.date || '9999-99-99'
    const bv = b.date || '9999-99-99'
    if (av !== bv) return av < bv ? -1 : 1
    return (entryOrderById?.get(a.id) ?? 0) - (entryOrderById?.get(b.id) ?? 0)
  }
}
