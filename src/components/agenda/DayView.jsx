import { getDay } from 'date-fns'
import { isSameDay, GRID_HEIGHT } from '../../lib/date'
import { WEEKDAYS_SHORT } from '../../constants'
import { useNow, HourGutter, GridLines, DayColumn } from './WeekView'

// Single-day grid. Reuses the week grid's column, gutter and now-line so the
// two views stay visually identical.
export default function DayView({ currentDate, events, onSlotClick, onEventClick }) {
  const now = useNow()
  const today = isSameDay(currentDate, now)

  return (
    <div className="thin-scroll h-full overflow-auto bg-surface">
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-surface px-4 py-2">
        <div className="w-[44px] shrink-0" />
        <span className="text-[10px] font-medium uppercase text-text-muted">
          {WEEKDAYS_SHORT[getDay(currentDate)]}
        </span>
        <span
          className={
            today
              ? 'flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[20px] font-light text-white'
              : 'flex h-9 w-9 items-center justify-center text-[20px] font-light text-text'
          }
        >
          {currentDate.getDate()}
        </span>
      </div>

      <div className="flex">
        <HourGutter />
        <div className="relative flex flex-1" style={{ height: GRID_HEIGHT }}>
          <GridLines />
          <DayColumn
            day={currentDate}
            events={events}
            now={now}
            onSlotClick={onSlotClick}
            onEventClick={onEventClick}
          />
        </div>
      </div>
    </div>
  )
}
