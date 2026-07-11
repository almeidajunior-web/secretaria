import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { buildTaskComparator, rankMap } from '../../lib/taskSort'
import TarefasToolbar from './TarefasToolbar'
import TaskListView from './TaskListView'
import TaskKanbanView from './TaskKanbanView'
import TaskModal from './TaskModal'
import TaskSettingsModal from './TaskSettingsModal'
import ConfirmDialog from '../common/ConfirmDialog'

function blankTask(statuses) {
  return {
    title: '',
    status: (statuses.find((s) => !s.isDone) || statuses[0])?.id,
    priorityId: null,
    tagIds: [],
    dueDate: null,
    dueTime: null,
    recurrence: 'none',
    recurrenceDays: [],
    recurrenceUntil: null,
  }
}

function filterTasks(tasks, filters, { applyHideFinished, doneStatusIds }) {
  return tasks.filter((t) => {
    if (filters.priorityIds.length && !filters.priorityIds.includes(t.priorityId)) return false
    if (filters.tags.length && !filters.tags.some((tagId) => t.tagIds?.includes(tagId))) return false
    if (filters.dueDate && t.dueDate !== filters.dueDate) return false
    if (applyHideFinished && filters.hideFinished && doneStatusIds.has(t.status)) return false
    return true
  })
}

const DEFAULT_FILTERS = { priorityIds: [], tags: [], hideFinished: true, dueDate: null }

// Tarefas module: list + kanban views over one task collection, sharing the
// same filter/hierarchical-sort state. Fully independent from Agenda and
// Planejamento — its own priorities, tags, statuses and storage domain.
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
  updateTag,
  onDeleteTag,
  reorderTags,
  statuses,
  addStatus,
  updateStatus,
  setStatusDone,
  onDeleteStatus,
  reorderStatuses,
  initialDateFilter,
}) {
  const [view, setView] = useState('list')
  const [sortChain, setSortChain] = useState([{ field: 'dueDate', direction: 'asc' }])
  // Seeded once at mount — Tarefas remounts fresh every time App.jsx switches
  // the active module to 'todos' (it isn't rendered otherwise), so this is
  // enough to pick up a date passed in from Agenda's per-day "Tarefas" link.
  const [filters, setFilters] = useState(() =>
    initialDateFilter ? { ...DEFAULT_FILTERS, dueDate: initialDateFilter } : DEFAULT_FILTERS
  )
  const [modalTask, setModalTask] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())

  const doneStatusIds = useMemo(
    () => new Set(statuses.filter((s) => s.isDone).map((s) => s.id)),
    [statuses]
  )

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

  const setDateFilter = (dueDate) => setFilters((prev) => ({ ...prev, dueDate: dueDate || null }))

  const toggleSelectMode = () => {
    setSelectMode((v) => !v)
    setSelectedIds(new Set())
  }

  const toggleSelectTask = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const priorityRank = useMemo(() => rankMap(priorities), [priorities])
  const statusRank = useMemo(() => rankMap(statuses), [statuses])
  const comparator = useMemo(
    () => buildTaskComparator(sortChain, priorityRank, statusRank),
    [sortChain, priorityRank, statusRank]
  )

  const visibleTasks = useMemo(
    () => filterTasks(tasks, filters, { applyHideFinished: view === 'list', doneStatusIds }),
    [tasks, filters, view, doneStatusIds]
  )
  const sortedTasks = useMemo(() => [...visibleTasks].sort(comparator), [visibleTasks, comparator])

  const selectAllVisible = () => setSelectedIds(new Set(sortedTasks.map((t) => t.id)))
  const clearSelection = () => setSelectedIds(new Set())

  // Bulk actions are a blunt "stamp this value on everything selected" tool,
  // so every field is a direct overwrite via updateTask — including status.
  // setTaskStatus (used by the row/kanban status controls) intentionally
  // special-cases recurring tasks: completing one advances its dueDate to
  // the next occurrence instead of leaving it "done", so it keeps cycling
  // (e.g. a daily task). That's the right behavior for a single deliberate
  // "I finished today's occurrence" click, but it silently fights a bulk
  // "mark all these as Finalizada" action — the status would visibly never
  // stick and the due date would creep forward one day per attempt. Bulk
  // status assignment always sets the literal chosen status instead.
  const bulkSetDueDate = (dueDate) => {
    selectedIds.forEach((id) => updateTask({ id, dueDate: dueDate || null }))
  }
  const bulkSetPriority = (priorityId) => {
    selectedIds.forEach((id) => updateTask({ id, priorityId: priorityId || null }))
  }
  const bulkSetStatus = (statusId) => {
    selectedIds.forEach((id) => updateTask({ id, status: statusId }))
  }
  const bulkAddTag = (tagId) => {
    selectedIds.forEach((id) => {
      const t = tasks.find((x) => x.id === id)
      if (t && !(t.tagIds || []).includes(tagId)) {
        updateTask({ id, tagIds: [...(t.tagIds || []), tagId] })
      }
    })
  }
  const bulkDelete = () => {
    selectedIds.forEach((id) => deleteTask(id))
    setPendingBulkDelete(false)
    toggleSelectMode()
  }

  const openCreate = () => setModalTask(blankTask(statuses))
  const openEdit = (task) => setModalTask(task)

  const handleSave = (data) => {
    if (modalTask?.id) updateTask({ ...data, id: modalTask.id })
    else addTask(data)
    setModalTask(null)
  }

  const handleQuickAdd = (partial) => {
    addTask({ ...blankTask(statuses), ...partial })
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
        onSetDateFilter={setDateFilter}
        onToggleHideFinished={() => setFilters((f) => ({ ...f, hideFinished: !f.hideFinished }))}
        onClearFilters={() => setFilters(DEFAULT_FILTERS)}
        priorities={priorities}
        tags={tags}
        statuses={statuses}
        onNew={openCreate}
        onManageClick={() => setSettingsOpen(true)}
        selectMode={selectMode}
        onToggleSelectMode={toggleSelectMode}
        selectedCount={selectedIds.size}
        onSelectAll={selectAllVisible}
        onClearSelection={clearSelection}
        onBulkSetDueDate={bulkSetDueDate}
        onBulkSetPriority={bulkSetPriority}
        onBulkSetStatus={bulkSetStatus}
        onBulkAddTag={bulkAddTag}
        onCreateTag={onCreateTag}
        onBulkDeleteClick={() => setPendingBulkDelete(true)}
      />

      <TaskSummaryBar tasks={visibleTasks} statuses={statuses} doneStatusIds={doneStatusIds} />

      <div className="flex-1 overflow-hidden">
        {view === 'list' ? (
          <TaskListView
            tasks={sortedTasks}
            priorities={priorities}
            tags={tags}
            statuses={statuses}
            doneStatusIds={doneStatusIds}
            onEdit={openEdit}
            onDeleteClick={setPendingDelete}
            onSetStatus={setTaskStatus}
            onUpdateTask={updateTask}
            onCreateTag={onCreateTag}
            onQuickAdd={handleQuickAdd}
            selectMode={selectMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelectTask}
          />
        ) : (
          <TaskKanbanView
            tasks={sortedTasks}
            priorities={priorities}
            tags={tags}
            statuses={statuses}
            doneStatusIds={doneStatusIds}
            onEdit={openEdit}
            onSetStatus={setTaskStatus}
          />
        )}
      </div>

      {modalTask && (
        <TaskModal
          initial={modalTask}
          priorities={priorities}
          tags={tags}
          statuses={statuses}
          onCreateTag={onCreateTag}
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
          onAddPriority={addPriority}
          onUpdatePriority={updatePriority}
          onDeletePriority={onDeletePriority}
          onReorderPriorities={reorderPriorities}
          tags={tags}
          onAddTag={onCreateTag}
          onUpdateTag={updateTag}
          onDeleteTag={onDeleteTag}
          onReorderTags={reorderTags}
          statuses={statuses}
          onAddStatus={addStatus}
          onUpdateStatus={updateStatus}
          onSetStatusDone={setStatusDone}
          onDeleteStatus={onDeleteStatus}
          onReorderStatuses={reorderStatuses}
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

      {pendingBulkDelete && (
        <ConfirmDialog
          title={`Excluir ${selectedIds.size} tarefa${selectedIds.size > 1 ? 's' : ''}?`}
          message="Esta ação não pode ser desfeita."
          confirmLabel="Excluir"
          onConfirm={bulkDelete}
          onCancel={() => setPendingBulkDelete(false)}
        />
      )}
    </div>
  )
}

// Compact count-by-status line, reflecting the currently visible (filtered)
// tasks — plus an overdue count pulled out in red for quick scanning.
function TaskSummaryBar({ tasks, statuses, doneStatusIds }) {
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const overdueCount = tasks.filter(
    (t) => t.dueDate && t.dueDate < todayStr && !doneStatusIds.has(t.status)
  ).length

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border bg-app-bg px-4 py-1.5 text-[11px]">
      {statuses.map((s) => (
        <span key={s.id} className="flex items-center gap-1.5 text-text-secondary">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
          {s.label} <span className="font-semibold text-text">{tasks.filter((t) => t.status === s.id).length}</span>
        </span>
      ))}
      {overdueCount > 0 && (
        <span className="ml-auto font-semibold text-danger">
          {overdueCount} atrasada{overdueCount > 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}
