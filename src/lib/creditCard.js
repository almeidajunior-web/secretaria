import { addMonths, format, getDaysInMonth, setDate } from 'date-fns'

// Parses 'yyyy-MM-dd' as a local-midnight Date (avoids UTC parsing shift) —
// same convention as billRecurrence.js#toDate.
function toDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function clampDay(date, day) {
  return setDate(date, Math.min(day, getDaysInMonth(date)))
}

// Single fixed card, closing/due day configured once (useFinanceCreditCard).
// A purchase before the closing day lands in the invoice that closes this
// month; on/after the closing day it's pushed into next month's invoice.
// The due date always falls after its closing date: if the due-day number
// is earlier in the month than the closing-day number, the due date rolls
// into the month after the invoice closes.
export function creditCardEffectiveDate(dateStr, closingDay, dueDay) {
  const purchase = toDate(dateStr)
  const closesThisMonth = purchase.getDate() < closingDay
  const closingCycle = closesThisMonth ? purchase : addMonths(purchase, 1)
  const dueMonth = dueDay > closingDay ? closingCycle : addMonths(closingCycle, 1)
  return format(clampDay(dueMonth, dueDay), 'yyyy-MM-dd')
}

// Recomputes `effectiveDate` for an entry — the date money actually leaves
// the balance. Non-card entries settle the same day they're logged; card
// entries follow the invoice-cycle math above. Called at every mutation
// point (add, edit, duplicate) so effectiveDate never goes stale.
export function withEffectiveDate(entry, creditCfg) {
  if (!entry.date) return { ...entry, effectiveDate: null }
  if (entry.paymentMethodId !== 'credito' || !creditCfg?.closingDay || !creditCfg?.dueDay) {
    return { ...entry, effectiveDate: entry.date }
  }
  return { ...entry, effectiveDate: creditCardEffectiveDate(entry.date, creditCfg.closingDay, creditCfg.dueDay) }
}

// The invoice currently accumulating (not yet closed): whatever a purchase
// made today would be assigned to. Since every card entry's effectiveDate
// already equals its invoice's due date, entries sharing that same due date
// belong to the same invoice — no separate grouping id needed.
export function currentInvoiceTotal(entries, creditCfg, todayStr) {
  if (!creditCfg?.closingDay || !creditCfg?.dueDay) return null
  const { closingDay, dueDay } = creditCfg
  const dueDate = creditCardEffectiveDate(todayStr, closingDay, dueDay)
  // Falls back to recomputing from `date` for entries stored before this
  // field existed, same fallback convention as financeMetrics/financePeriod.
  // Income on a card (a refund/chargeback) posts as a credit, so it lowers
  // the invoice rather than adding to it.
  const total = entries
    .filter((e) => e.paymentMethodId === 'credito' && e.date)
    .filter((e) => (e.effectiveDate || creditCardEffectiveDate(e.date, closingDay, dueDay)) === dueDate)
    .reduce((sum, e) => sum + (e.type === 'income' ? -(e.amount || 0) : e.amount || 0), 0)
  return { total, dueDate, closingDay, dueDay }
}
