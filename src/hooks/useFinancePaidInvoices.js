import { useEffect, useMemo, useState } from 'react'
import { loadFinancePaidInvoices, saveFinancePaidInvoices } from '../lib/storage'

// Which credit-card invoices the user has marked paid — keyed by the invoice's
// due date (its stable derived id). Persisted as an array; exposed as a Set for
// cheap membership plus a toggle.
export function useFinancePaidInvoices() {
  const [dueDates, setDueDates] = useState(() => loadFinancePaidInvoices())

  useEffect(() => {
    saveFinancePaidInvoices(dueDates)
  }, [dueDates])

  const paidSet = useMemo(() => new Set(dueDates), [dueDates])

  const togglePaid = (dueDate) =>
    setDueDates((prev) => (prev.includes(dueDate) ? prev.filter((d) => d !== dueDate) : [...prev, dueDate]))

  return { paidSet, togglePaid }
}
