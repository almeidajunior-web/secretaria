import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Filter, Settings, ListChecks, Trash2, X } from 'lucide-react'
import { PERIOD_OPTIONS } from '../../lib/financePeriod'

const SORT_FIELDS = [
  { field: 'date', label: 'Data' },
  { field: 'amount', label: 'Valor' },
  { field: 'category', label: 'Categoria' },
]

// Period navigation (Dia/Semana/Mês/Ano + prev/next/hoje, mirroring
// AgendaToolbar) on the left, sort chips + filter popover + actions on the
// right — same overall composition as VencimentosToolbar, just with an
// extra row of period controls since Finanças' table browses a selectable
// time window instead of always showing everything.
export default function FinanceToolbar({
  period,
  onChangePeriod,
  periodLabel,
  onPrevPeriod,
  onNextPeriod,
  onTodayPeriod,
  sortChain,
  onToggleSort,
  filters,
  onToggleFilter,
  onClearFilters,
  expenseCategories,
  incomeCategories,
  paymentMethods,
  accounts,
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
}) {
  const [filterOpen, setFilterOpen] = useState(false)
  const activeFilterCount =
    filters.categoryIds.length + filters.paymentMethodIds.length + filters.accountIds.length + filters.types.length

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

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-2.5">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Período anterior"
          onClick={onPrevPeriod}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-secondary hover:bg-accent-soft hover:text-primary"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          aria-label="Próximo período"
          onClick={onNextPeriod}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-secondary hover:bg-accent-soft hover:text-primary"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <button
        type="button"
        onClick={onTodayPeriod}
        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-accent-soft hover:text-primary"
      >
        Hoje
      </button>
      <h2 className="text-[13px] font-semibold text-text">{periodLabel}</h2>

      <div className="flex items-center rounded-lg border border-border bg-app-bg p-0.5">
        {PERIOD_OPTIONS.map((p) => {
          const active = p.value === period
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => onChangePeriod(p.value)}
              className={[
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                active ? 'bg-primary text-white' : 'text-text-secondary hover:text-text',
              ].join(' ')}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-text-muted">Ordenar:</span>
        {SORT_FIELDS.map(({ field, label }) => {
          const idx = sortChain.findIndex((s) => s.field === field)
          const active = idx !== -1
          const direction = active ? sortChain[idx].direction : null
          return (
            <button
              key={field}
              type="button"
              onClick={() => onToggleSort(field)}
              className={[
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium',
                active
                  ? 'border-primary bg-accent-soft text-primary'
                  : 'border-border text-text-secondary hover:border-border-strong',
              ].join(' ')}
            >
              {active && sortChain.length > 1 && (
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] text-white">
                  {idx + 1}
                </span>
              )}
              {label}
              {active && (direction === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
            </button>
          )
        })}
      </div>

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

// Category bulk-set is deliberately left out — a selection can freely mix
// income and expense entries, and the two have separate category lists, so
// there's no single dropdown that unambiguously applies to every selected
// row. Payment method and account aren't type-scoped, so those stay simple.
function BulkActionsBar({
  selectedCount,
  onSelectAll,
  onClearSelection,
  paymentMethods,
  accounts,
  onBulkSetPaymentMethod,
  onBulkSetAccount,
  onBulkDeleteClick,
  onCancel,
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-accent-soft/40 px-4 py-2.5">
      <span className="text-xs font-semibold text-text">
        {selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}
      </span>
      <button type="button" onClick={onSelectAll} className="text-[11px] font-medium text-primary hover:underline">
        Selecionar todos
      </button>
      <button
        type="button"
        onClick={onClearSelection}
        className="text-[11px] font-medium text-text-secondary hover:underline"
      >
        Limpar seleção
      </button>

      <div className="mx-1 h-5 w-px bg-border" />

      <select
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) onBulkSetPaymentMethod(e.target.value)
          e.target.value = ''
        }}
        disabled={selectedCount === 0}
        className="w-40 shrink-0 rounded-md border border-border-strong bg-surface px-1.5 py-1 text-[11px] text-text outline-none focus:border-primary disabled:opacity-50"
      >
        <option value="" disabled>
          Forma de pagamento
        </option>
        {paymentMethods.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>

      {accounts.length > 0 && (
        <select
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) onBulkSetAccount(e.target.value)
            e.target.value = ''
          }}
          disabled={selectedCount === 0}
          className="w-36 shrink-0 rounded-md border border-border-strong bg-surface px-1.5 py-1 text-[11px] text-text outline-none focus:border-primary disabled:opacity-50"
        >
          <option value="" disabled>
            Conta
          </option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      )}

      <button
        type="button"
        onClick={onBulkDeleteClick}
        disabled={selectedCount === 0}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-danger/15 hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Excluir selecionados"
      >
        <Trash2 size={14} />
      </button>

      <button
        type="button"
        onClick={onCancel}
        className="ml-auto inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:border-border-strong"
      >
        <X size={13} />
        Cancelar
      </button>
    </div>
  )
}

function FilterPopover({
  open,
  onOpenChange,
  filters,
  onToggleFilter,
  onClearFilters,
  expenseCategories,
  incomeCategories,
  paymentMethods,
  accounts,
  activeFilterCount,
}) {
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onOpenChange(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, onOpenChange])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className={[
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium',
          activeFilterCount > 0
            ? 'border-primary bg-accent-soft text-primary'
            : 'border-border text-text-secondary hover:border-border-strong',
        ].join(' ')}
      >
        <Filter size={12} />
        Filtros
        {activeFilterCount > 0 && ` (${activeFilterCount})`}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-72 rounded-xl border border-border bg-surface p-3 shadow-lg">
          <FilterSection label="Tipo">
            {[
              { value: 'income', label: 'Receita' },
              { value: 'expense', label: 'Despesa' },
            ].map((t) => (
              <FilterChip
                key={t.value}
                active={filters.types.includes(t.value)}
                onClick={() => onToggleFilter('types', t.value)}
              >
                {t.label}
              </FilterChip>
            ))}
          </FilterSection>

          <FilterSection label="Categoria de despesa">
            {expenseCategories.map((c) => (
              <FilterChip
                key={c.id}
                active={filters.categoryIds.includes(c.id)}
                onClick={() => onToggleFilter('categoryIds', c.id)}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                {c.label}
              </FilterChip>
            ))}
          </FilterSection>

          <FilterSection label="Categoria de receita">
            {incomeCategories.map((c) => (
              <FilterChip
                key={c.id}
                active={filters.categoryIds.includes(c.id)}
                onClick={() => onToggleFilter('categoryIds', c.id)}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                {c.label}
              </FilterChip>
            ))}
          </FilterSection>

          <FilterSection label="Forma de pagamento">
            {paymentMethods.map((m) => (
              <FilterChip
                key={m.id}
                active={filters.paymentMethodIds.includes(m.id)}
                onClick={() => onToggleFilter('paymentMethodIds', m.id)}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: m.color }} />
                {m.label}
              </FilterChip>
            ))}
          </FilterSection>

          {accounts.length > 0 && (
            <FilterSection label="Conta">
              {accounts.map((a) => (
                <FilterChip
                  key={a.id}
                  active={filters.accountIds.includes(a.id)}
                  onClick={() => onToggleFilter('accountIds', a.id)}
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: a.color }} />
                  {a.label}
                </FilterChip>
              ))}
            </FilterSection>
          )}

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-1 w-full rounded-md border border-border py-1.5 text-[11px] font-medium text-text-secondary hover:bg-accent-soft/50"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function FilterSection({ label, children }) {
  return (
    <div className="mb-2.5 flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium',
        active
          ? 'border-primary bg-accent-soft text-primary'
          : 'border-border text-text-secondary hover:border-border-strong',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
