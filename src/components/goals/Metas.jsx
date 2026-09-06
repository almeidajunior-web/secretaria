import { useMemo, useState } from 'react'
import { addMonths, addWeeks, endOfMonth, startOfMonth } from 'date-fns'
import { usePersistentState } from '../../hooks/usePersistentState'
import { capitalize, fmt, getWeekDays, weekStart } from '../../lib/date'
import { dayCompletion, toKey } from '../../lib/habitStats'
import MetasToolbar from './MetasToolbar'
import HabitChart from './HabitChart'
import HabitGrid from './HabitGrid'
import HabitModal from './HabitModal'
import ObjetivosSection from './ObjetivosSection'
import GoalModal from './GoalModal'

// Metas module: two stacked sections on one scrolling page.
//
// "Rotina" is the day-by-day half — a chart of how much of the routine was
// kept, over a grid where each cell is one habit on one day. "Objetivos" is
// the long-horizon half. They share a page rather than tabs because the point
// is seeing both at once: the habits are what actually move the goals.
export default function Metas({
  habits,
  habitLog,
  addHabit,
  updateHabit,
  deleteHabit,
  cycleCell,
  goals,
  addGoal,
  updateGoal,
  deleteGoal,
  setGoalStatus,
}) {
  const [period, setPeriod] = usePersistentState('secretaria:metasPeriod', 'month')
  // Anchor date for the visible window; the period toggle reinterprets it
  // rather than resetting it, so switching week↔month keeps you where you were.
  const [anchor, setAnchor] = useState(() => new Date())
  const [habitModal, setHabitModal] = useState(null) // null | { habit? }
  const [goalModal, setGoalModal] = useState(null)

  const today = useMemo(() => new Date(), [])
  const todayStr = toKey(today)

  const days = useMemo(() => {
    if (period === 'week') return getWeekDays(anchor)
    const first = startOfMonth(anchor)
    const last = endOfMonth(anchor)
    const out = []
    for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) out.push(new Date(d))
    return out
  }, [period, anchor])

  const title = useMemo(() => {
    if (period === 'month') return capitalize(fmt(anchor, "MMMM 'de' yyyy"))
    const start = weekStart(anchor)
    const end = days[days.length - 1]
    return `${fmt(start, 'd MMM')} – ${fmt(end, "d MMM 'de' yyyy")}`
  }, [period, anchor, days])

  // One pass over the period, scoring every day once.
  const dayStats = useMemo(() => {
    const out = {}
    for (const date of days) {
      const dateStr = toKey(date)
      out[dateStr] = dayCompletion(habits, habitLog, dateStr, date)
    }
    return out
  }, [days, habits, habitLog])

  // The chart spans exactly the days the grid below it shows, so the two read
  // as one picture of the same window. Days that haven't happened yet carry a
  // null rate rather than being dropped: that keeps the axis at full width —
  // columns still line up with the grid — while the line itself simply stops
  // at today instead of diving to zero for the rest of the period.
  const chartPoints = useMemo(
    () =>
      days.map((date) => {
        const dateStr = toKey(date)
        const stats = dayStats[dateStr]
        const future = dateStr > todayStr
        return {
          dateStr,
          date,
          rate: future || !stats ? null : stats.rate,
          done: stats ? stats.done : 0,
          counted: stats ? stats.counted : 0,
        }
      }),
    [days, dayStats, todayStr]
  )

  const step = (dir) =>
    setAnchor((prev) => (period === 'week' ? addWeeks(prev, dir) : addMonths(prev, dir)))

  return (
    <div className="flex h-full flex-col">
      <MetasToolbar
        period={period}
        onChangePeriod={setPeriod}
        title={title}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
        onToday={() => setAnchor(new Date())}
        onNewHabit={() => setHabitModal({})}
      />

      <div className="thin-scroll flex-1 overflow-auto">
        <div className="mx-auto max-w-[96%]">
          <section className="px-4 py-4">
            <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              Rotina
            </h2>
            <div className="mb-3 glass-strong rounded-xl border p-4">
              <HabitChart points={chartPoints} />
            </div>
            <HabitGrid
              habits={habits}
              habitLog={habitLog}
              days={days}
              todayStr={todayStr}
              today={today}
              onCycleCell={cycleCell}
              onEditHabit={(habit) => setHabitModal({ habit })}
            />
          </section>

          <ObjetivosSection
            goals={goals}
            onUpdateGoal={updateGoal}
            onSetStatus={setGoalStatus}
            onNew={() => setGoalModal({})}
            onEdit={(goal) => setGoalModal({ goal })}
          />
        </div>
      </div>

      {habitModal && (
        <HabitModal
          habit={habitModal.habit}
          colorSeed={habits.length}
          onSave={(habit) => {
            if (habit.id) updateHabit(habit)
            else addHabit(habit)
            setHabitModal(null)
          }}
          onDelete={deleteHabit}
          onClose={() => setHabitModal(null)}
        />
      )}

      {goalModal && (
        <GoalModal
          goal={goalModal.goal}
          onSave={(goal) => {
            if (goal.id) updateGoal(goal)
            else addGoal(goal)
            setGoalModal(null)
          }}
          onDelete={deleteGoal}
          onClose={() => setGoalModal(null)}
        />
      )}
    </div>
  )
}
