import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { loadShoppingItems, saveShoppingItems } from '../lib/storage'
import { buildSeedShoppingItems } from '../data/shoppingSeed'
import { useNow } from './useNow'

let nextId = 1
function genItemId() {
  return `shop_${Date.now()}_${nextId++}`
}

// CRUD over the shopping list, plus the auto-cleanup rule: an item checked
// off stays visible through the rest of that calendar day, then gets
// deleted for good the next time the app is open on a later day — no undo,
// matching the "no confirmation needed to delete" spirit of the module.
export function useShoppingItems() {
  const [items, setItems] = useState(() => {
    const stored = loadShoppingItems()
    if (stored !== null) return stored
    return buildSeedShoppingItems()
  })

  useEffect(() => {
    saveShoppingItems(items)
  }, [items])

  const now = useNow()
  const todayStr = format(now, 'yyyy-MM-dd')

  // Silently drops items purchased on an earlier calendar day, whenever the
  // day changes (including on mount, covering "opened the app after being
  // away for a while").
  useEffect(() => {
    setItems((prev) => {
      const next = prev.filter((it) => !(it.purchased && it.purchasedDate && it.purchasedDate < todayStr))
      return next.length !== prev.length ? next : prev
    })
  }, [todayStr])

  const addItem = (item) => {
    const id = genItemId()
    setItems((prev) => [...prev, { ...item, id }])
  }

  const updateItem = (item) => {
    setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, ...item } : it)))
  }

  const deleteItem = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  // Toggling off clears purchasedDate too, so a re-check starts a fresh
  // one-day countdown instead of reusing a stale date.
  const togglePurchased = (id, purchased) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, purchased, purchasedDate: purchased ? todayStr : null } : it
      )
    )
  }

  const removeCategoryFromAllItems = (categoryId) => {
    setItems((prev) =>
      prev.map((it) => (it.categoryId === categoryId ? { ...it, categoryId: null } : it))
    )
  }

  const removePriorityFromAllItems = (priorityId) => {
    setItems((prev) =>
      prev.map((it) => (it.priorityId === priorityId ? { ...it, priorityId: null } : it))
    )
  }

  return {
    items,
    addItem,
    updateItem,
    deleteItem,
    togglePurchased,
    removeCategoryFromAllItems,
    removePriorityFromAllItems,
  }
}
