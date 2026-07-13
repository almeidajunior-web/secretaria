import { useState } from 'react'
import { formatCurrency } from '../../lib/currency'

const WIDTH = 600
const HEIGHT = 220
const PADDING = { top: 16, right: 16, bottom: 26, left: 44 }
const PLOT_W = WIDTH - PADDING.left - PADDING.right
const PLOT_H = HEIGHT - PADDING.top - PADDING.bottom
const BAR_GAP_RATIO = 0.35
const SEGMENT_GAP = 2

// Rounds a max value up to a "clean" axis ceiling (0 / 1,000 / 2,000...) at
// ~4 ticks — same helper as TrendChart.jsx.
function niceTicks(maxValue, targetTicks = 4) {
  if (maxValue <= 0) return [0, 1]
  const rough = maxValue / targetTicks
  const mag = 10 ** Math.floor(Math.log10(rough))
  const norm = rough / mag
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag
  const top = Math.ceil(maxValue / step) * step
  const ticks = []
  for (let v = 0; v <= top; v += step) ticks.push(v)
  return ticks
}

// Exact abbreviation instead of a blind "round to nearest thousand" — a
// step below 1000 (e.g. 500) would otherwise mislabel 1500 as "2k".
function formatTick(t) {
  if (t === 0) return '0'
  if (t < 1000) return String(t)
  const k = t / 1000
  return `${Number.isInteger(k) ? k : k.toFixed(1)}k`
}

// Stacked-bar evolution of the top expense categories over the last few
// months (the rest fold into "Outros"). Category colors are user-editable
// so they can't be validated as CVD-safe by construction — every series
// stays direct-labeled in the legend below the chart, same mitigation
// CategoryBreakdownChart.jsx uses, so identity never rides on color alone.
export default function CategoryTrendChart({ data, valuesHidden }) {
  const [hoverIndex, setHoverIndex] = useState(null)
  const { series, months } = data

  if (series.length === 0) {
    return <p className="py-6 text-center text-[12px] text-text-muted">Sem despesas categorizadas no período.</p>
  }

  const maxTotal = Math.max(...months.map((m) => m.total), 0)
  const ticks = niceTicks(maxTotal)
  const yMax = ticks[ticks.length - 1]

  const barSlot = PLOT_W / months.length
  const barWidth = barSlot * (1 - BAR_GAP_RATIO)
  const xFor = (i) => PADDING.left + i * barSlot + (barSlot - barWidth) / 2
  const yFor = (v) => PADDING.top + PLOT_H - (yMax === 0 ? 0 : (v / yMax) * PLOT_H)
  const heightFor = (v) => (yMax === 0 ? 0 : (v / yMax) * PLOT_H)

  const mask = (v) => (valuesHidden ? 'R$ ••••' : formatCurrency(v))
  const hovered = hoverIndex != null ? months[hoverIndex] : null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-secondary">
        {series.map((s) => (
          <span key={s.categoryId} className="flex items-center gap-1.5">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full">
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={yFor(t)}
                y2={yFor(t)}
                className="stroke-border"
                strokeWidth={1}
              />
              <text
                x={PADDING.left - 6}
                y={yFor(t)}
                dy="0.32em"
                textAnchor="end"
                className="fill-text-muted text-[9px] tabular-nums"
              >
                {valuesHidden ? '••' : formatTick(t)}
              </text>
            </g>
          ))}

          {months.map((m, i) => {
            let offset = 0
            return (
              <g
                key={m.month}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex((v) => (v === i ? null : v))}
              >
                <rect
                  x={xFor(i)}
                  y={PADDING.top}
                  width={barWidth}
                  height={PLOT_H}
                  fill="transparent"
                />
                {series.map((s, segIdx) => {
                  const value = m.byCategory[s.categoryId] || 0
                  if (value <= 0) return null
                  const segHeight = Math.max(heightFor(value) - SEGMENT_GAP, 0)
                  const y = yFor(offset + value) + SEGMENT_GAP
                  offset += value
                  const isTop = segIdx === series.length - 1 || series.slice(segIdx + 1).every((s2) => !m.byCategory[s2.categoryId])
                  return (
                    <rect
                      key={s.categoryId}
                      x={xFor(i)}
                      y={y}
                      width={barWidth}
                      height={segHeight}
                      fill={s.color}
                      opacity={hoverIndex == null || hoverIndex === i ? 1 : 0.35}
                      rx={isTop ? 3 : 0}
                    />
                  )
                })}
                <text
                  x={xFor(i) + barWidth / 2}
                  y={HEIGHT - 8}
                  textAnchor="middle"
                  className="fill-text-muted text-[9px]"
                >
                  {m.label}
                </text>
              </g>
            )
          })}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute top-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-[11px] shadow-lg"
            style={{
              left: `${((xFor(hoverIndex) + barWidth / 2) / WIDTH) * 100}%`,
              transform: hoverIndex > months.length / 2 ? 'translateX(-100%)' : 'none',
            }}
          >
            <p className="mb-1 font-semibold text-text">{hovered.label}</p>
            {series.map((s) => {
              const value = hovered.byCategory[s.categoryId] || 0
              if (value <= 0) return null
              return (
                <p key={s.categoryId} className="flex items-center gap-1.5 text-text-secondary">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.label}: {mask(value)}
                </p>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
