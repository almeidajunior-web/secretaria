import {
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears,
  isSameDay,
  isSameMonth,
  isSameYear,
  isWithinInterval,
} from 'date-fns'
import { fmt, capitalize, weekStart, weekEnd, fromDateInput } from './date'

export const PERIOD_OPTIONS = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'year', label: 'Ano' },
]

// Filters the finance table by the selected period + reference date. This
// is independent from the Overview section above it, which always shows
// the current calendar month regardless of what period the table is
// browsing — see financeMetrics.js.
export function filterEntriesByPeriod(entries, period, referenceDate) {
  return entries.filter((e) => {
    const entryDate = fromDateInput(e.effectiveDate || e.date)
    if (!entryDate) return false
    switch (period) {
      case 'day':
        return isSameDay(entryDate, referenceDate)
      case 'week':
        return isWithinInterval(entryDate, { start: weekStart(referenceDate), end: weekEnd(referenceDate) })
      case 'year':
        return isSameYear(entryDate, referenceDate)
      case 'month':
      default:
        return isSameMonth(entryDate, referenceDate)
    }
  })
}

// Prev/next navigation for the period toolbar, mirroring Agenda.jsx's
// stepDate — one "step" is whatever the current period unit means.
export function shiftPeriod(referenceDate, period, direction) {
  switch (period) {
    case 'day':
      return direction > 0 ? addDays(referenceDate, 1) : subDays(referenceDate, 1)
    case 'week':
      return direction > 0 ? addWeeks(referenceDate, 1) : subWeeks(referenceDate, 1)
    case 'year':
      return direction > 0 ? addYears(referenceDate, 1) : subYears(referenceDate, 1)
    case 'month':
    default:
      return direction > 0 ? addMonths(referenceDate, 1) : subMonths(referenceDate, 1)
  }
}

export function formatPeriodLabel(referenceDate, period) {
  switch (period) {
    case 'day':
      return capitalize(fmt(referenceDate, "d 'de' MMMM 'de' yyyy"))
    case 'week': {
      const start = weekStart(referenceDate)
      const end = weekEnd(referenceDate)
      const startLabel = isSameMonth(start, end) ? fmt(start, 'd') : fmt(start, "d 'de' MMM")
      const endLabel = fmt(end, "d 'de' MMM 'de' yyyy")
      return capitalize(`${startLabel} – ${endLabel}`)
    }
    case 'year':
      return fmt(referenceDate, 'yyyy')
    case 'month':
    default:
      return capitalize(fmt(referenceDate, 'MMMM yyyy'))
  }
}
