import { isSameDay } from 'date-fns'
import { useCallback, useEffect, useRef, useState } from 'react'
import { loadEvents, saveEvents } from '../lib/storage'
import { buildSeedEvents } from '../data/seed'
import { formatKey } from '../lib/recurrence'

let nextId = 1
function genId() {
  return `evt_${Date.now()}_${nextId++}`
}

// Inclusive end-of-day just before `date` — used to close a series before a
// given occurrence ("este e os próximos").
function dayBefore(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - 1)
  d.setHours(23, 59, 59, 999)
  return d
}

// For custom (multi-weekday) series, shift the selected weekdays when the anchor
// day changes so the pattern follows the move.
function shiftedDays(event, origStart, newStart) {
  if (event.recurrence !== 'custom') return event.recurrenceDays
  const dd = ((newStart.getDay() - origStart.getDay()) % 7 + 7) % 7
  if (dd === 0) return event.recurrenceDays
  return (event.recurrenceDays || []).map((d) => (d + dd) % 7).sort((a, b) => a - b)
}

// Keeps class links symmetric: after `eventId` declares it wants to be linked
// to exactly `desiredLinkedIds`, every other event's own `linkedIds` is
// updated to agree (added where newly linked, removed where unlinked).
function reconcileLinks(events, eventId, desiredLinkedIds) {
  const desired = new Set(desiredLinkedIds || [])
  return events.map((e) => {
    if (e.id === eventId) return e
    const has = (e.linkedIds || []).includes(eventId)
    const should = desired.has(e.id)
    if (has === should) return e
    const linkedIds = should
      ? [...(e.linkedIds || []), eventId]
      : (e.linkedIds || []).filter((id) => id !== eventId)
    return { ...e, linkedIds }
  })
}

// Removes dangling references to a deleted event from every other event's
// linkedIds.
function unlinkEverywhere(events, eventId) {
  return events.map((e) =>
    e.linkedIds?.includes(eventId)
      ? { ...e, linkedIds: e.linkedIds.filter((id) => id !== eventId) }
      : e
  )
}

// exdates/occStatus are keyed by 'yyyy-MM-dd' strings, which sort correctly as
// plain strings — used to split a series' history at the point a "this and
// following" edit/move splits it in two.
const keysFrom = (arr, key) => (arr || []).filter((k) => k >= key)
const keysBefore = (arr, key) => (arr || []).filter((k) => k < key)
const entriesFrom = (obj, key) =>
  Object.fromEntries(Object.entries(obj || {}).filter(([k]) => k >= key))
const entriesBefore = (obj, key) =>
  Object.fromEntries(Object.entries(obj || {}).filter(([k]) => k < key))

// CRUD over the event collection with automatic persistence. Seeds example
// data only when the store is empty.
export function useEvents() {
  const [events, setEvents] = useState(() => {
    const stored = loadEvents()
    // Seed only the first time ever. An intentionally emptied calendar
    // (stored === []) must stay empty instead of re-seeding the examples.
    if (stored !== null) return stored
    return buildSeedEvents()
  })

  // Skip persisting the very first render so seed data is written exactly once.
  const firstRun = useRef(true)
  useEffect(() => {
    saveEvents(events)
    firstRun.current = false
  }, [events])

  const addEvent = useCallback((event) => {
    const id = genId()
    setEvents((prev) => reconcileLinks([...prev, { ...event, id }], id, event.linkedIds))
  }, [])

  const updateEvent = useCallback((event) => {
    setEvents((prev) => {
      const merged = prev.map((e) => (e.id === event.id ? { ...e, ...event } : e))
      return reconcileLinks(merged, event.id, event.linkedIds)
    })
  }, [])

  const deleteEvent = useCallback((id) => {
    setEvents((prev) => unlinkEverywhere(prev.filter((e) => e.id !== id), id))
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

  // Moves one occurrence to a new start/end. `scope` is 'all', 'this' or
  // 'following' for recurring series.
  const moveOccurrence = useCallback((occ, newStart, newEnd, scope) => {
    setEvents((prev) => {
      const event = prev.find((e) => e.id === occ.eventId)
      if (!event) return prev
      // Shift start and end independently (not by a single shared delta) so a
      // resize — start unchanged, only end moves — isn't silently ignored
      // just because it coincides with a duration-preserving move.
      const deltaStart = newStart.getTime() - occ.start.getTime()
      const deltaEnd = newEnd.getTime() - occ.end.getTime()
      // "This and following" from the series' very first occurrence covers
      // every occurrence there is — apply in place, same as scope 'all',
      // instead of splitting off a new series and leaving the old one empty.
      const coversWholeSeries = scope === 'following' && isSameDay(occ.start, event.start)

      if (event.recurrence === 'none' || scope === 'all' || coversWholeSeries) {
        return prev.map((e) =>
          e.id === event.id
            ? {
                ...e,
                start: new Date(e.start.getTime() + deltaStart),
                end: new Date(e.end.getTime() + deltaEnd),
                recurrenceDays: shiftedDays(e, occ.start, newStart),
              }
            : e
        )
      }
      if (scope === 'this') {
        const detached = {
          ...event,
          id: genId(),
          recurrence: 'none',
          recurrenceDays: [],
          recurrenceUntil: null,
          exdates: [],
          occStatus: {},
          status: occ.status,
          start: newStart,
          end: newEnd,
        }
        const withDetached = prev
          .map((e) =>
            e.id === event.id ? { ...e, exdates: [...(e.exdates || []), occ.occKey] } : e
          )
          .concat(detached)
        return reconcileLinks(withDetached, detached.id, detached.linkedIds)
      }
      // 'following': close the current series and start a new one from here.
      const until = dayBefore(occ.start)
      const splitKey = formatKey(occ.start)
      const newSeries = {
        ...event,
        id: genId(),
        start: newStart,
        end: newEnd,
        recurrenceDays: shiftedDays(event, occ.start, newStart),
        recurrenceUntil: event.recurrenceUntil || null,
        exdates: keysFrom(event.exdates, splitKey),
        occStatus: entriesFrom(event.occStatus, splitKey),
      }
      const withNewSeries = prev
        .map((e) =>
          e.id === event.id
            ? {
                ...e,
                recurrenceUntil: until,
                exdates: keysBefore(e.exdates, splitKey),
                occStatus: entriesBefore(e.occStatus, splitKey),
              }
            : e
        )
        .concat(newSeries)
      return reconcileLinks(withNewSeries, newSeries.id, newSeries.linkedIds)
    })
  }, [])

  // Deletes one occurrence with the same scope options.
  const deleteOccurrence = useCallback((occ, scope) => {
    setEvents((prev) => {
      const event = prev.find((e) => e.id === occ.eventId)
      if (!event) return prev
      if (event.recurrence === 'none' || scope === 'all') {
        return unlinkEverywhere(prev.filter((e) => e.id !== event.id), event.id)
      }
      if (scope === 'this') {
        return prev.map((e) =>
          e.id === event.id ? { ...e, exdates: [...(e.exdates || []), occ.occKey] } : e
        )
      }
      // 'following': if nothing would remain before this occurrence, remove the
      // whole series instead of leaving a phantom event with no occurrences.
      const until = dayBefore(occ.start)
      if (until < event.start) {
        return unlinkEverywhere(prev.filter((e) => e.id !== event.id), event.id)
      }
      return prev.map((e) => (e.id === event.id ? { ...e, recurrenceUntil: until } : e))
    })
  }, [])

  // Applies edited fields (from the modal) to one occurrence with scope options.
  const editOccurrence = useCallback((occ, data, scope) => {
    setEvents((prev) => {
      const event = prev.find((e) => e.id === occ.eventId)
      if (!event) return prev
      // Shift start and end independently — see moveOccurrence for why a
      // single shared delta silently drops end-only changes (resize).
      const deltaStart = data.start.getTime() - occ.start.getTime()
      const deltaEnd = data.end.getTime() - occ.end.getTime()
      // "This and following" from the series' very first occurrence covers
      // every occurrence there is — apply in place, same as scope 'all',
      // instead of splitting off a new series and leaving the old one empty.
      const coversWholeSeries = scope === 'following' && isSameDay(occ.start, event.start)

      if (event.recurrence === 'none' || scope === 'all' || coversWholeSeries) {
        return prev.map((e) =>
          e.id === event.id
            ? {
                ...e,
                ...data,
                id: e.id,
                start: new Date(e.start.getTime() + deltaStart),
                end: new Date(e.end.getTime() + deltaEnd),
                exdates: e.exdates || [],
                occStatus: e.occStatus || {},
              }
            : e
        )
      }
      if (scope === 'this') {
        const detached = {
          ...event,
          ...data,
          id: genId(),
          recurrence: 'none',
          recurrenceDays: [],
          recurrenceUntil: null,
          exdates: [],
          occStatus: {},
        }
        const withDetached = prev
          .map((e) =>
            e.id === event.id ? { ...e, exdates: [...(e.exdates || []), occ.occKey] } : e
          )
          .concat(detached)
        return reconcileLinks(withDetached, detached.id, detached.linkedIds)
      }
      // 'following'
      const until = dayBefore(occ.start)
      const splitKey = formatKey(occ.start)
      const newSeries = {
        ...event,
        ...data,
        id: genId(),
        exdates: keysFrom(event.exdates, splitKey),
        occStatus: entriesFrom(event.occStatus, splitKey),
        recurrenceUntil: event.recurrenceUntil || null,
      }
      const withNewSeries = prev
        .map((e) =>
          e.id === event.id
            ? {
                ...e,
                recurrenceUntil: until,
                exdates: keysBefore(e.exdates, splitKey),
                occStatus: entriesBefore(e.occStatus, splitKey),
              }
            : e
        )
        .concat(newSeries)
      return reconcileLinks(withNewSeries, newSeries.id, newSeries.linkedIds)
    })
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
    moveOccurrence,
    deleteOccurrence,
    editOccurrence,
    setOccurrenceStatus,
    removeTagFromAllEvents,
  }
}
