import { useEffect, useState } from 'react'

// Generic localStorage-backed useState for small UI preferences (view mode,
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
      const raw = localStorage.getItem(key)
      const parsed = raw != null ? JSON.parse(raw) : defaultValue
      return sanitize ? sanitize(parsed) : parsed
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // best-effort; ignore quota/availability errors
    }
  }, [key, value])

  return [value, setValue]
}
