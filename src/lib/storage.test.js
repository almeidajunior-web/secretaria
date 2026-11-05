import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryStorage } from '../test/memoryStorage'

let storage
beforeEach(() => {
  storage = createMemoryStorage()
  globalThis.localStorage = storage
})

const load = async () => import('./storage')

describe('storage', () => {
  it('round-trips events, reviving dates', async () => {
    const { saveEvents, loadEvents } = await load()
    saveEvents([{ id: 'e', start: new Date(2026, 2, 2, 10), end: new Date(2026, 2, 2, 11), recurrence: 'none' }])
    const [e] = loadEvents()
    expect(e.start).toEqual(new Date(2026, 2, 2, 10))
    expect(e.exdates).toEqual([])
  })

  it('reports "never saved" as null so hooks know to seed', async () => {
    const { loadTasks, loadBills, loadFinanceEntries } = await load()
    expect(loadTasks()).toBeNull()
    expect(loadBills()).toBeNull()
    expect(loadFinanceEntries()).toBeNull()
  })

  it('keeps an intentionally emptied list empty', async () => {
    const { saveTasks, loadTasks } = await load()
    saveTasks([])
    expect(loadTasks()).toEqual([])
  })

  it('migrates legacy planning cells and task tags', async () => {
    storage.setItem('secretaria:planning', JSON.stringify({ categories: [], grid: { '0:8': 'work' } }))
    storage.setItem('secretaria:tasks', JSON.stringify([{ id: 't', tags: ['x'] }]))
    const { loadPlanning, loadTasks } = await load()
    expect(loadPlanning().grid['0:8']).toEqual({ categoryId: 'work' })
    expect(loadTasks()[0]).toEqual({ id: 't', tagIds: [] })
  })

  it('drops malformed finance entries instead of failing the module', async () => {
    storage.setItem('secretaria:financeEntries', JSON.stringify([null, 3, { id: 'ok' }]))
    const { loadFinanceEntries } = await load()
    expect(loadFinanceEntries()).toEqual([{ id: 'ok' }])
  })
})
