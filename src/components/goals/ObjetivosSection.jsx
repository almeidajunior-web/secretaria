import { CheckCircle2, Plus, RotateCcw } from 'lucide-react'
import { fmt, fromDateInput } from '../../lib/date'
import { toKey } from '../../lib/habitStats'

const STATUS_LABEL = { active: 'Em andamento', done: 'Concluída' }

// Objetivos: the longer-horizon half of the module. Progress is a number the
// user sets by hand rather than something derived — that's what lets a
// countable goal ("juntar a reserva") and a fuzzy one ("trocar de emprego")
// sit in the same list without forcing either into the other's shape. There's
// no "abandonada" status: a goal that stops making sense gets deleted, not
// filed away.
//
// Laid out as a three-across grid of cards borrowing the Overview stat tile's
// rhythm, just taller, so each goal reads as its own box rather than a row in
// a list. The whole card opens the edit modal — there's no separate pencil —
// except the one status button, which stops the click from reaching it.
export default function ObjetivosSection({ goals, onSetStatus, onNew, onEdit }) {
  const todayStr = toKey(new Date())
  const active = goals.filter((g) => g.status !== 'done')
  const done = goals.filter((g) => g.status === 'done')

  const cards = (list) => (
    <div className="grid grid-cols-3 gap-3">
      {list.map((goal) => (
        <GoalCard key={goal.id} goal={goal} todayStr={todayStr} onSetStatus={onSetStatus} onEdit={onEdit} />
      ))}
    </div>
  )

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
        <>
          {active.length > 0 && cards(active)}
          {done.length > 0 && (
            <>
              <p className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                Concluídas
              </p>
              {cards(done)}
            </>
          )}
        </>
      )}
    </section>
  )
}

function GoalCard({ goal, todayStr, onSetStatus, onEdit }) {
  const done = goal.status === 'done'
  const overdue = !done && goal.targetDate && goal.targetDate < todayStr

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onEdit(goal)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onEdit(goal)
        }
      }}
      className={[
        'flex cursor-pointer flex-col glass-strong rounded-xl border px-4 py-3 text-left transition-colors hover:border-primary/50',
        done ? 'opacity-60' : '',
      ].join(' ')}
    >
      <div className="flex items-start gap-2">
        <p
          className={[
            'min-w-0 flex-1 text-[15px] font-semibold leading-snug',
            done ? 'text-text-muted line-through' : 'text-text',
          ].join(' ')}
        >
          {goal.title}
        </p>
        <span className="num-glow shrink-0 text-xl font-semibold tabular-nums text-text">
          {goal.progress}%
        </span>
        <IconButton
          label={done ? 'Reabrir meta' : 'Marcar como concluída'}
          onClick={(e) => {
            e.stopPropagation()
            onSetStatus(goal.id, done ? 'active' : 'done')
          }}
          icon={done ? RotateCcw : CheckCircle2}
          hover={done ? 'hover:bg-accent-soft hover:text-primary' : 'hover:bg-success/15 hover:text-success'}
        />
      </div>

      {goal.description && (
        <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-text-secondary">
          {goal.description}
        </p>
      )}

      {/* Pushed to the bottom edge so every card's footer lines up, however
          long its title or description runs. */}
      <p className="mt-auto pt-2 text-[10px] text-text-muted">
        {STATUS_LABEL[goal.status] ?? STATUS_LABEL.active}
        {goal.targetDate && (
          <>
            {' · '}
            <span className={overdue ? 'font-medium text-danger' : undefined}>
              {overdue ? 'venceu em ' : 'até '}
              {fmt(fromDateInput(goal.targetDate), "d 'de' MMM 'de' yyyy")}
            </span>
          </>
        )}
      </p>
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
      className={`-mr-1 -mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-muted ${hover}`}
    >
      <Icon size={13} />
    </button>
  )
}
