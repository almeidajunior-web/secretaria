import { addMonths, format } from 'date-fns'

// Bill-specific recurrence: simpler than Agenda/Tarefas' engine (no weekday
// combos, no "dias úteis") since a bill only ever recurs on a monthly-ish
// cadence anchored to its own due date. `addMonths` already clamps an
// overflowing day to the target month's last day (e.g. Jan 31 + 1 month →
// Feb 28), so no custom day-of-month handling is needed.
export const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Não recorrente' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'bimonthly', label: 'Bimestral' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannual', label: 'Semestral' },
  { value: 'annual', label: 'Anual' },
]

const RECURRENCE_MONTHS = {
  monthly: 1,
  bimonthly: 2,
  quarterly: 3,
  semiannual: 6,
  annual: 12,
}

// Parses 'yyyy-MM-dd' as a local-midnight Date (avoids UTC parsing shift).
function toDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// The due date of the next cycle, or null for a one-off bill.
export function nextDueDate(dueDateStr, recurrence) {
  const months = RECURRENCE_MONTHS[recurrence]
  if (!months) return null
  return format(addMonths(toDate(dueDateStr), months), 'yyyy-MM-dd')
}
