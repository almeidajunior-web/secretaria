import { format, addDays } from 'date-fns'

// Default priority levels (rank = array order, first is highest). Colors are
// drawn from EVENT_COLORS (src/constants.js) for palette consistency.
export const TASK_SEED_PRIORITIES = [
  { id: 'urgente', label: 'Urgente', color: '#DC2626' },
  { id: 'alta', label: 'Alta', color: '#D97706' },
  { id: 'media', label: 'Média', color: '#2563EB' },
  { id: 'baixa', label: 'Baixa', color: '#6B7280' },
]

const todayStr = (offset = 0) => format(addDays(new Date(), offset), 'yyyy-MM-dd')

// A handful of example tasks so the module isn't empty on first use.
export function buildSeedTasks() {
  return [
    {
      id: 'task_seed_1',
      title: 'Entregar relatório do projeto',
      status: 'pendente',
      priorityId: 'urgente',
      tags: ['Faculdade'],
      dueDate: todayStr(1),
      dueTime: null,
      recurrence: 'none',
      recurrenceDays: [],
      recurrenceUntil: null,
    },
    {
      id: 'task_seed_2',
      title: 'Estudar para prova de estatística',
      status: 'em_progresso',
      priorityId: 'alta',
      tags: ['Faculdade', 'Estudo'],
      dueDate: todayStr(3),
      dueTime: null,
      recurrence: 'none',
      recurrenceDays: [],
      recurrenceUntil: null,
    },
    {
      id: 'task_seed_3',
      title: 'Tomar banho',
      status: 'pendente',
      priorityId: 'baixa',
      tags: [],
      dueDate: todayStr(0),
      dueTime: null,
      recurrence: 'daily',
      recurrenceDays: [],
      recurrenceUntil: null,
    },
    {
      id: 'task_seed_4',
      title: 'Pagar contas do mês',
      status: 'congelada',
      priorityId: 'media',
      tags: ['Financeiro'],
      dueDate: todayStr(10),
      dueTime: null,
      recurrence: 'monthly',
      recurrenceDays: [],
      recurrenceUntil: null,
    },
    {
      id: 'task_seed_5',
      title: 'Revisar apresentação de slides',
      status: 'finalizada',
      priorityId: 'media',
      tags: ['Faculdade'],
      dueDate: todayStr(-2),
      dueTime: null,
      recurrence: 'none',
      recurrenceDays: [],
      recurrenceUntil: null,
    },
  ]
}
