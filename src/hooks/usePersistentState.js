import { useEffect, useState } from 'react'

// Generic localStorage-backed useState for small UI preferences (view mode,
// sort chain, filters) that should survive navigating away from a module and
// back — unlike domain data (events, tasks, bills...), these don't need
// revive/serialize or migrations, just a plain JSON round-trip.
export function usePersistentState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw != null ? JSON.parse(raw) : defaultValue
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
