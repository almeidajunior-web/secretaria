import { useEffect, useRef, useState } from 'react'
import { fmt } from '../../lib/date'
import { useTweenedNumbers } from '../../hooks/useTweenedNumbers'

const HEIGHT = 170
const PADDING = { top: 14, right: 14, bottom: 24, left: 38 }
const PLOT_H = HEIGHT - PADDING.top - PADDING.bottom
const TICKS = [0, 0.5, 1]

// Daily completion of the routine, drawn the same way the Finanças charts are
// — a hand-rolled SVG on a viewBox, no library. Being hand-rolled is what
// makes the animation possible: an SVG path's `d` can't be transitioned by
// CSS, so `useTweenedNumbers` eases the underlying rates instead and the path
// is rebuilt each frame from the eased values.
//
// `points` covers the whole visible period, matching the grid below column
// for column. `rate === null` marks a day with nothing to measure — either
// nothing was scheduled, or the day hasn't arrived — and those become gaps in
// the line rather than a dive to zero, since neither is a failed day.
export default function HabitChart({ points }) {
  const svgRef = useRef(null)
  const wrapRef = useRef(null)
  const [hoverIndex, setHoverIndex] = useState(null)
  // Measured rather than scaled: the other charts in the app map a fixed
  // viewBox onto the container width, which in a full-width panel blows the
  // height (and every label) up with it. Drawing 1:1 in real pixels keeps this
  // one a fixed 170px tall and its type at its true size, whatever the width.
  const [width, setWidth] = useState(600)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => setWidth(Math.max(240, el.getBoundingClientRect().width))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const PLOT_W = width - PADDING.left - PADDING.right

  const eased = useTweenedNumbers(points.map((p) => p.rate))
  // The tween lands one render behind whenever the number of days changes
  // (switching week↔month, stepping periods), so for that single frame the
  // eased array still has the previous length. Draw the true values until it
  // catches up — indexing `points` by an eased index would be reading past
  // the end of the array.
  const synced = eased.length === points.length
  const rates = points.map((p, i) => (synced ? eased[i] : p.rate))

  const xFor = (i) =>
    PADDING.left + (points.length <= 1 ? PLOT_W / 2 : (i / (points.length - 1)) * PLOT_W)
  const yFor = (rate) => PADDING.top + PLOT_H - rate * PLOT_H

  // Splits at gaps so a day without scheduled habits interrupts the stroke
  // instead of being bridged over as if it had been measured.
  const segments = []
  let current = []
  rates.forEach((rate, i) => {
    if (rate == null) {
      if (current.length) segments.push(current)
      current = []
      return
    }
    current.push({ i, rate })
  })
  if (current.length) segments.push(current)

  const linePath = (seg) =>
    seg.map((p, k) => `${k === 0 ? 'M' : 'L'} ${xFor(p.i)} ${yFor(p.rate)}`).join(' ')

  const areaPath = (seg) => {
    if (seg.length < 2) return ''
    const base = PADDING.top + PLOT_H
    return `${linePath(seg)} L ${xFor(seg[seg.length - 1].i)} ${base} L ${xFor(seg[0].i)} ${base} Z`
  }

  const handleMove = (e) => {
    const svg = svgRef.current
    if (!svg || points.length === 0) return
    const rect = svg.getBoundingClientRect()
    const svgX = e.clientX - rect.left
    const step = points.length <= 1 ? 1 : PLOT_W / (points.length - 1)
    const idx = Math.round((svgX - PADDING.left) / step)
    setHoverIndex(Math.max(0, Math.min(points.length - 1, idx)))
  }

  if (points.length === 0) {
    return (
      <p ref={wrapRef} className="py-6 text-center text-[12px] text-text-muted">
        Nenhuma rotina ativa neste período.
      </p>
    )
  }

  const hovered = hoverIndex == null ? null : points[hoverIndex]
  // Only label every nth day, otherwise a month view stacks 30 numbers on top
  // of one another.
  const labelEvery = points.length > 16 ? Math.ceil(points.length / 10) : 1

  return (
    <div ref={wrapRef} className="relative">
      <svg
        ref={svgRef}
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        className="block"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          {/* Stops read the same token the stroke uses, so the fill can never
              drift from its line. */}
          <linearGradient id="habit-rate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--c-primary))" stopOpacity="0.34" />
            <stop offset="100%" stopColor="rgb(var(--c-primary))" stopOpacity="0" />
          </linearGradient>
        </defs>

        {TICKS.map((t) => (
          <g key={t}>
            <line
              x1={PADDING.left}
              x2={width - PADDING.right}
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
              {Math.round(t * 100)}%
            </text>
          </g>
        ))}

        {points.map((p, i) =>
          i % labelEvery === 0 ? (
            <text
              key={p.dateStr}
              x={xFor(i)}
              y={HEIGHT - 6}
              textAnchor="middle"
              className="fill-text-muted text-[9px] tabular-nums"
            >
              {fmt(p.date, 'd')}
            </text>
          ) : null
        )}

        {hoverIndex != null && rates[hoverIndex] != null && (
          <line
            x1={xFor(hoverIndex)}
            x2={xFor(hoverIndex)}
            y1={PADDING.top}
            y2={PADDING.top + PLOT_H}
            className="stroke-border-strong"
            strokeWidth={1}
          />
        )}

        {segments.map((seg) => (
          <path key={`a-${seg[0].i}`} d={areaPath(seg)} fill="url(#habit-rate)" />
        ))}
        {segments.map((seg) => (
          <path
            key={`l-${seg[0].i}`}
            d={linePath(seg)}
            fill="none"
            className="stroke-primary"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* Dots ride along with the line: cx/cy are animatable CSS geometry
            properties, so they inherit the same easing for free. */}
        {rates.map((rate, i) =>
          rate == null ? null : (
            <circle
              key={points[i].dateStr}
              cx={xFor(i)}
              cy={yFor(rate)}
              r={hoverIndex === i ? 4 : 2.5}
              className="fill-primary stroke-surface [transition:r_140ms_ease]"
              strokeWidth={1.5}
            />
          )
        )}
      </svg>

      {hovered && hovered.rate != null && (
        <div
          className="pointer-events-none absolute top-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-[11px] shadow-lg"
          style={{
            left: `${(xFor(hoverIndex) / width) * 100}%`,
            transform: hoverIndex > points.length / 2 ? 'translateX(-100%)' : 'none',
          }}
        >
          <p className="font-semibold text-text">{fmt(hovered.date, "d 'de' MMM")}</p>
          <p className="text-text-secondary">
            {hovered.done} de {hovered.counted} {hovered.counted === 1 ? 'rotina' : 'rotinas'}
            <span className="ml-1 font-medium text-primary">{Math.round(hovered.rate * 100)}%</span>
          </p>
        </div>
      )}
    </div>
  )
}
