import { describe, expect, it } from 'vitest'
import { buildTaskComparator, rankMap, sanitizeSortChain as sanitizeTaskChain } from './taskSort'
import { groupTasksByDueDate } from './taskGroups'
import { buildShoppingComparator } from './shoppingSort'
import { groupItemsByCategory } from './shoppingGroups'
import { buildBillComparator } from './billSort'
import { groupBillsByDueDate } from './billGroups'
import { reorderIds } from './reorderList'
import { cellKey, parseCellKey, categoryHours, formatHours } from './planningGrid'

describe('tasks', () => {
  const rank = rankMap([{ id: 'high' }, { id: 'low' }])

  it('sorts by the chain, highest priority first', () => {
    const tasks = [
      { id: 1, title: 'b', priorityId: 'low', dueDate: '2026-03-01' },
      { id: 2, title: 'a', priorityId: 'high', dueDate: '2026-03-05' },
    ]
    const sorted = [...tasks].sort(buildTaskComparator([{ field: 'priority', direction: 'asc' }], rank))
    expect(sorted.map((t) => t.id)).toEqual([2, 1])
  })

  it('puts tasks without a due date last', () => {
    const tasks = [{ id: 1, title: 'x', dueDate: null }, { id: 2, title: 'y', dueDate: '2026-03-01' }]
    const sorted = [...tasks].sort(buildTaskComparator([{ field: 'dueDate', direction: 'asc' }], rank))
    expect(sorted.map((t) => t.id)).toEqual([2, 1])
  })

  it('drops retired sort fields from a stored chain', () => {
    expect(sanitizeTaskChain([{ field: 'status', direction: 'asc' }])).toEqual([{ field: 'dueDate', direction: 'asc' }])
  })

  it('groups by due date, overdue first', () => {
    const now = new Date(2026, 2, 10)
    const groups = groupTasksByDueDate(
      [
        { id: 'late', dueDate: '2026-03-01' },
        { id: 'today', dueDate: '2026-03-10' },
        { id: 'tomorrow', dueDate: '2026-03-11' },
        { id: 'week', dueDate: '2026-03-15' },
        { id: 'later', dueDate: '2026-04-01' },
        { id: 'none', dueDate: null },
      ],
      now
    )
    expect(groups.map((g) => g.key)).toEqual(['atrasadas', 'hoje', 'amanha', 'semana', 'depois', 'semPrazo'])
  })
})

describe('compras', () => {
  it('sorts uncategorized items last and groups by category label', () => {
    const items = [
      { id: 1, title: 'leite', categoryId: null },
      { id: 2, title: 'pão', categoryId: 'pad' },
      { id: 3, title: 'arroz', categoryId: 'mer' },
    ]
    const labels = { pad: 'Padaria', mer: 'Mercado' }
    const sorted = [...items].sort(buildShoppingComparator([{ field: 'category', direction: 'asc' }], {}, labels))
    expect(sorted.map((i) => i.id)).toEqual([3, 2, 1])
    const groups = groupItemsByCategory(sorted, [{ id: 'pad', label: 'Padaria' }, { id: 'mer', label: 'Mercado' }])
    expect(groups.map((g) => g.label)).toEqual(['Mercado', 'Padaria', 'Sem classificação'])
  })
})

describe('vencimentos', () => {
  it('sorts by amount and groups by due date', () => {
    const bills = [
      { id: 1, title: 'a', amount: 50, dueDate: '2026-03-09' },
      { id: 2, title: 'b', amount: 10, dueDate: '2026-03-12' },
    ]
    const sorted = [...bills].sort(buildBillComparator([{ field: 'amount', direction: 'asc' }]))
    expect(sorted.map((b) => b.id)).toEqual([2, 1])
    const groups = groupBillsByDueDate(bills, new Date(2026, 2, 10))
    expect(groups.map((g) => g.key)).toEqual(['atrasadas', 'semana'])
  })
})

describe('shared helpers', () => {
  it('moves a dragged id in front of the drop target', () => {
    expect(reorderIds(['a', 'b', 'c'], 'c', 'a')).toEqual(['c', 'a', 'b'])
  })

  it('addresses planning windows and totals painted hours', () => {
    expect(parseCellKey(cellKey(2, 9, 30))).toEqual({ day: 2, hour: 9, half: 30 })
    const grid = { [cellKey(0, 8)]: { categoryId: 'w' }, [cellKey(0, 9, 0)]: { categoryId: 'w' } }
    expect(categoryHours(grid)).toEqual({ w: 1.5 })
    expect(formatHours(1.5)).toBe('1h30')
  })
})
