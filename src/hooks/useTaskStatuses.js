import { useStoredState } from '../storage/useStoredState'
import { taskStatusesStore } from '../storage/stores'

let nextId = 1
function genStatusId() {
  return `status_${Date.now()}_${nextId++}`
}

// Whether a status may be deleted: never the last one, never the last
// "done" one (recurrence rollover and the hide-finished filter need it).
export function canDeleteStatus(statuses, id) {
  if (statuses.length <= 1) return false
  const target = statuses.find((s) => s.id === id)
  if (!target) return false
  return !(target.isDone && statuses.filter((s) => s.isDone).length <= 1)
}

// User-editable, reorderable status list for Tarefas — also the Kanban
// column order. `isDone` marks which status(es) count as "completed" (drives
// recurrence rollover and the hide-finished filter); at least one status and
// at least one isDone status are always kept, so deleteStatus/setDone are
// no-ops when they'd violate that.
export function useTaskStatuses() {
  const [statuses, setStatuses] = useStoredState(taskStatusesStore)

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
    setStatuses((prev) => (canDeleteStatus(prev, id) ? prev.filter((s) => s.id !== id) : prev))
  }

  const reorderStatuses = (newOrderIds) => {
    setStatuses((prev) =>
      newOrderIds.map((id) => prev.find((s) => s.id === id)).filter(Boolean)
    )
  }

  return { statuses, addStatus, updateStatus, setStatusDone, deleteStatus, reorderStatuses }
}
