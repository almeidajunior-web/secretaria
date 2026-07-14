import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { loadFinanceEntries, saveFinanceEntries } from '../lib/storage'
import { buildSeedEntries } from '../data/financeSeed'
import { nextDueDate } from '../lib/billRecurrence'

let nextId = 1
function genEntryId() {
  return `fin_${Date.now()}_${nextId++}`
}
function genSeriesId() {
  return `finseries_${Date.now()}_${nextId++}`
}

// Ensures an entry with a recurrence has a seriesId (assigned once, reused
// by every occurrence spawned from it) — mirrors useBills.js#withSeriesId.
function withSeriesId(entry) {
  if (entry.recurrence && entry.recurrence !== 'none' && !entry.seriesId) {
    return { ...entry, seriesId: genSeriesId() }
  }
  return entry
}

// CRUD over the finance entry collection, plus a lightweight recurrence
// engine (`ensureNextOccurrences`) for contas fixas — see Financas.jsx,
// which calls it after every mutation. Unlike Vencimentos' bills, an entry
// has no paid/unpaid state to gate spawning on: the next occurrence is
// spawned once the latest known instance of a series stops being previsto
// (its effective date has arrived), keeping exactly one future instance
// pending per series at all times.
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
    setEntries((prev) => [...prev, withSeriesId({ ...entry, id })])
  }

  const updateEntry = (entry) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? withSeriesId({ ...e, ...entry }) : e))
    )
  }

  const deleteEntry = (id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  // `transform` lets the caller recompute derived fields (effectiveDate) on
  // the duplicated entry before it lands in state — see Financas.jsx. A
  // duplicate is a one-off manual copy, not a new member of the source's
  // recurring series, so recurrence/seriesId are deliberately dropped.
  const duplicateEntry = (id, transform) => {
    setEntries((prev) => {
      const source = prev.find((e) => e.id === id)
      if (!source) return prev
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const duplicated = {
        ...source,
        id: genEntryId(),
        date: todayStr,
        recurrence: 'none',
        seriesId: undefined,
        installment: undefined,
        installmentGroupId: undefined,
      }
      return [...prev, transform ? transform(duplicated) : duplicated]
    })
  }

  // Keeps exactly one future ("previsto") instance pending per recurring
  // series. For each series, looks at its chronologically-latest member; if
  // that instance is no longer previsto (its effective date has arrived or
  // passed) and nothing later already exists, spawns the next one via
  // nextDueDate (billRecurrence.js). `transform` lets the caller recompute
  // effectiveDate (credit-card cycle) on the spawned entry — see Financas.jsx.
  // Idempotent and safe to call after every mutation: once a series has its
  // one pending future instance, there's nothing left to spawn. Memoized
  // (stable identity) so it can sit in a useEffect dependency list without
  // re-firing the scan on unrelated re-renders — it only touches the stable
  // functional form of setEntries.
  const ensureNextOccurrences = useCallback((transform) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    setEntries((prev) => {
      // Group by series in a single pass, then spawn at most one per series.
      const bySeriesId = new Map()
      for (const e of prev) {
        if (!e.recurrence || e.recurrence === 'none' || !e.seriesId) continue
        const list = bySeriesId.get(e.seriesId)
        if (list) list.push(e)
        else bySeriesId.set(e.seriesId, [e])
      }
      const toSpawn = []
      for (const siblings of bySeriesId.values()) {
        const latest = siblings.reduce((a, b) => (a.date > b.date ? a : b))
        const effective = latest.effectiveDate || latest.date
        if (!effective || effective > todayStr) continue // still previsto, nothing to add yet
        const nextDate = nextDueDate(latest.date, latest.recurrence)
        if (!nextDate) continue
        const spawned = { ...latest, id: genEntryId(), date: nextDate }
        toSpawn.push(transform ? transform(spawned) : spawned)
      }
      return toSpawn.length ? [...prev, ...toSpawn] : prev
    })
  }, [])

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
    ensureNextOccurrences,
    removeCategoryFromAllEntries,
    removePaymentMethodFromAllEntries,
    removeAccountFromAllEntries,
    removeTagFromAllEntries,
  }
}
