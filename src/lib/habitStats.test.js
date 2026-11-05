import { describe, expect, it } from 'vitest'
import { cellKey, nextCellState, isHabitActiveOn, dayCompletion, habitStreak, habitPeriodRate } from './habitStats'

const d = (s) => {
  const [y, m, day] = s.split('-').map(Number)
  return new Date(y, m - 1, day)
}
const everyDay = { id: 'h', weekdays: [0, 1, 2, 3, 4, 5, 6], startDate: '2026-03-01', endDate: null }

describe('habits', () => {
  it('cycles a cell through untouched -> done -> miss -> n/a -> untouched', () => {
    expect([undefined, 'done', 'miss', 'na'].map(nextCellState)).toEqual(['done', 'miss', 'na', undefined])
  })

  it('is only active inside its run and on its weekdays', () => {
    const weekdaysOnly = { ...everyDay, weekdays: [0, 1, 2, 3, 4] } // Mon-Fri (Monday-first)
    expect(isHabitActiveOn(weekdaysOnly, '2026-03-02', d('2026-03-02'))).toBe(true) // Monday
    expect(isHabitActiveOn(weekdaysOnly, '2026-03-07', d('2026-03-07'))).toBe(false) // Saturday
    expect(isHabitActiveOn(everyDay, '2026-02-28', d('2026-02-28'))).toBe(false) // before start
  })

  it('leaves n/a out of the day denominator', () => {
    const habits = [everyDay, { ...everyDay, id: 'h2' }]
    const log = { [cellKey('h', '2026-03-02')]: 'done', [cellKey('h2', '2026-03-02')]: 'na' }
    expect(dayCompletion(habits, log, '2026-03-02', d('2026-03-02'))).toEqual({ done: 1, counted: 1, rate: 1 })
    expect(dayCompletion(habits, {}, '2026-02-01', d('2026-02-01'))).toBeNull()
  })

  it('counts a streak without breaking on an unanswered today', () => {
    const log = {
      [cellKey('h', '2026-03-02')]: 'done',
      [cellKey('h', '2026-03-03')]: 'na',
      [cellKey('h', '2026-03-04')]: 'done',
    }
    expect(habitStreak(everyDay, log, '2026-03-05', d('2026-03-05'))).toBe(2)
  })

  it('rates the visible period up to today only', () => {
    const days = ['2026-03-02', '2026-03-03', '2026-03-04'].map(d)
    const log = { [cellKey('h', '2026-03-02')]: 'done', [cellKey('h', '2026-03-03')]: 'miss' }
    expect(habitPeriodRate(everyDay, log, days, '2026-03-03')).toEqual({ done: 1, counted: 2, rate: 0.5 })
  })
})
