import { useMemo, useState } from 'react'
import { format, subMonths } from 'date-fns'
import { usePersistentState } from '../../hooks/usePersistentState'
import { useFinanceValuesHidden } from '../../hooks/useFinanceValuesHidden'
import { buildFinanceComparator } from '../../lib/financeSort'
import { filterEntriesByPeriod, shiftPeriod, formatPeriodLabel } from '../../lib/financePeriod'
import { monthTotals, percentChange, categoryBreakdown, monthlyTrend } from '../../lib/financeMetrics'
import FinanceToolbar from './FinanceToolbar'
import OverviewSection from './OverviewSection'
import FinanceTableView from './FinanceTableView'
import FinanceEntryModal from './FinanceEntryModal'
import FinanceSettingsModal from './FinanceSettingsModal'

function filterEntries(entries, filters) {
  return entries.filter((e) => {
    if (filters.types.length && !filters.types.includes(e.type)) return false
    if (filters.categoryIds.length && !filters.categoryIds.includes(e.categoryId)) return false
    if (filters.paymentMethodIds.length && !filters.paymentMethodIds.includes(e.paymentMethodId)) return false
    if (filters.accountIds.length && !filters.accountIds.includes(e.accountId)) return false
    return true
  })
}

const DEFAULT_FILTERS = { categoryIds: [], paymentMethodIds: [], accountIds: [], types: [] }

// Finanças module: a fixed "current month" Overview pinned above an
// interactive, period-browsable table — the two sections are deliberately
// independent (see OverviewSection), matching how the user described the
// layout. Fully independent from every other module's data, including
// Vencimentos — no automatic cross-posting between the two.
export default function Financas({
  entries,
  addEntry,
  updateEntry,
  deleteEntry,
  duplicateEntry,
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
}) {
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
      const list = prev[dimension]
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
  // whatever period/filters the table above is browsing.
  const todayStr = format(new Date(), 'yyyy-MM')
  const prevMonthStr = format(subMonths(new Date(), 1), 'yyyy-MM')
  const currentTotals = useMemo(() => monthTotals(entries, todayStr), [entries, todayStr])
  const previousTotals = useMemo(() => monthTotals(entries, prevMonthStr), [entries, prevMonthStr])
  const incomeChange = percentChange(currentTotals.income, previousTotals.income)
  const expenseChange = percentChange(currentTotals.expense, previousTotals.expense)
  const balanceChange = percentChange(currentTotals.balance, previousTotals.balance)
  const expenseCategoryColorById = useMemo(
    () => Object.fromEntries(expenseCategories.map((c) => [c.id, c.color])),
    [expenseCategories]
  )
  const currentMonthEntries = useMemo(
    () => entries.filter((e) => e.date?.startsWith(todayStr)),
    [entries, todayStr]
  )
  const categoryData = useMemo(
    () => categoryBreakdown(currentMonthEntries, 'expense', categoryLabelById, expenseCategoryColorById),
    [currentMonthEntries, categoryLabelById, expenseCategoryColorById]
  )
  const trendData = useMemo(() => monthlyTrend(entries, 6), [entries])

  const selectAllVisible = () => setSelectedIds(new Set(sortedEntries.map((e) => e.id)))
  const clearSelection = () => setSelectedIds(new Set())

  const bulkSetPaymentMethod = (paymentMethodId) => {
    selectedIds.forEach((id) => updateEntry({ id, paymentMethodId: paymentMethodId || null }))
  }
  const bulkSetAccount = (accountId) => {
    selectedIds.forEach((id) => updateEntry({ id, accountId: accountId || null }))
  }
  const bulkDelete = () => {
    selectedIds.forEach((id) => deleteEntry(id))
    toggleSelectMode()
  }

  const handleQuickAdd = (partial) => {
    addEntry({
      title: '',
      description: '',
      categoryId: null,
      paymentMethodId: null,
      accountId: null,
      amount: 0,
      date: null,
      type: 'expense',
      ...partial,
    })
  }

  return (
    <div className="flex h-full flex-col">
      <FinanceToolbar
        period={period}
        onChangePeriod={setPeriod}
        periodLabel={formatPeriodLabel(referenceDate, period)}
        onPrevPeriod={() => setReferenceDate((d) => shiftPeriod(d, period, -1))}
        onNextPeriod={() => setReferenceDate((d) => shiftPeriod(d, period, 1))}
        onTodayPeriod={() => setReferenceDate(new Date())}
        sortChain={sortChain}
        onToggleSort={toggleSort}
        filters={filters}
        onToggleFilter={toggleFilter}
        onClearFilters={() => setFilters(DEFAULT_FILTERS)}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
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

      <OverviewSection
        currentTotals={currentTotals}
        incomeChange={incomeChange}
        expenseChange={expenseChange}
        balanceChange={balanceChange}
        categoryData={categoryData}
        trendData={trendData}
        valuesHidden={valuesHidden}
        onToggleValuesHidden={toggleValuesHidden}
      />

      <div className="flex-1 overflow-hidden">
        <FinanceTableView
          entries={sortedEntries}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
          paymentMethods={paymentMethods}
          accounts={accounts}
          onUpdateEntry={updateEntry}
          onDeleteClick={deleteEntry}
          onDuplicate={duplicateEntry}
          selectMode={selectMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelectEntry}
          onQuickAdd={handleQuickAdd}
        />
      </div>

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
          accounts={accounts}
          onAddAccount={addAccount}
          onUpdateAccount={updateAccount}
          onDeleteAccount={onDeleteAccount}
          onReorderAccounts={reorderAccounts}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {modalOpen && (
        <FinanceEntryModal
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
          paymentMethods={paymentMethods}
          accounts={accounts}
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
