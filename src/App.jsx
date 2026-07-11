import { useState } from 'react'
import { format } from 'date-fns'
import { Construction } from 'lucide-react'
import { useTheme } from './hooks/useTheme'
import { useEvents } from './hooks/useEvents'
import { useTags } from './hooks/useTags'
import { usePlanning } from './hooks/usePlanning'
import { useTasks } from './hooks/useTasks'
import { useTaskPriorities } from './hooks/useTaskPriorities'
import { useTaskTags } from './hooks/useTaskTags'
import { useTaskStatuses } from './hooks/useTaskStatuses'
import Topbar from './components/layout/Topbar'
import Sidebar from './components/layout/Sidebar'
import Agenda from './components/agenda/Agenda'
import Planejamento from './components/planning/Planejamento'
import Tarefas from './components/tasks/Tarefas'

// Application shell: top bar + sidebar + active module area. Module routing is
// kept in local state so future modules (Finanças) can be dropped in without
// restructuring.
export default function App() {
  const { theme, toggleTheme } = useTheme()
  const eventsApi = useEvents()
  // Seed the tag list from tags already present on the events (first run only).
  const seedTags = [...new Set(eventsApi.events.flatMap((e) => e.tags || []))]
  const tagsApi = useTags(seedTags)
  const planningApi = usePlanning()
  const taskStatusesApi = useTaskStatuses()
  const tasksApi = useTasks(taskStatusesApi.statuses)
  const taskPrioritiesApi = useTaskPriorities()
  const taskTagsApi = useTaskTags()
  const [activeModule, setActiveModule] = useState('agenda')
  const [currentDate, setCurrentDate] = useState(() => new Date())

  // Deleting a tag removes it from the managed list and from every event.
  const handleDeleteTag = (tag) => {
    tagsApi.removeTag(tag)
    eventsApi.removeTagFromAllEvents(tag)
  }

  // Deleting a task tag/priority removes it from the managed list and clears
  // it from every task that referenced it.
  const handleDeleteTaskTag = (id) => {
    taskTagsApi.deleteTag(id)
    tasksApi.removeTagFromAllTasks(id)
  }

  const handleDeleteTaskPriority = (id) => {
    taskPrioritiesApi.deletePriority(id)
    tasksApi.removePriorityFromAllTasks(id)
  }

  // Deleting a status (only allowed when more than one remains — enforced in
  // useTaskStatuses) reassigns its tasks to whichever status is now first.
  const handleDeleteTaskStatus = (id) => {
    const fallback = taskStatusesApi.statuses.find((s) => s.id !== id)?.id
    taskStatusesApi.deleteStatus(id)
    if (fallback) tasksApi.reassignStatusOnAllTasks(id, fallback)
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const doneStatusIds = new Set(taskStatusesApi.statuses.filter((s) => s.isDone).map((s) => s.id))
  const overdueOrTodayCount = tasksApi.tasks.filter(
    (t) => t.dueDate && t.dueDate <= todayStr && !doneStatusIds.has(t.status)
  ).length

  return (
    <div className="flex h-full flex-col bg-app-bg text-text">
      <Topbar theme={theme} onToggleTheme={toggleTheme} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeModule={activeModule}
          onSelectModule={setActiveModule}
          currentDate={currentDate}
          onSelectDate={setCurrentDate}
          badges={{ todos: overdueOrTodayCount }}
        />
        <main className="flex-1 overflow-hidden">
          {activeModule === 'agenda' ? (
            <Agenda
              currentDate={currentDate}
              onChangeDate={setCurrentDate}
              {...eventsApi}
              allTags={tagsApi.tags}
              onCreateTag={tagsApi.addTag}
              onDeleteTag={handleDeleteTag}
            />
          ) : activeModule === 'planning' ? (
            <Planejamento {...planningApi} />
          ) : activeModule === 'todos' ? (
            <Tarefas
              tasks={tasksApi.tasks}
              addTask={tasksApi.addTask}
              updateTask={tasksApi.updateTask}
              deleteTask={tasksApi.deleteTask}
              setTaskStatus={tasksApi.setTaskStatus}
              priorities={taskPrioritiesApi.priorities}
              addPriority={taskPrioritiesApi.addPriority}
              updatePriority={taskPrioritiesApi.updatePriority}
              onDeletePriority={handleDeleteTaskPriority}
              reorderPriorities={taskPrioritiesApi.reorderPriorities}
              tags={taskTagsApi.tags}
              onCreateTag={taskTagsApi.addTag}
              updateTag={taskTagsApi.updateTag}
              onDeleteTag={handleDeleteTaskTag}
              reorderTags={taskTagsApi.reorderTags}
              statuses={taskStatusesApi.statuses}
              addStatus={taskStatusesApi.addStatus}
              updateStatus={taskStatusesApi.updateStatus}
              setStatusDone={taskStatusesApi.setStatusDone}
              onDeleteStatus={handleDeleteTaskStatus}
              reorderStatuses={taskStatusesApi.reorderStatuses}
            />
          ) : (
            <ModulePlaceholder module={activeModule} />
          )}
        </main>
      </div>
    </div>
  )
}

const MODULE_NAMES = {
  finance: 'Finanças',
}

function ModulePlaceholder({ module }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-text-muted">
      <Construction size={40} strokeWidth={1.5} />
      <p className="text-base font-semibold text-text-secondary">
        {MODULE_NAMES[module] || 'Módulo'}
      </p>
      <p className="text-sm">Em construção</p>
    </div>
  )
}
