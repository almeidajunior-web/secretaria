import { format, addDays, subMonths } from 'date-fns'

const todayStr = (offset = 0) => format(addDays(new Date(), offset), 'yyyy-MM-dd')

// Default categories (Classificação). Colors drawn from EVENT_COLORS for
// palette consistency with every other editable list in the app.
export const DUES_SEED_CATEGORIES = [
  { id: 'moradia', label: 'Moradia', color: '#7C3AED' },
  { id: 'consumo', label: 'Consumo', color: '#D97706' },
  { id: 'assinaturas', label: 'Assinaturas', color: '#2563EB' },
  { id: 'educacao', label: 'Educação', color: '#059669' },
]

// A handful of example bills covering the module's key states: overdue,
// due today, a recurring monthly bill, and a paid one from last month to
// show off the permanent payment history.
export function buildSeedBills() {
  return [
    {
      id: 'bill_seed_1',
      title: 'Conta de luz',
      description: '',
      categoryId: 'consumo',
      amount: 145.9,
      dueDate: todayStr(-3),
      paid: false,
      paidDate: null,
      recurrence: 'monthly',
      seriesId: 'series_seed_luz',
    },
    {
      id: 'bill_seed_2',
      title: 'Netflix',
      description: '',
      categoryId: 'assinaturas',
      amount: 44.9,
      dueDate: todayStr(0),
      paid: false,
      paidDate: null,
      recurrence: 'monthly',
      seriesId: 'series_seed_netflix',
    },
    {
      id: 'bill_seed_3',
      title: 'Aluguel',
      description: '',
      categoryId: 'moradia',
      amount: 1500,
      dueDate: todayStr(6),
      paid: false,
      paidDate: null,
      recurrence: 'monthly',
      seriesId: 'series_seed_aluguel',
    },
    {
      id: 'bill_seed_4',
      title: 'Mensalidade da faculdade',
      description: '',
      categoryId: 'educacao',
      amount: 890,
      dueDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
      paid: true,
      paidDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
      recurrence: 'monthly',
      seriesId: 'series_seed_faculdade',
    },
  ]
}
