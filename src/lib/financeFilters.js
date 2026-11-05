// Narrowing the Finanças lançamentos: the column/toolbar filters, the title
// search, and a human description of whatever is active (written into the
// exported spreadsheet).

export const DEFAULT_FINANCE_FILTERS = { categoryIds: [], paymentMethodIds: [], accountIds: [], types: [] }

// Each dimension is read with `|| []` because a filters object persisted by
// an older version may be missing a key added later (types).
export function filterEntries(entries, filters) {
  const types = filters.types || []
  const categoryIds = filters.categoryIds || []
  const paymentMethodIds = filters.paymentMethodIds || []
  const accountIds = filters.accountIds || []
  return entries.filter((e) => {
    if (types.length && !types.includes(e.type)) return false
    if (categoryIds.length && !categoryIds.includes(e.categoryId)) return false
    if (paymentMethodIds.length && !paymentMethodIds.includes(e.paymentMethodId)) return false
    if (accountIds.length && !accountIds.includes(e.accountId)) return false
    return true
  })
}

// Accent- and case-insensitive, so "agua" finds "Água" and "SALARIO" finds
// "Salário" — typing the accents is exactly the friction a search box is
// supposed to remove.
export function normalizeForSearch(text) {
  return (text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

// Substring match on the título.
export function searchEntries(entries, term) {
  const needle = normalizeForSearch(term).trim()
  if (!needle) return entries
  return entries.filter((e) => normalizeForSearch(e.title).includes(needle))
}

// "busca "x"; categoria: Moradia, Lazer; ..." — empty when nothing narrows
// the list.
export function describeFinanceFilters({ search, filters, categories, paymentMethods, accounts }) {
  const labelsOf = (ids, list) => ids.map((id) => list.find((x) => x.id === id)?.label).filter(Boolean)
  const parts = []
  if (search.trim()) parts.push(`busca "${search.trim()}"`)
  const types = (filters.types || []).map((t) => (t === 'income' ? 'Receita' : 'Despesa'))
  if (types.length) parts.push(`tipo: ${types.join(', ')}`)
  const cats = labelsOf(filters.categoryIds || [], categories)
  if (cats.length) parts.push(`categoria: ${cats.join(', ')}`)
  const methods = labelsOf(filters.paymentMethodIds || [], paymentMethods)
  if (methods.length) parts.push(`pagamento: ${methods.join(', ')}`)
  const accs = labelsOf(filters.accountIds || [], accounts)
  if (accs.length) parts.push(`conta: ${accs.join(', ')}`)
  return parts.join('; ')
}
