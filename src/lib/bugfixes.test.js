import { describe, expect, it } from 'vitest'
import { parseAmount } from '../components/common/AmountInput'
import { percentChange } from './financeMetrics'
import { buildTaskComparator, rankMap } from './taskSort'
import { buildShoppingComparator } from './shoppingSort'

// Regression tests for bugs found in the November 2026 code review.

describe('money typed the Brazilian way', () => {
  it.each([
    ['1.500', 1500],
    ['12.345.678', 12345678],
    ['1.5', 1.5],
    ['1.50', 1.5],
    ['0.500', 0.5],
    ['1500.5', 1500.5],
  ])('reads %j as %j', (raw, value) => {
    expect(parseAmount(raw)).toBe(value)
  })
})

describe('change against a negative month', () => {
  it('reads going from -100 to +50 as an improvement', () => {
    expect(percentChange(50, -100)).toBe(150)
  })

  it('reads going from -100 to -200 as a worsening', () => {
    expect(percentChange(-200, -100)).toBe(-100)
  })
})

describe('items without a priority keep a stable order', () => {
  it('falls through to the due date / title tiebreak for tasks', () => {
    const tasks = [
      { id: 2, title: 'b', priorityId: null, dueDate: '2026-03-02' },
      { id: 1, title: 'a', priorityId: null, dueDate: '2026-03-01' },
    ]
    const sorted = [...tasks].sort(buildTaskComparator([{ field: 'priority', direction: 'asc' }], rankMap([])))
    expect(sorted.map((t) => t.id)).toEqual([1, 2])
  })

  it('falls through to the title tiebreak for shopping items', () => {
    const items = [
      { id: 2, title: 'pão', priorityId: null },
      { id: 1, title: 'arroz', priorityId: null },
    ]
    const sorted = [...items].sort(buildShoppingComparator([{ field: 'priority', direction: 'asc' }], {}, {}))
    expect(sorted.map((t) => t.id)).toEqual([1, 2])
  })
})

describe('task statuses', async () => {
  const { canDeleteStatus } = await import('../hooks/useTaskStatuses')
  const statuses = [
    { id: 'todo', isDone: false },
    { id: 'done', isDone: true },
  ]
  it('refuses to delete the last "done" status, allows the others', () => {
    expect(canDeleteStatus(statuses, 'done')).toBe(false)
    expect(canDeleteStatus(statuses, 'todo')).toBe(true)
    expect(canDeleteStatus([statuses[0]], 'todo')).toBe(false)
  })
})
