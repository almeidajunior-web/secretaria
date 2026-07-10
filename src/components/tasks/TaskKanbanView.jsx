import { useState } from 'react'
import { Repeat } from 'lucide-react'
import { TASK_STATUSES } from '../../constants'
import { formatDueDate, isOverdue } from '../../lib/taskFormat'

// Fixed 4-column board (Pendente/Em Progresso/Finalizada/Congelada). Cards
// are hold-and-drag reorderable between columns (native HTML5 drag-and-drop,
// same pattern as Planejamento's category reorder) to change status.
export default function TaskKanbanView({ tasks, priorities, onEdit, onSetStatus }) {
  const priorityById = Object.fromEntries(priorities.map((p) => [p.id, p]))
  const [dragOverStatus, setDragOverStatus] = useState(null)

  return (
    <div className="thin-scroll flex h-full gap-3 overflow-auto p-4">
      {TASK_STATUSES.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status.value)
        return (
          <div
            key={status.value}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOverStatus(status.value)
            }}
            onDragLeave={() => setDragOverStatus((s) => (s === status.value ? null : s))}
            onDrop={(e) => {
              e.preventDefault()
              const id = e.dataTransfer.getData('text/plain')
              if (id) onSetStatus(id, status.value)
              setDragOverStatus(null)
            }}
            className={[
              'flex w-64 shrink-0 flex-col rounded-lg border bg-app-bg',
              dragOverStatus === status.value ? 'border-primary' : 'border-border',
            ].join(' ')}
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-[12px] font-semibold text-text-secondary">{status.label}</span>
              <span className="text-[11px] text-text-muted">{columnTasks.length}</span>
            </div>
            <div className="thin-scroll flex flex-1 flex-col gap-2 overflow-y-auto p-2">
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  priority={priorityById[task.priorityId]}
                  onEdit={() => onEdit(task)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TaskCard({ task, priority, onEdit }) {
  const overdue = isOverdue(task)

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
      onClick={onEdit}
      className="cursor-grab rounded-lg border border-border bg-surface p-2.5 shadow-sm hover:border-primary active:cursor-grabbing"
    >
      <p className="mb-1.5 text-[13px] text-text">{task.title}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {priority && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ backgroundColor: `${priority.color}22`, color: priority.color }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: priority.color }} />
            {priority.label}
          </span>
        )}
        {task.tags?.map((t) => (
          <span key={t} className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-primary">
            {t}
          </span>
        ))}
        {task.recurrence !== 'none' && <Repeat size={11} className="text-text-muted" />}
        {task.dueDate && (
          <span className={['ml-auto text-[11px]', overdue ? 'font-semibold text-danger' : 'text-text-secondary'].join(' ')}>
            {formatDueDate(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  )
}
