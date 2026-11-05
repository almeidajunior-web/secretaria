import { useState } from 'react'
import { Settings, ListChecks, Download, Loader2 } from 'lucide-react'
import MonthStepper from './toolbar/MonthStepper'
import SearchField from './toolbar/SearchField'
import FilterPopover from './toolbar/FilterPopover'
import BulkActionsBar from './toolbar/BulkActionsBar'
const TABS = [
  { value: 'resumo', label: 'Resumo' },
  { value: 'lancamentos', label: 'Lançamentos' },
]

// Just the tab switcher (Resumo/Lançamentos) plus the settings/select/new
// actions, and — only in Lançamentos — a Filtros popover mirroring Tarefas'.
// It sets the same `filters` state FinanceTable's own column-header filters
// already read and write (src/components/finance/FinanceTable.jsx's
// `HeaderCell`), so this is a second, more visible entry point onto shared
// state — not a separate filter of its own. The Resumo tab keeps no period
// selector: it's a fixed current-month snapshot. While `selectMode` is active
// the toolbar body swaps for the bulk-actions bar.
export default function FinanceToolbar({
  tab,
  onChangeTab,
  expenseCategories,
  incomeCategories,
  paymentMethods,
  accounts,
  filters,
  onToggleFilter,
  onClearFilters,
  search,
  onSearchChange,
  onManageClick,
  selectMode,
  onToggleSelectMode,
  selectedCount,
  onSelectAll,
  onClearSelection,
  onBulkSetPaymentMethod,
  onBulkSetAccount,
  onBulkDeleteClick,
  onNew,
  monthLabel,
  isCurrentMonth,
  allMonths,
  onPrevMonth,
  onNextMonth,
  onCurrentMonth,
  onToggleAllMonths,
  onExport,
  exporting,
  exportCount,
}) {
  const [filterOpen, setFilterOpen] = useState(false)

  if (selectMode) {
    return (
      <BulkActionsBar
        selectedCount={selectedCount}
        onSelectAll={onSelectAll}
        onClearSelection={onClearSelection}
        paymentMethods={paymentMethods}
        accounts={accounts}
        onBulkSetPaymentMethod={onBulkSetPaymentMethod}
        onBulkSetAccount={onBulkSetAccount}
        onBulkDeleteClick={onBulkDeleteClick}
        onCancel={onToggleSelectMode}
      />
    )
  }

  const activeFilterCount =
    (filters?.types?.length || 0) +
    (filters?.categoryIds?.length || 0) +
    (filters?.paymentMethodIds?.length || 0) +
    (filters?.accountIds?.length || 0)

  return (
    <div className="relative z-30 flex shrink-0 flex-wrap items-center gap-3 glass border-b px-4 py-2.5">
      <div className="flex items-center rounded-lg border border-border bg-inset p-0.5">
        {TABS.map((t) => {
          const active = t.value === tab
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onChangeTab(t.value)}
              className={[
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                active ? 'bg-primary text-white' : 'text-text-secondary hover:text-text',
              ].join(' ')}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <MonthStepper
        // The Resumo is always one month's balance, so "todos os meses" is a
        // Lançamentos-only view — the Resumo keeps showing the month itself.
        title={tab === 'lancamentos' && allMonths ? 'Todos os meses' : monthLabel}
        showToday={!isCurrentMonth || (tab === 'lancamentos' && allMonths)}
        onPrev={onPrevMonth}
        onNext={onNextMonth}
        onToday={onCurrentMonth}
      />

      {tab === 'lancamentos' && (
        <>
          <button
            type="button"
            onClick={onToggleAllMonths}
            aria-pressed={allMonths}
            className={[
              'rounded-full border px-2.5 py-1 text-[11px] font-medium',
              allMonths
                ? 'border-primary bg-accent-soft text-primary'
                : 'border-border text-text-secondary hover:border-border-strong',
            ].join(' ')}
          >
            Todos os meses
          </button>
          <FilterPopover
            open={filterOpen}
            onOpenChange={setFilterOpen}
            filters={filters}
            onToggleFilter={onToggleFilter}
            onClearFilters={onClearFilters}
            expenseCategories={expenseCategories}
            incomeCategories={incomeCategories}
            paymentMethods={paymentMethods}
            accounts={accounts}
            activeFilterCount={activeFilterCount}
          />
          <SearchField value={search} onChange={onSearchChange} />
        </>
      )}

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onManageClick}
          aria-label="Configurações"
          className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted hover:bg-accent-soft/50 hover:text-primary"
        >
          <Settings size={15} />
        </button>
        <button
          type="button"
          onClick={onToggleSelectMode}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:border-border-strong"
        >
          <ListChecks size={13} />
          Selecionar
        </button>
        {tab === 'lancamentos' && (
          <button
            type="button"
            onClick={onExport}
            disabled={exporting || exportCount === 0}
            title={
              exportCount === 0
                ? 'Nenhum lançamento na tela para exportar'
                : `Baixar os ${exportCount} lançamentos da tela em .xlsx`
            }
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            Exportar
          </button>
        )}
        <button
          type="button"
          onClick={onNew}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover"
        >
          Novo lançamento
        </button>
      </div>
    </div>
  )
}
