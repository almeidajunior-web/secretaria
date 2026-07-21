import { addMonths, format, getDaysInMonth, setDate, subMonths } from 'date-fns'

// Parses 'yyyy-MM-dd' as a local-midnight Date (avoids UTC parsing shift) —
// same convention as billRecurrence.js#toDate.
function toDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function clampDay(date, day) {
  return setDate(date, Math.min(day, getDaysInMonth(date)))
}

// The due date of the invoice a credit-card purchase made on `dateStr` lands
// on. Single fixed card, closing/due day configured once (useFinanceCreditCard).
// A purchase before the closing day is billed on the invoice that closes this
// month; on/after the closing day it rolls to next month's invoice. The
// invoice is then due on `dueDay`: if that number falls on/before the closing
// day, the due date is in the month AFTER the invoice closes.
//
// This is a pure function of (date, config) and is NEVER stored — it's derived
// on demand wherever a cash date is needed, so changing the card config can't
// leave stale values behind.
export function vencimentoDaCompra(dateStr, closingDay, dueDay) {
  const purchase = toDate(dateStr)
  const closingMonth = purchase.getDate() < closingDay ? purchase : addMonths(purchase, 1)
  const dueMonth = dueDay > closingDay ? closingMonth : addMonths(closingMonth, 1)
  return format(clampDay(dueMonth, dueDay), 'yyyy-MM-dd')
}

// The closing date of the invoice that is due on `dueDateStr` — the inverse of
// vencimentoDaCompra's month math, used to label/scope an invoice cycle.
function closingDateForDue(dueDateStr, closingDay, dueDay) {
  const due = toDate(dueDateStr)
  const closingMonth = dueDay > closingDay ? due : subMonths(due, 1)
  return format(clampDay(closingMonth, closingDay), 'yyyy-MM-dd')
}

// ── The two date bases ──────────────────────────────────────────────────────
// Competência: when the expense/income was incurred — always the raw purchase
// date. Every "what did I spend/earn" metric keys off this.
export function dataCompetencia(entry) {
  return entry.date || null
}

// Caixa: when money actually leaves/enters the balance. Same as the competência
// date for everything except credit-card entries, which settle on their
// invoice's due date. Account balances and the invoice view key off this.
export function dataCaixa(entry, creditCfg) {
  if (!entry.date) return null
  if (entry.paymentMethodId !== 'credito' || !creditCfg?.closingDay || !creditCfg?.dueDay) {
    return entry.date
  }
  return vencimentoDaCompra(entry.date, creditCfg.closingDay, creditCfg.dueDay)
}

// Splits a single credit-card purchase into `count` monthly installment
// entries: the amount is divided evenly in cents (any leftover cent goes to
// the earliest installments, so the parts always sum back to the original
// total), each installment's `date` is one month further than the last (so it
// lands in — and is "incurred" in — its own month), and the title gets a
// "(i/N)" suffix. recurrence is force-cleared — installments are a fixed-count
// series, not an open-ended recurring bill.
export function splitIntoInstallments(entry, count) {
  const cents = Math.round((entry.amount || 0) * 100)
  const base = Math.floor(cents / count)
  const remainder = cents - base * count
  const groupId = `inst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const baseDate = toDate(entry.date)
  return Array.from({ length: count }, (_, i) => ({
    ...entry,
    amount: (base + (i < remainder ? 1 : 0)) / 100,
    date: format(addMonths(baseDate, i), 'yyyy-MM-dd'),
    title: `${entry.title} (${i + 1}/${count})`,
    recurrence: 'none',
    installment: { current: i + 1, total: count },
    installmentGroupId: groupId,
  }))
}

// Groups every credit-card entry into its invoice (keyed by due date) and
// returns them oldest→newest as first-class objects the UI can render and act
// on. Each invoice knows its cycle (closing/due dates), its line items, its net
// total (a refund/chargeback posts as a credit and lowers it), and its status.
// The cycle a purchase-made-today falls into is always represented, even with
// no items yet, so the "open" invoice is always shown.
//
// status:
//   aberta  — the cycle accumulating right now (a purchase made today lands here)
//   futura  — a later cycle that hasn't opened yet (from future installments/recurring)
//   fechada — closed, waiting to be paid (due date today or in the future)
//   vencida — due date passed and not marked paid
//   paga    — the user marked this invoice paid (dueDate ∈ paidSet)
export function creditCardInvoices(entries, creditCfg, todayStr, paidSet = new Set()) {
  if (!creditCfg?.closingDay || !creditCfg?.dueDay) return []
  const { closingDay, dueDay } = creditCfg

  const byDue = new Map()
  for (const e of entries) {
    if (e.paymentMethodId !== 'credito' || !e.date) continue
    const dueDate = vencimentoDaCompra(e.date, closingDay, dueDay)
    if (!byDue.has(dueDate)) byDue.set(dueDate, [])
    byDue.get(dueDate).push(e)
  }
  // Always surface the currently-accumulating cycle, even if empty.
  const openDue = vencimentoDaCompra(todayStr, closingDay, dueDay)
  if (!byDue.has(openDue)) byDue.set(openDue, [])

  const invoices = [...byDue.entries()].map(([dueDate, items]) => {
    const total = items.reduce(
      (sum, e) => sum + (e.type === 'income' ? -(e.amount || 0) : e.amount || 0),
      0
    )
    const closingDate = closingDateForDue(dueDate, closingDay, dueDay)
    const paid = paidSet.has(dueDate)
    let status
    if (paid) status = 'paga'
    else if (dueDate === openDue) status = 'aberta'
    else if (closingDate > todayStr) status = 'futura'
    else if (dueDate < todayStr) status = 'vencida'
    else status = 'fechada'
    return { dueDate, closingDate, closingDay, dueDay, items, total, status, paid }
  })

  invoices.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  return invoices
}
