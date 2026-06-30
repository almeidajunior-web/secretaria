import { useEffect, useMemo, useState } from 'react'
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
import { occurrencesForDay, computeFaltas } from '../../lib/recurrence'
import {
  WEEKDAYS_SHORT,
  HOUR_START,
  HOUR_END,
  HOUR_HEIGHT,
} from '../../constants'
import EventCard from './EventCard'

// Seven-day grid: sticky header with per-day quick links, time gutter, and one
// column per day with positioned events.
export default function WeekView({ currentDate, events, onSlotClick, onEventClick }) {
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
              onSlotClick={onSlotClick}
              onEventClick={onEventClick}
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
      if (e.isAula) map[e.id] = computeFaltas(e, now)
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
          label="To Dos"
          onClick={() => alert(`Navegar para To Dos — ${fmt(day, 'dd/MM')}`)}
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

export function DayColumn({ day, events, now, faltasByEvent = {}, onSlotClick, onEventClick }) {
  const laid = layoutColumns(occurrencesForDay(events, day))
  const today = isSameDay(day, now)
  const nowMin = minutesOfDay(now)
  const showNow = today && nowMin >= HOUR_START * 60 && nowMin <= HOUR_END * 60

  const handleEmptyClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    let minutes = HOUR_START * 60 + (y / HOUR_HEIGHT) * 60
    minutes = Math.round(minutes / 30) * 30
    minutes = Math.max(HOUR_START * 60, Math.min(minutes, HOUR_END * 60 - 30))
    onSlotClick(dayAtHour(day, minutes / 60))
  }

  return (
    <div className="relative flex-1 border-l border-border" onClick={handleEmptyClick}>
      {laid.map((o) => {
        const { top, height } = eventRect(o.start, o.end)
        return (
          <div
            key={`${o.eventId}_${o.occKey}`}
            className="absolute"
            style={{
              top,
              height,
              left: `${(o._col / o._cols) * 100}%`,
              width: `calc(${100 / o._cols}% - 3px)`,
              marginLeft: '1px',
            }}
          >
            <EventCard
              occ={o}
              height={height}
              isPast={o.end < now}
              faltas={faltasByEvent[o.eventId] || 0}
              onClick={(e) => {
                e.stopPropagation()
                onEventClick(o, e.currentTarget.getBoundingClientRect())
              }}
            />
          </div>
        )
      })}
      {showNow && <NowLine top={minutesToTop(nowMin)} />}
    </div>
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
