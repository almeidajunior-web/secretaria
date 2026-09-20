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
//
// `endDate` (optional 'yyyy-MM-dd') closes the series: once the next cycle
// would fall past it, there is no next cycle. It's inclusive, so a limit set
// exactly on a cycle's own date still lets that cycle happen — that's how the
// date reads in the interface ("recorrente até 10/12" includes 10/12). An
// already-spawned occurrence beyond the limit is deliberately left alone;
// this only stops new ones.
export function nextDueDate(dueDateStr, recurrence, endDate) {
  const months = RECURRENCE_MONTHS[recurrence]
  if (!months) return null
  const next = format(addMonths(toDate(dueDateStr), months), 'yyyy-MM-dd')
  if (endDate && next > endDate) return null
  return next
}
