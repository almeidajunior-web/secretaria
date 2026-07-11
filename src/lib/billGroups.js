import { addDays, format } from 'date-fns'

const BILL_GROUP_ORDER = ['atrasadas', 'hoje', 'amanha', 'semana', 'depois', 'semVencimento']

const BILL_GROUP_LABELS = {
  atrasadas: 'Atrasadas',
  hoje: 'Hoje',
  amanha: 'Amanhã',
  semana: 'Próximos 7 dias',
  depois: 'Mais tarde',
  semVencimento: 'Sem vencimento',
}

// Buckets already-sorted bills into due-date groups — always on for this
// module (vencimento is the central organizing concept here, unlike
// Compras' opt-in category grouping). Bucket order is always
// most-overdue-first, regardless of the active sort chain.
//
// Bucket assignment is by date alone (a bill whose due date has passed
// always lands in "atrasadas", paid or not) — same convention as Tarefas'
// groupTasksByDueDate. This keeps the elif chain simple and bug-free: once
// `paid` was factored into the branch condition here, a paid bill with a
// past due date fell through every date check (its date is never >= today)
// and got misrouted into "semana" purely from a lexicographic string
// comparison quirk. The red "atrasada" styling itself is still driven
// separately by isBillOverdue() at the row level, which does exclude paid
// bills — only the section it's grouped under is date-only.
export function groupBillsByDueDate(bills, now = new Date()) {
  const todayStr = format(now, 'yyyy-MM-dd')
  const tomorrowStr = format(addDays(now, 1), 'yyyy-MM-dd')
  const in7DaysStr = format(addDays(now, 7), 'yyyy-MM-dd')

  const buckets = { atrasadas: [], hoje: [], amanha: [], semana: [], depois: [], semVencimento: [] }
  for (const b of bills) {
    if (!b.dueDate) buckets.semVencimento.push(b)
    else if (b.dueDate < todayStr) buckets.atrasadas.push(b)
    else if (b.dueDate === todayStr) buckets.hoje.push(b)
    else if (b.dueDate === tomorrowStr) buckets.amanha.push(b)
    else if (b.dueDate <= in7DaysStr) buckets.semana.push(b)
    else buckets.depois.push(b)
  }

  return BILL_GROUP_ORDER.map((key) => ({
    key,
    label: BILL_GROUP_LABELS[key],
    bills: buckets[key],
  })).filter((g) => g.bills.length > 0)
}
