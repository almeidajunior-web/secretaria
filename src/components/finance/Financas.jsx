import { useEffect, useMemo, useState } from 'react'
import { addMonths, endOfMonth, format, subMonths } from 'date-fns'
import { usePersistentState, withDefaults } from '../../hooks/usePersistentState'
import { useFinanceValuesHidden } from '../../hooks/useFinanceValuesHidden'
import { buildFinanceComparator, compareByRecordOrder } from '../../lib/financeSort'
import { splitIntoInstallments, creditCardInvoices } from '../../lib/creditCard'
import { buildFinanceSheets, downloadFinanceXlsx } from '../../lib/financeExport'
import { capitalize, fmt } from '../../lib/date'
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
} from '../../lib/financeMetrics'
import FinanceToolbar from './FinanceToolbar'
import OverviewSection from './OverviewSection'
import FinanceTable from './FinanceTable'
import FinanceEntryModal from './FinanceEntryModal'
import FinanceSettingsModal from './FinanceSettingsModal'

// Each dimension is read with `|| []` because a filters object persisted by
// an older version may be missing a key added later (types) — reading
// `.length` off an undefined key would otherwise crash the whole module the
// moment any entry is present for the callback to run over.
function filterEntries(entries, filters) {
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

const DEFAULT_FILTERS = { categoryIds: [], paymentMethodIds: [], accountIds: [], types: [] }

// Accent- and case-insensitive substring match on the título, so "agua"
// finds "Água" and "SALARIO" finds "Salário" — typing the accents is exactly
// the friction a search box is supposed to remove.
function normalize(text) {
  return (text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function searchEntries(entries, term) {
  const needle = normalize(term).trim()
  if (!needle) return entries
  return entries.filter((e) => normalize(e.title).includes(needle))
}

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
  creditCardConfig,
  onUpdateCreditCardConfig,
  paidInvoices,
  onToggleInvoicePaid,
}) {
  const [tab, setTab] = usePersistentState('secretaria:financeTab', 'resumo')
  const [sortChain, setSortChain] = usePersistentState('secretaria:financeSortChain', [
    { field: 'date', direction: 'desc' },
  ])
  const [filters, setFilters] = usePersistentState(
    'secretaria:financeFilters',
    DEFAULT_FILTERS,
    withDefaults(DEFAULT_FILTERS)
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

  const clearFilters = () => setFilters(DEFAULT_FILTERS)

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

  // `todayStr` stays the real today: it's what decides whether a row is still
  // previsto and which card invoices are open, neither of which changes by
  // looking at another month. `cutoffStr` is the "as of" date for balances —
  // today in the current month, the month's last day anywhere else.
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const monthStr = month
  const anchor = monthAnchor(month)
  const isCurrentMonth = month === currentMonthStr
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
  const describeActiveFilters = () => {
    const labelsOf = (ids, list) => ids.map((id) => list.find((x) => x.id === id)?.label).filter(Boolean)
    const parts = []
    if (search.trim()) parts.push(`busca "${search.trim()}"`)
    const types = (filters.types || []).map((t) => (t === 'income' ? 'Receita' : 'Despesa'))
    if (types.length) parts.push(`tipo: ${types.join(', ')}`)
    const cats = labelsOf(filters.categoryIds || [], [...expenseCategories, ...incomeCategories])
    if (cats.length) parts.push(`categoria: ${cats.join(', ')}`)
    const methods = labelsOf(filters.paymentMethodIds || [], paymentMethods)
    if (methods.length) parts.push(`pagamento: ${methods.join(', ')}`)
    const accs = labelsOf(filters.accountIds || [], accounts)
    if (accs.length) parts.push(`conta: ${accs.join(', ')}`)
    return parts.join('; ')
  }

  const [exporting, setExporting] = useState(false)
  const handleExport = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const sheets = buildFinanceSheets({
        entries: sortedEntries,
        periodLabel: allMonths ? 'Todos os meses' : monthLabel,
        filtersLabel: describeActiveFilters(),
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
