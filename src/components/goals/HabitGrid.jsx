import { Check, Minus, Pencil, X } from 'lucide-react'
import { fmt } from '../../lib/date'
import { WEEKDAYS_LETTERS_ORDERED } from '../../constants'
import { cellKey, isHabitActiveOn, habitStreak, habitPeriodRate, toKey } from '../../lib/habitStats'
import { tintVars } from '../../lib/color'

// One background tint per day column, applied to the header cell and to every
// row's cell for that same day — so the tint reads as a continuous band down
// the column, not a per-row pattern. Resolves to exactly one class: stacking
// two background utilities on the same element is unreliable (whichever
// Tailwind emits last in the stylesheet wins, not whichever is listed last
// here), so today, the weekend and the week banding are a priority chain
// rather than combinable layers.
function dayColumnBg(date, index, isToday) {
  if (isToday) return 'bg-accent-soft/50'
  const weekday = (date.getDay() + 6) % 7 // Monday=0 … Sunday=6
  if (weekday >= 5) return 'bg-inset/60' // Saturday, Sunday
  return Math.floor(index / 7) % 2 === 1 ? 'bg-surface/40' : ''
}

// The grid itself: one row per routine, one column per day of the visible
// period, and a cell that cycles through the four states on click. Every
// cell carries its own border-b/border-r, the same "draw the grid one cell at
// a time" approach as Planejamento's grid — the outer border-l/border-t on
// the wrapper is what closes the box on the two edges no cell owns.
//
// Cells outside a routine's run (before its start date, past its end date, or
// on a weekday it wasn't defined for) are inert — they render as a faint dash
// and ignore clicks, because letting you mark a day the routine doesn't apply
// to would put a value into a denominator that deliberately excludes it.
export default function HabitGrid({
  habits,
  habitLog,
  days,
  todayStr,
  today,
  onCycleCell,
  onEditHabit,
}) {
  if (habits.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-text-muted">
        Nenhuma rotina ainda. Use "Nova rotina" para criar a primeira.
      </p>
    )
  }

  const dayMeta = days.map((date, index) => {
    const dateStr = toKey(date)
    const isToday = dateStr === todayStr
    return { date, dateStr, isToday, bg: dayColumnBg(date, index, isToday) }
  })

  // Fixed label column, then one equal track per day. `minmax(0, 1fr)` keeps
  // a month's 31 columns from overflowing the module instead of shrinking.
  const gridTemplateColumns = `minmax(185px, 1.4fr) repeat(${days.length}, minmax(0, 1fr)) 46px`

  return (
    <div className="thin-scroll overflow-x-auto">
      <div
        className="min-w-[560px] border-l border-t border-border"
        style={{ display: 'grid', gridTemplateColumns }}
      >
        {/* header */}
        <div className="sticky left-0 z-[1] border-b border-r border-border bg-app-bg px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
          Rotina
        </div>
        {dayMeta.map(({ date, dateStr, isToday, bg }) => (
          <div key={dateStr} className={`border-b border-r border-border pb-1.5 text-center ${bg}`}>
            <p
              className={[
                'text-[9px] uppercase',
                isToday ? 'font-semibold text-primary' : 'text-text-muted',
              ].join(' ')}
            >
              {WEEKDAYS_LETTERS_ORDERED[(date.getDay() + 6) % 7]}
            </p>
            <p
              className={[
                'text-[11px] tabular-nums',
                isToday ? 'font-semibold text-primary' : 'text-text-secondary',
              ].join(' ')}
            >
              {fmt(date, 'd')}
            </p>
          </div>
        ))}
        <div className="border-b border-r border-border pb-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-text-muted">
          %
        </div>

        {/* rows */}
        {habits.map((habit) => {
          const streak = habitStreak(habit, habitLog, todayStr, today)
          const period = habitPeriodRate(habit, habitLog, days, todayStr)
          return (
            <Row
              key={habit.id}
              habit={habit}
              habitLog={habitLog}
              dayMeta={dayMeta}
              todayStr={todayStr}
              streak={streak}
              period={period}
              onCycleCell={onCycleCell}
              onEditHabit={onEditHabit}
            />
          )
        })}
      </div>
    </div>
  )
}

function Row({ habit, habitLog, dayMeta, todayStr, streak, period, onCycleCell, onEditHabit }) {
  return (
    <>
      <div className="sticky left-0 z-[1] flex min-w-0 items-center gap-2 border-b border-r border-border bg-app-bg py-1 pr-3">
        <span className="tint-fill h-2 w-2 shrink-0 rounded-full" style={tintVars(habit.color)} />
        <button
          type="button"
          onClick={() => onEditHabit(habit)}
          className="group flex min-w-0 flex-1 items-center gap-1.5 text-left"
        >
          <span className="truncate text-[12px] text-text">{habit.label}</span>
          <Pencil
            size={11}
            className="shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
          />
        </button>
        {streak > 0 && (
          <span
            className="shrink-0 rounded-full border border-border px-1.5 text-[10px] tabular-nums text-text-secondary"
            title={`${streak} ${streak === 1 ? 'dia seguido' : 'dias seguidos'}`}
          >
            {streak}
          </span>
        )}
      </div>

      {dayMeta.map(({ date, dateStr, bg }) => {
        const active = isHabitActiveOn(habit, dateStr, date)
        const state = habitLog[cellKey(habit.id, dateStr)]
        return (
          <Cell
            key={dateStr}
            active={active}
            state={state}
            future={dateStr > todayStr}
            bg={bg}
            onClick={() => active && onCycleCell(habit.id, dateStr)}
            label={`${habit.label} — ${fmt(date, 'dd/MM')}`}
          />
        )
      })}

      <div className="flex items-center justify-center border-b border-r border-border py-1 text-[11px] tabular-nums text-text-secondary">
        {period.rate == null ? '–' : `${Math.round(period.rate * 100)}%`}
      </div>
    </>
  )
}

// The four states, plus the inert one. Colour carries meaning here but never
// alone: each state also has its own glyph, so it stays readable for anyone
// who can't separate the greens from the reds.
function Cell({ active, state, future, bg, onClick, label }) {
  if (!active) {
    return (
      <div
        className={`flex items-center justify-center border-b border-r border-border py-1 ${bg}`}
        aria-hidden="true"
      >
        <span className="h-[3px] w-[3px] rounded-full bg-border" />
      </div>
    )
  }

  const base =
    'flex h-[22px] w-full max-w-[26px] items-center justify-center rounded-[5px] border transition-[background-color,border-color,transform] duration-150 active:scale-90'
  const look =
    state === 'done'
      ? 'border-success bg-success text-white'
      : state === 'miss'
        ? 'border-danger/60 bg-danger/10 text-danger'
        : state === 'na'
          ? 'border-border-strong bg-transparent text-text-muted'
          : future
            ? 'border-border bg-transparent text-transparent'
            : 'border-border-strong bg-transparent text-transparent hover:border-primary'

  return (
    <div className={`flex items-center justify-center border-b border-r border-border py-1 ${bg}`}>
      <button type="button" onClick={onClick} aria-label={label} className={[base, look].join(' ')}>
        {state === 'done' ? (
          <Check size={13} strokeWidth={3} />
        ) : state === 'miss' ? (
          <X size={12} strokeWidth={3} />
        ) : state === 'na' ? (
          <Minus size={11} strokeWidth={3} />
        ) : null}
      </button>
    </div>
  )
}
