import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { loadTasks, saveTasks } from '../lib/storage'
import { buildSeedTasks } from '../data/taskSeed'
import { nextOccurrenceAfter, rollForwardIfOverdue } from '../lib/taskRecurrence'
import { useNow } from './useNow'

let nextId = 1
function genTaskId() {
  return `task_${Date.now()}_${nextId++}`
}

// CRUD over the task collection with automatic persistence, plus the
// recurrence rollover that keeps a recurring task to a single record: no
// second task is ever created when a deadline passes or is completed.
// `statuses` (from useTaskStatuses) drives which status ids count as "done".
export function useTasks(statuses) {
  const [tasks, setTasks] = useState(() => {
    const stored = loadTasks()
    if (stored !== null) return stored
    return buildSeedTasks()
  })

  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  const now = useNow()
  const todayStr = format(now, 'yyyy-MM-dd')

  const doneStatusIds = useMemo(
    () => new Set(statuses.filter((s) => s.isDone).map((s) => s.id)),
    [statuses]
  )
  // Status a rolled-forward/completed recurring task resets to — the first
  // non-done status, or just the first status if somehow all are done.
  const resetStatusId = useMemo(
    () => (statuses.find((s) => !s.isDone) || statuses[0])?.id,
    [statuses]
  )

  // Silently rolls overdue, unfinished recurring tasks forward to the next
  // valid occurrence whenever the calendar day changes — including on
  // mount, which covers "opened the app after being away for a while".
  useEffect(() => {
    setTasks((prev) => {
      let changed = false
      const next = prev.map((t) => {
        const rolled = rollForwardIfOverdue(t, todayStr, doneStatusIds)
        if (rolled !== t) changed = true
        return rolled
      })
      return changed ? next : prev
    })
  }, [todayStr, doneStatusIds])

  const addTask = (task) => {
    const id = genTaskId()
    setTasks((prev) => [...prev, { ...task, id }])
  }

  const updateTask = (task) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...task } : t)))
  }

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  // Marking a recurring task with a "done" status advances it to the next
  // cycle in place (due date moves forward, status resets) instead of
  // sticking as done — the recurrence only ends for real once there is no
  // next occurrence (recurrenceUntil exceeded), at which point it stays in
  // the done status like a one-off task.
  const setTaskStatus = (id, statusId) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        if (doneStatusIds.has(statusId) && t.recurrence !== 'none' && t.dueDate) {
          const next = nextOccurrenceAfter(t, t.dueDate)
          if (next) return { ...t, dueDate: next, status: resetStatusId ?? statusId }
        }
        return { ...t, status: statusId }
      })
    )
  }

  const removePriorityFromAllTasks = (priorityId) => {
    setTasks((prev) =>
      prev.map((t) => (t.priorityId === priorityId ? { ...t, priorityId: null } : t))
    )
  }

  const removeTagFromAllTasks = (tagId) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.tagIds?.includes(tagId) ? { ...t, tagIds: t.tagIds.filter((x) => x !== tagId) } : t
      )
    )
  }

  // Reassigns tasks off a deleted status onto the first remaining one
  // (mirrors removePriorityFromAllTasks/removeTagFromAllTasks).
  const reassignStatusOnAllTasks = (deletedStatusId, fallbackStatusId) => {
    setTasks((prev) =>
      prev.map((t) => (t.status === deletedStatusId ? { ...t, status: fallbackStatusId } : t))
    )
  }

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    setTaskStatus,
    removePriorityFromAllTasks,
    removeTagFromAllTasks,
    reassignStatusOnAllTasks,
  }
}
