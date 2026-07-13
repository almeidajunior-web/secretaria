import { format, subMonths } from 'date-fns'
import { fmt } from './date'

// All pure functions, no React — the Overview section composes these over
// the full entry list. `monthStr` is always 'yyyy-MM', matching the Overview
// being fixed to the current calendar month regardless of the table's own
// period selector (see financePeriod.js).
export function monthTotals(entries, monthStr) {
  const monthEntries = entries.filter((e) => (e.effectiveDate || e.date)?.startsWith(monthStr))
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

// Essential vs. total expense for a month: how much of the spending was on
// things flagged essential, in absolute value and as a share of expenses.
export function essentialTotals(entries, monthStr) {
  const expenses = entries.filter(
    (e) => e.type === 'expense' && (e.effectiveDate || e.date)?.startsWith(monthStr)
  )
  const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
  const essential = expenses.filter((e) => e.essential).reduce((sum, e) => sum + (e.amount || 0), 0)
  return { essential, total, ratio: total ? essential / total : 0 }
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

// Current balance of one account: its configured starting point plus every
// realized (non-previsto) entry assigned to it. Previstos are excluded on
// purpose — a future entry hasn't moved money yet, so it shouldn't count
// toward what's actually sitting in the account today.
export function accountBalance(entries, account, todayStr) {
  const realized = entries
    .filter((e) => e.accountId === account.id)
    .filter((e) => {
      const effective = e.effectiveDate || e.date
      return effective && effective <= todayStr
    })
    .reduce((sum, e) => sum + (e.type === 'income' ? e.amount || 0 : -(e.amount || 0)), 0)
  return (account.initialBalance || 0) + realized
}

// Realized entries with no account attached still moved real money — they
// count toward the consolidated total under a virtual "sem conta" bucket.
export function unassignedBalance(entries, todayStr) {
  return entries
    .filter((e) => !e.accountId)
    .filter((e) => {
      const effective = e.effectiveDate || e.date
      return effective && effective <= todayStr
    })
    .reduce((sum, e) => sum + (e.type === 'income' ? e.amount || 0 : -(e.amount || 0)), 0)
}

// Sum of every account's balance (optionally skipping reserve accounts,
// e.g. an emergency fund or investment you don't count as "spendable")
// plus whatever realized money has no account attached.
export function consolidatedBalance(entries, accounts, todayStr, { excludeReserve = false } = {}) {
  const relevant = excludeReserve ? accounts.filter((a) => !a.isReserve) : accounts
  const accountsTotal = relevant.reduce((sum, a) => sum + accountBalance(entries, a, todayStr), 0)
  return accountsTotal + unassignedBalance(entries, todayStr)
}

// Trailing average monthly expense over the last `monthsBack` *completed*
// months (current month is excluded — it's still partial and would skew
// the average down).
export function averageMonthlyExpense(entries, monthsBack = 3) {
  if (!monthsBack) return 0
  let total = 0
  for (let i = 1; i <= monthsBack; i++) {
    total += monthTotals(entries, format(subMonths(new Date(), i), 'yyyy-MM')).expense
  }
  return total / monthsBack
}

// How many months of typical spending the emergency reserve would cover.
// Null when there's no reserve account or no expense history to compare
// against — the caller should hide the indicator rather than show "0 meses".
export function reserveMonths(entries, accounts, todayStr, monthsBack = 3) {
  const reserveAccounts = accounts.filter((a) => a.isReserve)
  if (!reserveAccounts.length) return null
  const avgExpense = averageMonthlyExpense(entries, monthsBack)
  if (!avgExpense) return null
  const reserveTotal = reserveAccounts.reduce((sum, a) => sum + accountBalance(entries, a, todayStr), 0)
  return reserveTotal / avgExpense
}
