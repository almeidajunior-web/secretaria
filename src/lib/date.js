// Date/time helpers built on date-fns. Centralizes the grid math so the
// week and day views stay DRY.
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  addDays,
  format,
  isSameDay,
  getHours,
  getMinutes,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { HOUR_START, HOUR_END, HOUR_HEIGHT } from '../constants'

// Week starts on Sunday to match the WEEKDAYS_SHORT labels.
export function weekStart(date) {
  return startOfWeek(date, { weekStartsOn: 0 })
}

export function weekEnd(date) {
  return endOfWeek(date, { weekStartsOn: 0 })
}

// The 7 days of the week containing `date`.
export function getWeekDays(date) {
  const start = weekStart(date)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

// All days to render for a month grid (padded to full weeks).
export function getMonthGridDays(date) {
  const start = weekStart(startOfMonth(date))
  const end = weekEnd(endOfMonth(date))
  const days = []
  let cursor = start
  while (cursor <= end) {
    days.push(cursor)
    cursor = addDays(cursor, 1)
  }
  return days
}

export function fmt(date, pattern) {
  return format(date, pattern, { locale: ptBR })
}

// Capitalizes the first letter (pt-BR month names come lowercase from date-fns).
export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function minutesOfDay(date) {
  return getHours(date) * 60 + getMinutes(date)
}

const PX_PER_MIN = HOUR_HEIGHT / 60
const GRID_TOP_MIN = HOUR_START * 60
const GRID_BOTTOM_MIN = HOUR_END * 60

export const GRID_HEIGHT = (HOUR_END - HOUR_START) * HOUR_HEIGHT

// Vertical position (px) of a moment within the day grid.
export function minutesToTop(minutes) {
  return (minutes - GRID_TOP_MIN) * PX_PER_MIN
}

// Top/height (px) for an event occurrence, clamped to the visible range.
export function eventRect(start, end) {
  const startMin = Math.max(minutesOfDay(start), GRID_TOP_MIN)
  const endMin = Math.min(minutesOfDay(end), GRID_BOTTOM_MIN)
  const top = minutesToTop(startMin)
  const height = Math.max((endMin - startMin) * PX_PER_MIN, 18)
  return { top, height }
}

// Rounds a date down to the nearest half hour (used for slot clicks).
export function roundToHalfHour(date) {
  const d = new Date(date)
  const m = d.getMinutes()
  d.setMinutes(m < 30 ? 0 : 30, 0, 0)
  return d
}

// Builds a Date for `day` at the given hour fraction (e.g. 9.5 => 09:30).
export function dayAtHour(day, hour) {
  const d = startOfDay(day)
  d.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0)
  return d
}

// <input type="datetime-local"> serialization.
export function toInputValue(date) {
  return format(date, "yyyy-MM-dd'T'HH:mm")
}

export function fromInputValue(value) {
  return new Date(value)
}

// Assigns side-by-side columns to overlapping occurrences in a single day.
export function layoutColumns(occurrences) {
  const sorted = [...occurrences].sort((a, b) => a.start - b.start)
  const result = []
  let cluster = []
  let clusterEnd = null

  const flush = () => {
    const columns = []
    cluster.forEach((occ) => {
      let placed = false
      for (let c = 0; c < columns.length; c++) {
        if (columns[c] <= occ.start) {
          occ._col = c
          columns[c] = occ.end
          placed = true
          break
        }
      }
      if (!placed) {
        occ._col = columns.length
        columns.push(occ.end)
      }
    })
    cluster.forEach((occ) => {
      occ._cols = columns.length
      result.push(occ)
    })
    cluster = []
    clusterEnd = null
  }

  sorted.forEach((occ) => {
    if (clusterEnd !== null && occ.start >= clusterEnd) flush()
    cluster.push(occ)
    clusterEnd = clusterEnd === null ? occ.end : new Date(Math.max(clusterEnd, occ.end))
  })
  if (cluster.length) flush()
  return result
}

export { isSameDay, addDays }
