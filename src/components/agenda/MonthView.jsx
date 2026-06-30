import { isSameMonth, isToday } from 'date-fns'
import { getMonthGridDays, fmt } from '../../lib/date'
import { occurrencesForDay } from '../../lib/recurrence'
import { WEEKDAYS_SHORT, withAlpha } from '../../constants'

// Month grid. Each day shows up to two event pills plus an overflow indicator;
// clicking a day drills into its day view.
export default function MonthView({ currentDate, events, onSelectDay }) {
  const days = getMonthGridDays(currentDate)
  const now = new Date()

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS_SHORT.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-[10px] font-medium uppercase text-text-muted"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid flex-1 auto-rows-fr grid-cols-7">
        {days.map((day) => {
          const occ = occurrencesForDay(events, day)
          const visible = occ.slice(0, 2)
          const extra = occ.length - visible.length
          const outside = !isSameMonth(day, currentDate)
          const today = isToday(day)

          return (
            <button
              type="button"
              key={day.toISOString()}
              onClick={() => onSelectDay(day)}
              className={[
                'flex min-h-[80px] flex-col gap-1 border-b border-l border-border p-1.5 text-left align-top hover:bg-accent-soft/50',
                today ? 'bg-accent-soft' : '',
              ].join(' ')}
            >
              <span
                className={[
                  'text-[12px] font-medium',
                  outside ? 'text-text-muted' : 'text-text',
                  today ? 'text-primary' : '',
                ].join(' ')}
              >
                {day.getDate()}
              </span>

              <div className="flex flex-col gap-0.5 overflow-hidden">
                {visible.map((o) => (
                  <span
                    key={`${o.eventId}_${o.occKey}`}
                    className="truncate rounded px-1 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: withAlpha(o.color, 0.13),
                      color: o.color,
                      opacity: o.end < now ? 0.5 : 1,
                    }}
                  >
                    {fmt(o.start, 'HH:mm')} {o.title}
                  </span>
                ))}
                {extra > 0 && (
                  <span className="px-1 text-[10px] text-text-muted">+{extra} mais</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
