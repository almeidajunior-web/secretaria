import { describe, expect, it } from 'vitest'
import {
  monthTotals,
  percentChange,
  essentialTotals,
  categoryBreakdown,
  monthlyTrend,
  accountBalance,
  consolidatedBalance,
  categoryComparison,
  monthAnchor,
} from './financeMetrics'
import { buildFinanceComparator, compareByRecordOrder } from './financeSort'
import { buildFinanceSheets } from './financeExport'

const E = (id, date, type, amount, extra = {}) => ({ id, date, type, amount, title: id, ...extra })
const entries = [
  E('s1', '2026-02-05', 'income', 5000, { categoryId: 'sal', accountId: 'nu' }),
  E('a1', '2026-02-10', 'expense', 1500, { categoryId: 'mor', accountId: 'nu', essential: true }),
  E('s2', '2026-03-05', 'income', 5000, { categoryId: 'sal', accountId: 'nu' }),
  E('a2', '2026-03-10', 'expense', 1500, { categoryId: 'mor', accountId: 'nu', essential: true }),
  E('m2', '2026-03-12', 'expense', 300, { categoryId: 'ali', accountId: 'nu' }),
  E('c2', '2026-03-20', 'expense', 200, { categoryId: 'ali', paymentMethodId: 'credito', accountId: 'nu' }),
]

describe('month figures', () => {
  it('totals a month by competência', () => {
    expect(monthTotals(entries, '2026-03')).toEqual({ income: 5000, expense: 2000, balance: 3000 })
  })

  it('splits essential spending', () => {
    expect(essentialTotals(entries, '2026-03')).toEqual({ essential: 1500, total: 2000, ratio: 0.75 })
  })

  it('reports no change against an empty month', () => {
    expect(percentChange(100, 0)).toBeNull()
    expect(percentChange(150, 100)).toBe(50)
  })

  it('breaks spending down by category, largest first', () => {
    const rows = categoryBreakdown(entries.filter((e) => e.date.startsWith('2026-03')), 'expense', { mor: 'Moradia', ali: 'Alimentação' }, {})
    expect(rows.map((r) => [r.label, r.total])).toEqual([
      ['Moradia', 1500],
      ['Alimentação', 500],
    ])
  })

  it('builds the trailing trend ending on the anchor month', () => {
    const trend = monthlyTrend(entries, 2, monthAnchor('2026-03'))
    expect(trend.map((m) => [m.month, m.income, m.expense])).toEqual([
      ['2026-02', 5000, 1500],
      ['2026-03', 5000, 2000],
    ])
  })

  it('compares each category with its trailing average', () => {
    const rows = categoryComparison(entries, '2026-03', 1, { mor: 'Moradia', ali: 'Alimentação' }, {})
    const mor = rows.find((r) => r.categoryId === 'mor')
    expect(mor.average).toBe(1500)
    expect(mor.variance).toBe(0)
    expect(rows.find((r) => r.categoryId === 'ali').variance).toBeNull()
  })
})

describe('balances (caixa)', () => {
  const account = { id: 'nu', initialBalance: 1000 }
  const cfg = { closingDay: 25, dueDay: 5 }

  it('counts only entries whose cash date has arrived', () => {
    // card purchase on 03-20 only leaves the account on 04-05
    expect(accountBalance(entries, account, '2026-03-31', cfg)).toBe(1000 + 5000 - 1500 + 5000 - 1500 - 300)
    expect(accountBalance(entries, account, '2026-04-05', cfg)).toBe(1000 + 5000 - 1500 + 5000 - 1500 - 300 - 200)
  })

  it('consolidates accounts plus money with no account', () => {
    const extra = [...entries, E('x', '2026-03-01', 'income', 50)]
    expect(consolidatedBalance(extra, [account], '2026-03-31', cfg)).toBe(7700 + 50)
  })
})

describe('sorting lançamentos', () => {
  const order = new Map(entries.map((e, i) => [e.id, i]))

  it('keeps same-day entries in the order they were typed', () => {
    const sameDay = [E('b', '2026-03-10', 'expense', 1), E('a', '2026-03-10', 'expense', 2)]
    const seq = new Map([['b', 0], ['a', 1]])
    const sorted = [...sameDay].sort(buildFinanceComparator([{ field: 'date', direction: 'desc' }], {}, seq))
    expect(sorted.map((e) => e.id)).toEqual(['b', 'a'])
  })

  it('record order is date, then entry sequence', () => {
    const sorted = [...entries].reverse().sort(compareByRecordOrder(order))
    expect(sorted.map((e) => e.id)).toEqual(entries.map((e) => e.id))
  })
})

describe('xlsx export', () => {
  it('writes signed values whose sum is the saldo, with a reconciling summary', () => {
    const march = entries.filter((e) => e.date.startsWith('2026-03'))
    const [lanc, resumo] = buildFinanceSheets({
      entries: march,
      periodLabel: 'Março de 2026',
      filtersLabel: '',
      categoryLabelById: { sal: 'Salário', mor: 'Moradia', ali: 'Alimentação' },
      paymentMethodLabelById: { credito: 'Crédito' },
      accountLabelById: { nu: 'Nubank' },
      showAccounts: true,
      creditCardConfig: { closingDay: 25, dueDay: 5 },
    })
    const values = lanc.data.slice(1).map((row) => row[row.length - 1].value)
    expect(values.reduce((a, b) => a + b, 0)).toBe(3000)
    const saldoRow = resumo.data.find((row) => row[0]?.value === 'Saldo')
    expect(saldoRow[1].value).toBe(3000)
    // dates are built in UTC so the serial never shifts a day
    expect(lanc.data[1][0].value.toISOString().slice(0, 10)).toBe('2026-03-05')
  })
})
