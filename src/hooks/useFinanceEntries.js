import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { loadFinanceEntries, saveFinanceEntries } from '../lib/storage'
import { buildSeedEntries } from '../data/financeSeed'

let nextId = 1
function genEntryId() {
  return `fin_${Date.now()}_${nextId++}`
}

// CRUD over the finance entry collection. Unlike Vencimentos' bills, an
// entry is a movement that already happened — there's no pending/paid
// state and no recurrence-spawn engine here. The closest thing to
// recurrence in V1 is `duplicateEntry`, a one-click copy dated today.
export function useFinanceEntries() {
  const [entries, setEntries] = useState(() => {
    const stored = loadFinanceEntries()
    if (stored !== null) return stored
    return buildSeedEntries()
  })

  useEffect(() => {
    saveFinanceEntries(entries)
  }, [entries])

  const addEntry = (entry) => {
    const id = genEntryId()
    setEntries((prev) => [...prev, { ...entry, id }])
  }

  const updateEntry = (entry) => {
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, ...entry } : e)))
  }

  const deleteEntry = (id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  // `transform` lets the caller recompute derived fields (effectiveDate) on
  // the duplicated entry before it lands in state — see Financas.jsx.
  const duplicateEntry = (id, transform) => {
    setEntries((prev) => {
      const source = prev.find((e) => e.id === id)
      if (!source) return prev
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const duplicated = { ...source, id: genEntryId(), date: todayStr }
      return [...prev, transform ? transform(duplicated) : duplicated]
    })
  }

  // categoryId is never shared between the expense and income lists, so
  // matching on it alone is enough — no need to also check entry.type.
  const removeCategoryFromAllEntries = (categoryId) => {
    setEntries((prev) =>
      prev.map((e) => (e.categoryId === categoryId ? { ...e, categoryId: null } : e))
    )
  }

  const removePaymentMethodFromAllEntries = (paymentMethodId) => {
    setEntries((prev) =>
      prev.map((e) => (e.paymentMethodId === paymentMethodId ? { ...e, paymentMethodId: null } : e))
    )
  }

  const removeAccountFromAllEntries = (accountId) => {
    setEntries((prev) => prev.map((e) => (e.accountId === accountId ? { ...e, accountId: null } : e)))
  }

  const removeTagFromAllEntries = (tagId) => {
    setEntries((prev) =>
      prev.map((e) =>
        (e.tagIds || []).includes(tagId) ? { ...e, tagIds: e.tagIds.filter((t) => t !== tagId) } : e
      )
    )
  }

  return {
    entries,
    addEntry,
    updateEntry,
    deleteEntry,
    duplicateEntry,
    removeCategoryFromAllEntries,
    removePaymentMethodFromAllEntries,
    removeAccountFromAllEntries,
    removeTagFromAllEntries,
  }
}
