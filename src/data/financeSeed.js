import { format, setDate, subMonths } from 'date-fns'
import { creditCardEffectiveDate } from '../lib/creditCard'

const dateInMonth = (monthsAgo, day) => format(setDate(subMonths(new Date(), monthsAgo), day), 'yyyy-MM-dd')

// Mirrors useFinanceCreditCard's DEFAULT_CREDIT_CARD — keeps the seeded
// card entries' effectiveDate consistent with the config a fresh install
// starts with.
const SEED_CLOSING_DAY = 25
const SEED_DUE_DAY = 5

// Expense and income categories are deliberately separate lists — mixing
// "Salário" with "Moradia" in one list makes no sense. Colors drawn from
// EVENT_COLORS for palette consistency with every other editable list in
// the app (this is a swatch-picker palette, not the dedicated validated
// palette the charts use).
export const FINANCE_SEED_EXPENSE_CATEGORIES = [
  { id: 'moradia', label: 'Moradia', color: '#7C3AED' },
  { id: 'alimentacao', label: 'Alimentação', color: '#D97706' },
  { id: 'transporte', label: 'Transporte', color: '#0891B2' },
  { id: 'saude', label: 'Saúde', color: '#DC2626' },
  { id: 'educacao', label: 'Educação', color: '#059669' },
  { id: 'lazer', label: 'Lazer', color: '#DB2777' },
  { id: 'assinaturas', label: 'Assinaturas', color: '#2563EB' },
  { id: 'compras', label: 'Compras', color: '#65A30D' },
  { id: 'outros-despesa', label: 'Outros', color: '#6B7280' },
]

export const FINANCE_SEED_INCOME_CATEGORIES = [
  { id: 'salario', label: 'Salário', color: '#059669' },
  { id: 'freelance', label: 'Freelance', color: '#2563EB' },
  { id: 'investimentos', label: 'Investimentos', color: '#7C3AED' },
  { id: 'reembolso', label: 'Reembolso', color: '#0891B2' },
  { id: 'outros-receita', label: 'Outros', color: '#6B7280' },
]

export const FINANCE_SEED_PAYMENT_METHODS = [
  { id: 'dinheiro', label: 'Dinheiro', color: '#65A30D' },
  { id: 'debito', label: 'Débito', color: '#0891B2' },
  { id: 'credito', label: 'Crédito', color: '#DC2626' },
  { id: 'pix', label: 'Pix', color: '#2563EB' },
  { id: 'transferencia', label: 'Transferência', color: '#7C3AED' },
  { id: 'boleto', label: 'Boleto', color: '#D97706' },
]

// A handful of example entries spanning the current and previous month, so
// the Overview's month-over-month comparison and the trend chart both have
// something real to show on first run — mirrors duesSeed.js#buildSeedBills.
export function buildSeedEntries() {
  return [
    {
      id: 'fin_seed_1',
      type: 'income',
      title: 'Salário',
      description: '',
      amount: 5000,
      date: dateInMonth(0, 5),
      categoryId: 'salario',
      paymentMethodId: 'transferencia',
      accountId: null,
    },
    {
      id: 'fin_seed_2',
      type: 'income',
      title: 'Projeto freelance',
      description: '',
      amount: 800,
      date: dateInMonth(0, 15),
      categoryId: 'freelance',
      paymentMethodId: 'pix',
      accountId: null,
    },
    {
      id: 'fin_seed_3',
      type: 'expense',
      title: 'Aluguel',
      description: '',
      amount: 1500,
      date: dateInMonth(0, 5),
      categoryId: 'moradia',
      paymentMethodId: 'transferencia',
      accountId: null,
      essential: true,
    },
    {
      id: 'fin_seed_4',
      type: 'expense',
      title: 'Supermercado',
      description: '',
      amount: 450,
      date: dateInMonth(0, 10),
      effectiveDate: creditCardEffectiveDate(dateInMonth(0, 10), SEED_CLOSING_DAY, SEED_DUE_DAY),
      categoryId: 'alimentacao',
      paymentMethodId: 'credito',
      accountId: null,
      essential: true,
    },
    {
      id: 'fin_seed_5',
      type: 'expense',
      title: 'Uber',
      description: '',
      amount: 120,
      date: dateInMonth(0, 12),
      categoryId: 'transporte',
      paymentMethodId: 'pix',
      accountId: null,
    },
    {
      id: 'fin_seed_6',
      type: 'expense',
      title: 'Cinema',
      description: '',
      amount: 80,
      date: dateInMonth(0, 18),
      categoryId: 'lazer',
      paymentMethodId: 'debito',
      accountId: null,
    },
    {
      id: 'fin_seed_7',
      type: 'income',
      title: 'Salário',
      description: '',
      amount: 5000,
      date: dateInMonth(1, 5),
      categoryId: 'salario',
      paymentMethodId: 'transferencia',
      accountId: null,
    },
    {
      id: 'fin_seed_8',
      type: 'expense',
      title: 'Aluguel',
      description: '',
      amount: 1500,
      date: dateInMonth(1, 5),
      categoryId: 'moradia',
      paymentMethodId: 'transferencia',
      accountId: null,
    },
    {
      id: 'fin_seed_9',
      type: 'expense',
      title: 'Supermercado',
      description: '',
      amount: 500,
      date: dateInMonth(1, 8),
      effectiveDate: creditCardEffectiveDate(dateInMonth(1, 8), SEED_CLOSING_DAY, SEED_DUE_DAY),
      categoryId: 'alimentacao',
      paymentMethodId: 'credito',
      accountId: null,
    },
  ]
}
