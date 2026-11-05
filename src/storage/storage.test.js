import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryStorage } from '../test/memoryStorage'
import { loadStore, saveStore, initialValue } from './store'
import { getProblems, dismissProblems } from './problems'
import * as stores from './stores'
import { ensureSchemaVersion } from './schema'

let storage
beforeEach(() => {
  storage = createMemoryStorage()
  globalThis.localStorage = storage
  dismissProblems()
})

const roundTrip = (store) => {
  const loaded = loadStore(store)
  storage.removeItem(store.storageKey)
  saveStore(store, loaded.value)
  return storage.getItem(store.storageKey)
}

describe('stored format stays exactly as earlier versions wrote it', () => {
  it.each([
    ['tasks', stores.tasksStore, [{ id: 't', title: 'x', tagIds: [], status: 'todo' }]],
    ['bills', stores.billsStore, [{ id: 'b', title: 'Luz', amount: 10.5, dueDate: '2026-03-01' }]],
    ['financeEntries', stores.financeEntriesStore, [{ id: 'f', amount: 1, date: '2026-03-01', type: 'expense' }]],
    ['taskStatuses', stores.taskStatusesStore, [{ id: 's', label: 'A', color: '#000', isDone: false }]],
    ['habitLog', stores.habitLogStore, { 'h:2026-03-01': 'done' }],
    ['goals', stores.goalsStore, [{ id: 'g', title: 'x', progress: 10, status: 'active' }]],
    ['financeCreditCard', stores.financeCreditCardStore, { closingDay: 20, dueDay: 1 }],
    ['planning', stores.planningStore, { categories: [], grid: { '0:8': { categoryId: 'c' } }, splits: {}, hourStart: 6, hourEnd: 22 }],
  ])('%s', (_name, store, value) => {
    const raw = JSON.stringify(value)
    storage.setItem(store.storageKey, raw)
    expect(roundTrip(store)).toBe(raw)
  })

  it('events keep dates as ISO strings', () => {
    const raw = JSON.stringify([
      { id: 'e', title: 'x', start: '2026-03-02T13:00:00.000Z', end: '2026-03-02T14:00:00.000Z', recurrence: 'none', tags: [], kind: 'event', occStatus: {}, exdates: [], linkedIds: [], recurrenceDays: [], recurrenceUntil: null },
    ])
    storage.setItem('secretaria:events', raw)
    const { value } = loadStore(stores.eventsStore)
    expect(value[0].start).toBeInstanceOf(Date)
    expect(roundTrip(stores.eventsStore)).toBe(raw)
  })

  it('the theme is a bare string and the flags are "true"/"false"', () => {
    saveStore(stores.themeStore, 'dark')
    saveStore(stores.privacyModeStore, true)
    saveStore(stores.financeValuesHiddenStore, false)
    expect(storage.dump()).toMatchObject({
      'secretaria:theme': 'dark',
      'secretaria:privacyMode': 'true',
      'secretaria:financeValuesHidden': 'false',
    })
    expect(loadStore(stores.privacyModeStore).value).toBe(true)
  })

  it('still reads the legacy shapes, migrated', () => {
    storage.setItem('secretaria:planning', JSON.stringify({ categories: [], grid: { '0:8': 'work' } }))
    storage.setItem('secretaria:tasks', JSON.stringify([{ id: 't', tags: ['x'] }]))
    storage.setItem('secretaria:taskTags', JSON.stringify(['Faculdade']))
    expect(loadStore(stores.planningStore).value.grid['0:8']).toEqual({ categoryId: 'work' })
    expect(loadStore(stores.tasksStore).value[0]).toEqual({ id: 't', tagIds: [] })
    expect(loadStore(stores.taskTagsStore).value[0]).toMatchObject({ id: 'tag_legacy_0', label: 'Faculdade' })
  })

  it('stamps the schema version', () => {
    ensureSchemaVersion()
    expect(storage.getItem('secretaria:schemaVersion')).toBe('1')
  })
})

describe('first run and empty lists', () => {
  it('seeds only when nothing was ever saved', () => {
    expect(initialValue(stores.goalsStore, loadStore(stores.goalsStore)).length).toBeGreaterThan(0)
    storage.setItem('secretaria:goals', '[]')
    expect(initialValue(stores.goalsStore, loadStore(stores.goalsStore))).toEqual([])
  })

  it('accounts have no seed', () => {
    expect(initialValue(stores.financeAccountsStore, loadStore(stores.financeAccountsStore))).toEqual([])
  })
})

describe('unreadable data is never replaced by demo data', () => {
  it('sets the original aside, starts empty and reports it', () => {
    storage.setItem('secretaria:tasks', '{"not": "a list"}')
    const loaded = loadStore(stores.tasksStore)
    expect(loaded).toEqual({ status: 'corrupt', value: [] })
    expect(initialValue(stores.tasksStore, loaded)).toEqual([]) // not the seed
    expect(storage.getItem('secretaria:tasks:corrupted-backup')).toBe('{"not": "a list"}')
    expect(storage.getItem('secretaria:tasks')).toBe('{"not": "a list"}') // left in place
    expect(getProblems()).toEqual([expect.objectContaining({ kind: 'corrupt', key: 'tasks', label: 'Tarefas' })])
  })

  it('treats broken JSON the same way', () => {
    storage.setItem('secretaria:events', '[{"id":')
    expect(loadStore(stores.eventsStore).status).toBe('corrupt')
  })

  it('drops single malformed items instead of the whole collection', () => {
    storage.setItem('secretaria:financeEntries', JSON.stringify([null, 3, { id: 'ok' }]))
    expect(loadStore(stores.financeEntriesStore)).toEqual({ status: 'ok', value: [{ id: 'ok' }] })
  })

  it('an odd preference value quietly falls back to the default', () => {
    storage.setItem('secretaria:theme', 'blue')
    expect(loadStore(stores.themeStore).status).toBe('absent')
    expect(getProblems()).toEqual([])
  })
})

describe('saving', () => {
  it('reports a refused write and clears it once a write succeeds', () => {
    const setItem = storage.setItem
    storage.setItem = () => {
      throw new Error('QuotaExceededError')
    }
    saveStore(stores.billsStore, [{ id: 'b' }])
    expect(getProblems()).toEqual([expect.objectContaining({ kind: 'write', key: 'bills' })])
    storage.setItem = setItem
    saveStore(stores.billsStore, [{ id: 'b' }])
    expect(getProblems()).toEqual([])
  })

  it('does not rewrite an unchanged value', () => {
    saveStore(stores.billsStore, [{ id: 'b' }])
    let writes = 0
    const setItem = storage.setItem
    storage.setItem = (...args) => {
      writes++
      return setItem(...args)
    }
    saveStore(stores.billsStore, [{ id: 'b' }])
    expect(writes).toBe(0)
  })
})
