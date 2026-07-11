import { useEffect, useState } from 'react'
import { loadShoppingPriorities, saveShoppingPriorities } from '../lib/storage'
import { SHOPPING_SEED_PRIORITIES } from '../data/shoppingSeed'

let nextId = 1
function genPriorityId() {
  return `shopprio_${Date.now()}_${nextId++}`
}

// User-editable, reorderable priority list for Compras — independent from
// Tarefas' own priorities (each module owns its domain).
export function useShoppingPriorities() {
  const [priorities, setPriorities] = useState(() => {
    const stored = loadShoppingPriorities()
    return stored ?? SHOPPING_SEED_PRIORITIES
  })

  useEffect(() => {
    saveShoppingPriorities(priorities)
  }, [priorities])

  const addPriority = (label, color) => {
    const l = label.trim()
    if (!l) return null
    const id = genPriorityId()
    setPriorities((prev) => [...prev, { id, label: l, color }])
    return id
  }

  const updatePriority = (id, patch) => {
    setPriorities((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  const deletePriority = (id) => {
    setPriorities((prev) => prev.filter((p) => p.id !== id))
  }

  const reorderPriorities = (newOrderIds) => {
    setPriorities((prev) => newOrderIds.map((id) => prev.find((p) => p.id === id)).filter(Boolean))
  }

  return { priorities, addPriority, updatePriority, deletePriority, reorderPriorities }
}
