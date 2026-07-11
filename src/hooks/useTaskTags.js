import { useEffect, useState } from 'react'
import { loadTaskTags, saveTaskTags } from '../lib/storage'
import { TASK_SEED_TAGS } from '../data/taskSeed'

let nextId = 1
function genTagId() {
  return `tag_${Date.now()}_${nextId++}`
}

// User-editable, reorderable tag list for Tarefas — own domain, independent
// from Agenda's plain-string tags. Same shape/CRUD pattern as
// useTaskPriorities (id, label, color, array order = display order).
export function useTaskTags() {
  const [tags, setTags] = useState(() => {
    const stored = loadTaskTags()
    return stored ?? TASK_SEED_TAGS
  })

  useEffect(() => {
    saveTaskTags(tags)
  }, [tags])

  // Returns the new tag's id (computed synchronously, not inside the state
  // updater) so callers can immediately select it — e.g. TagPickerPopover's
  // "create and select" flow.
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
