import { addDays, format } from 'date-fns'

const TASK_GROUP_ORDER = ['atrasadas', 'hoje', 'amanha', 'semana', 'depois', 'semPrazo']

const TASK_GROUP_LABELS = {
  atrasadas: 'Atrasadas',
  hoje: 'Hoje',
  amanha: 'Amanhã',
  semana: 'Próximos 7 dias',
  depois: 'Mais tarde',
  semPrazo: 'Sem prazo',
}

// Buckets already-sorted tasks into due-date groups — bucket order is always
// most-overdue-first (Atrasadas → Hoje → Amanhã → ...), regardless of the
// active sort chain. Each bucket keeps the tasks' existing relative order
// (whatever the sort chain produced upstream), so within "Atrasadas" the
// default due-date-ascending sort naturally puts the oldest overdue task
// first too. Returns only non-empty groups.
export function groupTasksByDueDate(tasks, now = new Date()) {
  const todayStr = format(now, 'yyyy-MM-dd')
  const tomorrowStr = format(addDays(now, 1), 'yyyy-MM-dd')
  const in7DaysStr = format(addDays(now, 7), 'yyyy-MM-dd')

  const buckets = { atrasadas: [], hoje: [], amanha: [], semana: [], depois: [], semPrazo: [] }
  for (const t of tasks) {
    if (!t.dueDate) buckets.semPrazo.push(t)
    else if (t.dueDate < todayStr) buckets.atrasadas.push(t)
    else if (t.dueDate === todayStr) buckets.hoje.push(t)
    else if (t.dueDate === tomorrowStr) buckets.amanha.push(t)
    else if (t.dueDate <= in7DaysStr) buckets.semana.push(t)
    else buckets.depois.push(t)
  }

  return TASK_GROUP_ORDER.map((key) => ({
    key,
    label: TASK_GROUP_LABELS[key],
    tasks: buckets[key],
  })).filter((g) => g.tasks.length > 0)
}
