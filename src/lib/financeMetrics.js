import { format, subMonths, getDaysInMonth } from 'date-fns'
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

// Share of this month's income left over after expenses. Null when there's
// no income to compare against — a savings rate is meaningless without one.
export function savingsRate(entries, monthStr) {
  const { income, balance } = monthTotals(entries, monthStr)
  return income ? (balance / income) * 100 : null
}

// Share of this month's income already spoken for by recurring ("contas
// fixas") expenses — anything with a recurrence other than 'none'.
export function incomeCommitmentRatio(entries, monthStr) {
  const { income } = monthTotals(entries, monthStr)
  if (!income) return null
  const fixed = entries
    .filter((e) => e.type === 'expense' && e.recurrence && e.recurrence !== 'none')
    .filter((e) => (e.effectiveDate || e.date)?.startsWith(monthStr))
    .reduce((sum, e) => sum + (e.amount || 0), 0)
  return (fixed / income) * 100
}

// monthTotals already includes previstos (it keys off effectiveDate
// regardless of whether that date has arrived yet), so it doubles as the
// "projected end of month" figure; "realized" re-filters down to entries
// whose effective date has actually passed, for a realized-vs-projected
// contrast in the same indicator.
export function projectedMonthBalance(entries, monthStr, todayStr) {
  const projected = monthTotals(entries, monthStr).balance
  const monthEntries = entries.filter((e) => (e.effectiveDate || e.date)?.startsWith(monthStr))
  const realizedEntries = monthEntries.filter((e) => (e.effectiveDate || e.date) <= todayStr)
  const realizedIncome = realizedEntries
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + (e.amount || 0), 0)
  const realizedExpense = realizedEntries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + (e.amount || 0), 0)
  return { projected, realized: realizedIncome - realizedExpense }
}

// Month-to-date daily average expense (realized only) vs. the trailing
// daily average across the last `monthsBack` completed months — flags
// "spending faster than usual" at a glance.
export function averageDailySpend(entries, monthStr, todayStr, monthsBack = 3) {
  const dayOfMonth = Number(todayStr.slice(8, 10)) || 1
  const spentSoFar = entries
    .filter((e) => e.type === 'expense')
    .filter((e) => {
      const effective = e.effectiveDate || e.date
      return effective?.startsWith(monthStr) && effective <= todayStr
    })
    .reduce((sum, e) => sum + (e.amount || 0), 0)
  const current = spentSoFar / dayOfMonth

  let historicalTotal = 0
  let historicalDays = 0
  for (let i = 1; i <= monthsBack; i++) {
    const date = subMonths(new Date(), i)
    historicalTotal += monthTotals(entries, format(date, 'yyyy-MM')).expense
    historicalDays += getDaysInMonth(date)
  }
  const historical = historicalDays ? historicalTotal / historicalDays : 0

  return { current, historical }
}

// Per-month totals for the top-N `type` categories over the trailing
// `monthsBack` months (oldest → newest, ending on the current month) — the
// rest fold into a single "Outros" series instead of growing the legend
// indefinitely, per the categorical-color rule (never a generated hue).
export function categoryMonthlyTrend(entries, type, monthsBack, categoryLabelById, colorById, topN = 5) {
  const monthDates = []
  for (let i = monthsBack - 1; i >= 0; i--) monthDates.push(subMonths(new Date(), i))
  const monthStrs = monthDates.map((d) => format(d, 'yyyy-MM'))

  const totalsByCategory = new Map()
  entries
    .filter((e) => e.type === type && e.categoryId && monthStrs.includes((e.effectiveDate || e.date)?.slice(0, 7)))
    .forEach((e) => totalsByCategory.set(e.categoryId, (totalsByCategory.get(e.categoryId) || 0) + (e.amount || 0)))

  const topIds = [...totalsByCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([id]) => id)
  const series = topIds.map((id) => ({
    categoryId: id,
    label: categoryLabelById[id] || 'Sem categoria',
    color: colorById[id] || '#6B7280',
  }))
  const hasOthers = totalsByCategory.size > topN
  if (hasOthers) series.push({ categoryId: '__others__', label: 'Outros', color: '#9CA3AF' })

  const months = monthDates.map((date, i) => {
    const monthStr = monthStrs[i]
    const monthEntries = entries.filter((e) => e.type === type && (e.effectiveDate || e.date)?.startsWith(monthStr))
    const byCategory = {}
    let knownTotal = 0
    topIds.forEach((id) => {
      const total = monthEntries
        .filter((e) => e.categoryId === id)
        .reduce((sum, e) => sum + (e.amount || 0), 0)
      byCategory[id] = total
      knownTotal += total
    })
    const total = monthEntries.reduce((sum, e) => sum + (e.amount || 0), 0)
    if (hasOthers) byCategory.__others__ = Math.max(total - knownTotal, 0)
    return { month: monthStr, label: fmt(date, 'MMM'), byCategory, total }
  })

  return { series, months }
}

// This month's per-category expense totals against the trailing
// `monthsBack`-month average for that category — positive variance means
// spending more than usual, negative means less.
export function categoryComparison(entries, monthStr, monthsBack, categoryLabelById, colorById) {
  const current = categoryBreakdown(
    entries.filter((e) => (e.effectiveDate || e.date)?.startsWith(monthStr)),
    'expense',
    categoryLabelById,
    colorById
  )

  const averages = new Map()
  for (let i = 1; i <= monthsBack; i++) {
    const pastMonthStr = format(subMonths(new Date(), i), 'yyyy-MM')
    categoryBreakdown(
      entries.filter((e) => (e.effectiveDate || e.date)?.startsWith(pastMonthStr)),
      'expense',
      categoryLabelById,
      colorById
    ).forEach((c) => averages.set(c.categoryId, (averages.get(c.categoryId) || 0) + c.total / monthsBack))
  }

  return current.map((c) => {
    const average = averages.get(c.categoryId) || 0
    const variance = average ? ((c.total - average) / average) * 100 : null
    return { ...c, average, variance }
  })
}
