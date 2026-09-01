import { Eye, EyeOff, ArrowUp, ArrowDown, CreditCard, Landmark, ShieldCheck, Check } from 'lucide-react'
import { formatCurrency } from '../../lib/currency'
import { fmt, fromDateInput } from '../../lib/date'
import CategoryBreakdownChart from './CategoryBreakdownChart'
import TrendChart from './TrendChart'
import CategoryTrendChart from './CategoryTrendChart'
import { tintVars } from '../../lib/color'

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
  invoices,
  onToggleInvoicePaid,
  accountsSummary,
  indicators,
  categoryTrendData,
  categoryComparisonData,
  valuesHidden,
  onToggleValuesHidden,
}) {
  const essentialSubline =
    essential && essential.total > 0
      ? `Essenciais: ${valuesHidden ? 'R$ ••••' : formatCurrency(essential.essential)} (${Math.round(
          essential.ratio * 100
        )}%)`
      : null
  // "Saldo do mês" already reflects the projected total (monthTotals counts
  // every entry dated in the month, including this month's previstos); the
  // realized figure as a subline is what makes it distinct from a raw
  // projection — this is why there's no separate "Saldo projetado" tile.
  const saldoSubline = indicators
    ? `Realizado: ${valuesHidden ? 'R$ ••••' : formatCurrency(indicators.projection.realized)}`
    : null
  return (
    <div className="border-b border-border px-4 py-4">
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
          subline={saldoSubline}
        />
      </div>

      {invoices && invoices.length > 0 && (
        <InvoicesPanel
          invoices={invoices}
          valuesHidden={valuesHidden}
          onToggleInvoicePaid={onToggleInvoicePaid}
        />
      )}

      {accountsSummary && accountsSummary.balances.length > 0 && (
        <div className="mb-4 glass-strong rounded-xl border p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Contas</p>
          <div className="flex flex-col gap-2">
            {accountsSummary.balances.map((a) => (
              <div key={a.id} className="flex items-center gap-2 text-[12px]">
                <span className="tint-fill h-2 w-2 shrink-0 rounded-full" style={tintVars(a.color)} />
                <span className="flex-1 text-text-secondary">{a.label}</span>
                {a.isReserve && (
                  <ShieldCheck size={12} className="shrink-0 text-primary" aria-label="Reserva de emergência" />
                )}
                <span className="font-medium tabular-nums text-text">
                  {valuesHidden ? 'R$ ••••' : formatCurrency(a.balance)}
                </span>
              </div>
            ))}
            {/* Realized money with no account attached — shown so the listed
                balances actually reconcile with the consolidated total. */}
            {accountsSummary.unassigned !== 0 && (
              <div className="flex items-center gap-2 text-[12px]">
                <span className="h-2 w-2 shrink-0 rounded-full border border-dashed border-border-strong" />
                <span className="flex-1 text-text-muted">Sem conta</span>
                <span className="font-medium tabular-nums text-text-muted">
                  {valuesHidden ? 'R$ ••••' : formatCurrency(accountsSummary.unassigned)}
                </span>
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border pt-3 text-[11px] text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Landmark size={12} />
              Saldo consolidado:{' '}
              <span className="font-medium text-text">
                {valuesHidden ? 'R$ ••••' : formatCurrency(accountsSummary.consolidated)}
              </span>
            </span>
            {accountsSummary.consolidatedExReserve != null && (
              <span>
                sem reservas:{' '}
                <span className="font-medium text-text">
                  {valuesHidden ? 'R$ ••••' : formatCurrency(accountsSummary.consolidatedExReserve)}
                </span>
              </span>
            )}
            {accountsSummary.reserveMonths != null && (
              <span>
                reserva cobre{' '}
                <span className="font-medium text-text">{accountsSummary.reserveMonths.toFixed(1)} meses</span> de
                despesa
              </span>
            )}
          </div>
        </div>
      )}

      {indicators && (
        <div className="mb-4 grid grid-cols-3 gap-3">
          <IndicatorTile
            label="Taxa de poupança"
            value={indicators.savingsRate == null ? '—' : `${indicators.savingsRate.toFixed(0)}%`}
            colorClass={
              indicators.savingsRate == null
                ? 'text-text-muted'
                : indicators.savingsRate >= 0
                  ? 'text-success'
                  : 'text-danger'
            }
          />
          <IndicatorTile
            label="Comprometimento de renda"
            value={indicators.commitmentRatio == null ? '—' : `${indicators.commitmentRatio.toFixed(0)}%`}
            colorClass={
              indicators.commitmentRatio == null
                ? 'text-text-muted'
                : indicators.commitmentRatio > 60
                  ? 'text-danger'
                  : indicators.commitmentRatio > 30
                    ? 'text-text'
                    : 'text-success'
            }
          />
          <IndicatorTile
            label="Gasto médio diário"
            value={`${valuesHidden ? 'R$ ••••' : formatCurrency(indicators.dailySpend.current)}/dia`}
            colorClass={
              indicators.dailySpend.current > indicators.dailySpend.historical ? 'text-danger' : 'text-success'
            }
            subline={`Média: ${
              valuesHidden ? 'R$ ••••' : formatCurrency(indicators.dailySpend.historical)
            }/dia`}
          />
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="glass-strong rounded-xl border p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            Despesas por categoria
          </p>
          <CategoryBreakdownChart data={categoryData} valuesHidden={valuesHidden} />
        </div>
        <div className="glass-strong rounded-xl border p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            Receita x despesa (6 meses)
          </p>
          <TrendChart data={trendData} valuesHidden={valuesHidden} />
        </div>
      </div>

      {categoryTrendData && categoryTrendData.series.length > 0 && (
        <div className="mb-4 glass-strong rounded-xl border p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            Evolução mensal por categoria
          </p>
          <CategoryTrendChart data={categoryTrendData} valuesHidden={valuesHidden} />
        </div>
      )}

      {categoryComparisonData && categoryComparisonData.length > 0 && (
        <div className="glass-strong rounded-xl border p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            Comparação com a média (3 meses)
          </p>
          <div className="flex items-center gap-2 pb-1.5 text-[10px] text-text-muted">
            <span className="flex-1">Categoria</span>
            <span className="w-24 text-right">Média (3m)</span>
            <span className="w-24 text-right">Este mês</span>
            <span className="w-16 shrink-0 text-right">Variação</span>
          </div>
          <div className="flex flex-col gap-2">
            {categoryComparisonData.map((c) => (
              <div key={c.categoryId} className="flex items-center gap-2 text-[12px]">
                <span className="tint-fill h-2 w-2 shrink-0 rounded-full" style={tintVars(c.color)} />
                <span className="flex-1 truncate text-text-secondary">{c.label}</span>
                <span className="w-24 text-right tabular-nums text-text-muted">
                  {valuesHidden ? 'R$ ••••' : formatCurrency(c.average)}
                </span>
                <span className="w-24 text-right font-medium tabular-nums text-text">
                  {valuesHidden ? 'R$ ••••' : formatCurrency(c.total)}
                </span>
                <span
                  className={[
                    'flex w-16 shrink-0 items-center justify-end gap-0.5 text-[11px] font-medium',
                    c.variance == null
                      ? 'text-text-muted'
                      : c.variance > 0
                        ? 'text-danger'
                        : c.variance < 0
                          ? 'text-success'
                          : 'text-text-muted',
                  ].join(' ')}
                >
                  {c.variance != null && (c.variance > 0 ? <ArrowUp size={11} /> : c.variance < 0 ? <ArrowDown size={11} /> : null)}
                  {c.variance == null ? '—' : `${Math.abs(c.variance).toFixed(0)}%`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const INVOICE_STATUS = {
  aberta: { label: 'Aberta', cls: 'bg-accent-soft text-primary' },
  futura: { label: 'Futura', cls: 'border border-border-strong text-text-muted' },
  fechada: { label: 'Fechada', cls: 'bg-amber-500/12 text-amber-600' },
  vencida: { label: 'Vencida', cls: 'bg-danger/12 text-danger' },
  paga: { label: 'Paga', cls: 'bg-success/12 text-success' },
}

// The credit-card invoices as first-class objects: the accumulating "aberta"
// invoice up top, then the rest most-urgent-first (vencida, fechada, futura,
// paga), each with a mark-as-paid toggle where it makes sense.
function InvoicesPanel({ invoices, valuesHidden, onToggleInvoicePaid }) {
  const money = (v) => (valuesHidden ? 'R$ ••••' : formatCurrency(v))
  const open = invoices.find((i) => i.status === 'aberta')
  const order = { vencida: 0, fechada: 1, futura: 2, paga: 3 }
  const others = invoices
    .filter((i) => i.status !== 'aberta')
    .sort((a, b) => order[a.status] - order[b.status] || a.dueDate.localeCompare(b.dueDate))
  const shown = others.slice(0, 5)
  const hiddenCount = others.length - shown.length

  return (
    <div className="mb-4 glass-strong rounded-xl border p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-primary">
          <CreditCard size={13} />
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Cartão de crédito</p>
      </div>

      {open && (
        <div className="mb-3 flex items-end justify-between gap-3 rounded-lg border border-border bg-inset px-3 py-2.5">
          <div>
            <p className="text-[11px] font-medium text-text-secondary">Fatura aberta</p>
            <span className="num-glow text-lg font-semibold text-text">{money(open.total)}</span>
          </div>
          <p className="text-right text-[11px] leading-relaxed text-text-muted">
            fecha {fmt(fromDateInput(open.closingDate), 'dd/MM')}
            <br />
            vence {fmt(fromDateInput(open.dueDate), 'dd/MM/yyyy')}
          </p>
        </div>
      )}

      {shown.length > 0 && (
        <div className="flex flex-col divide-y divide-border">
          {shown.map((inv) => {
            const s = INVOICE_STATUS[inv.status]
            const actionable = inv.status !== 'futura'
            return (
              <div key={inv.dueDate} className="flex items-center gap-2 py-2 text-[12px]">
                <span className={['shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium', s.cls].join(' ')}>
                  {s.label}
                </span>
                <span className="text-text-secondary">vence {fmt(fromDateInput(inv.dueDate), 'dd/MM/yyyy')}</span>
                <span className="ml-auto font-medium tabular-nums text-text">{money(inv.total)}</span>
                {actionable && (
                  <button
                    type="button"
                    onClick={() => onToggleInvoicePaid(inv.dueDate)}
                    aria-label={inv.paid ? 'Desmarcar como paga' : 'Marcar como paga'}
                    className={[
                      'flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium',
                      inv.paid
                        ? 'border-success/40 text-success'
                        : 'border-border text-text-secondary hover:border-primary hover:text-primary',
                    ].join(' ')}
                  >
                    {inv.paid ? (
                      <>
                        <Check size={11} /> Paga
                      </>
                    ) : (
                      'Marcar paga'
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
      {hiddenCount > 0 && <p className="mt-2 text-[11px] text-text-muted">+{hiddenCount} outras faturas</p>}
    </div>
  )
}

function IndicatorTile({ label, value, colorClass, subline }) {
  return (
    <div className="glass-strong rounded-xl border px-3 py-2">
      <p className="text-[9px] font-medium text-text-secondary">{label}</p>
      <p className={`num-glow mt-0.5 text-[13px] font-semibold ${colorClass}`}>{value}</p>
      {subline && <p className="mt-0.5 text-[9px] text-text-muted">{subline}</p>}
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
    <div className="flex-1 glass-strong rounded-xl border px-4 py-2.5">
      <p className="text-[10px] font-medium text-text-secondary">{label}</p>
      <div className="mt-0.5 flex items-baseline gap-1.5">
        <span className="num-glow text-base font-semibold text-text">
          {hidden ? 'R$ ••••' : formatCurrency(value)}
        </span>
        {change == null ? (
          <span className="text-[10px] text-text-muted">novo</span>
        ) : (
          <span className={`flex items-center gap-0.5 text-[10px] font-medium ${deltaColorClass(change, upIsGood)}`}>
            {change > 0 ? <ArrowUp size={10} /> : change < 0 ? <ArrowDown size={10} /> : null}
            {Math.abs(change).toFixed(0)}%
          </span>
        )}
      </div>
      <p className="mt-0.5 text-[9px] text-text-muted">vs. mês anterior</p>
      {subline && <p className="mt-1 text-[9px] text-text-muted">{subline}</p>}
    </div>
  )
}
