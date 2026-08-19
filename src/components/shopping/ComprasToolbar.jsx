import { useEffect, useRef, useState } from 'react'
import {
  ArrowUp,
  ArrowDown,
  Filter,
  Settings,
  Eye,
  EyeOff,
  Layers,
  ListChecks,
  Trash2,
  X,
  CircleCheck,
  Circle,
} from 'lucide-react'
import { tintVars } from '../../lib/color'

const SORT_FIELDS = [
  { field: 'category', label: 'Classificação' },
  { field: 'priority', label: 'Prioridade' },
]

// Sort chips, filter popover, group-by-category toggle and the "Ocultar
// comprados" switch. While `selectMode` is active the whole middle section
// gives way to a bulk-actions bar (same pattern as Tarefas' toolbar).
export default function ComprasToolbar({
  sortChain,
  onToggleSort,
  filters,
  onToggleFilter,
  onToggleHidePurchased,
  onClearFilters,
  categories,
  priorities,
  groupByCategory,
  onToggleGroupByCategory,
  onManageClick,
  selectMode,
  onToggleSelectMode,
  selectedCount,
  onSelectAll,
  onClearSelection,
  onBulkSetCategory,
  onBulkSetPriority,
  onBulkTogglePurchased,
  onBulkDeleteClick,
  onNew,
}) {
  const [filterOpen, setFilterOpen] = useState(false)
  const activeFilterCount = filters.categoryIds.length + filters.priorityIds.length

  if (selectMode) {
    return (
      <BulkActionsBar
        selectedCount={selectedCount}
        onSelectAll={onSelectAll}
        onClearSelection={onClearSelection}
        categories={categories}
        priorities={priorities}
        onBulkSetCategory={onBulkSetCategory}
        onBulkSetPriority={onBulkSetPriority}
        onBulkTogglePurchased={onBulkTogglePurchased}
        onBulkDeleteClick={onBulkDeleteClick}
        onCancel={onToggleSelectMode}
      />
    )
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-2.5">
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
              {active &&
                (direction === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onToggleGroupByCategory}
        className={[
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium',
          groupByCategory
            ? 'border-primary bg-accent-soft text-primary'
            : 'border-border text-text-secondary hover:border-border-strong',
        ].join(' ')}
      >
        <Layers size={12} />
        Agrupar por classificação
      </button>

      <button
        type="button"
        onClick={onToggleHidePurchased}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-text-secondary hover:border-border-strong"
      >
        {filters.hidePurchased ? <EyeOff size={12} /> : <Eye size={12} />}
        {filters.hidePurchased ? 'Ocultando comprados' : 'Mostrando comprados'}
      </button>

      <FilterPopover
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onToggleFilter={onToggleFilter}
        onClearFilters={onClearFilters}
        categories={categories}
        priorities={priorities}
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
          Novo item
        </button>
      </div>
    </div>
  )
}

function BulkActionsBar({
  selectedCount,
  onSelectAll,
  onClearSelection,
  categories,
  priorities,
  onBulkSetCategory,
  onBulkSetPriority,
  onBulkTogglePurchased,
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
          if (e.target.value) onBulkSetCategory(e.target.value)
          e.target.value = ''
        }}
        disabled={selectedCount === 0}
        className="w-36 shrink-0 rounded-md border border-border-strong bg-surface px-1.5 py-1 text-[11px] text-text outline-none focus:border-primary disabled:opacity-50"
      >
        <option value="" disabled>
          Classificação
        </option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>

      <select
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) onBulkSetPriority(e.target.value)
          e.target.value = ''
        }}
        disabled={selectedCount === 0}
        className="w-32 shrink-0 rounded-md border border-border-strong bg-surface px-1.5 py-1 text-[11px] text-text outline-none focus:border-primary disabled:opacity-50"
      >
        <option value="" disabled>
          Prioridade
        </option>
        {priorities.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => onBulkTogglePurchased(true)}
        disabled={selectedCount === 0}
        className="inline-flex items-center gap-1.5 rounded-md border border-border-strong px-2.5 py-1 text-[11px] font-medium text-text-secondary hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CircleCheck size={12} />
        Marcar comprado
      </button>
      <button
        type="button"
        onClick={() => onBulkTogglePurchased(false)}
        disabled={selectedCount === 0}
        className="inline-flex items-center gap-1.5 rounded-md border border-border-strong px-2.5 py-1 text-[11px] font-medium text-text-secondary hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Circle size={12} />
        Marcar pendente
      </button>

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
  categories,
  priorities,
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
        <div className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-xl border border-border bg-surface p-3 shadow-lg">
          <FilterSection label="Classificação">
            {categories.length === 0 && (
              <p className="text-[11px] text-text-muted">Nenhuma classificação criada ainda.</p>
            )}
            {categories.map((c) => (
              <FilterChip
                key={c.id}
                active={filters.categoryIds.includes(c.id)}
                onClick={() => onToggleFilter('categoryIds', c.id)}
              >
                <span className="tint-fill h-2 w-2 shrink-0 rounded-full" style={tintVars(c.color)} />
                {c.label}
              </FilterChip>
            ))}
          </FilterSection>

          <FilterSection label="Prioridade">
            {priorities.map((p) => (
              <FilterChip
                key={p.id}
                active={filters.priorityIds.includes(p.id)}
                onClick={() => onToggleFilter('priorityIds', p.id)}
              >
                <span className="tint-fill h-2 w-2 shrink-0 rounded-full" style={tintVars(p.color)} />
                {p.label}
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
