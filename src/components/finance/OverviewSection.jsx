import { Eye, EyeOff, ArrowUp, ArrowDown, CreditCard } from 'lucide-react'
import { formatCurrency } from '../../lib/currency'
import { fmt, fromDateInput } from '../../lib/date'
import CategoryBreakdownChart from './CategoryBreakdownChart'
import TrendChart from './TrendChart'

// Always the current calendar month, independent of whatever period the
// table below is browsing — this is the fixed "how am I doing right now"
// snapshot the user asked for. Three stat tiles with month-over-month
// deltas, plus the two charts.
export default function OverviewSection({
  currentTotals,
  incomeChange,
  expenseChange,
  balanceChange,
  essential,
  categoryData,
  trendData,
  invoice,
  valuesHidden,
  onToggleValuesHidden,
}) {
  const essentialSubline =
    essential && essential.total > 0
      ? `Essenciais: ${valuesHidden ? 'R$ ••••' : formatCurrency(essential.essential)} (${Math.round(
          essential.ratio * 100
        )}%)`
      : null
  return (
    <div className="border-b border-border bg-app-bg px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-text">Overview</h2>
        <button
          type="button"
          onClick={onToggleValuesHidden}
          aria-label={valuesHidden ? 'Mostrar valores' : 'Ocultar valores'}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-accent-soft/60 hover:text-primary"
        >
          {valuesHidden ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      </div>

      <div className="mb-4 flex gap-3">
        <StatTile
          label="Receitas do mês"
          value={currentTotals.income}
          change={incomeChange}
          upIsGood
          hidden={valuesHidden}
        />
        <StatTile
          label="Despesas do mês"
          value={currentTotals.expense}
          change={expenseChange}
          upIsGood={false}
          hidden={valuesHidden}
          subline={essentialSubline}
        />
        <StatTile
          label="Saldo do mês"
          value={currentTotals.balance}
          change={balanceChange}
          upIsGood
          hidden={valuesHidden}
        />
      </div>

      {invoice && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-primary">
            <CreditCard size={16} />
          </span>
          <div className="flex-1">
            <p className="text-[11px] font-medium text-text-secondary">Fatura atual do cartão</p>
            <span className="text-lg font-semibold text-text">
              {valuesHidden ? 'R$ ••••' : formatCurrency(invoice.total)}
            </span>
          </div>
          <p className="text-[11px] text-text-muted">
            Fecha dia {invoice.closingDay} · vence em {fmt(fromDateInput(invoice.dueDate), 'dd/MM/yyyy')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            Despesas por categoria
          </p>
          <CategoryBreakdownChart data={categoryData} valuesHidden={valuesHidden} />
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            Receita x despesa (6 meses)
          </p>
          <TrendChart data={trendData} valuesHidden={valuesHidden} />
        </div>
      </div>
    </div>
  )
}

function deltaColorClass(change, upIsGood) {
  if (change == null || change === 0) return 'text-text-muted'
  const isUp = change > 0
  const isGood = upIsGood ? isUp : !isUp
  return isGood ? 'text-success' : 'text-danger'
}

function StatTile({ label, value, change, upIsGood, hidden, subline }) {
  return (
    <div className="flex-1 rounded-xl border border-border bg-surface p-4">
      <p className="text-[11px] font-medium text-text-secondary">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-xl font-semibold text-text">
          {hidden ? 'R$ ••••' : formatCurrency(value)}
        </span>
        {change == null ? (
          <span className="text-[11px] text-text-muted">novo</span>
        ) : (
          <span className={`flex items-center gap-0.5 text-[11px] font-medium ${deltaColorClass(change, upIsGood)}`}>
            {change > 0 ? <ArrowUp size={11} /> : change < 0 ? <ArrowDown size={11} /> : null}
            {Math.abs(change).toFixed(0)}%
          </span>
        )}
      </div>
      <p className="mt-0.5 text-[10px] text-text-muted">vs. mês anterior</p>
      {subline && <p className="mt-1 text-[10px] text-text-muted">{subline}</p>}
    </div>
  )
}
