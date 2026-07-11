import { useEffect, useRef, useState } from 'react'
import { format, addDays } from 'date-fns'
import { Plus, Repeat, Trash2, Clock } from 'lucide-react'
import { formatDueDate, isOverdue, parseDueDate } from '../../lib/taskFormat'
import { groupTasksByDueDate } from '../../lib/taskGroups'
import TagPickerPopover from '../common/TagPickerPopover'
import ChipSelect from '../common/ChipSelect'
import InlineDate from '../common/InlineDate'

// Flat, sorted task list grouped into due-date sections (Atrasadas first),
// with fields editable directly in the row (ClickUp-style — the modal only
// opens when clicking outside a dedicated field control), and a quick-add
// row at the bottom for modal-free creation.
export default function TaskListView({
  tasks,
  priorities,
  tags,
  statuses,
  doneStatusIds,
  onEdit,
  onDeleteClick,
  onSetStatus,
  onUpdateTask,
  onCreateTag,
  onQuickAdd,
  selectMode,
  selectedIds,
  onToggleSelect,
}) {
  const groups = groupTasksByDueDate(tasks)

  return (
    <div className="thin-scroll flex h-full flex-col overflow-auto">
      {tasks.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-text-muted">
          Nenhuma tarefa por aqui. Use a linha abaixo para criar a primeira.
        </p>
      ) : (
        <div className="flex flex-col">
          {groups.map((group) => (
            <div key={group.key}>
              <div className="sticky top-0 z-[1] bg-app-bg px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                {group.label} <span className="font-normal normal-case">({group.tasks.length})</span>
              </div>
              {group.tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  priorities={priorities}
                  tags={tags}
                  statuses={statuses}
                  doneStatusIds={doneStatusIds}
                  onEdit={() => onEdit(task)}
                  onDeleteClick={() => onDeleteClick(task)}
                  onSetStatus={(status) => onSetStatus(task.id, status)}
                  onUpdateTask={onUpdateTask}
                  onCreateTag={onCreateTag}
                  selectMode={selectMode}
                  selected={selectedIds?.has(task.id)}
                  onToggleSelect={() => onToggleSelect(task.id)}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      <QuickAddRow priorities={priorities} tags={tags} onCreateTag={onCreateTag} onQuickAdd={onQuickAdd} />
    </div>
  )
}

function TaskRow({
  task,
  priorities,
  tags,
  statuses,
  doneStatusIds,
  onEdit,
  onDeleteClick,
  onSetStatus,
  onUpdateTask,
  onCreateTag,
  selectMode,
  selected,
  onToggleSelect,
}) {
  const overdue = isOverdue(task, doneStatusIds)
  const finished = doneStatusIds.has(task.status)
  const [title, setTitle] = useState(task.title)

  // The row keeps the same key (task.id) across renders, so it never
  // remounts on its own — resync the local buffer whenever the title
  // changes from outside this input (e.g. saved via the full edit modal),
  // otherwise the row keeps showing the pre-edit title indefinitely.
  useEffect(() => {
    setTitle(task.title)
  }, [task.title])

  const commitTitle = () => {
    const t = title.trim()
    if (t && t !== task.title) onUpdateTask({ ...task, title: t })
    else setTitle(task.title)
  }

  const toggleTag = (tagId) => {
    const has = (task.tagIds || []).includes(tagId)
    const next = has ? task.tagIds.filter((x) => x !== tagId) : [...(task.tagIds || []), tagId]
    onUpdateTask({ ...task, tagIds: next })
  }

  return (
    <div
      onClick={onEdit}
      className="flex cursor-pointer items-center gap-2 border-b border-border px-4 py-2 hover:bg-accent-soft/30"
    >
      {selectMode && (
        <input
          type="checkbox"
          checked={!!selected}
          onClick={(e) => e.stopPropagation()}
          onChange={onToggleSelect}
          className="h-3.5 w-3.5 shrink-0"
        />
      )}

      <ChipSelect
        value={task.status}
        options={statuses}
        onChange={(id) => id && onSetStatus(id)}
        allowNull={false}
        align="left"
      />

      <input
        value={title}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commitTitle}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className={[
          'min-w-0 flex-1 bg-transparent text-[13px] outline-none',
          finished ? 'text-text-muted line-through' : 'text-text',
        ].join(' ')}
      />

      {task.recurrence !== 'none' && <Repeat size={13} className="shrink-0 text-text-muted" />}

      <TagPickerPopover
        tags={tags}
        selectedIds={task.tagIds || []}
        onToggle={toggleTag}
        onCreate={onCreateTag}
        triggerClassName="flex shrink-0 flex-wrap items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-text-secondary hover:bg-accent-soft/50"
      />

      <ChipSelect
        value={task.priorityId || null}
        options={priorities}
        onChange={(id) => onUpdateTask({ ...task, priorityId: id })}
        nullLabel="Sem prioridade"
        clearLabel="Sem prioridade"
      />

      <InlineDate
        value={task.dueDate || null}
        onChange={(v) => onUpdateTask({ ...task, dueDate: v })}
        overdue={overdue}
        muted
        placeholder="Sem prazo"
      />

      <PostponeButton task={task} onUpdateTask={onUpdateTask} />

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

function PostponeButton({ task, onUpdateTask }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const postpone = (days) => {
    const base = task.dueDate ? parseDueDate(task.dueDate) : new Date()
    onUpdateTask({ ...task, dueDate: format(addDays(base, days), 'yyyy-MM-dd') })
    setOpen(false)
  }

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        aria-label="Adiar tarefa"
        className="flex h-6 w-6 items-center justify-center rounded-full text-text-muted hover:bg-accent-soft/60 hover:text-primary"
      >
        <Clock size={13} />
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full z-50 mt-1.5 flex w-32 flex-col gap-0.5 rounded-xl border border-border bg-surface p-1.5 shadow-lg"
        >
          <button
            type="button"
            onClick={() => postpone(1)}
            className="rounded-lg px-2 py-1.5 text-left text-xs font-medium text-text-secondary hover:bg-accent-soft hover:text-primary"
          >
            +1 dia
          </button>
          <button
            type="button"
            onClick={() => postpone(7)}
            className="rounded-lg px-2 py-1.5 text-left text-xs font-medium text-text-secondary hover:bg-accent-soft hover:text-primary"
          >
            +1 semana
          </button>
        </div>
      )}
    </div>
  )
}

function QuickAddRow({ priorities, tags, onCreateTag, onQuickAdd }) {
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priorityId, setPriorityId] = useState('')
  const [tagIds, setTagIds] = useState([])

  const commit = () => {
    const t = title.trim()
    if (!t) return
    onQuickAdd({
      title: t,
      dueDate: dueDate || null,
      priorityId: priorityId || null,
      tagIds,
    })
    setTitle('')
    setDueDate('')
    setPriorityId('')
    setTagIds([])
  }

  return (
    <div className="mt-auto flex items-center gap-2 border-t border-border px-4 py-2">
      <Plus size={14} className="shrink-0 text-text-muted" />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        placeholder="Nova tarefa…"
        className="flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-text-muted"
      />
      <TagPickerPopover
        tags={tags}
        selectedIds={tagIds}
        onToggle={(id) =>
          setTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
        }
        onCreate={onCreateTag}
      />
      <InlineDate
        value={dueDate || null}
        onChange={(v) => setDueDate(v || '')}
        placeholder="Prazo"
      />
      <ChipSelect
        value={priorityId || null}
        options={priorities}
        onChange={(id) => setPriorityId(id || '')}
        nullLabel="Prioridade"
        clearLabel="Sem prioridade"
      />
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
