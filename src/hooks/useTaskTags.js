import { useEffect, useState } from 'react'
import { loadTaskTags, saveTaskTags } from '../lib/storage'

// Tarefas' own tag list — independent from Agenda's (same shape/behavior as
// useTags.js, separate storage key so the two modules stay decoupled).
export function useTaskTags(seedTags) {
  const [tags, setTags] = useState(() => {
    const stored = loadTaskTags()
    if (stored) return stored
    return seedTags || []
  })

  useEffect(() => {
    saveTaskTags(tags)
  }, [tags])

  const addTag = (name) => {
    const n = name.trim()
    if (!n) return
    setTags((prev) => (prev.includes(n) ? prev : [...prev, n]))
  }

  const removeTag = (name) => {
    setTags((prev) => prev.filter((t) => t !== name))
  }

  return { tags, addTag, removeTag }
}
