import { formatCurrency } from '../../lib/currency'
import { tintVars } from '../../lib/color'

// Ranked horizontal bar list — scales better than a pie/donut past a
// handful of categories, and reads the exact value directly instead of
// asking the reader to compare wedge angles. Every row already carries the
// category name as text, so identity is never color-alone even though
// category colors are user-editable (and therefore can't be validated the
// way a fixed palette can) — this direct labeling is the mandatory
// mitigation the dataviz skill calls for whenever a palette can't be
// guaranteed CVD-safe by construction.
export default function CategoryBreakdownChart({ data, valuesHidden }) {
  if (data.length === 0) {
    return <p className="py-6 text-center text-[12px] text-text-muted">Sem despesas categorizadas neste mês.</p>
  }

  const maxTotal = Math.max(...data.map((d) => d.total), 1)

  return (
    <div className="flex flex-col gap-2">
      {data.map((d) => {
        const pct = Math.max((d.total / maxTotal) * 100, 2)
        return (
          <div key={d.categoryId} className="group flex items-center gap-2">
            <span
              className="w-24 shrink-0 truncate text-[11px] text-text-secondary"
              title={d.label}
            >
              {d.label}
            </span>
            <div className="h-5 flex-1 rounded-sm bg-inset">
              <div
                className="h-5 transition-[filter] group-hover:brightness-110"
                style={{
                  width: `${pct}%`,
                  backgroundColor: d.color,
                  borderRadius: '0 4px 4px 0',
                }}
              />
            </div>
            <span className="w-[92px] shrink-0 text-right text-[11px] font-medium tabular-nums text-text">
              {valuesHidden ? 'R$ ••••' : formatCurrency(d.total)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
