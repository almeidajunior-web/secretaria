import { useEffect, useState } from 'react'
import { loadFinanceTags, saveFinanceTags } from '../lib/storage'

let nextId = 1
function genTagId() {
  return `fintag_${Date.now()}_${nextId++}`
}

// User-editable, reorderable tag list for Finanças — its own independent
// domain (not shared with Tarefas' tags). No seed; the user creates their
// own. Mirrors the other finance list hooks; the { id, label, color } shape
// matches what TagPickerPopover expects.
export function useFinanceTags() {
  const [tags, setTags] = useState(() => loadFinanceTags() ?? [])

  useEffect(() => {
    saveFinanceTags(tags)
  }, [tags])

  const addTag = (label, color) => {
    const l = label.trim()
    if (!l) return null
    const id = genTagId()
    setTags((prev) => [...prev, { id, label: l, color }])
    return id
  }

  const updateTag = (id, patch) => {
    setTags((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  const deleteTag = (id) => {
    setTags((prev) => prev.filter((t) => t.id !== id))
  }

  const reorderTags = (newOrderIds) => {
    setTags((prev) => newOrderIds.map((id) => prev.find((t) => t.id === id)).filter(Boolean))
  }

  return { tags, addTag, updateTag, deleteTag, reorderTags }
}
