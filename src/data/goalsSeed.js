import { format, subDays } from 'date-fns'

const dayStr = (offset = 0) => format(subDays(new Date(), -offset), 'yyyy-MM-dd')

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]
const WEEKDAYS = [0, 1, 2, 3, 4]

// A few habits so the grid and the chart have something to show on first run
// — including one that only runs on weekdays and one that started recently,
// so the "inactive cell" and "starts mid-period" cases are visible from the
// start instead of only appearing once the user builds them by hand.
export function buildSeedHabits() {
  return [
    {
      id: 'habit_agua',
      label: 'Beber 2 litros de água',
      description: 'Levar a garrafa de 500ml e enchê-la 4 vezes ao longo do dia.',
      weekdays: EVERY_DAY,
      startDate: dayStr(-30),
      endDate: null,
    },
    { id: 'habit_leitura', label: 'Ler 10 páginas', description: '', weekdays: EVERY_DAY, startDate: dayStr(-30), endDate: null },
    { id: 'habit_academia', label: 'Academia', description: '', weekdays: WEEKDAYS, startDate: dayStr(-30), endDate: null },
    { id: 'habit_ingles', label: 'Estudar inglês', description: '', weekdays: WEEKDAYS, startDate: dayStr(-6), endDate: null },
  ]
}

// Fills the last two weeks with a plausible pattern rather than a perfect
// one, so the chart has an actual shape to draw on a fresh install.
export function buildSeedHabitLog() {
  const log = {}
  const habits = buildSeedHabits()
  for (let back = 14; back >= 1; back -= 1) {
    const date = subDays(new Date(), back)
    const dateStr = format(date, 'yyyy-MM-dd')
    const weekday = (date.getDay() + 6) % 7
    for (const habit of habits) {
      if (!habit.weekdays.includes(weekday)) continue
      if (habit.startDate && dateStr < habit.startDate) continue
      const roll = (back * 7 + habit.label.length) % 10
      log[`${habit.id}:${dateStr}`] = roll < 6 ? 'done' : roll < 8 ? 'miss' : 'na'
    }
  }
  return log
}

export function buildSeedGoals() {
  return [
    {
      id: 'goal_seed_0',
      title: 'Terminar a especialização',
      description: 'Concluir os módulos restantes e entregar o trabalho final.',
      targetDate: dayStr(120),
      progress: 45,
      status: 'active',
    },
    {
      id: 'goal_seed_1',
      title: 'Juntar reserva de emergência',
      description: '',
      targetDate: dayStr(300),
      progress: 20,
      status: 'active',
    },
  ]
}
