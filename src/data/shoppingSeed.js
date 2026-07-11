import { format } from 'date-fns'

const todayStr = () => format(new Date(), 'yyyy-MM-dd')

// Default categories (Classificação). Colors drawn from EVENT_COLORS for
// palette consistency with every other editable list in the app. Fully
// user-editable (rename/recolor/reorder/add/remove) via ShoppingSettingsModal.
export const SHOPPING_SEED_CATEGORIES = [
  { id: 'mercado', label: 'Mercado', color: '#2563EB' },
  { id: 'educacao', label: 'Educação', color: '#7C3AED' },
  { id: 'lazer', label: 'Lazer', color: '#059669' },
]

// Priority tiers — independent from Tarefas' own priority list (each module
// owns its domain, same as Agenda's tags vs. Tarefas' tags).
export const SHOPPING_SEED_PRIORITIES = [
  { id: 'urgente', label: 'Urgente', color: '#DC2626' },
  { id: 'alta', label: 'Alta', color: '#D97706' },
  { id: 'media', label: 'Média', color: '#2563EB' },
  { id: 'baixa', label: 'Baixa', color: '#6B7280' },
]

// A handful of example items so the module isn't empty on first use — one
// already purchased, to show off the checked/strikethrough state.
export function buildSeedShoppingItems() {
  return [
    {
      id: 'shop_seed_1',
      title: 'Leite',
      description: '',
      categoryId: 'mercado',
      priorityId: 'media',
      purchased: false,
      purchasedDate: null,
    },
    {
      id: 'shop_seed_2',
      title: 'Detergente',
      description: '',
      categoryId: 'mercado',
      priorityId: 'baixa',
      purchased: false,
      purchasedDate: null,
    },
    {
      id: 'shop_seed_3',
      title: 'Caderno universitário',
      description: '10 matérias',
      categoryId: 'educacao',
      priorityId: 'alta',
      purchased: false,
      purchasedDate: null,
    },
    {
      id: 'shop_seed_4',
      title: 'Ingresso do cinema',
      description: '',
      categoryId: 'lazer',
      priorityId: 'baixa',
      purchased: true,
      purchasedDate: todayStr(),
    },
  ]
}
