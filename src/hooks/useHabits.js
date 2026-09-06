import { useEffect, useState } from 'react'
import { loadHabits, saveHabits, loadHabitLog, saveHabitLog } from '../lib/storage'
import { buildSeedHabits, buildSeedHabitLog } from '../data/goalsSeed'
import { cellKey, nextCellState } from '../lib/habitStats'

let nextId = 1
function genHabitId() {
  return `habit_${Date.now()}_${nextId++}`
}

// Habit definitions and the day-by-day log, kept in two stores on purpose:
// the definitions are a short list the user edits by hand, while the log is a
// sparse map that grows by one entry per marked cell forever. Splitting them
// means renaming a habit never rewrites its history, and clearing history
// never touches the definitions.
export function useHabits() {
  const [habits, setHabits] = useState(() => loadHabits() ?? buildSeedHabits())
  const [log, setLog] = useState(() => loadHabitLog() ?? buildSeedHabitLog())

  useEffect(() => {
    saveHabits(habits)
  }, [habits])

  useEffect(() => {
    saveHabitLog(log)
  }, [log])

  const addHabit = (habit) => {
    const id = genHabitId()
    setHabits((prev) => [...prev, { ...habit, id }])
    return id
  }

  const updateHabit = (habit) =>
    setHabits((prev) => prev.map((h) => (h.id === habit.id ? { ...h, ...habit } : h)))

  // Deleting a habit takes its history with it — leaving orphaned log entries
  // behind would quietly grow the store forever and resurrect the habit's
  // marks if a new one ever reused the id.
  const deleteHabit = (id) => {
    setHabits((prev) => prev.filter((h) => h.id !== id))
    setLog((prev) => {
      const prefix = `${id}:`
      const next = Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith(prefix)))
      return Object.keys(next).length === Object.keys(prev).length ? prev : next
    })
  }

  const reorderHabits = (newOrderIds) =>
    setHabits((prev) => newOrderIds.map((id) => prev.find((h) => h.id === id)).filter(Boolean))

  // Advances one cell through undefined → done → miss → na → undefined.
  // The undefined step deletes the key instead of storing it, keeping the map
  // to only the days actually answered.
  const cycleCell = (habitId, dateStr) =>
    setLog((prev) => {
      const key = cellKey(habitId, dateStr)
      const next = nextCellState(prev[key])
      const copy = { ...prev }
      if (next === undefined) delete copy[key]
      else copy[key] = next
      return copy
    })

  return { habits, habitLog: log, addHabit, updateHabit, deleteHabit, reorderHabits, cycleCell }
}
