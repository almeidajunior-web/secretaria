import { useEffect, useState } from 'react'
import { loadTaskPriorities, saveTaskPriorities } from '../lib/storage'
import { TASK_SEED_PRIORITIES } from '../data/taskSeed'

let nextId = 1
function genPriorityId() {
  return `prio_${Date.now()}_${nextId++}`
}

// User-editable, reorderable priority list for Tarefas. Array order IS the
// rank (first = highest priority) — see lib/taskSort.js.
export function useTaskPriorities() {
  const [priorities, setPriorities] = useState(() => {
    const stored = loadTaskPriorities()
    return stored?.length ? stored : TASK_SEED_PRIORITIES
  })

  useEffect(() => {
    saveTaskPriorities(priorities)
  }, [priorities])

  const addPriority = (label, color) => {
    const l = label.trim()
    if (!l) return
    setPriorities((prev) => [...prev, { id: genPriorityId(), label: l, color }])
  }

  const updatePriority = (id, patch) => {
    setPriorities((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  const deletePriority = (id) => {
    setPriorities((prev) => prev.filter((p) => p.id !== id))
  }

  const reorderPriorities = (newOrderIds) => {
    setPriorities((prev) =>
      newOrderIds.map((id) => prev.find((p) => p.id === id)).filter(Boolean)
    )
  }

  return { priorities, addPriority, updatePriority, deletePriority, reorderPriorities }
}
