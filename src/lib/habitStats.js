import { weekdayOrder } from './date'

// Pure math behind the Rotina section. Everything here takes plain data and
// 'yyyy-MM-dd' strings, so the grid, the chart and the per-habit indicators
// all read from one definition of "counts" instead of three.

export const cellKey = (habitId, dateStr) => `${habitId}:${dateStr}`

// The click cycle. Untouched is deliberately part of it: it lets you undo a
// mark without a modifier key, and it reads differently from 'na' — untouched
// still counts against the day, 'na' steps out of the count entirely.
const CYCLE = { undefined: 'done', done: 'miss', miss: 'na', na: undefined }
export const nextCellState = (state) => CYCLE[state]

// A habit only applies on a date when the date sits inside its run and the
// weekday is one it was defined for. Anything else is inert: not clickable,
// and absent from every denominator.
export function isHabitActiveOn(habit, dateStr, date) {
  if (habit.startDate && dateStr < habit.startDate) return false
  if (habit.endDate && dateStr > habit.endDate) return false
  return habit.weekdays.includes(weekdayOrder(date))
}

// One day's completion. `na` cells leave the denominator, which is what makes
// the state worth having — a justified day off neither rewards nor punishes.
// Returns null when nothing was scheduled, so callers can skip the day rather
// than plot a misleading zero.
export function dayCompletion(habits, log, dateStr, date) {
  let done = 0
  let counted = 0
  for (const habit of habits) {
    if (!isHabitActiveOn(habit, dateStr, date)) continue
    const state = log[cellKey(habit.id, dateStr)]
    if (state === 'na') continue
    counted += 1
    if (state === 'done') done += 1
  }
  if (counted === 0) return null
  return { done, counted, rate: done / counted }
}

// Consecutive scheduled days ending at `todayStr`, walking backwards. Today
// is allowed to be unanswered without breaking the run — the day isn't over
// yet, and a streak that resets every morning would be useless.
export function habitStreak(habit, log, todayStr, today) {
  let streak = 0
  const cursor = new Date(today)
  let first = true
  // A habit scheduled once a week would otherwise walk back forever on an
  // empty log; its own start date is the natural floor.
  for (let guard = 0; guard < 400; guard += 1) {
    const dateStr = toKey(cursor)
    if (habit.startDate && dateStr < habit.startDate) break
    if (isHabitActiveOn(habit, dateStr, cursor)) {
      const state = log[cellKey(habit.id, dateStr)]
      if (state === 'done') streak += 1
      else if (state === 'na') {
        // skipped on purpose — neither extends nor breaks the run
      } else if (!first) break
      else if (state === 'miss') break
    }
    first = false
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

// Hit rate over the visible period, for the column at the end of each row.
// Only counts days that already happened — a month view shouldn't grade you
// on days that haven't arrived.
export function habitPeriodRate(habit, log, days, todayStr) {
  let done = 0
  let counted = 0
  for (const date of days) {
    const dateStr = toKey(date)
    if (dateStr > todayStr) break
    if (!isHabitActiveOn(habit, dateStr, date)) continue
    const state = log[cellKey(habit.id, dateStr)]
    if (state === 'na') continue
    counted += 1
    if (state === 'done') done += 1
  }
  return { done, counted, rate: counted === 0 ? null : done / counted }
}

// Local date -> 'yyyy-MM-dd' without going through UTC, matching
// lib/date.js#toDateInput. Kept local so this module stays dependency-free
// and safe to call in tight loops.
function toKey(date) {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

export { toKey }
