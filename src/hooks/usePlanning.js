import { useEffect, useState } from 'react'
import { loadPlanning, savePlanning } from '../lib/storage'
import { PLANNING_SEED_CATEGORIES, DEFAULT_HOUR_START, DEFAULT_HOUR_END } from '../data/planningSeed'
import { cellKey, parseCellKey } from '../lib/planningGrid'

let nextId = 1
function genCategoryId() {
  return `cat_${Date.now()}_${nextId++}`
}

// Manages the Planejamento module's data: a user-editable, reorderable list
// of routine categories, a configurable hour range, and a sparse grid of
// windows (whole-hour, or split into two independent 30-min halves) each
// optionally carrying a categoryId and/or a free-text description.
// Persisted as a single localStorage entry.
export function usePlanning() {
  const [state, setState] = useState(() => {
    const stored = loadPlanning()
    // Seed categories only on a true first run (no stored planning data at
    // all). Once the user has ever saved — even down to zero categories —
    // their data is respected as-is; previously, an empty list (e.g. after
    // deleting every category) was indistinguishable from "never touched"
    // and silently got replaced with the defaults on the next reload.
    return {
      categories: stored ? stored.categories : PLANNING_SEED_CATEGORIES,
      grid: stored?.grid || {},
      splits: stored?.splits || {},
      hourStart: stored?.hourStart ?? DEFAULT_HOUR_START,
      hourEnd: stored?.hourEnd ?? DEFAULT_HOUR_END,
    }
  })

  useEffect(() => {
    savePlanning(state)
  }, [state])

  // Sets/clears a window's category. categoryId === null clears the color;
  // if the window has a description it's kept (icon stays visible) — full
  // removal of a described window goes through clearWindowCompletely.
  const paintCell = (day, hour, categoryId, half) => {
    setState((prev) => {
      const key = cellKey(day, hour, half)
      const existing = prev.grid[key]
      if (categoryId == null) {
        if (!existing) return prev
        if (existing.description) {
          if (existing.categoryId == null) return prev
          return { ...prev, grid: { ...prev.grid, [key]: { description: existing.description } } }
        }
        const grid = { ...prev.grid }
        delete grid[key]
        return { ...prev, grid }
      }
      if (existing?.categoryId === categoryId) return prev
      return { ...prev, grid: { ...prev.grid, [key]: { ...existing, categoryId } } }
    })
  }

  // Fully removes a window's data (color + description) regardless of
  // content — used by the eraser once the user confirms clearing a
  // described window.
  const clearWindowCompletely = (day, hour, half) => {
    setState((prev) => {
      const key = cellKey(day, hour, half)
      if (!(key in prev.grid)) return prev
      const grid = { ...prev.grid }
      delete grid[key]
      return { ...prev, grid }
    })
  }

  const setDescription = (day, hour, half, text) => {
    setState((prev) => {
      const key = cellKey(day, hour, half)
      return { ...prev, grid: { ...prev.grid, [key]: { ...prev.grid[key], description: text } } }
    })
  }

  const deleteDescription = (day, hour, half) => {
    setState((prev) => {
      const key = cellKey(day, hour, half)
      const existing = prev.grid[key]
      if (!existing?.description) return prev
      if (existing.categoryId == null) {
        const grid = { ...prev.grid }
        delete grid[key]
        return { ...prev, grid }
      }
      return { ...prev, grid: { ...prev.grid, [key]: { categoryId: existing.categoryId } } }
    })
  }

  // Splits an hour into two independent 30-min windows, moving the current
  // whole-hour data (if any) into the first half; the second half starts
  // empty. Non-destructive — nothing is lost.
  const splitWindow = (day, hour) => {
    setState((prev) => {
      const wholeKey = cellKey(day, hour)
      const existing = prev.grid[wholeKey]
      const grid = { ...prev.grid }
      delete grid[wholeKey]
      if (existing) grid[cellKey(day, hour, 0)] = existing
      return { ...prev, grid, splits: { ...prev.splits, [wholeKey]: true } }
    })
  }

  // Merges the two halves back into a single empty hour window, discarding
  // whatever data either half had. Callers should confirm with the user
  // first when either half isn't already empty.
  const mergeWindow = (day, hour) => {
    setState((prev) => {
      const wholeKey = cellKey(day, hour)
      const grid = { ...prev.grid }
      delete grid[cellKey(day, hour, 0)]
      delete grid[cellKey(day, hour, 30)]
      const splits = { ...prev.splits }
      delete splits[wholeKey]
      return { ...prev, grid, splits }
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

  // Removes the category and clears its color from every window that used
  // it — any description on those windows is preserved.
  const deleteCategory = (id) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
      grid: Object.fromEntries(
        Object.entries(prev.grid)
          .map(([key, entry]) =>
            entry.categoryId === id ? [key, { description: entry.description }] : [key, entry]
          )
          .filter(([, entry]) => entry.categoryId != null || entry.description)
      ),
    }))
  }

  // Reorders categories to match `newOrderIds` — the array order is the
  // single source of truth for both the horizontal palette and the vertical
  // settings list.
  const reorderCategories = (newOrderIds) => {
    setState((prev) => ({
      ...prev,
      categories: newOrderIds.map((id) => prev.categories.find((c) => c.id === id)).filter(Boolean),
    }))
  }

  // Applies a new hour range, permanently discarding any grid/split entries
  // whose hour falls outside it. Callers should check windowsOutsideRange()
  // first to decide whether to confirm with the user.
  const setHourRange = (start, end) => {
    setState((prev) => {
      const inRange = ([key]) => {
        const { hour } = parseCellKey(key)
        return hour >= start && hour <= end
      }
      return {
        ...prev,
        hourStart: start,
        hourEnd: end,
        grid: Object.fromEntries(Object.entries(prev.grid).filter(inRange)),
        splits: Object.fromEntries(Object.entries(prev.splits).filter(inRange)),
      }
    })
  }

  // True if narrowing the range to [start, end] would discard any existing
  // window data — used to decide whether to confirm before applying.
  const windowsOutsideRange = (start, end) =>
    Object.keys(state.grid).some((key) => {
      const { hour } = parseCellKey(key)
      return hour < start || hour > end
    })

  return {
    categories: state.categories,
    grid: state.grid,
    splits: state.splits,
    hourStart: state.hourStart,
    hourEnd: state.hourEnd,
    paintCell,
    clearWindowCompletely,
    setDescription,
    deleteDescription,
    splitWindow,
    mergeWindow,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    setHourRange,
    windowsOutsideRange,
  }
}
