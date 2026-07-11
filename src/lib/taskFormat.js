import { format, differenceInCalendarDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Parses 'yyyy-MM-dd' as a local-midnight Date (avoids UTC parsing shift).
export function parseDueDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const toDate = parseDueDate

// Strictly before today only — a task due today is never "overdue" (kept
// in the default styling, not the red warning).
export function isOverdue(task, doneStatusIds) {
  if (!task.dueDate || doneStatusIds.has(task.status)) return false
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  return task.dueDate < todayStr
}

// Short relative/absolute label for a task's due date.
export function formatDueDate(dueDate) {
  if (!dueDate) return '—'
  const diff = differenceInCalendarDays(toDate(dueDate), new Date())
  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Amanhã'
  if (diff === -1) return 'Ontem'
  return format(toDate(dueDate), 'dd/MM', { locale: ptBR })
}
