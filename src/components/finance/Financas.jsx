import { useEffect, useMemo, useState } from 'react'
import { addMonths, format } from 'date-fns'
import { usePersistentState, withDefaults } from '../../hooks/usePersistentState'
import { useSortChain, useSelection, filterToggler } from '../../hooks/useListControls'
import { useFinanceValuesHidden } from '../../hooks/useFinanceValuesHidden'
import { useFinanceOverview } from '../../hooks/useFinanceOverview'
import { buildFinanceComparator, compareByRecordOrder } from '../../lib/financeSort'
import { splitIntoInstallments } from '../../lib/creditCard'
import { buildFinanceSheets, downloadFinanceXlsx } from '../../lib/financeExport'
import { monthAnchor } from '../../lib/financeMetrics'
import {
  DEFAULT_FINANCE_FILTERS,
  filterEntries,
  searchEntries,
  describeFinanceFilters,
} from '../../lib/financeFilters'
import FinanceToolbar from './FinanceToolbar'
import OverviewSection from './OverviewSection'
import FinanceTable from './table/FinanceTable'
import FinanceEntryModal from './FinanceEntryModal'
import FinanceSettingsModal from './FinanceSettingsModal'

// Finanças module: two tabs (Resumo = métricas + gráficos + lançamentos
// recentes; Lançamentos = tabela completa), sharing one month picked in the
// toolbar. The numbers come from useFinanceOverview and the narrowing from
// lib/financeFilters; this component wires them to the screen. Fully
// independent from every other module.
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
  creditCardConfig,
  onUpdateCreditCardConfig,
  paidInvoices,
  onToggleInvoicePaid,
}) {
  const [tab, setTab] = usePersistentState('secretaria:financeTab', 'resumo')
  const [sortChain, toggleSort] = useSortChain('secretaria:financeSortChain', [
    { field: 'date', direction: 'desc' },
  ])
  const [filters, setFilters] = usePersistentState(
    'secretaria:financeFilters',
    DEFAULT_FINANCE_FILTERS,
    withDefaults(DEFAULT_FINANCE_FILTERS)
  )
  // Deliberately not persisted: coming back to a module whose list is silently
  // narrowed by a search you typed days ago reads as missing data, not as a
  // preference. Filters persist; the search resets with the session.
  const [search, setSearch] = useState('')
  // One month for both tabs. Not persisted, same reasoning as the search:
  // reopening Finanças should land on the present, not on whatever month was
  // last browsed. `allMonths` only means something in Lançamentos — the
  // Resumo is always a single month's balance, so it keeps reading `month`.
  const currentMonthStr = format(new Date(), 'yyyy-MM')
  const [month, setMonth] = useState(currentMonthStr)
  const [allMonths, setAllMonths] = useState(false)
  const stepMonth = (delta) => {
    setAllMonths(false)
    setMonth((m) => format(addMonths(monthAnchor(m), delta), 'yyyy-MM'))
  }
  const goToCurrentMonth = () => {
    setAllMonths(false)
    setMonth(currentMonthStr)
  }
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const {
    selectMode,
    selectedIds,
    toggleSelectMode,
    toggleSelected: toggleSelectEntry,
    selectAll,
    clearSelection,
  } = useSelection()
  const { hidden: valuesHidden, toggleValuesHidden } = useFinanceValuesHidden()

  const toggleFilter = filterToggler(setFilters)

  const clearFilters = () => setFilters(DEFAULT_FINANCE_FILTERS)

  const categoryLabelById = useMemo(
    () => Object.fromEntries([...expenseCategories, ...incomeCategories].map((c) => [c.id, c.label])),
    [expenseCategories, incomeCategories]
  )
  // Index into the stored collection, which useFinanceEntries only ever
  // appends to — so this is the order the lançamentos were recorded in, and
  // it's what breaks ties between two entries on the same day.
  const entryOrderById = useMemo(() => {
    const m = new Map()
    entries.forEach((e, i) => m.set(e.id, i))
    return m
  }, [entries])

  const comparator = useMemo(
    () => buildFinanceComparator(sortChain, categoryLabelById, entryOrderById),
    [sortChain, categoryLabelById, entryOrderById]
  )

  const visibleEntries = useMemo(() => filterEntries(entries, filters), [entries, filters])
  // Competência, like every month figure in the Resumo: an entry belongs to
  // the month of its own date, so a card purchase sits in the month it was
  // made, not the month its invoice falls due.
  const monthEntries = useMemo(
    () => visibleEntries.filter((e) => e.date?.startsWith(month)),
    [visibleEntries, month]
  )
  // The search narrows the Lançamentos table only — it's typed in that tab's
  // own toolbar, so letting it reach the Resumo below would quietly change
  // numbers the user isn't looking at.
  const sortedEntries = useMemo(
    () => [...searchEntries(allMonths ? visibleEntries : monthEntries, search)].sort(comparator),
    [allMonths, visibleEntries, monthEntries, search, comparator]
  )

  // "Lançamentos recentes" means the newest ones, so it takes the tail of the
  // canonical record order rather than the head of whatever sort the user
  // happens to have applied to the table — within the month being viewed.
  const recentEntries = useMemo(
    () => [...monthEntries].sort(compareByRecordOrder(entryOrderById)).slice(-10),
    [monthEntries, entryOrderById]
  )

  const overview = useFinanceOverview({
    entries,
    month,
    accounts,
    creditCardConfig,
    paidInvoices,
    categoryLabelById,
    expenseCategories,
  })
  const { todayStr, monthLabel, isCurrentMonth, cutoffStr } = overview

  // Keeps every recurring series topped up with exactly one pending previsto
  // instance — runs after every mutation and once on mount. Idempotent: once
  // a series has its future instance, ensureNextOccurrences is a no-op, so
  // this settles after at most one extra render instead of looping.
  useEffect(() => {
    ensureNextOccurrences()
  }, [entries, ensureNextOccurrences])

  const selectAllVisible = () => selectAll(sortedEntries.map((e) => e.id))

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
      essential: false,
      amount: 0,
      date: null,
      type: 'expense',
      recurrence: 'none',
      recurrenceEnd: null,
      ...rest,
    }
    if (installmentCount && installmentCount >= 2 && base.paymentMethodId === 'credito') {
      splitIntoInstallments(base, installmentCount).forEach((part) => addEntry(part))
    } else {
      addEntry(base)
    }
  }

  const handleDuplicate = (id) => duplicateEntry(id)

  // Exports exactly what the Lançamentos table is showing — month (or all of
  // them), filters, search and sort — and says so in the file, so a total in
  // the spreadsheet is never mistaken for the whole month when it wasn't.
  const [exporting, setExporting] = useState(false)
  const handleExport = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const sheets = buildFinanceSheets({
        entries: sortedEntries,
        periodLabel: allMonths ? 'Todos os meses' : monthLabel,
        filtersLabel: describeFinanceFilters({
          search,
          filters,
          categories: [...expenseCategories, ...incomeCategories],
          paymentMethods,
          accounts,
        }),
        categoryLabelById,
        paymentMethodLabelById: Object.fromEntries(paymentMethods.map((m) => [m.id, m.label])),
        accountLabelById: Object.fromEntries(accounts.map((a) => [a.id, a.label])),
        showAccounts: accounts.length > 0,
        creditCardConfig,
      })
      await downloadFinanceXlsx(sheets, `financas-${allMonths ? 'todos-os-meses' : month}.xlsx`)
    } catch (err) {
      console.error(err)
      window.alert('Não foi possível gerar a planilha. Tente novamente.')
    } finally {
      setExporting(false)
    }
  }

  const tableProps = {
    expenseCategories,
    incomeCategories,
    paymentMethods,
    accounts,
    sortChain,
    onToggleSort: toggleSort,
    filters,
    onToggleFilter: toggleFilter,
    onUpdateEntry: applyEntryUpdate,
    onDeleteClick: deleteEntry,
    onDuplicate: handleDuplicate,
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
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        paymentMethods={paymentMethods}
        accounts={accounts}
        filters={filters}
        onToggleFilter={toggleFilter}
        onClearFilters={clearFilters}
        search={search}
        onSearchChange={setSearch}
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
        monthLabel={monthLabel}
        isCurrentMonth={isCurrentMonth}
        allMonths={allMonths}
        onPrevMonth={() => stepMonth(-1)}
        onNextMonth={() => stepMonth(1)}
        onCurrentMonth={goToCurrentMonth}
        onToggleAllMonths={() => setAllMonths((v) => !v)}
        onExport={handleExport}
        exporting={exporting}
        exportCount={sortedEntries.length}
      />

      {tab === 'resumo' ? (
        <div className="thin-scroll flex-1 overflow-auto">
          {/* One centred column for the whole Resumo — the Overview and the
              "Lançamentos recentes" panel below it share this cap, so they
              can't drift out of alignment with each other. */}
          <div className="mx-auto max-w-[96%]">
            <OverviewSection
              currentTotals={overview.currentTotals}
              incomeChange={overview.incomeChange}
              expenseChange={overview.expenseChange}
              balanceChange={overview.balanceChange}
              essential={overview.essential}
              categoryData={overview.categoryData}
              trendData={overview.trendData}
              invoices={overview.invoices}
              onToggleInvoicePaid={onToggleInvoicePaid}
              accountsSummary={overview.accountsSummary}
              indicators={overview.indicators}
              categoryTrendData={overview.categoryTrendData}
              categoryComparisonData={overview.categoryComparisonData}
              monthLabel={monthLabel}
              balanceAsOf={isCurrentMonth ? null : cutoffStr}
              valuesHidden={valuesHidden}
              onToggleValuesHidden={toggleValuesHidden}
            />
            <div className="px-4 pb-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                Lançamentos recentes
              </p>
              <div className="glass-strong rounded-xl border">
                <FinanceTable {...tableProps} entries={recentEntries} />
              </div>
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
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {modalOpen && (
        <FinanceEntryModal
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
          paymentMethods={paymentMethods}
          accounts={accounts}
          creditCardConfig={creditCardConfig}
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
