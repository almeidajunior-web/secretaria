import { format, differenceInCalendarDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Parses 'yyyy-MM-dd' as a local-midnight Date (avoids UTC parsing shift).
function toDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function isOverdue(task) {
  if (!task.dueDate || task.status === 'finalizada') return false
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
