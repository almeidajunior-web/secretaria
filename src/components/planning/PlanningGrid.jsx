import { Fragment, useEffect, useMemo, useRef } from 'react'
import { StickyNote } from 'lucide-react'
import { HOUR_HEIGHT, WEEKDAYS_SHORT_ORDERED } from '../../constants'
import { cellKey } from '../../lib/planningGrid'
import { ERASER } from './CategoryPalette'

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
  activeBrush,
  onPaintCell,
  onRequestClearWithConfirm,
  onOpenWindowMenu,
  onOpenDescription,
}) {
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
    <div className="thin-scroll flex-1 overflow-auto p-4">
      {activeBrush == null && (
        <p className="mb-2 text-[11px] text-text-muted">
          Selecione uma categoria acima para pintar a grade. Clique com o botão direito numa
          janela preenchida para dividir ou adicionar uma descrição.
        </p>
      )}
      <div
        className="select-none overflow-hidden rounded-md border-l border-t border-border"
        style={{
          display: 'grid',
          gridTemplateColumns: `52px repeat(7, minmax(64px, 1fr))`,
        }}
      >
        <div className="border-b border-r border-border" />
        {WEEKDAYS_SHORT_ORDERED.map((d) => (
          <div
            key={d}
            className="border-b border-r border-border py-1.5 text-center text-[11px] font-semibold text-text-secondary"
          >
            {d}
          </div>
        ))}

        {hours.map((h) => (
          <Fragment key={h}>
            <div
              className="flex items-start justify-end border-b border-r border-border pr-1.5 pt-0.5 text-[10px] text-text-muted"
              style={{ height: HOUR_HEIGHT }}
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
                    height={HOUR_HEIGHT}
                    entry={grid[wholeKey]}
                    categoryById={categoryById}
                    activeBrush={activeBrush}
                    onMouseDown={handleMouseDown}
                    onMouseEnter={handleMouseEnter}
                    onOpenWindowMenu={onOpenWindowMenu}
                    onOpenDescription={onOpenDescription}
                  />
                )
              }

              return (
                <div
                  key={day}
                  className="flex flex-col border-b border-r border-border"
                  style={{ height: HOUR_HEIGHT }}
                >
                  <Window
                    day={day}
                    hour={h}
                    half={0}
                    height={HOUR_HEIGHT / 2}
                    entry={grid[cellKey(day, h, 0)]}
                    categoryById={categoryById}
                    activeBrush={activeBrush}
                    onMouseDown={handleMouseDown}
                    onMouseEnter={handleMouseEnter}
                    onOpenWindowMenu={onOpenWindowMenu}
                    onOpenDescription={onOpenDescription}
                    skipRightBorder
                  />
                  <Window
                    day={day}
                    hour={h}
                    half={30}
                    height={HOUR_HEIGHT / 2}
                    entry={grid[cellKey(day, h, 30)]}
                    categoryById={categoryById}
                    activeBrush={activeBrush}
                    onMouseDown={handleMouseDown}
                    onMouseEnter={handleMouseEnter}
                    onOpenWindowMenu={onOpenWindowMenu}
                    onOpenDescription={onOpenDescription}
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
  activeBrush,
  onMouseDown,
  onMouseEnter,
  onOpenWindowMenu,
  onOpenDescription,
  skipRightBorder,
}) {
  const cat = entry?.categoryId ? categoryById[entry.categoryId] : null

  return (
    <div
      onMouseDown={(e) => {
        if (e.button !== 0) return
        onMouseDown(day, hour, half)
      }}
      onMouseEnter={() => onMouseEnter(day, hour, half)}
      onContextMenu={(e) => {
        e.preventDefault()
        if (!cat) return
        onOpenWindowMenu({ day, hour, half, rect: e.currentTarget.getBoundingClientRect() })
      }}
      className={[
        'relative border-b',
        skipRightBorder ? '' : 'border-r',
        'border-border',
        activeBrush != null ? 'cursor-pointer' : 'cursor-default',
        cat ? '' : 'hover:bg-accent-soft/40',
      ].join(' ')}
      style={{ height, backgroundColor: cat?.color }}
    >
      {entry?.description && (
        <button
          type="button"
          aria-label="Ver descrição"
          onMouseDown={(e) => {
            e.stopPropagation()
            onOpenDescription({ day, hour, half })
          }}
          onContextMenu={(e) => e.stopPropagation()}
          className="absolute bottom-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black/45 text-white"
        >
          <StickyNote size={9} />
        </button>
      )}
    </div>
  )
}
