import { describe, expect, it } from 'vitest'
import { parseAmount, formatAmount } from './AmountInput'

describe('money field', () => {
  it.each([
    ['1500', 1500],
    ['1500,50', 1500.5],
    ['1.500,50', 1500.5],
    ['1500.50', 1500.5],
    ['12,5', 12.5],
    ['', null],
    ['abc', null],
  ])('reads %j as %j', (raw, value) => {
    expect(parseAmount(raw)).toBe(value)
  })

  it('displays two pt-BR decimals', () => {
    expect(formatAmount(1500.5)).toBe('1.500,50')
    expect(formatAmount(null)).toBe('')
  })
})
