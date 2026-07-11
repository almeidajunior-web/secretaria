import { format } from 'date-fns'

// A bill is only "atrasada" while unpaid — once paid, a past due date is
// just history, not something needing attention.
export function isBillOverdue(bill) {
  if (!bill.dueDate || bill.paid) return false
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  return bill.dueDate < todayStr
}
