import { useState } from 'react'
import { Repeat } from 'lucide-react'
import { formatDueDate, isOverdue } from '../../lib/taskFormat'
import { tintVars } from '../../lib/color'

// Board with one column per status (user-editable — order/color/label come
// from `statuses`, which also drives the Kanban column order). Cards are
// hold-and-drag reorderable between columns (native HTML5 drag-and-drop,
// same pattern as Planejamento's category reorder) to change status. Each
// column's internal order matches the incoming `tasks` array (already
// filtered/sorted the same way as the List view) — cards are never manually
// reorderable within a column.
export default function TaskKanbanView({ tasks, priorities, tags, statuses, doneStatusIds, onEdit, onSetStatus }) {
  const priorityById = Object.fromEntries(priorities.map((p) => [p.id, p]))
  const tagById = Object.fromEntries(tags.map((t) => [t.id, t]))
  const [dragOverStatus, setDragOverStatus] = useState(null)

  return (
    <div className="thin-scroll flex h-full gap-3 overflow-auto p-4">
      {statuses.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status.id)
        return (
          <div
            key={status.id}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOverStatus(status.id)
            }}
            onDragLeave={() => setDragOverStatus((s) => (s === status.id ? null : s))}
            onDrop={(e) => {
              e.preventDefault()
              const id = e.dataTransfer.getData('text/plain')
              if (id) onSetStatus(id, status.id)
              setDragOverStatus(null)
            }}
            className={[
              'flex w-64 shrink-0 flex-col rounded-lg border bg-app-bg',
              dragOverStatus === status.id ? 'border-primary' : 'border-border',
            ].join(' ')}
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="tint-ink text-[12px] font-semibold" style={tintVars(status.color)}>
                {status.label}
              </span>
              <span className="text-[11px] text-text-muted">{columnTasks.length}</span>
            </div>
            <div className="thin-scroll flex flex-1 flex-col gap-2 overflow-y-auto p-2">
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  priority={priorityById[task.priorityId]}
                  taskTags={(task.tagIds || []).map((id) => tagById[id]).filter(Boolean)}
                  doneStatusIds={doneStatusIds}
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

function TaskCard({ task, priority, taskTags, doneStatusIds, onEdit }) {
  const overdue = isOverdue(task, doneStatusIds)

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
            className="tint-ink tint-soft inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={tintVars(priority.color, 0.13)}
          >
            <span className="tint-fill h-1.5 w-1.5 rounded-full" />
            {priority.label}
          </span>
        )}
        {taskTags.map((t) => (
          <span
            key={t.id}
            className="tint-ink tint-soft inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
            style={tintVars(t.color, 0.13)}
          >
            {t.label}
          </span>
        ))}
        {task.recurrence !== 'none' && <Repeat size={11} className="text-text-muted" />}
        {task.dueDate && (
          <span
            className={[
              'ml-auto text-[11px]',
              overdue ? 'font-semibold text-danger' : 'text-text-secondary',
            ].join(' ')}
          >
            {formatDueDate(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  )
}
