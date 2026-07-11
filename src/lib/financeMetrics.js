import { format, subMonths } from 'date-fns'
import { fmt } from './date'

// All pure functions, no React — the Overview section composes these over
// the full entry list. `monthStr` is always 'yyyy-MM', matching the Overview
// being fixed to the current calendar month regardless of the table's own
// period selector (see financePeriod.js).
export function monthTotals(entries, monthStr) {
  const monthEntries = entries.filter((e) => e.date?.startsWith(monthStr))
  const income = monthEntries
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + (e.amount || 0), 0)
  const expense = monthEntries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + (e.amount || 0), 0)
  return { income, expense, balance: income - expense }
}

// Returns null when there's nothing to compare against (previous month was
// zero) — the caller should render "novo" instead of a nonsensical
// infinite/undefined percentage.
export function percentChange(current, previous) {
  if (!previous) return null
  return ((current - previous) / previous) * 100
}

export function categoryBreakdown(entries, type, categoryLabelById, colorById) {
  const totals = new Map()
  entries
    .filter((e) => e.type === type && e.categoryId)
    .forEach((e) => {
      totals.set(e.categoryId, (totals.get(e.categoryId) || 0) + (e.amount || 0))
    })
  return [...totals.entries()]
    .map(([categoryId, total]) => ({
      categoryId,
      label: categoryLabelById[categoryId] || 'Sem categoria',
      color: colorById[categoryId] || '#6B7280',
      total,
    }))
    .sort((a, b) => b.total - a.total)
}

// Oldest → newest, ending on the current month.
export function monthlyTrend(entries, monthsBack = 6) {
  const months = []
  for (let i = monthsBack - 1; i >= 0; i--) {
    const date = subMonths(new Date(), i)
    const monthStr = format(date, 'yyyy-MM')
    const { income, expense } = monthTotals(entries, monthStr)
    months.push({ month: monthStr, label: fmt(date, 'MMM'), income, expense })
  }
  return months
}
