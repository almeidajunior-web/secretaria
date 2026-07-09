import { useEffect, useMemo, useRef, useState } from 'react'
import { getDay } from 'date-fns'
import { CircleCheck, Wallet } from 'lucide-react'
import {
  getWeekDays,
  eventRect,
  minutesToTop,
  minutesOfDay,
  dayAtHour,
  isSameDay,
  fmt,
  layoutColumns,
  GRID_HEIGHT,
} from '../../lib/date'
import { occurrencesForDay, computeFaltasGroup } from '../../lib/recurrence'
import {
  WEEKDAYS_SHORT,
  HOUR_START,
  HOUR_END,
  HOUR_HEIGHT,
} from '../../constants'
import EventCard from './EventCard'

// Seven-day grid: sticky header with per-day quick links, time gutter, and one
// column per day with positioned events. Supports drag-to-create and drag-to-
// move.
export default function WeekView({ currentDate, events, onCreateRange, onEventClick, onMove }) {
  const days = getWeekDays(currentDate)
  const now = useNow()
  const faltasByEvent = useFaltas(events, now)

  return (
    <div className="thin-scroll h-full overflow-auto bg-surface">
      <div className="sticky top-0 z-20 flex border-b border-border bg-surface">
        <div className="w-[52px] shrink-0" />
        {days.map((day) => (
          <DayHeader key={day.toISOString()} day={day} now={now} />
        ))}
      </div>

      <div className="flex">
        <HourGutter />
        <div className="relative flex flex-1" style={{ height: GRID_HEIGHT }}>
          <GridLines />
          {days.map((day) => (
            <DayColumn
              key={day.toISOString()}
              day={day}
              events={events}
              now={now}
              faltasByEvent={faltasByEvent}
              onCreateRange={onCreateRange}
              onEventClick={onEventClick}
              onMove={onMove}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])
  return now
}

// Derived absence count per class event (recomputed when events or time change).
export function useFaltas(events, now) {
  return useMemo(() => {
    const map = {}
    events.forEach((e) => {
      if (e.isAula) map[e.id] = computeFaltasGroup(events, e, now)
    })
    return map
  }, [events, now])
}

function DayHeader({ day, now }) {
  const today = isSameDay(day, now)
  return (
    <div className="flex flex-1 flex-col items-center gap-1 border-l border-border py-2">
      <span className="text-[10px] font-medium uppercase text-text-muted">
        {WEEKDAYS_SHORT[getDay(day)]}
      </span>
      <span
        className={
          today
            ? 'flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[20px] font-light text-white'
            : 'flex h-9 w-9 items-center justify-center text-[20px] font-light text-text'
        }
      >
        {day.getDate()}
      </span>
      <div className="flex gap-1">
        <QuickLink
          icon={CircleCheck}
          label="Tarefas"
          onClick={() => alert(`Navegar para Tarefas — ${fmt(day, 'dd/MM')}`)}
        />
        <QuickLink
          icon={Wallet}
          label="Venc."
          onClick={() => alert(`Navegar para Vencimentos — ${fmt(day, 'dd/MM')}`)}
        />
      </div>
    </div>
  )
}

function QuickLink({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-0.5 rounded border border-border px-1 py-0.5 text-[9px] text-text-muted hover:border-primary hover:text-primary"
    >
      <Icon size={9} />
      {label}
    </button>
  )
}

export function HourGutter() {
  const hours = []
  for (let h = HOUR_START; h <= HOUR_END; h++) hours.push(h)
  return (
    <div className="relative w-[52px] shrink-0" style={{ height: GRID_HEIGHT }}>
      {hours.map((h) => (
        <span
          key={h}
          className="absolute right-1.5 text-[10px] text-text-muted"
          style={{ top: minutesToTop(h * 60) }}
        >
          {String(h).padStart(2, '0')}:00
        </span>
      ))}
    </div>
  )
}

export function GridLines() {
  const lines = []
  for (let h = HOUR_START; h <= HOUR_END; h++) {
    lines.push(
      <div
        key={`h${h}`}
        className="absolute left-0 right-0 border-t border-border"
        style={{ top: minutesToTop(h * 60) }}
      />
    )
    if (h < HOUR_END) {
      lines.push(
        <div
          key={`hh${h}`}
          className="absolute left-0 right-0 border-t border-dashed border-border opacity-50"
          style={{ top: minutesToTop(h * 60 + 30) }}
        />
      )
    }
  }
  return <div className="pointer-events-none absolute inset-0">{lines}</div>
}

// Snaps a client Y coordinate (relative to `el`) to minutes-of-day (15 min).
function yToMinutes(el, clientY) {
  const rect = el.getBoundingClientRect()
  let m = HOUR_START * 60 + ((clientY - rect.top) / HOUR_HEIGHT) * 60
  m = Math.round(m / 15) * 15
  return Math.max(HOUR_START * 60, Math.min(m, HOUR_END * 60))
}

export function DayColumn({
  day,
  events,
  now,
  faltasByEvent = {},
  onCreateRange,
  onEventClick,
  onMove,
}) {
  const colRef = useRef(null)
  const [createDrag, setCreateDrag] = useState(null) // { startMin, endMin }
  const [moveDrag, setMoveDrag] = useState(null) // { key, dx, dy, moved }
  const [resizeDrag, setResizeDrag] = useState(null) // { key, previewHeight }

  const laid = layoutColumns(occurrencesForDay(events, day))
  const today = isSameDay(day, now)
  const nowMin = minutesOfDay(now)
  const showNow = today && nowMin >= HOUR_START * 60 && nowMin <= HOUR_END * 60

  // Drag on empty space -> create an event spanning the dragged range.
  const handleColumnMouseDown = (e) => {
    if (e.button !== 0) return
    const startMin = yToMinutes(colRef.current, e.clientY)
    let endMin = startMin
    const onMoveEv = (ev) => {
      endMin = yToMinutes(colRef.current, ev.clientY)
      setCreateDrag({ startMin, endMin })
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMoveEv)
      window.removeEventListener('mouseup', onUp)
      setCreateDrag(null)
      const a = Math.min(startMin, endMin)
      const b = Math.max(startMin, endMin)
      const startDate = dayAtHour(day, a / 60)
      const endDate =
        b - a >= 15 ? dayAtHour(day, b / 60) : new Date(startDate.getTime() + 30 * 60000)
      onCreateRange(startDate, endDate)
    }
    window.addEventListener('mousemove', onMoveEv)
    window.addEventListener('mouseup', onUp)
  }

  // Drag on an event -> move it (day + time). A negligible move is a click.
  const handleEventMouseDown = (e, occ) => {
    e.stopPropagation()
    if (e.button !== 0) return
    const originX = e.clientX
    const originY = e.clientY
    const rect = e.currentTarget.getBoundingClientRect()
    const key = `${occ.eventId}_${occ.occKey}`
    let dx = 0
    let dy = 0
    let moved = false

    const onMoveEv = (ev) => {
      dx = ev.clientX - originX
      dy = ev.clientY - originY
      if (!moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) moved = true
      if (moved) setMoveDrag({ key, dx, dy })
    }
    const onUp = (ev) => {
      window.removeEventListener('mousemove', onMoveEv)
      window.removeEventListener('mouseup', onUp)
      setMoveDrag(null)
      if (!moved) {
        onEventClick(occ, rect)
        return
      }
      const deltaMin = Math.round(((ev.clientY - originY) / HOUR_HEIGHT) * 60 / 15) * 15
      const targetEl = document.elementFromPoint(ev.clientX, ev.clientY)
      const dayEl = targetEl && targetEl.closest('[data-day]')
      const targetDay = dayEl ? new Date(dayEl.dataset.day) : day
      const startMin = occ.start.getHours() * 60 + occ.start.getMinutes() + deltaMin
      const clamped = Math.max(0, Math.min(startMin, 24 * 60 - 5))
      const ns = new Date(targetDay)
      ns.setHours(0, 0, 0, 0)
      ns.setMinutes(clamped)
      const ne = new Date(ns.getTime() + (occ.end.getTime() - occ.start.getTime()))
      onMove(occ, ns, ne)
    }
    window.addEventListener('mousemove', onMoveEv)
    window.addEventListener('mouseup', onUp)
  }

  // Drag the bottom edge -> change duration (keeps start fixed).
  const handleResizeMouseDown = (e, occ) => {
    e.stopPropagation()
    if (e.button !== 0) return
    const key = `${occ.eventId}_${occ.occKey}`
    const startMin = occ.start.getHours() * 60 + occ.start.getMinutes()
    const originalEndMin = occ.end.getHours() * 60 + occ.end.getMinutes()
    let endMin = originalEndMin

    const onMoveEv = (ev) => {
      const m = yToMinutes(colRef.current, ev.clientY)
      endMin = Math.max(m, startMin + 15)
      setResizeDrag({ key, previewHeight: Math.max((endMin - startMin) * (HOUR_HEIGHT / 60), 18) })
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMoveEv)
      window.removeEventListener('mouseup', onUp)
      setResizeDrag(null)
      if (endMin === originalEndMin) return
      const newEnd = new Date(occ.start)
      newEnd.setHours(0, 0, 0, 0)
      newEnd.setMinutes(endMin)
      onMove(occ, occ.start, newEnd)
    }
    window.addEventListener('mousemove', onMoveEv)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div
      ref={colRef}
      data-day={day.toISOString()}
      className="relative flex-1 select-none border-l border-border"
      onMouseDown={handleColumnMouseDown}
    >
      {createDrag && <SelectionBox drag={createDrag} />}

      {laid.map((o) => {
        const { top, height } = eventRect(o.start, o.end)
        const key = `${o.eventId}_${o.occKey}`
        const isMoving = moveDrag && moveDrag.key === key
        const isResizing = resizeDrag && resizeDrag.key === key
        const effectiveHeight = isResizing ? resizeDrag.previewHeight : height
        return (
          <div
            key={key}
            className="absolute cursor-grab"
            style={{
              top,
              height: effectiveHeight,
              left: `${(o._col / o._cols) * 100}%`,
              width: `calc(${100 / o._cols}% - 3px)`,
              marginLeft: '1px',
              transform: isMoving ? `translate(${moveDrag.dx}px, ${moveDrag.dy}px)` : undefined,
              zIndex: isMoving || isResizing ? 40 : undefined,
              pointerEvents: isMoving ? 'none' : undefined,
            }}
            onMouseDown={(e) => handleEventMouseDown(e, o)}
          >
            <EventCard
              occ={o}
              height={effectiveHeight}
              isPast={o.end < now}
              faltas={faltasByEvent[o.eventId] || 0}
            />
            {height >= 38 && (
              <div
                title="Arrastar para redimensionar"
                onMouseDown={(e) => handleResizeMouseDown(e, o)}
                className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize"
              />
            )}
          </div>
        )
      })}
      {showNow && <NowLine top={minutesToTop(nowMin)} />}
    </div>
  )
}

function SelectionBox({ drag }) {
  const a = Math.min(drag.startMin, drag.endMin)
  const b = Math.max(drag.startMin, drag.endMin)
  const top = minutesToTop(a)
  const height = Math.max((b - a) * (HOUR_HEIGHT / 60), 2)
  return (
    <div
      className="pointer-events-none absolute left-0 right-0 rounded border border-primary bg-primary/20"
      style={{ top, height }}
    />
  )
}

export function NowLine({ top }) {
  return (
    <div className="pointer-events-none absolute left-0 right-0 z-10" style={{ top }}>
      <div className="relative border-t-2 border-primary">
        <div className="absolute -left-1 -top-[5px] h-2 w-2 rounded-full bg-primary" />
      </div>
    </div>
  )
}
