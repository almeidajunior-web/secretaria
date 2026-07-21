import { useEffect, useMemo, useState } from 'react'
import { format, subMonths } from 'date-fns'
import { usePersistentState } from '../../hooks/usePersistentState'
import { useFinanceValuesHidden } from '../../hooks/useFinanceValuesHidden'
import { buildFinanceComparator } from '../../lib/financeSort'
import { splitIntoInstallments, creditCardInvoices } from '../../lib/creditCard'
import {
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
} from '../../lib/financeMetrics'
import FinanceToolbar from './FinanceToolbar'
import OverviewSection from './OverviewSection'
import FinanceTable from './FinanceTable'
import FinanceEntryModal from './FinanceEntryModal'
import FinanceSettingsModal from './FinanceSettingsModal'

// Each dimension is read with `|| []` because a filters object persisted by
// an older version may be missing a key added later (tagIds/types) — reading
// `.length` off an undefined key would otherwise crash the whole module the
// moment any entry is present for the callback to run over.
function filterEntries(entries, filters) {
  const types = filters.types || []
  const categoryIds = filters.categoryIds || []
  const paymentMethodIds = filters.paymentMethodIds || []
  const accountIds = filters.accountIds || []
  const tagIds = filters.tagIds || []
  return entries.filter((e) => {
    if (types.length && !types.includes(e.type)) return false
    if (categoryIds.length && !categoryIds.includes(e.categoryId)) return false
    if (paymentMethodIds.length && !paymentMethodIds.includes(e.paymentMethodId)) return false
    if (accountIds.length && !accountIds.includes(e.accountId)) return false
    if (tagIds.length && !tagIds.some((t) => (e.tagIds || []).includes(t))) return false
    return true
  })
}

const DEFAULT_FILTERS = { categoryIds: [], paymentMethodIds: [], accountIds: [], tagIds: [], types: [] }

// Finanças module: two tabs (Resumo = métricas + gráficos + tabela recente;
// Lançamentos = tabela completa). There's no period selector — the Overview
// is a fixed current-month snapshot, and the Lançamentos table shows every
// entry, narrowed via the column header filters/sort (shared, persisted
// state). Fully independent from every other module.
export default function Financas({
  entries,
  addEntry,
  updateEntry,
  deleteEntry,
  duplicateEntry,
  ensureNextOccurrences,
  expenseCategories,
  addExpenseCategory,
  updateExpenseCategory,
  onDeleteExpenseCategory,
  reorderExpenseCategories,
  incomeCategories,
  addIncomeCategory,
  updateIncomeCategory,
  onDeleteIncomeCategory,
  reorderIncomeCategories,
  paymentMethods,
  addPaymentMethod,
  updatePaymentMethod,
  onDeletePaymentMethod,
  reorderPaymentMethods,
  accounts,
  addAccount,
  updateAccount,
  onDeleteAccount,
  reorderAccounts,
  tags,
  addTag,
  updateTag,
  onDeleteTag,
  reorderTags,
  creditCardConfig,
  onUpdateCreditCardConfig,
  paidInvoices,
  onToggleInvoicePaid,
}) {
  const [tab, setTab] = usePersistentState('secretaria:financeTab', 'resumo')
  const [sortChain, setSortChain] = usePersistentState('secretaria:financeSortChain', [
    { field: 'date', direction: 'desc' },
  ])
  const [filters, setFilters] = usePersistentState('secretaria:financeFilters', DEFAULT_FILTERS)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const { hidden: valuesHidden, toggleValuesHidden } = useFinanceValuesHidden()

  const toggleSort = (field) => {
    setSortChain((prev) => {
      const idx = prev.findIndex((s) => s.field === field)
      if (idx === -1) return [...prev, { field, direction: 'asc' }]
      if (prev[idx].direction === 'asc') {
        const next = [...prev]
        next[idx] = { field, direction: 'desc' }
        return next
      }
      return prev.filter((s) => s.field !== field)
    })
  }

  const toggleFilter = (dimension, value) => {
    setFilters((prev) => {
      const list = prev[dimension] || []
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
      return { ...prev, [dimension]: next }
    })
  }

  const toggleSelectMode = () => {
    setSelectMode((v) => !v)
    setSelectedIds(new Set())
  }

  const toggleSelectEntry = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const categoryLabelById = useMemo(
    () => Object.fromEntries([...expenseCategories, ...incomeCategories].map((c) => [c.id, c.label])),
    [expenseCategories, incomeCategories]
  )
  const comparator = useMemo(
    () => buildFinanceComparator(sortChain, categoryLabelById),
    [sortChain, categoryLabelById]
  )

  const visibleEntries = useMemo(() => filterEntries(entries, filters), [entries, filters])
  const sortedEntries = useMemo(() => [...visibleEntries].sort(comparator), [visibleEntries, comparator])

  // Overview always reflects the true current month, independent of
  // whatever period/filters the table below is browsing.
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const monthStr = format(new Date(), 'yyyy-MM')
  const prevMonthStr = format(subMonths(new Date(), 1), 'yyyy-MM')
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
  const trendData = useMemo(() => monthlyTrend(entries, 6), [entries])
  const invoices = useMemo(
    () => creditCardInvoices(entries, creditCardConfig, todayStr, paidInvoices),
    [entries, creditCardConfig, todayStr, paidInvoices]
  )
  const hasReserveAccount = accounts.some((a) => a.isReserve)
  // Caixa: account balances count entries by when money actually moves
  // (dataCaixa — the invoice due date for card entries), so a card purchase
  // only leaves the balance once its invoice is due.
  const accountsSummary = useMemo(
    () => ({
      balances: accounts.map((a) => ({ ...a, balance: accountBalance(entries, a, todayStr, creditCardConfig) })),
      unassigned: unassignedBalance(entries, todayStr, creditCardConfig),
      consolidated: consolidatedBalance(entries, accounts, todayStr, creditCardConfig),
      consolidatedExReserve: hasReserveAccount
        ? consolidatedBalance(entries, accounts, todayStr, creditCardConfig, { excludeReserve: true })
        : null,
      reserveMonths: reserveMonths(entries, accounts, todayStr, creditCardConfig),
    }),
    [entries, accounts, todayStr, creditCardConfig, hasReserveAccount]
  )
  const indicators = useMemo(
    () => ({
      savingsRate: savingsRate(entries, monthStr),
      commitmentRatio: incomeCommitmentRatio(entries, monthStr),
      projection: projectedMonthBalance(entries, monthStr, todayStr),
      dailySpend: averageDailySpend(entries, monthStr, todayStr),
    }),
    [entries, monthStr, todayStr]
  )
  const categoryTrendData = useMemo(
    () => categoryMonthlyTrend(entries, 'expense', 6, categoryLabelById, expenseCategoryColorById),
    [entries, categoryLabelById, expenseCategoryColorById]
  )
  const categoryComparisonData = useMemo(
    () => categoryComparison(entries, monthStr, 3, categoryLabelById, expenseCategoryColorById),
    [entries, monthStr, categoryLabelById, expenseCategoryColorById]
  )

  // Keeps every recurring series topped up with exactly one pending previsto
  // instance — runs after every mutation and once on mount. Idempotent: once
  // a series has its future instance, ensureNextOccurrences is a no-op, so
  // this settles after at most one extra render instead of looping.
  useEffect(() => {
    ensureNextOccurrences()
  }, [entries, ensureNextOccurrences])

  const selectAllVisible = () => setSelectedIds(new Set(sortedEntries.map((e) => e.id)))
  const clearSelection = () => setSelectedIds(new Set())

  const entryById = useMemo(() => Object.fromEntries(entries.map((e) => [e.id, e])), [entries])

  // Single centralized point for every inline/bulk entry edit: merges the
  // (possibly partial) patch onto the current entry. No derived date to keep
  // in sync — the invoice due date is computed on demand from date + config.
  const applyEntryUpdate = (patch) => {
    const source = entryById[patch.id] || {}
    updateEntry({ ...source, ...patch })
  }

  const bulkSetPaymentMethod = (paymentMethodId) => {
    selectedIds.forEach((id) => applyEntryUpdate({ id, paymentMethodId: paymentMethodId || null }))
  }
  const bulkSetAccount = (accountId) => {
    selectedIds.forEach((id) => applyEntryUpdate({ id, accountId: accountId || null }))
  }
  const bulkDelete = () => {
    selectedIds.forEach((id) => deleteEntry(id))
    toggleSelectMode()
  }

  const handleQuickAdd = (partial) => {
    const { installmentCount, ...rest } = partial
    const base = {
      title: '',
      description: '',
      categoryId: null,
      paymentMethodId: null,
      accountId: null,
      tagIds: [],
      essential: false,
      amount: 0,
      date: null,
      type: 'expense',
      recurrence: 'none',
      ...rest,
    }
    if (installmentCount && installmentCount >= 2 && base.paymentMethodId === 'credito') {
      splitIntoInstallments(base, installmentCount).forEach((part) => addEntry(part))
    } else {
      addEntry(base)
    }
  }

  const handleDuplicate = (id) => duplicateEntry(id)

  const tableProps = {
    expenseCategories,
    incomeCategories,
    paymentMethods,
    accounts,
    tags,
    sortChain,
    onToggleSort: toggleSort,
    filters,
    onToggleFilter: toggleFilter,
    onUpdateEntry: applyEntryUpdate,
    onDeleteClick: deleteEntry,
    onDuplicate: handleDuplicate,
    onCreateTag: addTag,
    selectMode,
    selectedIds,
    onToggleSelect: toggleSelectEntry,
    today: todayStr,
    creditCardConfig,
  }

  return (
    <div className="flex h-full flex-col">
      <FinanceToolbar
        tab={tab}
        onChangeTab={setTab}
        paymentMethods={paymentMethods}
        accounts={accounts}
        onManageClick={() => setSettingsOpen(true)}
        selectMode={selectMode}
        onToggleSelectMode={toggleSelectMode}
        selectedCount={selectedIds.size}
        onSelectAll={selectAllVisible}
        onClearSelection={clearSelection}
        onBulkSetPaymentMethod={bulkSetPaymentMethod}
        onBulkSetAccount={bulkSetAccount}
        onBulkDeleteClick={bulkDelete}
        onNew={() => setModalOpen(true)}
      />

      {tab === 'resumo' ? (
        <div className="thin-scroll flex-1 overflow-auto">
          <OverviewSection
            currentTotals={currentTotals}
            incomeChange={incomeChange}
            expenseChange={expenseChange}
            balanceChange={balanceChange}
            essential={essential}
            categoryData={categoryData}
            trendData={trendData}
            invoices={invoices}
            onToggleInvoicePaid={onToggleInvoicePaid}
            accountsSummary={accountsSummary}
            indicators={indicators}
            categoryTrendData={categoryTrendData}
            categoryComparisonData={categoryComparisonData}
            valuesHidden={valuesHidden}
            onToggleValuesHidden={toggleValuesHidden}
          />
          <div className="px-4 pb-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              Lançamentos recentes
            </p>
            <div className="rounded-xl border border-border bg-surface">
              <FinanceTable {...tableProps} entries={sortedEntries.slice(0, 8)} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <FinanceTable {...tableProps} entries={sortedEntries} onQuickAdd={handleQuickAdd} groupInstallments />
        </div>
      )}

      {settingsOpen && (
        <FinanceSettingsModal
          expenseCategories={expenseCategories}
          onAddExpenseCategory={addExpenseCategory}
          onUpdateExpenseCategory={updateExpenseCategory}
          onDeleteExpenseCategory={onDeleteExpenseCategory}
          onReorderExpenseCategories={reorderExpenseCategories}
          incomeCategories={incomeCategories}
          onAddIncomeCategory={addIncomeCategory}
          onUpdateIncomeCategory={updateIncomeCategory}
          onDeleteIncomeCategory={onDeleteIncomeCategory}
          onReorderIncomeCategories={reorderIncomeCategories}
          paymentMethods={paymentMethods}
          onAddPaymentMethod={addPaymentMethod}
          onUpdatePaymentMethod={updatePaymentMethod}
          onDeletePaymentMethod={onDeletePaymentMethod}
          onReorderPaymentMethods={reorderPaymentMethods}
          creditCardConfig={creditCardConfig}
          onUpdateCreditCardConfig={onUpdateCreditCardConfig}
          accounts={accounts}
          onAddAccount={addAccount}
          onUpdateAccount={updateAccount}
          onDeleteAccount={onDeleteAccount}
          onReorderAccounts={reorderAccounts}
          tags={tags}
          onAddTag={addTag}
          onUpdateTag={updateTag}
          onDeleteTag={onDeleteTag}
          onReorderTags={reorderTags}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {modalOpen && (
        <FinanceEntryModal
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
          paymentMethods={paymentMethods}
          accounts={accounts}
          tags={tags}
          creditCardConfig={creditCardConfig}
          onCreateTag={addTag}
          onSave={(data) => {
            handleQuickAdd(data)
            setModalOpen(false)
          }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
