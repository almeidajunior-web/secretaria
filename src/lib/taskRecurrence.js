// Recurrence rollover for Tarefas. Unlike Agenda (which expands a series
// into many visible occurrences), a recurring task is a single record whose
// `dueDate` advances in place — completing it or letting it go overdue never
// spawns a second task. Reuses Agenda's `occursOn` so the recurrence
// patterns (diária/semanal/quinzenal/mensal/anual/dias úteis/personalizada)
// behave identically across both modules.
import { addDays, startOfDay } from 'date-fns'
import { occursOn } from './recurrence'

// Parses 'yyyy-MM-dd' as a local-midnight Date (avoids UTC parsing shift).
function toDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// The next date (inclusive) the task's recurrence rule occurs on, starting
// the search at `fromDateStr`. Returns null when the task isn't recurring or
// its recurrence has ended (recurrenceUntil exceeded).
export function nextOccurrenceOnOrAfter(task, fromDateStr) {
  if (!task.recurrence || task.recurrence === 'none') return null
  const pseudoEvent = {
    recurrence: task.recurrence,
    recurrenceDays: task.recurrenceDays || [],
    start: toDate(task.dueDate),
    recurrenceUntil: task.recurrenceUntil ? toDate(task.recurrenceUntil) : null,
    exdates: [],
  }
  let cursor = startOfDay(toDate(fromDateStr))
  let guard = 0
  while (guard < 1000) {
    guard += 1
    if (pseudoEvent.recurrenceUntil && cursor > pseudoEvent.recurrenceUntil) return null
    if (occursOn(pseudoEvent, cursor)) return toDateStr(cursor)
    cursor = addDays(cursor, 1)
  }
  return null
}

// The next occurrence strictly after `fromDateStr` — used when completing a
// recurring task, so finishing it early never re-selects the same day.
export function nextOccurrenceAfter(task, fromDateStr) {
  return nextOccurrenceOnOrAfter(task, toDateStr(addDays(toDate(fromDateStr), 1)))
}

// Silently advances an overdue, unfinished recurring task's due date to the
// next valid occurrence on/after `todayStr`. Returns the same task instance
// unchanged when no rollover is needed (not recurring, not overdue, already
// finalizada, or the recurrence has ended).
export function rollForwardIfOverdue(task, todayStr) {
  if (!task.recurrence || task.recurrence === 'none') return task
  if (task.status === 'finalizada') return task
  if (task.dueDate >= todayStr) return task
  const next = nextOccurrenceOnOrAfter(task, todayStr)
  if (!next || next === task.dueDate) return task
  return { ...task, dueDate: next }
}
