import { useEffect, useMemo, useState } from 'react'
import { format, subMonths } from 'date-fns'
import { usePersistentState } from '../../hooks/usePersistentState'
import { useFinanceValuesHidden } from '../../hooks/useFinanceValuesHidden'
import { buildFinanceComparator } from '../../lib/financeSort'
import { filterEntriesByPeriod, shiftPeriod, formatPeriodLabel } from '../../lib/financePeriod'
import { withEffectiveDate, currentInvoiceTotal } from '../../lib/creditCard'
import {
  monthTotals,
  percentChange,
  categoryBreakdown,
  monthlyTrend,
  essentialTotals,
} from '../../lib/financeMetrics'
import FinanceToolbar from './FinanceToolbar'
import OverviewSection from './OverviewSection'
import FinanceTable from './FinanceTable'
import FinanceEntryModal from './FinanceEntryModal'
import FinanceSettingsModal from './FinanceSettingsModal'

function filterEntries(entries, filters) {
  return entries.filter((e) => {
    if (filters.types.length && !filters.types.includes(e.type)) return false
    if (filters.categoryIds.length && !filters.categoryIds.includes(e.categoryId)) return false
    if (filters.paymentMethodIds.length && !filters.paymentMethodIds.includes(e.paymentMethodId)) return false
    if (filters.accountIds.length && !filters.accountIds.includes(e.accountId)) return false
    if (filters.tagIds.length && !filters.tagIds.some((t) => (e.tagIds || []).includes(t))) return false
    return true
  })
}

const DEFAULT_FILTERS = { categoryIds: [], paymentMethodIds: [], accountIds: [], tagIds: [], types: [] }

// Finanças module: two tabs (Resumo = métricas + gráficos + tabela recente;
// Lançamentos = tabela completa), both scoped by the period selector. The
// table is an Excel-style grid whose header does the sorting/filtering
// (shared, persisted state). Fully independent from every other module.
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
}) {
  const [tab, setTab] = usePersistentState('secretaria:financeTab', 'resumo')
  const [period, setPeriod] = usePersistentState('secretaria:financePeriod', 'month')
  const [referenceDate, setReferenceDate] = useState(() => new Date())
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

  const periodEntries = useMemo(
    () => filterEntriesByPeriod(entries, period, referenceDate),
    [entries, period, referenceDate]
  )
  const visibleEntries = useMemo(() => filterEntries(periodEntries, filters), [periodEntries, filters])
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
  const currentMonthEntries = useMemo(
    () => entries.filter((e) => (e.effectiveDate || e.date)?.startsWith(monthStr)),
    [entries, monthStr]
  )
  const categoryData = useMemo(
    () => categoryBreakdown(currentMonthEntries, 'expense', categoryLabelById, expenseCategoryColorById),
    [currentMonthEntries, categoryLabelById, expenseCategoryColorById]
  )
  const trendData = useMemo(() => monthlyTrend(entries, 6), [entries])
  const invoice = useMemo(
    () => currentInvoiceTotal(entries, creditCardConfig, todayStr),
    [entries, creditCardConfig, todayStr]
  )

  // Keeps every recurring series topped up with exactly one pending previsto
  // instance — runs after every mutation and once on mount. Idempotent: once
  // a series has its future instance, ensureNextOccurrences is a no-op, so
  // this settles after at most one extra render instead of looping.
  useEffect(() => {
    ensureNextOccurrences((entry) => withEffectiveDate(entry, creditCardConfig))
  }, [entries, creditCardConfig, ensureNextOccurrences])

  const selectAllVisible = () => setSelectedIds(new Set(sortedEntries.map((e) => e.id)))
  const clearSelection = () => setSelectedIds(new Set())

  const entryById = useMemo(() => Object.fromEntries(entries.map((e) => [e.id, e])), [entries])

  // Single centralized point for every entry mutation: merges the (possibly
  // partial) patch onto the current entry, then recomputes effectiveDate —
  // covers inline edits, bulk actions, add and duplicate alike.
  const applyEntryUpdate = (patch) => {
    const source = entryById[patch.id] || {}
    updateEntry(withEffectiveDate({ ...source, ...patch }, creditCardConfig))
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
      ...partial,
    }
    addEntry(withEffectiveDate(base, creditCardConfig))
  }

  const handleDuplicate = (id) => duplicateEntry(id, (entry) => withEffectiveDate(entry, creditCardConfig))

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
        period={period}
        onChangePeriod={setPeriod}
        periodLabel={formatPeriodLabel(referenceDate, period)}
        onPrevPeriod={() => setReferenceDate((d) => shiftPeriod(d, period, -1))}
        onNextPeriod={() => setReferenceDate((d) => shiftPeriod(d, period, 1))}
        onTodayPeriod={() => setReferenceDate(new Date())}
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
            invoice={invoice}
            valuesHidden={valuesHidden}
            onToggleValuesHidden={toggleValuesHidden}
          />
          <div className="px-4 pb-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              Lançamentos do período
            </p>
            <div className="rounded-xl border border-border bg-surface">
              <FinanceTable {...tableProps} entries={sortedEntries.slice(0, 8)} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <FinanceTable {...tableProps} entries={sortedEntries} onQuickAdd={handleQuickAdd} />
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
