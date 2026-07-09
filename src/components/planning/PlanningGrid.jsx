import { Fragment, useEffect, useMemo, useRef } from 'react'
import { HOUR_START, HOUR_END, HOUR_HEIGHT, WEEKDAYS_SHORT_ORDERED } from '../../constants'
import { ERASER } from './CategoryPalette'

// Fixed weekly routine grid (Monday–Sunday x HOUR_START–HOUR_END). Cells are
// painted with the currently armed brush on mousedown, and on mouseenter
// while the mouse button is held — this lets a single drag stroke paint a
// run of cells, including across day columns.
export default function PlanningGrid({ categories, grid, activeBrush, onPaintCell }) {
  const isPaintingRef = useRef(false)
  const categoryById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories]
  )

  useEffect(() => {
    const stop = () => {
      isPaintingRef.current = false
    }
    window.addEventListener('mouseup', stop)
    return () => window.removeEventListener('mouseup', stop)
  }, [])

  const applyBrush = (day, hour) => {
    if (activeBrush == null) return
    onPaintCell(day, hour, activeBrush === ERASER ? null : activeBrush)
  }

  const hours = []
  for (let h = HOUR_START; h <= HOUR_END; h++) hours.push(h)

  return (
    <div className="thin-scroll flex-1 overflow-auto p-4">
      {activeBrush == null && (
        <p className="mb-2 text-[11px] text-text-muted">
          Selecione uma categoria acima para pintar a grade.
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
              const key = `${day}:${h}`
              const cat = grid[key] ? categoryById[grid[key]] : null
              return (
                <div
                  key={day}
                  onMouseDown={(e) => {
                    if (e.button !== 0) return
                    isPaintingRef.current = true
                    applyBrush(day, h)
                  }}
                  onMouseEnter={() => {
                    if (isPaintingRef.current) applyBrush(day, h)
                  }}
                  className={[
                    'border-b border-r border-border',
                    activeBrush != null ? 'cursor-pointer' : 'cursor-default',
                    cat ? '' : 'hover:bg-accent-soft/40',
                  ].join(' ')}
                  style={{ height: HOUR_HEIGHT, backgroundColor: cat?.color }}
                />
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
