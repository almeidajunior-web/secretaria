import { describe, expect, it } from 'vitest'
import { nextDueDate } from './billRecurrence'
import { nextOccurrenceAfter, nextOccurrenceOnOrAfter, rollForwardIfOverdue } from './taskRecurrence'
import { vencimentoDaCompra, dataCaixa, splitIntoInstallments, creditCardInvoices } from './creditCard'

describe('nextDueDate (bills and recurring lançamentos)', () => {
  it('steps by the recurrence interval', () => {
    expect(nextDueDate('2026-01-10', 'monthly')).toBe('2026-02-10')
    expect(nextDueDate('2026-01-10', 'quarterly')).toBe('2026-04-10')
    expect(nextDueDate('2026-01-10', 'annual')).toBe('2027-01-10')
  })

  it('clamps day 31 to the end of a shorter month', () => {
    expect(nextDueDate('2026-01-31', 'monthly')).toBe('2026-02-28')
  })

  it('is null for one-offs and once the optional end date is passed', () => {
    expect(nextDueDate('2026-01-10', 'none')).toBeNull()
    expect(nextDueDate('2026-01-10', 'monthly', '2026-02-09')).toBeNull()
    expect(nextDueDate('2026-01-10', 'monthly', '2026-02-10')).toBe('2026-02-10') // inclusive
  })
})

describe('task recurrence', () => {
  const task = (over = {}) => ({ id: 't', status: 'todo', recurrence: 'weekly', dueDate: '2026-03-02', ...over })
  const done = new Set(['done'])

  it('finds the next occurrence strictly after a date', () => {
    expect(nextOccurrenceAfter(task(), '2026-03-02')).toBe('2026-03-09')
    expect(nextOccurrenceOnOrAfter(task(), '2026-03-02')).toBe('2026-03-02')
  })

  it('stops at recurrenceUntil', () => {
    expect(nextOccurrenceAfter(task({ recurrenceUntil: '2026-03-05' }), '2026-03-02')).toBeNull()
  })

  it('rolls an overdue unfinished task forward to today or later', () => {
    expect(rollForwardIfOverdue(task(), '2026-03-20', done).dueDate).toBe('2026-03-23')
  })

  it('leaves finished, non-recurring or not-yet-due tasks alone', () => {
    const finished = task({ status: 'done' })
    expect(rollForwardIfOverdue(finished, '2026-03-20', done)).toBe(finished)
    const oneOff = task({ recurrence: 'none' })
    expect(rollForwardIfOverdue(oneOff, '2026-03-20', done)).toBe(oneOff)
    const future = task({ dueDate: '2026-04-01' })
    expect(rollForwardIfOverdue(future, '2026-03-20', done)).toBe(future)
  })
})

describe('credit card', () => {
  // closes on the 25th, due on the 5th of the following month
  it('bills a purchase before the closing day on this month’s invoice', () => {
    expect(vencimentoDaCompra('2026-03-10', 25, 5)).toBe('2026-04-05')
  })

  it('rolls a purchase on/after the closing day to the next invoice', () => {
    expect(vencimentoDaCompra('2026-03-25', 25, 5)).toBe('2026-05-05')
  })

  it('keeps the due date in the closing month when the due day is later', () => {
    expect(vencimentoDaCompra('2026-03-01', 3, 10)).toBe('2026-03-10')
  })

  it('uses the invoice due date as the cash date only for card entries', () => {
    const cfg = { closingDay: 25, dueDay: 5 }
    expect(dataCaixa({ date: '2026-03-10', paymentMethodId: 'credito' }, cfg)).toBe('2026-04-05')
    expect(dataCaixa({ date: '2026-03-10', paymentMethodId: 'pix' }, cfg)).toBe('2026-03-10')
  })

  it('splits installments that always add back up to the total', () => {
    const parts = splitIntoInstallments({ title: 'TV', amount: 100, date: '2026-01-31' }, 3)
    expect(parts.map((p) => p.amount)).toEqual([33.34, 33.33, 33.33])
    expect(parts.map((p) => p.date)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31'])
    expect(parts.map((p) => p.title)).toEqual(['TV (1/3)', 'TV (2/3)', 'TV (3/3)'])
    expect(new Set(parts.map((p) => p.installmentGroupId)).size).toBe(1)
  })

  it('derives invoices with their status', () => {
    const cfg = { closingDay: 25, dueDay: 5 }
    const entries = [
      { type: 'expense', amount: 100, date: '2026-02-10', paymentMethodId: 'credito' }, // due 03-05
      { type: 'expense', amount: 50, date: '2026-03-10', paymentMethodId: 'credito' }, // due 04-05
      { type: 'income', amount: 20, date: '2026-03-11', paymentMethodId: 'credito' }, // refund
    ]
    const invoices = creditCardInvoices(entries, cfg, '2026-03-20', new Set())
    const byDue = Object.fromEntries(invoices.map((i) => [i.dueDate, i]))
    expect(byDue['2026-03-05'].status).toBe('vencida')
    expect(byDue['2026-04-05'].status).toBe('aberta')
    expect(byDue['2026-04-05'].total).toBe(30)
    expect(creditCardInvoices(entries, cfg, '2026-03-20', new Set(['2026-03-05']))[0].status).toBe('paga')
  })
})
