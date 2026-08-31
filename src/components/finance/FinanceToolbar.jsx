import { useEffect, useRef, useState } from 'react'
import { Settings, ListChecks, Filter, Trash2, X } from 'lucide-react'
import { tintVars } from '../../lib/color'

const TABS = [
  { value: 'resumo', label: 'Resumo' },
  { value: 'lancamentos', label: 'Lançamentos' },
]

const TYPE_OPTIONS = [
  { id: 'income', label: 'Receita' },
  { id: 'expense', label: 'Despesa' },
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
  tags,
  filters,
  onToggleFilter,
  onClearFilters,
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
    (filters?.accountIds?.length || 0) +
    (filters?.tagIds?.length || 0)

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

      {tab === 'lancamentos' && (
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
          tags={tags}
          activeFilterCount={activeFilterCount}
        />
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
  tags,
  activeFilterCount,
}) {
  const ref = useRef(null)
  const allCategories = [...expenseCategories, ...incomeCategories]

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
        <div className="absolute left-0 top-full z-50 mt-1.5 max-h-[70vh] w-64 overflow-auto rounded-xl border border-border bg-surface p-3 shadow-lg">
          <FilterSection label="Tipo">
            {TYPE_OPTIONS.map((o) => (
              <FilterChip
                key={o.id}
                active={(filters.types || []).includes(o.id)}
                onClick={() => onToggleFilter('types', o.id)}
              >
                {o.label}
              </FilterChip>
            ))}
          </FilterSection>

          <FilterSection label="Categoria">
            {allCategories.length === 0 && (
              <p className="text-[11px] text-text-muted">Nenhuma categoria criada ainda.</p>
            )}
            {allCategories.map((c) => (
              <FilterChip
                key={c.id}
                active={(filters.categoryIds || []).includes(c.id)}
                onClick={() => onToggleFilter('categoryIds', c.id)}
              >
                <span className="tint-fill h-2 w-2 shrink-0 rounded-full" style={tintVars(c.color)} />
                {c.label}
              </FilterChip>
            ))}
          </FilterSection>

          <FilterSection label="Forma de pagamento">
            {paymentMethods.map((m) => (
              <FilterChip
                key={m.id}
                active={(filters.paymentMethodIds || []).includes(m.id)}
                onClick={() => onToggleFilter('paymentMethodIds', m.id)}
              >
                <span className="tint-fill h-2 w-2 shrink-0 rounded-full" style={tintVars(m.color)} />
                {m.label}
              </FilterChip>
            ))}
          </FilterSection>

          {accounts.length > 0 && (
            <FilterSection label="Conta">
              {accounts.map((a) => (
                <FilterChip
                  key={a.id}
                  active={(filters.accountIds || []).includes(a.id)}
                  onClick={() => onToggleFilter('accountIds', a.id)}
                >
                  <span className="tint-fill h-2 w-2 shrink-0 rounded-full" style={tintVars(a.color)} />
                  {a.label}
                </FilterChip>
              ))}
            </FilterSection>
          )}

          <FilterSection label="Tags">
            {tags.length === 0 && (
              <p className="text-[11px] text-text-muted">Nenhuma tag criada ainda.</p>
            )}
            {tags.map((t) => (
              <FilterChip
                key={t.id}
                active={(filters.tagIds || []).includes(t.id)}
                onClick={() => onToggleFilter('tagIds', t.id)}
              >
                <span className="tint-fill h-2 w-2 shrink-0 rounded-full" style={tintVars(t.color)} />
                {t.label}
              </FilterChip>
            ))}
          </FilterSection>

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

// Category bulk-set is left out on purpose — a selection can mix income and
// expense entries, which have separate category lists. Payment method and
// account aren't type-scoped, so those stay.
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
