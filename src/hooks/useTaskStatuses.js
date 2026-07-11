import { useEffect, useState } from 'react'
import { loadTaskStatuses, saveTaskStatuses } from '../lib/storage'
import { TASK_STATUS_SEED } from '../data/taskSeed'

let nextId = 1
function genStatusId() {
  return `status_${Date.now()}_${nextId++}`
}

// User-editable, reorderable status list for Tarefas — also the Kanban
// column order. `isDone` marks which status(es) count as "completed" (drives
// recurrence rollover and the hide-finished filter); at least one status and
// at least one isDone status are always kept, so deleteStatus/setDone are
// no-ops when they'd violate that.
export function useTaskStatuses() {
  const [statuses, setStatuses] = useState(() => {
    const stored = loadTaskStatuses()
    return stored ?? TASK_STATUS_SEED
  })

  useEffect(() => {
    saveTaskStatuses(statuses)
  }, [statuses])

  const addStatus = (label, color) => {
    const l = label.trim()
    if (!l) return
    setStatuses((prev) => [...prev, { id: genStatusId(), label: l, color, isDone: false }])
  }

  const updateStatus = (id, patch) => {
    setStatuses((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  // Toggles `isDone`, refusing to uncheck the last remaining done status.
  const setStatusDone = (id, isDone) => {
    setStatuses((prev) => {
      if (!isDone && prev.filter((s) => s.isDone).length <= 1 && prev.find((s) => s.id === id)?.isDone) {
        return prev
      }
      return prev.map((s) => (s.id === id ? { ...s, isDone } : s))
    })
  }

  // Refuses to delete the last remaining status, or the last remaining
  // isDone status (mirrors setStatusDone's guard above — deleting it would
  // silently break the same things unchecking it is prevented from breaking).
  const deleteStatus = (id) => {
    setStatuses((prev) => {
      if (prev.length <= 1) return prev
      const target = prev.find((s) => s.id === id)
      if (target?.isDone && prev.filter((s) => s.isDone).length <= 1) return prev
      return prev.filter((s) => s.id !== id)
    })
  }

  const reorderStatuses = (newOrderIds) => {
    setStatuses((prev) =>
      newOrderIds.map((id) => prev.find((s) => s.id === id)).filter(Boolean)
    )
  }

  return { statuses, addStatus, updateStatus, setStatusDone, deleteStatus, reorderStatuses }
}
