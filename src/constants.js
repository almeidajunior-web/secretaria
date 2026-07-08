// Static configuration shared across the app. UI labels in pt-BR, code in English.

// Brand color is first so it is the default for new events.
export const EVENT_COLORS = [
  '#2563EB',
  '#1E3A8A',
  '#7C3AED',
  '#059669',
  '#D97706',
  '#DC2626',
  '#DB2777',
  '#0891B2',
  '#65A30D',
  '#6B7280',
]

// Short weekday labels, week starting on Sunday (date-fns getDay() order).
export const WEEKDAYS_SHORT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']

// Single-letter weekday labels for compact pickers (Sunday-first, indexed by
// date-fns getDay()).
export const WEEKDAYS_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

// Monday-first orderings for headers rendered in week order.
export const WEEKDAYS_SHORT_ORDERED = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']
export const WEEKDAYS_LETTERS_ORDERED = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

export const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export const MONTHS_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

// Visible hour range for the day/week grids.
export const HOUR_START = 6
export const HOUR_END = 23
export const HOUR_HEIGHT = 48 // px per hour slot

export const CLASSIFICATIONS = [
  { value: 'event', label: 'Evento' },
  { value: 'aula', label: 'Aula' },
  { value: 'prova', label: 'Prova' },
]

export const STATUSES = [
  { value: 'unconfirmed', label: 'Não confirmado' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'provisional', label: 'Provisório' },
  { value: 'refused', label: 'Recusado' },
]

export const RECURRENCES = [
  { value: 'none', label: 'Sem recorrência' },
  { value: 'daily', label: 'Diária' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quinzenal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'yearly', label: 'Anual' },
  { value: 'weekdays', label: 'Dias úteis (seg–sex)' },
  { value: 'custom', label: 'Personalizar…' },
]

export const VIEWS = [
  { value: 'year', label: 'Anual' },
  { value: 'month', label: 'Mensal' },
  { value: 'week', label: 'Semanal' },
  { value: 'day', label: 'Diária' },
]

// Convert a hex color to an rgba() string. Event colors are data-driven and
// cannot be expressed as Tailwind classes, so inline color styling is used.
export function withAlpha(hex, alpha) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
