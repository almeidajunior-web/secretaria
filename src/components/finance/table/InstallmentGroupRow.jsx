import { TrendingUp, TrendingDown, ChevronRight, ChevronDown } from 'lucide-react'
import { formatCurrency } from '../../../lib/currency'
import { baseInstallmentTitle } from './rows'

// Collapsed summary for an installment series — one clickable row that expands
// to reveal each parcela (rendered as normal, editable EntryRows below it).
export default function InstallmentGroupRow({ items, colSpan, expanded, onToggle, today }) {
  const first = items[0]
  const isIncome = first.type === 'income'
  const total = items.reduce((sum, e) => sum + (e.amount || 0), 0)
  const totalParts = first.installment?.total ?? items.length
  const realized = items.filter((e) => e.date && today && e.date <= today).length

  return (
    <tr className="border-b border-border bg-accent-soft/20 hover:bg-accent-soft/30">
      <td colSpan={colSpan} className="px-2 py-1.5">
        <button type="button" onClick={onToggle} className="flex w-full items-center gap-2 text-left">
          {expanded ? (
            <ChevronDown size={14} className="shrink-0 text-text-muted" />
          ) : (
            <ChevronRight size={14} className="shrink-0 text-text-muted" />
          )}
          {isIncome ? (
            <TrendingUp size={15} className="shrink-0 text-success" />
          ) : (
            <TrendingDown size={15} className="shrink-0 text-danger" />
          )}
          <span className="truncate text-[13px] font-medium text-text">{baseInstallmentTitle(first.title)}</span>
          <span className="shrink-0 rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
            {totalParts}x
          </span>
          <span className="shrink-0 text-[11px] text-text-muted">
            {realized}/{items.length} lançadas
          </span>
          <span
            className={[
              'ml-auto shrink-0 text-[13px] font-semibold tabular-nums',
              isIncome ? 'text-success' : 'text-danger',
            ].join(' ')}
          >
            {formatCurrency(total)}
          </span>
        </button>
      </td>
    </tr>
  )
}
