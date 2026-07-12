import { ChevronLeft, ChevronRight, Settings, ListChecks, Trash2, X } from 'lucide-react'
import { PERIOD_OPTIONS } from '../../lib/financePeriod'

const TABS = [
  { value: 'resumo', label: 'Resumo' },
  { value: 'lancamentos', label: 'Lançamentos' },
]

// Tabs (Resumo/Lançamentos) + period navigation. Sorting and filtering now
// live on the table header (Excel-style), so the toolbar no longer carries
// sort chips or a filter popover. While `selectMode` is active the toolbar
// body swaps for the bulk-actions bar.
export default function FinanceToolbar({
  tab,
  onChangeTab,
  period,
  onChangePeriod,
  periodLabel,
  onPrevPeriod,
  onNextPeriod,
  onTodayPeriod,
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
      <div className="flex items-center rounded-lg border border-border bg-app-bg p-0.5">
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
