// Example events, loaded only when storage is empty. Times are relative to
// "today" so the agenda always looks populated on first run.
import { addDays, startOfDay } from 'date-fns'

function at(dayOffset, hour, minute) {
  const d = startOfDay(addDays(new Date(), dayOffset))
  d.setHours(hour, minute, 0, 0)
  return d
}

let seq = 0
function id() {
  return `seed_${seq++}`
}

export function buildSeedEvents() {
  return [
    {
      id: id(),
      title: 'Reunião de alinhamento',
      start: at(0, 9, 0),
      end: at(0, 10, 0),
      local: 'Google Meet',
      color: '#2563EB',
      tags: ['Trabalho'],
      status: 'confirmed',
      recurrence: 'none',
      isAula: false,
      faltasMax: null,
      faltasAtual: 0,
      presenca: {},
    },
    {
      id: id(),
      title: 'EM504B — Mecânica',
      start: at(0, 10, 0),
      end: at(0, 12, 0),
      local: '',
      color: '#7C3AED',
      tags: ['Faculdade'],
      status: 'confirmed',
      recurrence: 'weekly',
      isAula: true,
      faltasMax: 15,
      faltasAtual: 3,
      presenca: {},
    },
    {
      id: id(),
      title: 'Almoço',
      start: at(0, 12, 0),
      end: at(0, 13, 0),
      local: '',
      color: '#D97706',
      tags: ['Pessoal'],
      status: 'provisional',
      recurrence: 'none',
      isAula: false,
      faltasMax: null,
      faltasAtual: 0,
      presenca: {},
    },
    {
      id: id(),
      title: 'Review CNH Industrial',
      start: at(1, 14, 0),
      end: at(1, 15, 30),
      local: 'Teams',
      color: '#2563EB',
      tags: ['Trabalho'],
      status: 'unconfirmed',
      recurrence: 'none',
      isAula: false,
      faltasMax: null,
      faltasAtual: 0,
      presenca: {},
    },
    {
      id: id(),
      title: 'EM504B — Lab',
      start: at(2, 8, 0),
      end: at(2, 10, 0),
      local: '',
      color: '#7C3AED',
      tags: ['Faculdade'],
      status: 'confirmed',
      recurrence: 'weekly',
      isAula: true,
      faltasMax: 15,
      faltasAtual: 3,
      presenca: {},
    },
    {
      id: id(),
      title: 'Consulta médica',
      start: at(3, 15, 0),
      end: at(3, 16, 0),
      local: 'UBS Central',
      color: '#DC2626',
      tags: ['Saúde'],
      status: 'confirmed',
      recurrence: 'none',
      isAula: false,
      faltasMax: null,
      faltasAtual: 0,
      presenca: {},
    },
    {
      id: id(),
      title: 'Evento recusado',
      start: at(-1, 11, 0),
      end: at(-1, 12, 0),
      local: '',
      color: '#DB2777',
      tags: ['Pessoal'],
      status: 'refused',
      recurrence: 'none',
      isAula: false,
      faltasMax: null,
      faltasAtual: 0,
      presenca: {},
    },
  ]
}
