import { useEffect, useState } from 'react'
import { readRaw, writeRaw } from '../storage/backend'

// Generic stored useState for small UI preferences (view mode,
// sort chain, filters) that should survive navigating away from a module and
// back — unlike domain data (events, tasks, bills...), these need no
// revive/serialize step, just a plain JSON round-trip.
//
// `sanitize` is for the one case a plain round-trip can't cover: a stored
// preference that names something the UI no longer offers (a retired sort
// field, a deleted view mode) would otherwise stay active with no control
// left to turn it off. It runs on the parsed value at mount and the result is
// written back on the next save.
export function usePersistentState(key, defaultValue, sanitize) {
  const [value, setValue] = useState(() => {
    try {
      const raw = readRaw(key)
      const parsed = raw != null ? JSON.parse(raw) : defaultValue
      return sanitize ? sanitize(parsed) : parsed
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    try {
      writeRaw(key, JSON.stringify(value))
    } catch {
      // A view preference not sticking isn't worth an alarm — unlike the
      // domain stores, which report a refused save (see storage/store.js).
    }
  }, [key, value])

  return [value, setValue]
}

// Sanitizer for object-shaped preferences (filters): lays the stored value
// over the current defaults, so a shape saved by an older version that lacks
// a key added later still gets that key — instead of the module crashing on
// `filters.newKey.length`.
export function withDefaults(defaults) {
  return (stored) =>
    stored && typeof stored === 'object' && !Array.isArray(stored) ? { ...defaults, ...stored } : defaults
}
