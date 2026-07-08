import { useState } from 'react'
import { addMonths, subMonths, isSameMonth, isToday } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonthGridDays, fmt, capitalize, isSameDay } from '../../lib/date'
import { WEEKDAYS_LETTERS_ORDERED } from '../../constants'

// Compact month picker in the sidebar. Browsing months is local; picking a day
// updates the agenda's active date.
export default function MiniCalendar({ currentDate, onSelectDate }) {
  const [viewMonth, setViewMonth] = useState(() => new Date(currentDate))
  const days = getMonthGridDays(viewMonth)

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-text">
          {capitalize(fmt(viewMonth, 'MMMM yyyy'))}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Mês anterior"
            onClick={() => setViewMonth((m) => subMonths(m, 1))}
            className="flex h-5 w-5 items-center justify-center rounded text-text-muted hover:bg-accent-soft hover:text-primary"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            aria-label="Próximo mês"
            onClick={() => setViewMonth((m) => addMonths(m, 1))}
            className="flex h-5 w-5 items-center justify-center rounded text-text-muted hover:bg-accent-soft hover:text-primary"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center text-[10px] text-text-muted">
        {WEEKDAYS_LETTERS_ORDERED.map((d, i) => (
          <span key={i} className="font-medium">
            {d}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-y-0.5 text-center">
        {days.map((day) => {
          const selected = isSameDay(day, currentDate)
          const today = isToday(day)
          const outside = !isSameMonth(day, viewMonth)
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDate(new Date(day))}
              className={[
                'mx-auto flex h-6 w-6 items-center justify-center rounded-full text-[11px]',
                selected
                  ? 'bg-primary font-semibold text-white'
                  : today
                    ? 'text-primary font-semibold'
                    : outside
                      ? 'text-text-muted'
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
