import { describe, expect, it } from 'vitest'
import {
  occursOn,
  getOccurrence,
  computeFaltas,
  computeFaltasGroup,
  getLinkedGroup,
  occurrencesForDay,
  formatKey,
} from './recurrence'

const d = (y, m, day, h = 0, min = 0) => new Date(y, m - 1, day, h, min)
const event = (over = {}) => ({
  id: 'e1',
  title: 'Aula',
  start: d(2026, 3, 2, 10), // Monday 2 Mar 2026
  end: d(2026, 3, 2, 12),
  recurrence: 'none',
  recurrenceDays: [],
  recurrenceUntil: null,
  exdates: [],
  occStatus: {},
  status: 'unconfirmed',
  ...over,
})

describe('occursOn', () => {
  it('one-off events occur only on their own day', () => {
    expect(occursOn(event(), d(2026, 3, 2))).toBe(true)
    expect(occursOn(event(), d(2026, 3, 9))).toBe(false)
  })

  it('never occurs before the series start', () => {
    expect(occursOn(event({ recurrence: 'daily' }), d(2026, 3, 1))).toBe(false)
  })

  it.each([
    ['daily', d(2026, 3, 5), true],
    ['weekly', d(2026, 3, 9), true],
    ['weekly', d(2026, 3, 10), false],
    ['biweekly', d(2026, 3, 16), true],
    ['biweekly', d(2026, 3, 9), false],
    ['monthly', d(2026, 4, 2), true],
    ['monthly', d(2026, 4, 3), false],
    ['yearly', d(2027, 3, 2), true],
    ['weekdays', d(2026, 3, 6), true], // Friday
    ['weekdays', d(2026, 3, 7), false], // Saturday
  ])('%s on %s -> %s', (recurrence, day, expected) => {
    expect(occursOn(event({ recurrence }), day)).toBe(expected)
  })

  it('custom repeats on the chosen weekdays only', () => {
    const e = event({ recurrence: 'custom', recurrenceDays: [1, 3] }) // Mon, Wed
    expect(occursOn(e, d(2026, 3, 4))).toBe(true)
    expect(occursOn(e, d(2026, 3, 5))).toBe(false)
  })

  it('respects recurrenceUntil (inclusive) and exdates', () => {
    const e = event({ recurrence: 'daily', recurrenceUntil: d(2026, 3, 4), exdates: ['2026-03-03'] })
    expect(occursOn(e, d(2026, 3, 3))).toBe(false)
    expect(occursOn(e, d(2026, 3, 4))).toBe(true)
    expect(occursOn(e, d(2026, 3, 5))).toBe(false)
  })
})

describe('getOccurrence', () => {
  it('keeps the time of day and duration, and applies per-occurrence status', () => {
    const e = event({ recurrence: 'weekly', occStatus: { '2026-03-09': 'confirmed' } })
    const occ = getOccurrence(e, d(2026, 3, 9))
    expect(occ.start).toEqual(d(2026, 3, 9, 10))
    expect(occ.end).toEqual(d(2026, 3, 9, 12))
    expect(occ.status).toBe('confirmed')
    expect(occ.baseStatus).toBe('unconfirmed')
    expect(occ.occKey).toBe('2026-03-09')
  })

  it('returns null on a day without occurrence', () => {
    expect(getOccurrence(event(), d(2026, 3, 3))).toBeNull()
  })
})

describe('faltas', () => {
  const now = d(2026, 3, 20, 23)

  it('counts past class occurrences that are not confirmed', () => {
    const aula = event({
      isAula: true,
      recurrence: 'weekly',
      occStatus: { '2026-03-02': 'confirmed' },
    })
    // Mar 2 (confirmed), 9, 16 -> 2 absences
    expect(computeFaltas(aula, now)).toBe(2)
  })

  it('is zero for anything that is not a class', () => {
    expect(computeFaltas(event({ recurrence: 'weekly' }), now)).toBe(0)
  })

  it('pools absences across linked classes', () => {
    const a = event({ id: 'a', isAula: true, recurrence: 'weekly', linkedIds: ['b'] })
    const b = event({ id: 'b', isAula: true, start: d(2026, 3, 4, 10), end: d(2026, 3, 4, 12), recurrence: 'weekly', linkedIds: ['a'] })
    expect(getLinkedGroup([a, b], 'a').map((e) => e.id).sort()).toEqual(['a', 'b'])
    // a: Mar 2, 9, 16 (3); b: Mar 4, 11, 18 (3)
    expect(computeFaltasGroup([a, b], a, now)).toBe(6)
  })
})

describe('occurrencesForDay', () => {
  it('returns occurrences sorted by start time', () => {
    const late = event({ id: 'late', start: d(2026, 3, 2, 15), end: d(2026, 3, 2, 16) })
    const early = event({ id: 'early', start: d(2026, 3, 2, 8), end: d(2026, 3, 2, 9) })
    expect(occurrencesForDay([late, early], d(2026, 3, 2)).map((o) => o.id)).toEqual(['early', 'late'])
  })
})

it('formatKey is a zero-padded local date', () => {
  expect(formatKey(d(2026, 1, 5))).toBe('2026-01-05')
})
