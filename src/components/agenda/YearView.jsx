import { isSameMonth, isToday, setMonth } from 'date-fns'
import { getMonthGridDays } from '../../lib/date'
import { MONTHS, WEEKDAYS_LETTERS_ORDERED } from '../../constants'

// Twelve mini-months (4×3). Numbers only — no events. Today is highlighted and
// clicking any day drills into its day view.
export default function YearView({ currentDate, onSelectDay }) {
  return (
    <div className="thin-scroll h-full overflow-auto bg-surface p-4">
      <div className="grid grid-cols-4 gap-4">
        {MONTHS.map((name, idx) => (
          <MiniMonth
            key={name}
            monthDate={setMonth(currentDate, idx)}
            label={name}
            onSelectDay={onSelectDay}
          />
        ))}
      </div>
    </div>
  )
}

function MiniMonth({ monthDate, label, onSelectDay }) {
  const days = getMonthGridDays(monthDate)
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="mb-2 text-xs font-semibold text-text">{label}</p>
      <div className="grid grid-cols-7 text-center text-[9px] text-text-muted">
        {WEEKDAYS_LETTERS_ORDERED.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-y-0.5 text-center">
        {days.map((day) => {
          const outside = !isSameMonth(day, monthDate)
          const today = isToday(day)
          if (outside) return <span key={day.toISOString()} />
          return (
            <button
              type="button"
              key={day.toISOString()}
              onClick={() => onSelectDay(day)}
              className={[
                'mx-auto flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
                today
                  ? 'bg-primary font-semibold text-white'
                  : 'text-text-secondary hover:bg-accent-soft',
              ].join(' ')}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
