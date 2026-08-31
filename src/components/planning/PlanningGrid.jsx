import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { StickyNote } from 'lucide-react'
import { PLANNING_HOUR_HEIGHT, WEEKDAYS_SHORT_ORDERED } from '../../constants'
import { weekdayOrder } from '../../lib/date'
import { cellKey } from '../../lib/planningGrid'
import { fillColorForTheme } from '../../lib/color'
import { useNow } from '../../hooks/useNow'
import { ERASER } from './CategoryPalette'

// Returns the vertical position (0-100%) for the "now" line within the given
// window, or null if `now` doesn't fall inside it (wrong day/hour/half).
function nowLineTop(nowRef, day, hour, half) {
  if (!nowRef || nowRef.day !== day || nowRef.hour !== hour) return null
  if (half == null) return (nowRef.minute / 60) * 100
  const inHalf = half === 0 ? nowRef.minute < 30 : nowRef.minute >= 30
  if (!inHalf) return null
  return ((nowRef.minute % 30) / 30) * 100
}

// Fixed weekly routine grid (Monday–Sunday x hourStart–hourEnd, independently
// configurable from Agenda's own hour range). Cells are painted with the
// currently armed brush on mousedown, and on mouseenter while the mouse
// button is held — this lets a single drag stroke paint a run of cells,
// including across day columns. An hour can be split into two independently
// paintable/describable 30-min halves (see splits/half handling below).
export default function PlanningGrid({
  categories,
  grid,
  splits,
  hourStart,
  hourEnd,
  isDark,
  activeBrush,
  onPaintCell,
  onRequestClearWithConfirm,
  onOpenWindowMenu,
  onOpenDescription,
}) {
  const now = useNow()
  const nowRef = useMemo(() => {
    const hour = now.getHours()
    if (hour < hourStart || hour > hourEnd) return null
    return { day: weekdayOrder(now), hour, minute: now.getMinutes() }
  }, [now, hourStart, hourEnd])

  const isPaintingRef = useRef(false)
  // Set on mousedown when the eraser lands on a described window; any
  // mouseenter (i.e. the gesture turned into a drag) invalidates it so the
  // drag-skip rule applies instead. Only resolves into a confirm request on
  // mouseup if it survives untouched — i.e. a genuine single click.
  const pendingEraseRef = useRef(null)
  const categoryById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories]
  )

  useEffect(() => {
    const stop = () => {
      isPaintingRef.current = false
      if (pendingEraseRef.current) {
        const { day, hour, half } = pendingEraseRef.current
        pendingEraseRef.current = null
        onRequestClearWithConfirm(day, hour, half)
      }
    }
    window.addEventListener('mouseup', stop)
    return () => window.removeEventListener('mouseup', stop)
  }, [onRequestClearWithConfirm])

  const isDescribed = (day, hour, half) => !!grid[cellKey(day, hour, half)]?.description

  const handleMouseDown = (day, hour, half) => {
    isPaintingRef.current = true
    if (activeBrush === ERASER && isDescribed(day, hour, half)) {
      pendingEraseRef.current = { day, hour, half }
      return
    }
    pendingEraseRef.current = null
    if (activeBrush === ERASER) onPaintCell(day, hour, null, half)
    else if (activeBrush != null) onPaintCell(day, hour, activeBrush, half)
  }

  const handleMouseEnter = (day, hour, half) => {
    if (!isPaintingRef.current) return
    pendingEraseRef.current = null
    if (activeBrush === ERASER) {
      if (isDescribed(day, hour, half)) return // drag-skip rule: leave it untouched
      onPaintCell(day, hour, null, half)
    } else if (activeBrush != null) {
      onPaintCell(day, hour, activeBrush, half)
    }
  }

  const hours = []
  for (let h = hourStart; h <= hourEnd; h++) hours.push(h)

  return (
    <div className="thin-scroll flex-1 overflow-auto p-3">
      {activeBrush == null && (
        <p className="mb-2 text-[11px] text-text-muted">
          Selecione uma categoria acima para pintar a grade. Clique com o botão direito numa
          janela para dividir ou adicionar uma descrição.
        </p>
      )}
      <div
        className="select-none overflow-hidden rounded-md border-l border-t border-border"
        style={{
          display: 'grid',
          gridTemplateColumns: `35px repeat(7, minmax(45px, 1fr))`,
        }}
      >
        <div className="border-b border-r border-border" />
        {WEEKDAYS_SHORT_ORDERED.map((d) => (
          <div
            key={d}
            className="border-b border-r border-border py-1 text-center text-[11px] font-semibold text-text-secondary"
          >
            {d}
          </div>
        ))}

        {hours.map((h) => (
          <Fragment key={h}>
            <div
              className="flex items-start justify-end border-b border-r border-border pr-1 pt-0.5 text-[9px] text-text-muted"
              style={{ height: PLANNING_HOUR_HEIGHT }}
            >
              {String(h).padStart(2, '0')}H
            </div>
            {WEEKDAYS_SHORT_ORDERED.map((_, day) => {
              const wholeKey = cellKey(day, h)
              const split = !!splits[wholeKey]

              if (!split) {
                return (
                  <Window
                    key={day}
                    day={day}
                    hour={h}
                    half={undefined}
                    height={PLANNING_HOUR_HEIGHT}
                    entry={grid[wholeKey]}
                    categoryById={categoryById}
                    isDark={isDark}
                    activeBrush={activeBrush}
                    onMouseDown={handleMouseDown}
                    onMouseEnter={handleMouseEnter}
                    onOpenWindowMenu={onOpenWindowMenu}
                    onOpenDescription={onOpenDescription}
                    nowTop={nowLineTop(nowRef, day, h, undefined)}
                  />
                )
              }

              return (
                <div
                  key={day}
                  className="flex flex-col border-b border-r border-border"
                  style={{ height: PLANNING_HOUR_HEIGHT }}
                >
                  <Window
                    day={day}
                    hour={h}
                    half={0}
                    height={PLANNING_HOUR_HEIGHT / 2}
                    entry={grid[cellKey(day, h, 0)]}
                    categoryById={categoryById}
                    isDark={isDark}
                    activeBrush={activeBrush}
                    onMouseDown={handleMouseDown}
                    onMouseEnter={handleMouseEnter}
                    onOpenWindowMenu={onOpenWindowMenu}
                    onOpenDescription={onOpenDescription}
                    nowTop={nowLineTop(nowRef, day, h, 0)}
                    skipRightBorder
                  />
                  <Window
                    day={day}
                    hour={h}
                    half={30}
                    height={PLANNING_HOUR_HEIGHT / 2}
                    entry={grid[cellKey(day, h, 30)]}
                    categoryById={categoryById}
                    isDark={isDark}
                    activeBrush={activeBrush}
                    onMouseDown={handleMouseDown}
                    onMouseEnter={handleMouseEnter}
                    onOpenWindowMenu={onOpenWindowMenu}
                    onOpenDescription={onOpenDescription}
                    nowTop={nowLineTop(nowRef, day, h, 30)}
                    skipRightBorder
                  />
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

function Window({
  day,
  hour,
  half,
  height,
  entry,
  categoryById,
  isDark,
  activeBrush,
  onMouseDown,
  onMouseEnter,
  onOpenWindowMenu,
  onOpenDescription,
  nowTop,
  skipRightBorder,
}) {
  const cat = entry?.categoryId ? categoryById[entry.categoryId] : null
  const cellRef = useRef(null)
  const [tooltipRect, setTooltipRect] = useState(null)

  return (
    <div
      ref={cellRef}
      onMouseDown={(e) => {
        if (e.button !== 0) return
        onMouseDown(day, hour, half)
      }}
      onMouseEnter={() => {
        onMouseEnter(day, hour, half)
        if (entry?.description) setTooltipRect(cellRef.current?.getBoundingClientRect() ?? null)
      }}
      onMouseLeave={() => setTooltipRect(null)}
      onContextMenu={(e) => {
        e.preventDefault()
        onOpenWindowMenu({ day, hour, half, rect: e.currentTarget.getBoundingClientRect() })
      }}
      className={[
        'group relative border-b',
        skipRightBorder ? '' : 'border-r',
        'border-border',
        activeBrush != null ? 'cursor-pointer' : 'cursor-default',
        cat ? '' : 'hover:bg-accent-soft/40',
      ].join(' ')}
      style={{ height, backgroundColor: fillColorForTheme(cat?.color, isDark) }}
    >
      {nowTop != null && (
        <div
          className="pointer-events-none absolute left-0 right-0 z-20"
          style={{ top: `${nowTop}%` }}
        >
          <div className="relative border-t-2 border-primary">
            <div className="absolute -left-1 -top-[5px] h-2 w-2 rounded-full bg-primary" />
          </div>
        </div>
      )}

      {entry?.description && (
        <>
          {tooltipRect && <DescriptionTooltip rect={tooltipRect} text={entry.description} />}
          <button
            type="button"
            aria-label="Ver descrição"
            onMouseDown={(e) => {
              e.stopPropagation()
              onOpenDescription({ day, hour, half })
            }}
            onContextMenu={(e) => e.stopPropagation()}
            className="absolute bottom-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/45 text-white"
          >
            <StickyNote size={10} />
          </button>
        </>
      )}
    </div>
  )
}

const TOOLTIP_HALF_WIDTH = 110

// Portals the description tooltip to <body> so it's never clipped by the
// grid's own overflow-hidden/overflow-auto ancestors — previously the
// tooltip was absolutely positioned inside the scrolling grid and got cut
// off by the grid's own borders whenever it opened near an edge.
function DescriptionTooltip({ rect, text }) {
  const showBelow = rect.top < 90
  const left = Math.min(
    Math.max(rect.left + rect.width / 2, TOOLTIP_HALF_WIDTH + 8),
    window.innerWidth - TOOLTIP_HALF_WIDTH - 8
  )
  return createPortal(
    <div
      className="pointer-events-none fixed z-[70] w-max max-w-[220px] whitespace-pre-wrap rounded-md bg-black/85 px-2 py-1 text-[11px] leading-snug text-white"
      style={{
        left,
        top: showBelow ? rect.bottom + 6 : rect.top - 6,
        transform: showBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
      }}
    >
      {text}
    </div>,
    document.body
  )
}
