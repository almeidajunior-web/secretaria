// Expansion of recurring events. Given an event and a target day, decide
// whether the event occurs and produce a concrete occurrence for that day.
import {
  startOfDay,
  isSameDay,
  getDay,
  getDate,
  getMonth,
  differenceInCalendarDays,
} from 'date-fns'

// True when `event` has an occurrence on `day` (time of day ignored).
export function occursOn(event, day) {
  const dayStart = startOfDay(day)
  const seriesStart = startOfDay(event.start)

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
// occurrence (used for per-occurrence presence tracking).
export function getOccurrence(event, day) {
  if (!occursOn(event, day)) return null

  const start = new Date(day)
  start.setHours(event.start.getHours(), event.start.getMinutes(), 0, 0)
  const durationMs = event.end - event.start
  const end = new Date(start.getTime() + durationMs)
  const occKey = formatKey(day)

  return {
    ...event,
    start,
    end,
    eventId: event.id,
    occKey,
    // Per-occurrence presence state for this specific day.
    occPresenca: event.presenca ? event.presenca[occKey] : undefined,
  }
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
