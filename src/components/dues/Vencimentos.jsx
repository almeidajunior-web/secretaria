import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Eye, EyeOff } from 'lucide-react'
import { buildBillComparator } from '../../lib/billSort'
import { groupBillsByDueDate } from '../../lib/billGroups'
import { formatCurrency } from '../../lib/currency'
import { useBillValuesHidden } from '../../hooks/useBillValuesHidden'
import { usePersistentState } from '../../hooks/usePersistentState'
import VencimentosToolbar from './VencimentosToolbar'
import VencimentosListView from './VencimentosListView'
import DuesSettingsModal from './DuesSettingsModal'
import BillModal from './BillModal'

function filterBills(bills, filters) {
  return bills.filter((b) => {
    if (filters.categoryIds.length && !filters.categoryIds.includes(b.categoryId)) return false
    if (filters.hidePaid && b.paid) return false
    return true
  })
}

const DEFAULT_FILTERS = { categoryIds: [], hidePaid: true }

// Vencimentos module: a single list always grouped by due date (that's the
// central organizing concept here, unlike Compras' opt-in category
// grouping), plus a totals summary. Every field is editable inline; the
// bill modal is only an alternate, more visual creation entry point next to
// the quick-add row — same pattern as Compras' "Novo item".
export default function Vencimentos({
  bills,
  addBill,
  updateBill,
  deleteBill,
  togglePaid,
  categories,
  addCategory,
  updateCategory,
  onDeleteCategory,
  reorderCategories,
}) {
  // View/sort/filter preferences persist across module navigation and reloads.
  const [sortChain, setSortChain] = usePersistentState('secretaria:billsSortChain', [
    { field: 'dueDate', direction: 'asc' },
  ])
  const [filters, setFilters] = usePersistentState('secretaria:billsFilters', DEFAULT_FILTERS)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const { hidden: valuesHidden, toggleValuesHidden } = useBillValuesHidden()

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

  const toggleSelectBill = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const categoryLabelById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.label])),
    [categories]
  )
  const comparator = useMemo(
    () => buildBillComparator(sortChain, categoryLabelById),
    [sortChain, categoryLabelById]
  )

  const categoryFilteredBills = useMemo(
    () => bills.filter((b) => !filters.categoryIds.length || filters.categoryIds.includes(b.categoryId)),
    [bills, filters.categoryIds]
  )
  const visibleBills = useMemo(() => filterBills(bills, filters), [bills, filters])
  const sortedBills = useMemo(() => [...visibleBills].sort(comparator), [visibleBills, comparator])
  const groups = useMemo(() => groupBillsByDueDate(sortedBills), [sortedBills])

  // Totals ignore the "ocultar pagas" toggle (a paid total that vanishes
  // the moment you hide paid bills from the list would defeat the point of
  // showing it) but still respect the Classificação filter, since that's a
  // deliberate "only this category" lens the user asked for.
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const monthPrefix = todayStr.slice(0, 7)
  const totalPendenteMes = categoryFilteredBills
    .filter((b) => !b.paid && b.dueDate?.startsWith(monthPrefix))
    .reduce((sum, b) => sum + (b.amount || 0), 0)
  const totalPagoMes = categoryFilteredBills
    .filter((b) => b.paid && b.paidDate?.startsWith(monthPrefix))
    .reduce((sum, b) => sum + (b.amount || 0), 0)
  const totalAtrasado = categoryFilteredBills
    .filter((b) => !b.paid && b.dueDate < todayStr)
    .reduce((sum, b) => sum + (b.amount || 0), 0)

  const selectAllVisible = () => setSelectedIds(new Set(sortedBills.map((b) => b.id)))
  const clearSelection = () => setSelectedIds(new Set())

  const bulkSetCategory = (categoryId) => {
    selectedIds.forEach((id) => updateBill({ id, categoryId: categoryId || null }))
  }
  const bulkTogglePaid = (paid) => {
    selectedIds.forEach((id) => togglePaid(id, paid))
  }
  const bulkDelete = () => {
    selectedIds.forEach((id) => deleteBill(id))
    toggleSelectMode()
  }

  const handleQuickAdd = (partial) => {
    addBill({
      title: '',
      description: '',
      categoryId: null,
      amount: 0,
      dueDate: null,
      paid: false,
      paidDate: null,
      recurrence: 'none',
      seriesId: null,
      ...partial,
    })
  }

  return (
    <div className="flex h-full flex-col">
      <VencimentosToolbar
        sortChain={sortChain}
        onToggleSort={toggleSort}
        filters={filters}
        onToggleFilter={toggleFilter}
        onToggleHidePaid={() => setFilters((f) => ({ ...f, hidePaid: !f.hidePaid }))}
        onClearFilters={() => setFilters(DEFAULT_FILTERS)}
        categories={categories}
        onManageClick={() => setSettingsOpen(true)}
        selectMode={selectMode}
        onToggleSelectMode={toggleSelectMode}
        selectedCount={selectedIds.size}
        onSelectAll={selectAllVisible}
        onClearSelection={clearSelection}
        onBulkSetCategory={bulkSetCategory}
        onBulkTogglePaid={bulkTogglePaid}
        onBulkDeleteClick={bulkDelete}
        onNew={() => setModalOpen(true)}
      />

      <SummaryBar
        totalPendenteMes={totalPendenteMes}
        totalPagoMes={totalPagoMes}
        totalAtrasado={totalAtrasado}
        valuesHidden={valuesHidden}
        onToggleValuesHidden={toggleValuesHidden}
      />

      <div className="flex-1 overflow-hidden">
        <VencimentosListView
          groups={groups}
          categories={categories}
          onTogglePaid={togglePaid}
          onUpdateBill={updateBill}
          onDeleteClick={deleteBill}
          selectMode={selectMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelectBill}
          onQuickAdd={handleQuickAdd}
        />
      </div>

      {settingsOpen && (
        <DuesSettingsModal
          categories={categories}
          onAddCategory={addCategory}
          onUpdateCategory={updateCategory}
          onDeleteCategory={onDeleteCategory}
          onReorderCategories={reorderCategories}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {modalOpen && (
        <BillModal
          categories={categories}
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

// Masks the three totals bank-app style — dots instead of digits, no data
// touched or cleared, purely what's rendered here.
const MASK = 'R$ ••••'

function SummaryBar({
  totalPendenteMes,
  totalPagoMes,
  totalAtrasado,
  valuesHidden,
  onToggleValuesHidden,
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-border bg-app-bg px-4 py-1.5 text-[11px]">
      <button
        type="button"
        onClick={onToggleValuesHidden}
        aria-label={valuesHidden ? 'Mostrar valores' : 'Ocultar valores'}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-accent-soft/60 hover:text-primary"
      >
        {valuesHidden ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
      <span className="text-text-secondary">
        Pendente no mês{' '}
        <span className="font-semibold text-text">
          {valuesHidden ? MASK : formatCurrency(totalPendenteMes)}
        </span>
      </span>
      <span className="text-text-secondary">
        Pago no mês{' '}
        <span className="font-semibold text-text">
          {valuesHidden ? MASK : formatCurrency(totalPagoMes)}
        </span>
      </span>
      {totalAtrasado > 0 && (
        <span className="font-semibold text-danger">
          Atrasado {valuesHidden ? MASK : formatCurrency(totalAtrasado)}
        </span>
      )}
    </div>
  )
}
