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

  // Sets the status of a single occurrence. Non-recurring events update their
  // base status directly; recurring events store a per-occurrence override so
  // each class day can be confirmed independently (drives the absence count).
  const setOccurrenceStatus = useCallback((id, occKey, status) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e
        if (e.recurrence === 'none') return { ...e, status }
        return { ...e, occStatus: { ...(e.occStatus || {}), [occKey]: status } }
      })
    )
  }, [])

  return {
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    setOccurrenceStatus,
    removeTagFromAllEvents,
  }
}
