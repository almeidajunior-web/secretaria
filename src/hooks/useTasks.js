import { useEffect, useState } from 'react'
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
export function useTasks() {
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

  // Silently rolls overdue, unfinished recurring tasks forward to the next
  // valid occurrence whenever the calendar day changes — including on
  // mount, which covers "opened the app after being away for a while".
  useEffect(() => {
    setTasks((prev) => {
      let changed = false
      const next = prev.map((t) => {
        const rolled = rollForwardIfOverdue(t, todayStr)
        if (rolled !== t) changed = true
        return rolled
      })
      return changed ? next : prev
    })
  }, [todayStr])

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

  // Marking a recurring task Finalizada advances it to the next cycle
  // in place (due date moves forward, status resets to Pendente) instead of
  // sticking as done — the recurrence only ends for real once there is no
  // next occurrence (recurrenceUntil exceeded), at which point it stays
  // Finalizada like a one-off task.
  const setTaskStatus = (id, status) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        if (status === 'finalizada' && t.recurrence !== 'none' && t.dueDate) {
          const next = nextOccurrenceAfter(t, t.dueDate)
          if (next) return { ...t, dueDate: next, status: 'pendente' }
        }
        return { ...t, status }
      })
    )
  }

  const removePriorityFromAllTasks = (priorityId) => {
    setTasks((prev) =>
      prev.map((t) => (t.priorityId === priorityId ? { ...t, priorityId: null } : t))
    )
  }

  const removeTagFromAllTasks = (tag) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.tags?.includes(tag) ? { ...t, tags: t.tags.filter((x) => x !== tag) } : t
      )
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
  }
}
