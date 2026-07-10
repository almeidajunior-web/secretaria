// Grid key helpers for the Planejamento module. A window is addressed by
// "day:hour" (a whole-hour window) or "day:hour:half" once split, where
// `half` is 0 (HH:00–HH:30) or 30 (HH:30–(HH+1):00). Splitting only ever
// applies to one specific day+hour cell, never a whole row.
export function cellKey(day, hour, half) {
  return half == null ? `${day}:${hour}` : `${day}:${hour}:${half}`
}

export function parseCellKey(key) {
  const parts = key.split(':').map(Number)
  return { day: parts[0], hour: parts[1], half: parts.length > 2 ? parts[2] : undefined }
}

// Total painted hours per category across the whole grid — a whole-hour
// window counts as 1h, a split half as 0.5h.
export function categoryHours(grid) {
  const hours = {}
  for (const [key, entry] of Object.entries(grid)) {
    if (!entry?.categoryId) continue
    const { half } = parseCellKey(key)
    const amount = half == null ? 1 : 0.5
    hours[entry.categoryId] = (hours[entry.categoryId] || 0) + amount
  }
  return hours
}
