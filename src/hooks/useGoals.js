import { useEffect, useState } from 'react'
import { loadGoals, saveGoals } from '../lib/storage'
import { buildSeedGoals } from '../data/goalsSeed'

let nextId = 1
function genGoalId() {
  return `goal_${Date.now()}_${nextId++}`
}

// Objetivos: longer-horizon goals with a manually-set progress bar. There's
// deliberately no computed progress here — the number is the user's own read
// on how far along they are, which is what keeps a goal like "trocar de
// emprego" expressible next to one like "juntar reserva".
export function useGoals() {
  const [goals, setGoals] = useState(() => loadGoals() ?? buildSeedGoals())

  useEffect(() => {
    saveGoals(goals)
  }, [goals])

  const addGoal = (goal) => {
    const id = genGoalId()
    setGoals((prev) => [...prev, { ...goal, id }])
    return id
  }

  const updateGoal = (goal) =>
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? { ...g, ...goal } : g)))

  const deleteGoal = (id) => setGoals((prev) => prev.filter((g) => g.id !== id))

  // Marking a goal done pins the bar to 100 — a "concluída" sitting at 60%
  // reads as a bug every time, and the two controls are otherwise free to
  // disagree.
  const setGoalStatus = (id, status) =>
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, status, progress: status === 'done' ? 100 : g.progress } : g))
    )

  return { goals, addGoal, updateGoal, deleteGoal, setGoalStatus }
}
