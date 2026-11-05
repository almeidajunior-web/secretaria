import { useMemo } from 'react'
import { endOfMonth, format, subMonths } from 'date-fns'
import { capitalize, fmt } from '../lib/date'
import { creditCardInvoices } from '../lib/creditCard'
import {
  monthAnchor,
  monthTotals,
  percentChange,
  categoryBreakdown,
  monthlyTrend,
  essentialTotals,
  accountBalance,
  unassignedBalance,
  consolidatedBalance,
  reserveMonths,
  savingsRate,
  incomeCommitmentRatio,
  projectedMonthBalance,
  averageDailySpend,
  categoryMonthlyTrend,
  categoryComparison,
} from '../lib/financeMetrics'

// Every number the Finanças "Resumo" shows for one month ('yyyy-MM'), derived
// from the entries with the pure functions in lib/financeMetrics — no screen
// code here, so another interface (the mobile version) can show the same
// figures.
export function useFinanceOverview({
  entries,
  month,
  accounts,
  creditCardConfig,
  paidInvoices,
  categoryLabelById,
  expenseCategories,
}) {
  // `todayStr` stays the real today: it's what decides whether a row is still
  // previsto and which card invoices are open, neither of which changes by
  // looking at another month. `cutoffStr` is the "as of" date for balances —
  // today in the current month, the month's last day anywhere else.
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const monthStr = month
  const anchor = monthAnchor(month)
  const isCurrentMonth = month === format(new Date(), 'yyyy-MM')
  const cutoffStr = isCurrentMonth ? todayStr : format(endOfMonth(anchor), 'yyyy-MM-dd')
  const prevMonthStr = format(subMonths(anchor, 1), 'yyyy-MM')
  const monthLabel = capitalize(fmt(anchor, "MMMM 'de' yyyy"))
  const currentTotals = useMemo(() => monthTotals(entries, monthStr), [entries, monthStr])
  const previousTotals = useMemo(() => monthTotals(entries, prevMonthStr), [entries, prevMonthStr])
  const incomeChange = percentChange(currentTotals.income, previousTotals.income)
  const expenseChange = percentChange(currentTotals.expense, previousTotals.expense)
  const balanceChange = percentChange(currentTotals.balance, previousTotals.balance)
  const essential = useMemo(() => essentialTotals(entries, monthStr), [entries, monthStr])
  const expenseCategoryColorById = useMemo(
    () => Object.fromEntries(expenseCategories.map((c) => [c.id, c.color])),
    [expenseCategories]
  )
  // Competência: the current-month snapshot counts entries by when they were
  // incurred (e.date), so a credit-card purchase shows up in the month it was
  // made — not the month its invoice is due.
  const currentMonthEntries = useMemo(
    () => entries.filter((e) => e.date?.startsWith(monthStr)),
    [entries, monthStr]
  )
  const categoryData = useMemo(
    () => categoryBreakdown(currentMonthEntries, 'expense', categoryLabelById, expenseCategoryColorById),
    [currentMonthEntries, categoryLabelById, expenseCategoryColorById]
  )
  const trendData = useMemo(() => monthlyTrend(entries, 6, anchor), [entries, month]) // eslint-disable-line react-hooks/exhaustive-deps
  const invoices = useMemo(
    () => creditCardInvoices(entries, creditCardConfig, todayStr, paidInvoices),
    [entries, creditCardConfig, todayStr, paidInvoices]
  )
  const hasReserveAccount = accounts.some((a) => a.isReserve)
  // Caixa: account balances count entries by when money actually moves
  // (dataCaixa — the invoice due date for card entries), so a card purchase
  // only leaves the balance once its invoice is due.
  // In another month, this is the balance as it stood on that month's last
  // day — every metric below already takes the cut-off as a plain parameter.
  const accountsSummary = useMemo(
    () => ({
      balances: accounts.map((a) => ({ ...a, balance: accountBalance(entries, a, cutoffStr, creditCardConfig) })),
      unassigned: unassignedBalance(entries, cutoffStr, creditCardConfig),
      consolidated: consolidatedBalance(entries, accounts, cutoffStr, creditCardConfig),
      consolidatedExReserve: hasReserveAccount
        ? consolidatedBalance(entries, accounts, cutoffStr, creditCardConfig, { excludeReserve: true })
        : null,
      reserveMonths: reserveMonths(entries, accounts, cutoffStr, creditCardConfig),
    }),
    [entries, accounts, cutoffStr, creditCardConfig, hasReserveAccount]
  )
  const indicators = useMemo(
    () => ({
      savingsRate: savingsRate(entries, monthStr),
      commitmentRatio: incomeCommitmentRatio(entries, monthStr),
      projection: projectedMonthBalance(entries, monthStr, cutoffStr),
      dailySpend: averageDailySpend(entries, monthStr, cutoffStr),
    }),
    [entries, monthStr, cutoffStr]
  )
  const categoryTrendData = useMemo(
    () => categoryMonthlyTrend(entries, 'expense', 6, categoryLabelById, expenseCategoryColorById, 5, anchor),
    [entries, categoryLabelById, expenseCategoryColorById, month] // eslint-disable-line react-hooks/exhaustive-deps
  )
  const categoryComparisonData = useMemo(
    () => categoryComparison(entries, monthStr, 3, categoryLabelById, expenseCategoryColorById),
    [entries, monthStr, categoryLabelById, expenseCategoryColorById]
  )


  return {
    todayStr,
    monthLabel,
    isCurrentMonth,
    cutoffStr,
    currentTotals,
    incomeChange,
    expenseChange,
    balanceChange,
    essential,
    categoryData,
    trendData,
    invoices,
    accountsSummary,
    indicators,
    categoryTrendData,
    categoryComparisonData,
  }
}
