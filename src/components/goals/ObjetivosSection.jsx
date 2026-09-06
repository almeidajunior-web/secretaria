import { CheckCircle2, CircleSlash, Pencil, Plus, RotateCcw } from 'lucide-react'
import { fmt, fromDateInput } from '../../lib/date'
import { toKey } from '../../lib/habitStats'

const STATUS_LABEL = { active: 'Em andamento', done: 'Concluída', dropped: 'Abandonada' }

// Objetivos: the longer-horizon half of the module. Progress is a number the
// user sets by hand rather than something derived — that's what lets a
// countable goal ("juntar a reserva") and a fuzzy one ("trocar de emprego")
// sit in the same list without forcing either into the other's shape.
export default function ObjetivosSection({ goals, onUpdateGoal, onSetStatus, onNew, onEdit }) {
  const todayStr = toKey(new Date())
  const active = goals.filter((g) => g.status === 'active')
  const closed = goals.filter((g) => g.status !== 'active')

  return (
    <section className="px-4 pb-6">
      <div className="mb-2.5 flex items-center gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          Objetivos
        </h2>
        <button
          type="button"
          onClick={onNew}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-text-secondary hover:border-primary hover:text-primary"
        >
          <Plus size={13} />
          Nova meta
        </button>
      </div>

      {goals.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-text-muted">
          Nenhuma meta ainda. Use "Nova meta" para criar a primeira.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {active.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              todayStr={todayStr}
              onUpdateGoal={onUpdateGoal}
              onSetStatus={onSetStatus}
              onEdit={onEdit}
            />
          ))}
          {closed.length > 0 && (
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              Encerradas
            </p>
          )}
          {closed.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              todayStr={todayStr}
              onUpdateGoal={onUpdateGoal}
              onSetStatus={onSetStatus}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function GoalCard({ goal, todayStr, onUpdateGoal, onSetStatus, onEdit }) {
  const closed = goal.status !== 'active'
  const overdue = !closed && goal.targetDate && goal.targetDate < todayStr
  const setProgress = (value) => {
    const clamped = Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
    if (clamped !== goal.progress) onUpdateGoal({ id: goal.id, progress: clamped })
  }

  return (
    <div className={['glass-strong rounded-xl border p-3', closed ? 'opacity-60' : ''].join(' ')}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p
            className={[
              'text-[13px] font-medium',
              closed ? 'text-text-muted line-through' : 'text-text',
            ].join(' ')}
          >
            {goal.title}
          </p>
          {goal.description && (
            <p className="mt-0.5 text-[11px] text-text-secondary">{goal.description}</p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]">
            <span className="text-text-muted">{STATUS_LABEL[goal.status]}</span>
            {goal.targetDate && (
              <span className={overdue ? 'font-medium text-danger' : 'text-text-muted'}>
                {overdue ? 'Venceu em ' : 'Até '}
                {fmt(fromDateInput(goal.targetDate), "d 'de' MMM 'de' yyyy")}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {goal.status === 'active' ? (
            <>
              <IconButton
                label="Marcar como concluída"
                onClick={() => onSetStatus(goal.id, 'done')}
                icon={CheckCircle2}
                hover="hover:bg-success/15 hover:text-success"
              />
              <IconButton
                label="Marcar como abandonada"
                onClick={() => onSetStatus(goal.id, 'dropped')}
                icon={CircleSlash}
                hover="hover:bg-danger/15 hover:text-danger"
              />
            </>
          ) : (
            <IconButton
              label="Reabrir meta"
              onClick={() => onSetStatus(goal.id, 'active')}
              icon={RotateCcw}
              hover="hover:bg-accent-soft hover:text-primary"
            />
          )}
          <IconButton
            label="Editar meta"
            onClick={() => onEdit(goal)}
            icon={Pencil}
            hover="hover:bg-accent-soft hover:text-primary"
          />
        </div>
      </div>

      {/* The slider and the number field are two views of the same value, so
          you can drag for a rough read or type when you know the figure. */}
      <div className="mt-2.5 flex items-center gap-2.5">
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={goal.progress}
          onChange={(e) => setProgress(e.target.value)}
          aria-label={`Progresso de ${goal.title}`}
          className="h-1.5 flex-1 cursor-pointer accent-primary"
        />
        <div className="flex shrink-0 items-center gap-0.5">
          <input
            type="number"
            min="0"
            max="100"
            value={goal.progress}
            onChange={(e) => setProgress(e.target.value)}
            aria-label={`Progresso de ${goal.title} em porcentagem`}
            className="w-[46px] rounded-md border border-border-strong bg-surface px-1 py-0.5 text-right text-[11px] tabular-nums text-text outline-none focus:border-primary"
          />
          <span className="text-[11px] text-text-muted">%</span>
        </div>
      </div>
    </div>
  )
}

function IconButton({ label, onClick, icon: Icon, hover }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-7 w-7 items-center justify-center rounded-full text-text-muted ${hover}`}
    >
      <Icon size={14} />
    </button>
  )
}
