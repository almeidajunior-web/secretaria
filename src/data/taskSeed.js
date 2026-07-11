import { format, addDays } from 'date-fns'

// Default priority levels (rank = array order, first is highest). Colors are
// drawn from EVENT_COLORS (src/constants.js) for palette consistency.
export const TASK_SEED_PRIORITIES = [
  { id: 'urgente', label: 'Urgente', color: '#DC2626' },
  { id: 'alta', label: 'Alta', color: '#D97706' },
  { id: 'media', label: 'Média', color: '#2563EB' },
  { id: 'baixa', label: 'Baixa', color: '#6B7280' },
]

// Default status list (rank = array order, also the Kanban column order).
// `isDone` marks which status(es) count as "completed" — drives the
// recurrence rollover and the hide-finished filter. Fully user-editable
// (rename/recolor/reorder/add/remove) via TaskSettingsModal.
export const TASK_STATUS_SEED = [
  { id: 'pendente', label: 'Pendente', color: '#6B7280', isDone: false },
  { id: 'em_progresso', label: 'Em Progresso', color: '#2563EB', isDone: false },
  { id: 'finalizada', label: 'Finalizada', color: '#16A34A', isDone: true },
  { id: 'congelada', label: 'Congelada', color: '#7C3AED', isDone: false },
]

export const TASK_SEED_TAGS = [
  { id: 'faculdade', label: 'Faculdade', color: '#2563EB' },
  { id: 'estudo', label: 'Estudo', color: '#7C3AED' },
  { id: 'financeiro', label: 'Financeiro', color: '#059669' },
]

const todayStr = (offset = 0) => format(addDays(new Date(), offset), 'yyyy-MM-dd')

// A handful of example tasks so the module isn't empty on first use.
export function buildSeedTasks() {
  return [
    {
      id: 'task_seed_0',
      title: 'Devolver livro da biblioteca',
      status: 'pendente',
      priorityId: 'media',
      tagIds: ['faculdade'],
      dueDate: todayStr(-2),
      dueTime: null,
      recurrence: 'none',
      recurrenceDays: [],
      recurrenceUntil: null,
    },
    {
      id: 'task_seed_1',
      title: 'Entregar relatório do projeto',
      status: 'pendente',
      priorityId: 'urgente',
      tagIds: ['faculdade'],
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
      tagIds: ['faculdade', 'estudo'],
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
      tagIds: [],
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
      tagIds: ['financeiro'],
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
      tagIds: ['faculdade'],
      dueDate: todayStr(-2),
      dueTime: null,
      recurrence: 'none',
      recurrenceDays: [],
      recurrenceUntil: null,
    },
    {
      id: 'task_seed_6',
      title: 'Organizar anotações da disciplina',
      status: 'pendente',
      priorityId: null,
      tagIds: [],
      dueDate: null,
      dueTime: null,
      recurrence: 'none',
      recurrenceDays: [],
      recurrenceUntil: null,
    },
  ]
}
