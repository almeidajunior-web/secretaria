import { useEffect, useState } from 'react'
import { loadTags, saveTags } from '../lib/storage'

// Manages the user-defined tag list with persistence. On first run (empty
// storage) it is seeded from whatever tags already exist on the events.
export function useTags(seedTags) {
  const [tags, setTags] = useState(() => {
    const stored = loadTags()
    if (stored) return stored
    return seedTags || []
  })

  useEffect(() => {
    saveTags(tags)
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
