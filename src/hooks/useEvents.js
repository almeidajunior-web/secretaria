import { useCallback, useEffect, useRef, useState } from 'react'
import { loadEvents, saveEvents } from '../lib/storage'
import { buildSeedEvents } from '../data/seed'

let nextId = 1
function genId() {
  return `evt_${Date.now()}_${nextId++}`
}

// CRUD over the event collection with automatic persistence. Seeds example
// data only when the store is empty.
export function useEvents() {
  const [events, setEvents] = useState(() => {
    const stored = loadEvents()
    if (stored && stored.length) return stored
    return buildSeedEvents()
  })

  // Skip persisting the very first render so seed data is written exactly once.
  const firstRun = useRef(true)
  useEffect(() => {
    saveEvents(events)
    firstRun.current = false
  }, [events])

  const addEvent = useCallback((event) => {
    setEvents((prev) => [...prev, { ...event, id: genId() }])
  }, [])

  const updateEvent = useCallback((event) => {
    setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, ...event } : e)))
  }, [])

  const deleteEvent = useCallback((id) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }, [])

  // Removes a tag from every event that references it (used when the tag is
  // deleted from the managed tag list).
  const removeTagFromAllEvents = useCallback((tag) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.tags?.includes(tag) ? { ...e, tags: e.tags.filter((t) => t !== tag) } : e
      )
    )
  }, [])

  // Toggles presence for one occurrence of a class and keeps the absence
  // counter (faltasAtual) in sync. `type` is 'present' or 'absent'.
  const togglePresence = useCallback((id, occKey, type) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e
        const presenca = { ...(e.presenca || {}) }
        const current = presenca[occKey]
        let faltas = e.faltasAtual || 0

        if (current === type) {
          // Clicking the active state clears it.
          delete presenca[occKey]
          if (current === 'absent') faltas -= 1
        } else {
          if (current === 'absent') faltas -= 1
          presenca[occKey] = type
          if (type === 'absent') faltas += 1
        }

        return { ...e, presenca, faltasAtual: Math.max(0, faltas) }
      })
    )
  }, [])

  return {
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    togglePresence,
    removeTagFromAllEvents,
  }
}
