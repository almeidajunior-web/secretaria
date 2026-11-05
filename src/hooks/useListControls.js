import { useState } from 'react'
import { usePersistentState } from './usePersistentState'

// The controls every list module shares (Tarefas, Compras, Vencimentos,
// Finanças): a hierarchical sort chain, multi-value filters and bulk
// selection. One implementation, so the four lists can't drift apart.

// Sort chain persisted under `key`. Clicking a field cycles it through
// ascending → descending → off; a newly added field joins the end of the
// chain, so earlier fields keep priority.
export function useSortChain(key, defaultChain, sanitize) {
  const [sortChain, setSortChain] = usePersistentState(key, defaultChain, sanitize)
  const toggleSort = (field) =>
    setSortChain((prev) => {
      const idx = prev.findIndex((s) => s.field === field)
      if (idx === -1) return [...prev, { field, direction: 'asc' }]
      if (prev[idx].direction === 'asc') {
        const next = [...prev]
        next[idx] = { field, direction: 'desc' }
        return next
      }
      return prev.filter((s) => s.field !== field)
    })
  return [sortChain, toggleSort]
}

// Returns a toggler for multi-value filters: `toggle('categoryIds', id)`
// adds the id to that dimension, or removes it if already there.
export function filterToggler(setFilters) {
  return (dimension, value) =>
    setFilters((prev) => {
      const list = prev[dimension] || []
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
      return { ...prev, [dimension]: next }
    })
}

// "Selecionar" mode with a set of selected ids. Leaving (or entering) the
// mode always starts from an empty selection.
export function useSelection() {
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(() => new Set())

  const toggleSelectMode = () => {
    setSelectMode((v) => !v)
    setSelectedIds(new Set())
  }
  const toggleSelected = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const selectAll = (ids) => setSelectedIds(new Set(ids))
  const clearSelection = () => setSelectedIds(new Set())

  return { selectMode, selectedIds, toggleSelectMode, toggleSelected, selectAll, clearSelection }
}
