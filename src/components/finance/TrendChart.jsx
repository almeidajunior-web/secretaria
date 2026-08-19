import { useRef, useState } from 'react'
import { formatCurrency } from '../../lib/currency'

const WIDTH = 600
const HEIGHT = 220
const PADDING = { top: 16, right: 16, bottom: 26, left: 56 }
const PLOT_W = WIDTH - PADDING.left - PADDING.right
const PLOT_H = HEIGHT - PADDING.top - PADDING.bottom

// Rounds a max value up to a "clean" axis ceiling (0 / 1,000 / 2,000...) at
// ~4 ticks, per the skill's "Y-axis ticks: round to clean numbers" spec.
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

// Last-N-months line chart, Receita vs. Despesa — one axis (never a
// dual-axis), 2px lines with a hover crosshair that reads out both series
// at once. Both series use the app's own semantic success/danger tokens
// instead of a bespoke palette — those are fixed, validated, and never
// user-editable, unlike category colors.
export default function TrendChart({ data, valuesHidden }) {
  const svgRef = useRef(null)
  const [hoverIndex, setHoverIndex] = useState(null)

  const maxValue = Math.max(...data.flatMap((d) => [d.income, d.expense]), 0)
  const ticks = niceTicks(maxValue)
  const yMax = ticks[ticks.length - 1]

  const xFor = (i) => PADDING.left + (data.length <= 1 ? 0 : (i / (data.length - 1)) * PLOT_W)
  const yFor = (v) => PADDING.top + PLOT_H - (yMax === 0 ? 0 : (v / yMax) * PLOT_H)

  const linePath = (key) =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(d[key])}`).join(' ')

  // Same trace as the line, dropped to the baseline and closed — the gradient
  // fill below each series. Needs at least two points to enclose an area.
  const areaPath = (key) =>
    data.length < 2
      ? ''
      : `${linePath(key)} L ${xFor(data.length - 1)} ${yFor(0)} L ${xFor(0)} ${yFor(0)} Z`

  const handleMove = (e) => {
    const svg = svgRef.current
    if (!svg || data.length === 0) return
    const rect = svg.getBoundingClientRect()
    const scale = WIDTH / rect.width
    const svgX = (e.clientX - rect.left) * scale
    const step = data.length <= 1 ? 1 : PLOT_W / (data.length - 1)
    const idx = Math.round((svgX - PADDING.left) / step)
    setHoverIndex(Math.max(0, Math.min(data.length - 1, idx)))
  }

  const hovered = hoverIndex != null ? data[hoverIndex] : null
  const mask = (v) => (valuesHidden ? 'R$ ••••' : formatCurrency(v))

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4 text-[11px] text-text-secondary">
        <LegendKey colorClass="stroke-success" label="Receita" />
        <LegendKey colorClass="stroke-danger" label="Despesa" />
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full"
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            {/* Stops read the same token the stroke uses, so the fill can
                never drift from its line. */}
            <linearGradient id="trend-income" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--c-success))" stopOpacity="0.38" />
              <stop offset="100%" stopColor="rgb(var(--c-success))" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="trend-expense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--c-danger))" stopOpacity="0.30" />
              <stop offset="100%" stopColor="rgb(var(--c-danger))" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* gridlines + y ticks */}
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
                x={PADDING.left - 8}
                y={yFor(t)}
                dy="0.32em"
                textAnchor="end"
                className="fill-text-muted text-[9px] tabular-nums"
              >
                {valuesHidden ? '••' : formatTick(t)}
              </text>
            </g>
          ))}

          {/* x-axis month labels */}
          {data.map((d, i) => (
            <text
              key={d.month}
              x={xFor(i)}
              y={HEIGHT - 8}
              textAnchor="middle"
              className="fill-text-muted text-[9px]"
            >
              {d.label}
            </text>
          ))}

          {/* crosshair */}
          {hovered && (
            <line
              x1={xFor(hoverIndex)}
              x2={xFor(hoverIndex)}
              y1={PADDING.top}
              y2={PADDING.top + PLOT_H}
              className="stroke-border-strong"
              strokeWidth={1}
            />
          )}

          {/* gradient areas, under the strokes */}
          {data.length > 1 && (
            <>
              <path d={areaPath('expense')} fill="url(#trend-expense)" stroke="none" />
              <path d={areaPath('income')} fill="url(#trend-income)" stroke="none" />
            </>
          )}

          {/* lines */}
          <path d={linePath('income')} fill="none" className="stroke-success" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <path d={linePath('expense')} fill="none" className="stroke-danger" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {/* end markers */}
          {data.length > 0 && (
            <>
              <circle cx={xFor(data.length - 1)} cy={yFor(data[data.length - 1].income)} r={4} className="fill-success stroke-surface" strokeWidth={2} />
              <circle cx={xFor(data.length - 1)} cy={yFor(data[data.length - 1].expense)} r={4} className="fill-danger stroke-surface" strokeWidth={2} />
            </>
          )}

          {/* hover dots */}
          {hovered && (
            <>
              <circle cx={xFor(hoverIndex)} cy={yFor(hovered.income)} r={4} className="fill-success stroke-surface" strokeWidth={2} />
              <circle cx={xFor(hoverIndex)} cy={yFor(hovered.expense)} r={4} className="fill-danger stroke-surface" strokeWidth={2} />
            </>
          )}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute top-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-[11px] shadow-lg"
            style={{
              left: `${(xFor(hoverIndex) / WIDTH) * 100}%`,
              transform: hoverIndex > data.length / 2 ? 'translateX(-100%)' : 'none',
            }}
          >
            <p className="mb-1 font-semibold text-text">{hovered.label}</p>
            <p className="flex items-center gap-1.5 text-success">
              <span className="h-0.5 w-3 rounded bg-success" /> {mask(hovered.income)}
            </p>
            <p className="flex items-center gap-1.5 text-danger">
              <span className="h-0.5 w-3 rounded bg-danger" /> {mask(hovered.expense)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function LegendKey({ colorClass, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <svg width="12" height="8" viewBox="0 0 12 8">
        <line x1="0" y1="4" x2="12" y2="4" className={colorClass} strokeWidth={2} strokeLinecap="round" />
      </svg>
      {label}
    </span>
  )
}
