import { useState } from 'react'
import { format } from 'date-fns'
import { Construction } from 'lucide-react'
import { useTheme } from './hooks/useTheme'
import { usePrivacyMode } from './hooks/usePrivacyMode'
import { useEvents } from './hooks/useEvents'
import { useTags } from './hooks/useTags'
import { usePlanning } from './hooks/usePlanning'
import { useTasks } from './hooks/useTasks'
import { useTaskPriorities } from './hooks/useTaskPriorities'
import { useTaskTags } from './hooks/useTaskTags'
import { useTaskStatuses } from './hooks/useTaskStatuses'
import { useModulesConfig } from './hooks/useModulesConfig'
import { useShoppingItems } from './hooks/useShoppingItems'
import { useShoppingCategories } from './hooks/useShoppingCategories'
import { useShoppingPriorities } from './hooks/useShoppingPriorities'
import { useBills } from './hooks/useBills'
import { useBillCategories } from './hooks/useBillCategories'
import { MODULE_DEFS } from './data/modules'
import Topbar from './components/layout/Topbar'
import Sidebar from './components/layout/Sidebar'
import ModulesSettingsModal from './components/layout/ModulesSettingsModal'
import PrivacyOverlay from './components/layout/PrivacyOverlay'
import Agenda from './components/agenda/Agenda'
import Planejamento from './components/planning/Planejamento'
import Tarefas from './components/tasks/Tarefas'
import Compras from './components/shopping/Compras'
import Vencimentos from './components/dues/Vencimentos'

const MODULE_NAMES = Object.fromEntries(MODULE_DEFS.map((m) => [m.id, m.label]))

// Application shell: top bar + sidebar + active module area. Module routing is
// kept in local state so future modules (Finanças) can be dropped in without
// restructuring.
export default function App() {
  const { theme, toggleTheme } = useTheme()
  const { hidden: privacyHidden, togglePrivacyMode } = usePrivacyMode()
  const eventsApi = useEvents()
  // Seed the tag list from tags already present on the events (first run only).
  const seedTags = [...new Set(eventsApi.events.flatMap((e) => e.tags || []))]
  const tagsApi = useTags(seedTags)
  const planningApi = usePlanning()
  const taskStatusesApi = useTaskStatuses()
  const tasksApi = useTasks(taskStatusesApi.statuses)
  const taskPrioritiesApi = useTaskPriorities()
  const taskTagsApi = useTaskTags()
  const modulesConfigApi = useModulesConfig()
  const shoppingItemsApi = useShoppingItems()
  const shoppingCategoriesApi = useShoppingCategories()
  const shoppingPrioritiesApi = useShoppingPriorities()
  const billsApi = useBills()
  const billCategoriesApi = useBillCategories()
  const [activeModule, setActiveModule] = useState('agenda')
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [modulesSettingsOpen, setModulesSettingsOpen] = useState(false)
  // Set only by the Agenda's per-day "Tarefas"/"Venc." quick links — seeds
  // the target module's date filter the moment it mounts. Manual sidebar
  // navigation always clears both first, so a stale date never leaks into
  // a later visit.
  const [taskDateFilter, setTaskDateFilter] = useState(null)
  const [billDateFilter, setBillDateFilter] = useState(null)

  const handleSelectModule = (id) => {
    setActiveModule(id)
    setTaskDateFilter(null)
    setBillDateFilter(null)
  }

  const handleOpenTasksForDate = (dateStr) => {
    setTaskDateFilter(dateStr)
    setActiveModule('todos')
  }

  const handleOpenDuesForDate = (dateStr) => {
    setBillDateFilter(dateStr)
    setActiveModule('vencimentos')
  }

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

  // Deleting a shopping category/priority removes it from the managed list
  // and clears it from every item that referenced it.
  const handleDeleteShoppingCategory = (id) => {
    shoppingCategoriesApi.deleteCategory(id)
    shoppingItemsApi.removeCategoryFromAllItems(id)
  }

  const handleDeleteShoppingPriority = (id) => {
    shoppingPrioritiesApi.deletePriority(id)
    shoppingItemsApi.removePriorityFromAllItems(id)
  }

  // Deleting a bill category removes it from the managed list and clears it
  // from every bill that referenced it.
  const handleDeleteBillCategory = (id) => {
    billCategoriesApi.deleteCategory(id)
    billsApi.removeCategoryFromAllBills(id)
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const doneStatusIds = new Set(taskStatusesApi.statuses.filter((s) => s.isDone).map((s) => s.id))
  const overdueOrTodayCount = tasksApi.tasks.filter(
    (t) => t.dueDate && t.dueDate <= todayStr && !doneStatusIds.has(t.status)
  ).length
  const overdueOrTodayBillsCount = billsApi.bills.filter(
    (b) => !b.paid && b.dueDate && b.dueDate <= todayStr
  ).length

  return (
    <div className="flex h-full flex-col bg-app-bg text-text">
      <Topbar
        theme={theme}
        onToggleTheme={toggleTheme}
        privacyHidden={privacyHidden}
        onTogglePrivacy={togglePrivacyMode}
      />
      <div className="relative flex flex-1 overflow-hidden">
        <Sidebar
          activeModule={activeModule}
          onSelectModule={handleSelectModule}
          currentDate={currentDate}
          onSelectDate={setCurrentDate}
          badges={{ todos: overdueOrTodayCount, vencimentos: overdueOrTodayBillsCount }}
          moduleOrder={modulesConfigApi.order}
          hiddenModules={modulesConfigApi.hidden}
          onOpenSettings={() => setModulesSettingsOpen(true)}
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
              onNavigateToTasks={handleOpenTasksForDate}
              onNavigateToDues={handleOpenDuesForDate}
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
              initialDateFilter={taskDateFilter}
            />
          ) : activeModule === 'compras' ? (
            <Compras
              items={shoppingItemsApi.items}
              addItem={shoppingItemsApi.addItem}
              updateItem={shoppingItemsApi.updateItem}
              deleteItem={shoppingItemsApi.deleteItem}
              togglePurchased={shoppingItemsApi.togglePurchased}
              categories={shoppingCategoriesApi.categories}
              addCategory={shoppingCategoriesApi.addCategory}
              updateCategory={shoppingCategoriesApi.updateCategory}
              onDeleteCategory={handleDeleteShoppingCategory}
              reorderCategories={shoppingCategoriesApi.reorderCategories}
              priorities={shoppingPrioritiesApi.priorities}
              addPriority={shoppingPrioritiesApi.addPriority}
              updatePriority={shoppingPrioritiesApi.updatePriority}
              onDeletePriority={handleDeleteShoppingPriority}
              reorderPriorities={shoppingPrioritiesApi.reorderPriorities}
            />
          ) : activeModule === 'vencimentos' ? (
            <Vencimentos
              bills={billsApi.bills}
              addBill={billsApi.addBill}
              updateBill={billsApi.updateBill}
              deleteBill={billsApi.deleteBill}
              togglePaid={billsApi.togglePaid}
              categories={billCategoriesApi.categories}
              addCategory={billCategoriesApi.addCategory}
              updateCategory={billCategoriesApi.updateCategory}
              onDeleteCategory={handleDeleteBillCategory}
              reorderCategories={billCategoriesApi.reorderCategories}
              initialDateFilter={billDateFilter}
            />
          ) : (
            <ModulePlaceholder module={activeModule} />
          )}
        </main>

        {privacyHidden && <PrivacyOverlay />}
      </div>

      {modulesSettingsOpen && (
        <ModulesSettingsModal
          order={modulesConfigApi.order}
          hidden={modulesConfigApi.hidden}
          onReorder={modulesConfigApi.reorderModules}
          onToggleVisibility={modulesConfigApi.toggleModuleVisibility}
          onClose={() => setModulesSettingsOpen(false)}
        />
      )}
    </div>
  )
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
