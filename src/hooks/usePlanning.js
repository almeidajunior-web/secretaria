import { useEffect, useState } from 'react'
import { loadPlanning, savePlanning } from '../lib/storage'
import { PLANNING_SEED_CATEGORIES } from '../data/planningSeed'

let nextId = 1
function genCategoryId() {
  return `cat_${Date.now()}_${nextId++}`
}

const cellKey = (day, hour) => `${day}:${hour}`

// Manages the Planejamento module's data: a user-editable list of routine
// categories and a sparse "day:hour -> categoryId" grid painted with them.
// Persisted as a single localStorage entry (categories + grid are always
// read/written together).
export function usePlanning() {
  const [state, setState] = useState(() => {
    const stored = loadPlanning()
    return {
      categories: stored?.categories?.length ? stored.categories : PLANNING_SEED_CATEGORIES,
      grid: stored?.grid || {},
    }
  })

  useEffect(() => {
    savePlanning(state)
  }, [state])

  // categoryId === null clears the cell.
  const paintCell = (day, hour, categoryId) => {
    setState((prev) => {
      const key = cellKey(day, hour)
      if (categoryId == null) {
        if (!(key in prev.grid)) return prev
        const grid = { ...prev.grid }
        delete grid[key]
        return { ...prev, grid }
      }
      if (prev.grid[key] === categoryId) return prev
      return { ...prev, grid: { ...prev.grid, [key]: categoryId } }
    })
  }

  const addCategory = (label, color) => {
    const l = label.trim()
    if (!l) return
    setState((prev) => ({
      ...prev,
      categories: [...prev.categories, { id: genCategoryId(), label: l, color }],
    }))
  }

  const updateCategory = (id, patch) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }))
  }

  // Removes the category and clears every grid cell that referenced it.
  const deleteCategory = (id) => {
    setState((prev) => ({
      categories: prev.categories.filter((c) => c.id !== id),
      grid: Object.fromEntries(Object.entries(prev.grid).filter(([, catId]) => catId !== id)),
    }))
  }

  return {
    categories: state.categories,
    grid: state.grid,
    paintCell,
    addCategory,
    updateCategory,
    deleteCategory,
  }
}
