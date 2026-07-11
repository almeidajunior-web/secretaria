// Persistence layer. Today it is backed by localStorage; tomorrow this file
// can be swapped for a Supabase implementation without touching the UI.
// Dates live as `Date` objects in memory and ISO strings on disk.

const KEYS = {
  events: 'secretaria:events',
  tags: 'secretaria:tags',
  theme: 'secretaria:theme',
  planning: 'secretaria:planning',
  tasks: 'secretaria:tasks',
  taskPriorities: 'secretaria:taskPriorities',
  taskTags: 'secretaria:taskTags',
  taskStatuses: 'secretaria:taskStatuses',
  modulesConfig: 'secretaria:modulesConfig',
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

export function loadPlanning() {
  try {
    const raw = localStorage.getItem(KEYS.planning)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    // Grid cell values used to be bare category-id strings; migrate them to
    // { categoryId } objects so existing painted routines survive the switch
    // to per-window descriptions.
    const rawGrid = parsed.grid && typeof parsed.grid === 'object' ? parsed.grid : {}
    const grid = Object.fromEntries(
      Object.entries(rawGrid).map(([key, value]) => [
        key,
        typeof value === 'string' ? { categoryId: value } : value,
      ])
    )
    return {
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      grid,
      splits: parsed.splits && typeof parsed.splits === 'object' ? parsed.splits : {},
      hourStart: typeof parsed.hourStart === 'number' ? parsed.hourStart : undefined,
      hourEnd: typeof parsed.hourEnd === 'number' ? parsed.hourEnd : undefined,
    }
  } catch {
    return null
  }
}

export function savePlanning(planning) {
  localStorage.setItem(KEYS.planning, JSON.stringify(planning))
}

// Tasks have no Date objects — dueDate/dueTime/recurrenceUntil are plain
// 'yyyy-MM-dd'/'HH:mm' strings, so no revive/serialize step is needed.
export function loadTasks() {
  try {
    const raw = localStorage.getItem(KEYS.tasks)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveTasks(tasks) {
  localStorage.setItem(KEYS.tasks, JSON.stringify(tasks))
}

export function loadTaskPriorities() {
  try {
    const raw = localStorage.getItem(KEYS.taskPriorities)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveTaskPriorities(priorities) {
  localStorage.setItem(KEYS.taskPriorities, JSON.stringify(priorities))
}

export function loadTaskTags() {
  try {
    const raw = localStorage.getItem(KEYS.taskTags)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    // Tags used to be bare label strings; migrate them to {id, label, color}
    // objects (best-effort — tasks referencing the old string values won't
    // automatically re-link, but the tag list itself stays usable).
    return parsed.map((t, i) =>
      typeof t === 'string' ? { id: `tag_legacy_${i}`, label: t, color: '#6B7280' } : t
    )
  } catch {
    return null
  }
}

export function saveTaskTags(tags) {
  localStorage.setItem(KEYS.taskTags, JSON.stringify(tags))
}

export function loadTaskStatuses() {
  try {
    const raw = localStorage.getItem(KEYS.taskStatuses)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveTaskStatuses(statuses) {
  localStorage.setItem(KEYS.taskStatuses, JSON.stringify(statuses))
}

export function loadModulesConfig() {
  try {
    const raw = localStorage.getItem(KEYS.modulesConfig)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return {
      order: Array.isArray(parsed.order) ? parsed.order : [],
      hidden: Array.isArray(parsed.hidden) ? parsed.hidden : [],
    }
  } catch {
    return null
  }
}

export function saveModulesConfig(config) {
  localStorage.setItem(KEYS.modulesConfig, JSON.stringify(config))
}

export function loadTheme() {
  const theme = localStorage.getItem(KEYS.theme)
  return theme === 'light' || theme === 'dark' ? theme : null
}

export function saveTheme(theme) {
  localStorage.setItem(KEYS.theme, theme)
}
