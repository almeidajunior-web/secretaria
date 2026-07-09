// Persistence layer. Today it is backed by localStorage; tomorrow this file
// can be swapped for a Supabase implementation without touching the UI.
// Dates live as `Date` objects in memory and ISO strings on disk.

const KEYS = {
  events: 'secretaria:events',
  tags: 'secretaria:tags',
  theme: 'secretaria:theme',
  schemaVersion: 'secretaria:schemaVersion',
}

const SCHEMA_VERSION = 1

// Single place to run migrations when SCHEMA_VERSION changes in the future.
function ensureSchema() {
  const stored = Number(localStorage.getItem(KEYS.schemaVersion))
  if (stored === SCHEMA_VERSION) return
  // No migrations needed yet — just stamp the current version.
  localStorage.setItem(KEYS.schemaVersion, String(SCHEMA_VERSION))
}

function reviveEvent(raw) {
  return {
    ...raw,
    start: new Date(raw.start),
    end: new Date(raw.end),
    tags: raw.tags || [],
    kind: raw.kind || (raw.isAula ? 'aula' : 'event'),
    occStatus: raw.occStatus || {},
    exdates: raw.exdates || [],
    linkedIds: raw.linkedIds || [],
    recurrenceDays: raw.recurrenceDays || [],
    recurrenceUntil: raw.recurrenceUntil ? new Date(raw.recurrenceUntil) : null,
  }
}

function serializeEvent(event) {
  return {
    ...event,
    start: event.start instanceof Date ? event.start.toISOString() : event.start,
    end: event.end instanceof Date ? event.end.toISOString() : event.end,
    recurrenceUntil:
      event.recurrenceUntil instanceof Date
        ? event.recurrenceUntil.toISOString()
        : event.recurrenceUntil || null,
  }
}

export function loadEvents() {
  ensureSchema()
  const raw = localStorage.getItem(KEYS.events)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) throw new Error('not an array')
    return parsed.map(reviveEvent)
  } catch {
    // Preserve the corrupted payload instead of letting the next saveEvents()
    // silently overwrite it with seed data — gives a chance at manual
    // recovery via devtools.
    try {
      localStorage.setItem(`${KEYS.events}:corrupted-backup`, raw)
    } catch {
      // best-effort; ignore a secondary storage failure
    }
    return null
  }
}

export function saveEvents(events) {
  ensureSchema()
  const payload = events.map(serializeEvent)
  localStorage.setItem(KEYS.events, JSON.stringify(payload))
}

export function loadTags() {
  try {
    const raw = localStorage.getItem(KEYS.tags)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveTags(tags) {
  localStorage.setItem(KEYS.tags, JSON.stringify(tags))
}

export function loadTheme() {
  const theme = localStorage.getItem(KEYS.theme)
  return theme === 'light' || theme === 'dark' ? theme : null
}

export function saveTheme(theme) {
  localStorage.setItem(KEYS.theme, theme)
}
