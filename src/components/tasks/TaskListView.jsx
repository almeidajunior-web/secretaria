import { useState } from 'react'
import { Plus, Repeat, Trash2 } from 'lucide-react'
import { TASK_STATUSES } from '../../constants'
import { formatDueDate, isOverdue } from '../../lib/taskFormat'

const STATUS_COLORS = {
  pendente: '#6B7280',
  em_progresso: '#2563EB',
  finalizada: '#16A34A',
  congelada: '#7C3AED',
}

// Flat, sorted task list with inline status/priority controls and a
// ClickUp-style quick-add row at the bottom for modal-free creation.
export default function TaskListView({ tasks, priorities, onEdit, onDeleteClick, onSetStatus, onQuickAdd }) {
  const priorityById = Object.fromEntries(priorities.map((p) => [p.id, p]))

  return (
    <div className="thin-scroll flex h-full flex-col overflow-auto">
      {tasks.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-text-muted">
          Nenhuma tarefa por aqui. Use a linha abaixo para criar a primeira.
        </p>
      ) : (
        <div className="flex flex-col">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              priority={priorityById[task.priorityId]}
              onEdit={() => onEdit(task)}
              onDeleteClick={() => onDeleteClick(task)}
              onSetStatus={(status) => onSetStatus(task.id, status)}
            />
          ))}
        </div>
      )}

      <QuickAddRow priorities={priorities} onQuickAdd={onQuickAdd} />
    </div>
  )
}

function TaskRow({ task, priority, onEdit, onDeleteClick, onSetStatus }) {
  const overdue = isOverdue(task)
  const finished = task.status === 'finalizada'

  return (
    <div
      onClick={onEdit}
      className="flex cursor-pointer items-center gap-3 border-b border-border px-4 py-2.5 hover:bg-accent-soft/30"
    >
      <select
        value={task.status}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onSetStatus(e.target.value)}
        style={{ color: STATUS_COLORS[task.status], borderColor: STATUS_COLORS[task.status] }}
        className="shrink-0 rounded-md border bg-transparent px-1.5 py-1 text-[11px] font-medium outline-none"
      >
        {TASK_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <span className={['flex-1 truncate text-[13px]', finished ? 'text-text-muted line-through' : 'text-text'].join(' ')}>
        {task.title}
      </span>

      {task.recurrence !== 'none' && (
        <Repeat size={13} className="shrink-0 text-text-muted" />
      )}

      {task.tags?.length > 0 && (
        <span className="hidden shrink-0 flex-wrap gap-1 sm:flex">
          {task.tags.map((t) => (
            <span
              key={t}
              className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-primary"
            >
              {t}
            </span>
          ))}
        </span>
      )}

      {priority && (
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ backgroundColor: `${priority.color}22`, color: priority.color }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: priority.color }} />
          {priority.label}
        </span>
      )}

      <span className={['w-16 shrink-0 text-right text-[11px]', overdue ? 'font-semibold text-danger' : 'text-text-secondary'].join(' ')}>
        {formatDueDate(task.dueDate)}
      </span>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onDeleteClick()
        }}
        aria-label={`Excluir tarefa ${task.title}`}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-danger/15 hover:text-danger"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

function QuickAddRow({ priorities, onQuickAdd }) {
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priorityId, setPriorityId] = useState('')

  const commit = () => {
    const t = title.trim()
    if (!t) return
    onQuickAdd({
      title: t,
      dueDate: dueDate || null,
      priorityId: priorityId || null,
    })
    setTitle('')
    setDueDate('')
    setPriorityId('')
  }

  return (
    <div className="mt-auto flex items-center gap-2 border-t border-border px-4 py-2">
      <Plus size={14} className="shrink-0 text-text-muted" />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        placeholder="Nova tarefa rápida…"
        className="flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-text-muted"
      />
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        className="w-32 shrink-0 rounded-md border border-border-strong bg-surface px-1.5 py-1 text-[11px] text-text outline-none focus:border-primary"
      />
      <select
        value={priorityId}
        onChange={(e) => setPriorityId(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        className="w-28 shrink-0 rounded-md border border-border-strong bg-surface px-1.5 py-1 text-[11px] text-text outline-none focus:border-primary"
      >
        <option value="">Prioridade</option>
        {priorities.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={commit}
        disabled={!title.trim()}
        className="rounded-md bg-primary px-3 py-1 text-[11px] font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        Adicionar
      </button>
    </div>
  )
}
