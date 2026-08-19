import { useEffect, useRef, useState } from 'react'
import { ArrowUp, ArrowDown, Filter, Settings, Eye, EyeOff, ListChecks, Trash2, X } from 'lucide-react'
import TagPickerPopover from '../common/TagPickerPopover'
import { tintVars } from '../../lib/color'

const SORT_FIELDS = [
  { field: 'dueDate', label: 'Prazo' },
  { field: 'priority', label: 'Prioridade' },
]

// View toggle, hierarchical sort chips, filter popover and the "Nova Tarefa"
// entry point (opens the full modal — see Tarefas.jsx's inline quick-add row
// in the list for the no-modal creation path). While `selectMode` is active
// (list view only) the sort/filter controls give way to a bulk-actions bar.
export default function TarefasToolbar({
  view,
  onChangeView,
  sortChain,
  onToggleSort,
  filters,
  onToggleFilter,
  onSetDateFilter,
  onToggleHideFinished,
  onClearFilters,
  priorities,
  tags,
  statuses,
  onNew,
  onManageClick,
  selectMode,
  onToggleSelectMode,
  selectedCount,
  onSelectAll,
  onClearSelection,
  onBulkSetDueDate,
  onBulkSetPriority,
  onBulkSetStatus,
  onBulkAddTag,
  onCreateTag,
  onBulkDeleteClick,
}) {
  const [filterOpen, setFilterOpen] = useState(false)
  const activeFilterCount =
    filters.priorityIds.length + filters.tags.length + (filters.dueDate ? 1 : 0)

  if (selectMode) {
    return (
      <BulkActionsBar
        selectedCount={selectedCount}
        onSelectAll={onSelectAll}
        onClearSelection={onClearSelection}
        priorities={priorities}
        statuses={statuses}
        tags={tags}
        onBulkSetDueDate={onBulkSetDueDate}
        onBulkSetPriority={onBulkSetPriority}
        onBulkSetStatus={onBulkSetStatus}
        onBulkAddTag={onBulkAddTag}
        onCreateTag={onCreateTag}
        onBulkDeleteClick={onBulkDeleteClick}
        onCancel={onToggleSelectMode}
      />
    )
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 glass border-b px-4 py-2.5">
      <div className="flex items-center rounded-lg border border-border bg-inset p-0.5">
        {[
          { value: 'list', label: 'Lista' },
          { value: 'kanban', label: 'Kanban' },
        ].map((v) => {
          const active = v.value === view
          return (
            <button
              key={v.value}
              type="button"
              onClick={() => onChangeView(v.value)}
              className={[
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                active ? 'bg-primary text-white' : 'text-text-secondary hover:text-text',
              ].join(' ')}
            >
              {v.label}
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
              {active &&
                (direction === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
            </button>
          )
        })}
      </div>

      {view === 'list' && (
        <button
          type="button"
          onClick={onToggleHideFinished}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-text-secondary hover:border-border-strong"
        >
          {filters.hideFinished ? <EyeOff size={12} /> : <Eye size={12} />}
          {filters.hideFinished ? 'Ocultando finalizadas' : 'Mostrando finalizadas'}
        </button>
      )}

      <FilterPopover
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onToggleFilter={onToggleFilter}
        onSetDateFilter={onSetDateFilter}
        onClearFilters={onClearFilters}
        priorities={priorities}
        tags={tags}
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
        {view === 'list' && (
          <button
            type="button"
            onClick={onToggleSelectMode}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:border-border-strong"
          >
            <ListChecks size={13} />
            Selecionar
          </button>
        )}
        <button
          type="button"
          onClick={onNew}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover"
        >
          Nova tarefa
        </button>
      </div>
    </div>
  )
}

// Replaces the sort/filter controls while bulk-selecting: pick a value in
// any field to apply it to every selected task immediately (same
// apply-on-change pattern as the list row's inline editors).
function BulkActionsBar({
  selectedCount,
  onSelectAll,
  onClearSelection,
  priorities,
  statuses,
  tags,
  onBulkSetDueDate,
  onBulkSetPriority,
  onBulkSetStatus,
  onBulkAddTag,
  onCreateTag,
  onBulkDeleteClick,
  onCancel,
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-accent-soft/40 px-4 py-2.5">
      <span className="text-xs font-semibold text-text">
        {selectedCount} selecionada{selectedCount !== 1 ? 's' : ''}
      </span>
      <button
        type="button"
        onClick={onSelectAll}
        className="text-[11px] font-medium text-primary hover:underline"
      >
        Selecionar todas
      </button>
      <button
        type="button"
        onClick={onClearSelection}
        className="text-[11px] font-medium text-text-secondary hover:underline"
      >
        Limpar seleção
      </button>

      <div className="mx-1 h-5 w-px bg-border" />

      <input
        type="date"
        onChange={(e) => e.target.value && onBulkSetDueDate(e.target.value)}
        disabled={selectedCount === 0}
        className="w-32 shrink-0 rounded-md border border-border-strong bg-surface px-1.5 py-1 text-[11px] text-text outline-none focus:border-primary disabled:opacity-50"
      />

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

      <select
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) onBulkSetStatus(e.target.value)
          e.target.value = ''
        }}
        disabled={selectedCount === 0}
        className="w-32 shrink-0 rounded-md border border-border-strong bg-surface px-1.5 py-1 text-[11px] text-text outline-none focus:border-primary disabled:opacity-50"
      >
        <option value="" disabled>
          Status
        </option>
        {statuses.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>

      <TagPickerPopover
        tags={tags}
        selectedIds={[]}
        onToggle={onBulkAddTag}
        onCreate={onCreateTag}
        triggerClassName="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border-strong bg-surface px-2 py-1 text-[11px] font-medium text-text-secondary hover:border-primary hover:text-primary"
      />

      <button
        type="button"
        onClick={onBulkDeleteClick}
        disabled={selectedCount === 0}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-danger/15 hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Excluir selecionadas"
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
  onSetDateFilter,
  onClearFilters,
  priorities,
  tags,
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
          <FilterSection label="Data">
            <div className="flex w-full items-center gap-1.5">
              <input
                type="date"
                value={filters.dueDate || ''}
                onChange={(e) => onSetDateFilter(e.target.value || null)}
                className="w-full rounded-md border border-border-strong bg-surface px-2 py-1 text-[11px] text-text outline-none focus:border-primary"
              />
              {filters.dueDate && (
                <button
                  type="button"
                  onClick={() => onSetDateFilter(null)}
                  aria-label="Limpar filtro de data"
                  className="shrink-0 text-text-muted hover:text-text"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </FilterSection>

          <FilterSection label="Prioridade">
            {priorities.map((p) => (
              <FilterChip
                key={p.id}
                active={filters.priorityIds.includes(p.id)}
                onClick={() => onToggleFilter('priorityIds', p.id)}
              >
                <span
                  className="tint-fill h-2 w-2 shrink-0 rounded-full"
                  style={tintVars(p.color)}
                />
                {p.label}
              </FilterChip>
            ))}
          </FilterSection>

          <FilterSection label="Tags">
            {tags.length === 0 && (
              <p className="text-[11px] text-text-muted">Nenhuma tag criada ainda.</p>
            )}
            {tags.map((t) => (
              <FilterChip
                key={t.id}
                active={filters.tags.includes(t.id)}
                onClick={() => onToggleFilter('tags', t.id)}
              >
                <span
                  className="tint-fill h-2 w-2 shrink-0 rounded-full"
                  style={tintVars(t.color)}
                />
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
      <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </span>
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
