import { useMemo } from 'react'
import { useStoredState } from '../storage/useStoredState'
import { financePaidInvoicesStore } from '../storage/stores'

// Credit card invoices marked paid, identified by their due date (an invoice
// is derived from the entries, so its due date is its id).
export function useFinancePaidInvoices() {
  const [dueDates, setDueDates] = useStoredState(financePaidInvoicesStore)
  const paidSet = useMemo(() => new Set(dueDates), [dueDates])
  const togglePaid = (dueDate) =>
    setDueDates((prev) => (prev.includes(dueDate) ? prev.filter((d) => d !== dueDate) : [...prev, dueDate]))
  return { paidSet, togglePaid }
}
