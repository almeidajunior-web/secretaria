import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { loadBills, saveBills } from '../lib/storage'
import { buildSeedBills } from '../data/duesSeed'
import { nextDueDate } from '../lib/billRecurrence'

let nextId = 1
function genBillId() {
  return `bill_${Date.now()}_${nextId++}`
}
function genSeriesId() {
  return `series_${Date.now()}_${nextId++}`
}

// Ensures a bill with a recurrence has a seriesId (assigned once, reused by
// every cycle spawned from it) — needed whether the bill was created
// recurring from the start or had recurrence added later via an edit.
function withSeriesId(bill) {
  if (bill.recurrence !== 'none' && !bill.seriesId) return { ...bill, seriesId: genSeriesId() }
  return bill
}

// CRUD over the bill collection, plus the one thing that makes bills
// different from Tarefas' recurring tasks: paying a bill is a historical
// financial event worth keeping (see useBills' togglePaid), not something
// to silently advance in place. There is deliberately no overdue-rollover
// effect here — an unpaid overdue bill must stay visibly "atrasada" until
// someone actually pays it; auto-advancing it forward would just hide an
// unpaid bill, which is the one thing this module exists to prevent.
export function useBills() {
  const [bills, setBills] = useState(() => {
    const stored = loadBills()
    if (stored !== null) return stored
    return buildSeedBills()
  })

  useEffect(() => {
    saveBills(bills)
  }, [bills])

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const addBill = (bill) => {
    const id = genBillId()
    setBills((prev) => [...prev, withSeriesId({ ...bill, id })])
  }

  const updateBill = (bill) => {
    setBills((prev) =>
      prev.map((b) => (b.id === bill.id ? withSeriesId({ ...b, ...bill }) : b))
    )
  }

  const deleteBill = (id) => {
    setBills((prev) => prev.filter((b) => b.id !== id))
  }

  // Marking a bill paid keeps it as a permanent record (paidDate stamped)
  // instead of advancing it — that's what lets you look back at what you
  // paid in a given month. For a recurring bill, the next cycle is spawned
  // as a brand new row (same seriesId, unpaid, due date pushed forward by
  // the recurrence interval), seeded with this cycle's amount as an
  // editable starting point since bills like utilities vary month to month.
  // The spawn only happens on the unpaid→paid transition, and only if the
  // series doesn't already have a pending instance — guards against
  // duplicates from toggling the checkbox on and off.
  const togglePaid = (id, paid) => {
    setBills((prev) => {
      const bill = prev.find((b) => b.id === id)
      if (!bill) return prev
      const updated = prev.map((b) =>
        b.id === id ? { ...b, paid, paidDate: paid ? todayStr : null } : b
      )
      if (paid && !bill.paid && bill.recurrence !== 'none') {
        const hasPendingSibling = prev.some(
          (b) => b.id !== bill.id && b.seriesId === bill.seriesId && !b.paid
        )
        if (!hasPendingSibling) {
          const next = nextDueDate(bill.dueDate, bill.recurrence)
          if (next) {
            updated.push({
              ...bill,
              id: genBillId(),
              dueDate: next,
              paid: false,
              paidDate: null,
            })
          }
        }
      }
      return updated
    })
  }

  const removeCategoryFromAllBills = (categoryId) => {
    setBills((prev) =>
      prev.map((b) => (b.categoryId === categoryId ? { ...b, categoryId: null } : b))
    )
  }

  return { bills, addBill, updateBill, deleteBill, togglePaid, removeCategoryFromAllBills }
}
