import { defineStore } from './store'
import { buildSeedEvents } from '../data/seed'
import { PLANNING_SEED_CATEGORIES, DEFAULT_HOUR_START, DEFAULT_HOUR_END } from '../data/planningSeed'
import { buildSeedTasks, TASK_STATUS_SEED, TASK_SEED_PRIORITIES, TASK_SEED_TAGS } from '../data/taskSeed'
import { buildSeedShoppingItems, SHOPPING_SEED_CATEGORIES, SHOPPING_SEED_PRIORITIES } from '../data/shoppingSeed'
import { buildSeedBills, DUES_SEED_CATEGORIES } from '../data/duesSeed'
import {
  buildSeedEntries,
  FINANCE_SEED_EXPENSE_CATEGORIES,
  FINANCE_SEED_INCOME_CATEGORIES,
  FINANCE_SEED_PAYMENT_METHODS,
} from '../data/financeSeed'
import { buildSeedHabits, buildSeedHabitLog, buildSeedGoals } from '../data/goalsSeed'
import { repairConfig } from '../lib/modulesConfig'

// Every value the app keeps in the browser, in one place. Keys, stored shapes
// and the migrations of old shapes are exactly those of earlier versions —
// changing any of them would make existing data (and exported backups)
// unreadable. To add a store, define it here and read it with useStoredState.

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

// A plain array store; `keep` drops individual malformed items instead of
// rejecting the whole collection over one bad record.
const arrayOf = (keep) => (v) => (Array.isArray(v) ? (keep ? v.filter(keep) : v) : undefined)

const list = (key, label, seed) =>
  defineStore({ key, label, empty: () => [], seed: seed ? () => seed : undefined, parse: arrayOf() })

// ── Agenda ──────────────────────────────────────────────────────────────────
// Dates live as Date objects in memory and ISO strings on disk.
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
      event.recurrenceUntil instanceof Date ? event.recurrenceUntil.toISOString() : event.recurrenceUntil || null,
  }
}

export const eventsStore = defineStore({
  key: 'events',
  label: 'Agenda',
  empty: () => [],
  seed: buildSeedEvents,
  parse: (v) => (Array.isArray(v) ? v.filter(isObject).map(reviveEvent) : undefined),
  serialize: (events) => events.map(serializeEvent),
})

// Agenda's tags are bare strings. First run seeds them from the events (see
// useTags), so this store has no seed of its own.
export const agendaTagsStore = list('tags', 'Agenda (tags)')

// ── Planejamento ───────────────────────────────────────────────────────────
export const planningStore = defineStore({
  key: 'planning',
  label: 'Planejamento',
  seed: () => ({
    categories: PLANNING_SEED_CATEGORIES,
    grid: {},
    splits: {},
    hourStart: DEFAULT_HOUR_START,
    hourEnd: DEFAULT_HOUR_END,
  }),
  empty: () => ({ categories: [], grid: {}, splits: {}, hourStart: DEFAULT_HOUR_START, hourEnd: DEFAULT_HOUR_END }),
  parse: (v) => {
    if (!isObject(v)) return undefined
    // Grid cells used to be bare category-id strings; they're { categoryId }
    // objects now, so painted routines survive the switch to descriptions.
    const rawGrid = isObject(v.grid) ? v.grid : {}
    const grid = Object.fromEntries(
      Object.entries(rawGrid).map(([k, cell]) => [k, typeof cell === 'string' ? { categoryId: cell } : cell])
    )
    return {
      categories: Array.isArray(v.categories) ? v.categories : [],
      grid,
      splits: isObject(v.splits) ? v.splits : {},
      hourStart: typeof v.hourStart === 'number' ? v.hourStart : DEFAULT_HOUR_START,
      hourEnd: typeof v.hourEnd === 'number' ? v.hourEnd : DEFAULT_HOUR_END,
    }
  },
})

// ── Tarefas ────────────────────────────────────────────────────────────────
export const tasksStore = defineStore({
  key: 'tasks',
  label: 'Tarefas',
  empty: () => [],
  seed: buildSeedTasks,
  // Tasks used to carry `tags: string[]` (label text); they reference tag
  // objects by id via `tagIds` now. The old labels can't be mapped to ids, so
  // a legacy task drops the dead field and starts untagged.
  parse: (v) =>
    Array.isArray(v)
      ? v.filter(isObject).map((t) => {
          if (t.tagIds || !t.tags) return t
          const { tags: _legacyTags, ...rest } = t
          return { ...rest, tagIds: [] }
        })
      : undefined,
})

export const taskPrioritiesStore = list('taskPriorities', 'Tarefas (prioridades)', TASK_SEED_PRIORITIES)
export const taskStatusesStore = list('taskStatuses', 'Tarefas (status)', TASK_STATUS_SEED)
export const taskTagsStore = defineStore({
  key: 'taskTags',
  label: 'Tarefas (tags)',
  empty: () => [],
  seed: () => TASK_SEED_TAGS,
  // Tags used to be bare label strings; they're { id, label, color } now.
  parse: (v) =>
    Array.isArray(v)
      ? v.map((t, i) => (typeof t === 'string' ? { id: `tag_legacy_${i}`, label: t, color: '#6B7280' } : t))
      : undefined,
})

// ── Compras ────────────────────────────────────────────────────────────────
export const shoppingItemsStore = defineStore({
  key: 'shoppingItems',
  label: 'Compras',
  empty: () => [],
  seed: buildSeedShoppingItems,
  parse: arrayOf(isObject),
})
export const shoppingCategoriesStore = list('shoppingCategories', 'Compras (classificações)', SHOPPING_SEED_CATEGORIES)
export const shoppingPrioritiesStore = list('shoppingPriorities', 'Compras (prioridades)', SHOPPING_SEED_PRIORITIES)

// ── Vencimentos ────────────────────────────────────────────────────────────
export const billsStore = defineStore({
  key: 'bills',
  label: 'Vencimentos',
  empty: () => [],
  seed: buildSeedBills,
  parse: arrayOf(isObject),
})
export const billCategoriesStore = list('billCategories', 'Vencimentos (classificações)', DUES_SEED_CATEGORIES)

// ── Finanças ───────────────────────────────────────────────────────────────
// Malformed items (null, a stray primitive) are dropped: every metric reads
// `e.date` straight off each entry, so one of them used to crash the module.
export const financeEntriesStore = defineStore({
  key: 'financeEntries',
  label: 'Finanças',
  empty: () => [],
  seed: buildSeedEntries,
  parse: arrayOf(isObject),
})
export const financeExpenseCategoriesStore = list(
  'financeExpenseCategories',
  'Finanças (categorias de despesa)',
  FINANCE_SEED_EXPENSE_CATEGORIES
)
export const financeIncomeCategoriesStore = list(
  'financeIncomeCategories',
  'Finanças (categorias de receita)',
  FINANCE_SEED_INCOME_CATEGORIES
)
export const financePaymentMethodsStore = list('financePaymentMethods', 'Finanças (formas de pagamento)', FINANCE_SEED_PAYMENT_METHODS)
// No seed: there's no guessing someone's real banks.
export const financeAccountsStore = list('financeAccounts', 'Finanças (contas)')
export const financeCreditCardStore = defineStore({
  key: 'financeCreditCard',
  label: 'Finanças (cartão de crédito)',
  empty: () => ({ closingDay: 25, dueDay: 5 }),
  parse: (v) => (isObject(v) ? v : undefined),
})
// Invoices marked paid, identified by their due date.
export const financePaidInvoicesStore = defineStore({
  key: 'financePaidInvoices',
  label: 'Finanças (faturas pagas)',
  empty: () => [],
  parse: arrayOf((d) => typeof d === 'string'),
})

// ── Metas ──────────────────────────────────────────────────────────────────
// Habits normalize the fields the grid indexes by, so callers never guard them.
export const habitsStore = defineStore({
  key: 'habits',
  label: 'Metas (rotinas)',
  empty: () => [],
  seed: buildSeedHabits,
  parse: (v) =>
    Array.isArray(v)
      ? v
          .filter((h) => isObject(h) && typeof h.id === 'string')
          .map((h) => ({
            ...h,
            weekdays: Array.isArray(h.weekdays) ? h.weekdays.filter((d) => d >= 0 && d <= 6) : [0, 1, 2, 3, 4, 5, 6],
            startDate: typeof h.startDate === 'string' ? h.startDate : null,
            endDate: typeof h.endDate === 'string' ? h.endDate : null,
          }))
      : undefined,
})

// Sparse map 'habitId:yyyy-MM-dd' -> 'done' | 'miss' | 'na'. An absent key is
// a day never answered (it still counts against the day, unlike 'na').
const CELL_STATES = new Set(['done', 'miss', 'na'])
export const habitLogStore = defineStore({
  key: 'habitLog',
  label: 'Metas (registro diário)',
  empty: () => ({}),
  seed: buildSeedHabitLog,
  parse: (v) => (isObject(v) ? Object.fromEntries(Object.entries(v).filter(([, s]) => CELL_STATES.has(s))) : undefined),
})

export const goalsStore = defineStore({
  key: 'goals',
  label: 'Metas (objetivos)',
  empty: () => [],
  seed: buildSeedGoals,
  parse: arrayOf(isObject),
})

// ── App ────────────────────────────────────────────────────────────────────
// Always handed out repaired: every module accounted for exactly once, no
// reference to a module or group that no longer exists.
export const modulesConfigStore = defineStore({
  key: 'modulesConfig',
  label: 'Configurações (módulos)',
  seed: () => repairConfig(null),
  parse: (v) =>
    isObject(v)
      ? repairConfig({
          order: Array.isArray(v.order) ? v.order : [],
          hidden: Array.isArray(v.hidden) ? v.hidden : [],
          // Absent on configs saved before groups existed: every module then
          // stays loose in the top bar, exactly as before.
          groups: Array.isArray(v.groups)
            ? v.groups.filter((g) => g && typeof g.id === 'string' && Array.isArray(g.moduleIds))
            : [],
        })
      : undefined,
})

// The theme is stored as a bare string, not JSON.
export const themeStore = defineStore({
  key: 'theme',
  format: 'text',
  lenient: true,
  parse: (v) => (v === 'light' || v === 'dark' ? v : undefined),
})

// On/off preferences, stored as 'true' / 'false'. They persist across
// reloads on purpose — a privacy toggle that resets when you reopen the
// laptop would defeat its point.
const flag = (key) =>
  defineStore({ key, format: 'text', lenient: true, empty: () => false, parse: (v) => v === 'true' })
export const privacyModeStore = flag('privacyMode')
export const billValuesHiddenStore = flag('billValuesHidden')
export const financeValuesHiddenStore = flag('financeValuesHidden')
