import { useMemo, useState } from 'react'
import { buildTaskComparator, priorityRankMap } from '../../lib/taskSort'
import TarefasToolbar from './TarefasToolbar'
import TaskListView from './TaskListView'
import TaskKanbanView from './TaskKanbanView'
import TaskModal from './TaskModal'
import TaskSettingsModal from './TaskSettingsModal'
import ConfirmDialog from '../common/ConfirmDialog'

function blankTask() {
  return {
    title: '',
    status: 'pendente',
    priorityId: null,
    tags: [],
    dueDate: null,
    dueTime: null,
    recurrence: 'none',
    recurrenceDays: [],
    recurrenceUntil: null,
  }
}

function filterTasks(tasks, filters, { applyHideFinished }) {
  return tasks.filter((t) => {
    if (filters.priorityIds.length && !filters.priorityIds.includes(t.priorityId)) return false
    if (filters.tags.length && !filters.tags.some((tag) => t.tags?.includes(tag))) return false
    if (applyHideFinished && filters.hideFinished && t.status === 'finalizada') return false
    return true
  })
}

const DEFAULT_FILTERS = { priorityIds: [], tags: [], hideFinished: true }

// Tarefas module: list + kanban views over one task collection, sharing the
// same filter/hierarchical-sort state. Fully independent from Agenda and
// Planejamento — its own priorities, tags and storage domain.
export default function Tarefas({
  tasks,
  addTask,
  updateTask,
  deleteTask,
  setTaskStatus,
  priorities,
  addPriority,
  updatePriority,
  onDeletePriority,
  reorderPriorities,
  tags,
  onCreateTag,
  onDeleteTag,
}) {
  const [view, setView] = useState('list')
  const [sortChain, setSortChain] = useState([{ field: 'dueDate', direction: 'asc' }])
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [modalTask, setModalTask] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)

  const toggleSort = (field) => {
    setSortChain((prev) => {
      const idx = prev.findIndex((s) => s.field === field)
      if (idx === -1) return [...prev, { field, direction: 'asc' }]
      if (prev[idx].direction === 'asc') {
        const next = [...prev]
        next[idx] = { field, direction: 'desc' }
        return next
      }
      return prev.filter((s) => s.field !== field)
    })
  }

  const toggleFilter = (dimension, value) => {
    setFilters((prev) => {
      const list = prev[dimension]
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
      return { ...prev, [dimension]: next }
    })
  }

  const priorityRank = useMemo(() => priorityRankMap(priorities), [priorities])
  const comparator = useMemo(
    () => buildTaskComparator(sortChain, priorityRank),
    [sortChain, priorityRank]
  )

  const visibleTasks = useMemo(
    () => filterTasks(tasks, filters, { applyHideFinished: view === 'list' }),
    [tasks, filters, view]
  )
  const sortedTasks = useMemo(() => [...visibleTasks].sort(comparator), [visibleTasks, comparator])

  const openCreate = () => setModalTask(blankTask())
  const openEdit = (task) => setModalTask(task)

  const handleSave = (data) => {
    if (modalTask?.id) updateTask({ ...data, id: modalTask.id })
    else addTask(data)
    setModalTask(null)
  }

  const handleQuickAdd = (partial) => {
    addTask({ ...blankTask(), ...partial })
  }

  return (
    <div className="flex h-full flex-col">
      <TarefasToolbar
        view={view}
        onChangeView={setView}
        sortChain={sortChain}
        onToggleSort={toggleSort}
        filters={filters}
        onToggleFilter={toggleFilter}
        onToggleHideFinished={() => setFilters((f) => ({ ...f, hideFinished: !f.hideFinished }))}
        onClearFilters={() => setFilters(DEFAULT_FILTERS)}
        priorities={priorities}
        tags={tags}
        onNew={openCreate}
        onManageClick={() => setSettingsOpen(true)}
      />

      <div className="flex-1 overflow-hidden">
        {view === 'list' ? (
          <TaskListView
            tasks={sortedTasks}
            priorities={priorities}
            onEdit={openEdit}
            onDeleteClick={setPendingDelete}
            onSetStatus={setTaskStatus}
            onQuickAdd={handleQuickAdd}
          />
        ) : (
          <TaskKanbanView
            tasks={sortedTasks}
            priorities={priorities}
            onEdit={openEdit}
            onSetStatus={setTaskStatus}
          />
        )}
      </div>

      {modalTask && (
        <TaskModal
          initial={modalTask}
          priorities={priorities}
          allTags={tags}
          onCreateTag={onCreateTag}
          onDeleteTag={onDeleteTag}
          onSave={handleSave}
          onDelete={
            modalTask.id
              ? () => {
                  setPendingDelete(modalTask)
                  setModalTask(null)
                }
              : undefined
          }
          onClose={() => setModalTask(null)}
        />
      )}

      {settingsOpen && (
        <TaskSettingsModal
          priorities={priorities}
          onAdd={addPriority}
          onUpdate={updatePriority}
          onDelete={onDeletePriority}
          onReorder={reorderPriorities}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={`Excluir "${pendingDelete.title}"?`}
          message="Esta ação não pode ser desfeita."
          confirmLabel="Excluir"
          onConfirm={() => {
            deleteTask(pendingDelete.id)
            setPendingDelete(null)
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}
