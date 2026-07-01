// Expansion of recurring events. Given an event and a target day, decide
// whether the event occurs and produce a concrete occurrence for that day.
import {
  startOfDay,
  isSameDay,
  getDay,
  getDate,
  getMonth,
  differenceInCalendarDays,
  addDays,
} from 'date-fns'

// True when `event` has an occurrence on `day` (time of day ignored).
export function occursOn(event, day) {
  const dayStart = startOfDay(day)
  const seriesStart = startOfDay(event.start)

  // Occurrences explicitly removed from the series ("somente este" na exclusão
  // ou ao destacar uma ocorrência).
  if (event.exdates && event.exdates.includes(formatKey(day))) return false

  if (event.recurrence === 'none') {
    return isSameDay(event.start, day)
  }

  // Recurring series never produce occurrences before their start date.
  if (dayStart < seriesStart) return false

  // Optional end date for the series ("repetir até").
  if (event.recurrenceUntil && dayStart > startOfDay(event.recurrenceUntil)) {
    return false
  }

  switch (event.recurrence) {
    case 'daily':
      return true
    case 'weekly':
      return getDay(day) === getDay(event.start)
    case 'biweekly': {
      if (getDay(day) !== getDay(event.start)) return false
      const diffDays = differenceInCalendarDays(dayStart, seriesStart)
      return (diffDays / 7) % 2 === 0
    }
    case 'monthly':
      return getDate(day) === getDate(event.start)
    case 'yearly':
      return getDate(day) === getDate(event.start) && getMonth(day) === getMonth(event.start)
    case 'weekdays': {
      const wd = getDay(day)
      return wd >= 1 && wd <= 5
    }
    case 'custom': {
      // Repeats on any of the selected weekdays.
      const days = event.recurrenceDays || []
      return days.includes(getDay(day))
    }
    default:
      return false
  }
}

// Returns a concrete occurrence of `event` on `day`, preserving the original
// time of day, or null if it does not occur. `occKey` identifies the specific
// occurrence and `status` is the effective (per-occurrence) status.
export function getOccurrence(event, day) {
  if (!occursOn(event, day)) return null

  const start = new Date(day)
  start.setHours(event.start.getHours(), event.start.getMinutes(), 0, 0)
  const durationMs = event.end - event.start
  const end = new Date(start.getTime() + durationMs)
  const occKey = formatKey(day)

  // A single occurrence may override the series status (e.g. marking one class
  // as attended). Falls back to the event's base status.
  const status = (event.occStatus && event.occStatus[occKey]) || event.status

  return {
    ...event,
    start,
    end,
    status,
    baseStatus: event.status,
    eventId: event.id,
    occKey,
  }
}

// Counts absences for a class event: every past occurrence whose effective
// status is not "confirmed" (the chosen rule: only Confirmado = presença).
export function computeFaltas(event, now = new Date()) {
  if (!event.isAula) return 0

  const isAbsence = (occ) => occ && occ.end < now && occ.status !== 'confirmed'

  if (event.recurrence === 'none') {
    return isAbsence(getOccurrence(event, event.start)) ? 1 : 0
  }

  let count = 0
  const today = startOfDay(now)
  let cursor = startOfDay(event.start)
  let guard = 0
  while (cursor <= today && guard < 1000) {
    guard += 1
    if (occursOn(event, cursor) && isAbsence(getOccurrence(event, cursor))) {
      count += 1
    }
    cursor = addDays(cursor, 1)
  }
  return count
}

// Stable key for an occurrence date (yyyy-MM-dd).
export function formatKey(day) {
  const y = day.getFullYear()
  const m = String(day.getMonth() + 1).padStart(2, '0')
  const d = String(day.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// All occurrences for a given day across a list of events, sorted by start.
export function occurrencesForDay(events, day) {
  return events
    .map((e) => getOccurrence(e, day))
    .filter(Boolean)
    .sort((a, b) => a.start - b.start)
}
