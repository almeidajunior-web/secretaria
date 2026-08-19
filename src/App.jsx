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
import { useFinanceEntries } from './hooks/useFinanceEntries'
import { useFinanceExpenseCategories } from './hooks/useFinanceExpenseCategories'
import { useFinanceIncomeCategories } from './hooks/useFinanceIncomeCategories'
import { useFinancePaymentMethods } from './hooks/useFinancePaymentMethods'
import { useFinanceAccounts } from './hooks/useFinanceAccounts'
import { useFinanceTags } from './hooks/useFinanceTags'
import { useFinanceCreditCard } from './hooks/useFinanceCreditCard'
import { useFinancePaidInvoices } from './hooks/useFinancePaidInvoices'
import { MODULE_DEFS } from './data/modules'
import Topbar from './components/layout/Topbar'
import ModulesSettingsModal from './components/layout/ModulesSettingsModal'
import PrivacyOverlay from './components/layout/PrivacyOverlay'
import ErrorBoundary from './components/common/ErrorBoundary'
import Agenda from './components/agenda/Agenda'
import Planejamento from './components/planning/Planejamento'
import Tarefas from './components/tasks/Tarefas'
import Compras from './components/shopping/Compras'
import Vencimentos from './components/dues/Vencimentos'
import Financas from './components/finance/Financas'

const MODULE_NAMES = Object.fromEntries(MODULE_DEFS.map((m) => [m.id, m.label]))

// Application shell: a top bar carrying both the brand and the module
// navigation, over the active module's full-width area. Module routing is kept
// in local state so future modules can be dropped in without restructuring.
export default function App() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
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
  const financeEntriesApi = useFinanceEntries()
  const financeExpenseCategoriesApi = useFinanceExpenseCategories()
  const financeIncomeCategoriesApi = useFinanceIncomeCategories()
  const financePaymentMethodsApi = useFinancePaymentMethods()
  const financeAccountsApi = useFinanceAccounts()
  const financeTagsApi = useFinanceTags()
  const financeCreditCardApi = useFinanceCreditCard()
  const financePaidInvoicesApi = useFinancePaidInvoices()
  const [activeModule, setActiveModule] = useState('agenda')
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [modulesSettingsOpen, setModulesSettingsOpen] = useState(false)

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

  // Deleting a Finanças list entry removes it from its managed list and
  // clears it from every entry that referenced it.
  const handleDeleteFinanceExpenseCategory = (id) => {
    financeExpenseCategoriesApi.deleteCategory(id)
    financeEntriesApi.removeCategoryFromAllEntries(id)
  }

  const handleDeleteFinanceIncomeCategory = (id) => {
    financeIncomeCategoriesApi.deleteCategory(id)
    financeEntriesApi.removeCategoryFromAllEntries(id)
  }

  const handleDeleteFinancePaymentMethod = (id) => {
    financePaymentMethodsApi.deleteMethod(id)
    financeEntriesApi.removePaymentMethodFromAllEntries(id)
  }

  const handleDeleteFinanceAccount = (id) => {
    financeAccountsApi.deleteAccount(id)
    financeEntriesApi.removeAccountFromAllEntries(id)
  }

  const handleDeleteFinanceTag = (id) => {
    financeTagsApi.deleteTag(id)
    financeEntriesApi.removeTagFromAllEntries(id)
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
    <div className="app-ground flex h-full flex-col text-text">
      <Topbar
        theme={theme}
        privacyHidden={privacyHidden}
        onTogglePrivacy={togglePrivacyMode}
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        moduleOrder={modulesConfigApi.order}
        hiddenModules={modulesConfigApi.hidden}
        badges={{ todos: overdueOrTodayCount, vencimentos: overdueOrTodayBillsCount }}
        onOpenSettings={() => setModulesSettingsOpen(true)}
      />
      {/* `relative` anchors PrivacyOverlay's `absolute inset-0`, which is why
          this wrapper stays even with a single child. */}
      <div className="relative flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden">
          <ErrorBoundary resetKey={activeModule}>
          {activeModule === 'agenda' ? (
            <Agenda
              currentDate={currentDate}
              onChangeDate={setCurrentDate}
              {...eventsApi}
              allTags={tagsApi.tags}
              onCreateTag={tagsApi.addTag}
              onDeleteTag={handleDeleteTag}
              isDark={isDark}
            />
          ) : activeModule === 'planning' ? (
            <Planejamento {...planningApi} isDark={isDark} />
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
            />
          ) : activeModule === 'finance' ? (
            <Financas
              entries={financeEntriesApi.entries}
              addEntry={financeEntriesApi.addEntry}
              updateEntry={financeEntriesApi.updateEntry}
              deleteEntry={financeEntriesApi.deleteEntry}
              duplicateEntry={financeEntriesApi.duplicateEntry}
              ensureNextOccurrences={financeEntriesApi.ensureNextOccurrences}
              expenseCategories={financeExpenseCategoriesApi.categories}
              addExpenseCategory={financeExpenseCategoriesApi.addCategory}
              updateExpenseCategory={financeExpenseCategoriesApi.updateCategory}
              onDeleteExpenseCategory={handleDeleteFinanceExpenseCategory}
              reorderExpenseCategories={financeExpenseCategoriesApi.reorderCategories}
              incomeCategories={financeIncomeCategoriesApi.categories}
              addIncomeCategory={financeIncomeCategoriesApi.addCategory}
              updateIncomeCategory={financeIncomeCategoriesApi.updateCategory}
              onDeleteIncomeCategory={handleDeleteFinanceIncomeCategory}
              reorderIncomeCategories={financeIncomeCategoriesApi.reorderCategories}
              paymentMethods={financePaymentMethodsApi.methods}
              addPaymentMethod={financePaymentMethodsApi.addMethod}
              updatePaymentMethod={financePaymentMethodsApi.updateMethod}
              onDeletePaymentMethod={handleDeleteFinancePaymentMethod}
              reorderPaymentMethods={financePaymentMethodsApi.reorderMethods}
              accounts={financeAccountsApi.accounts}
              addAccount={financeAccountsApi.addAccount}
              updateAccount={financeAccountsApi.updateAccount}
              onDeleteAccount={handleDeleteFinanceAccount}
              reorderAccounts={financeAccountsApi.reorderAccounts}
              tags={financeTagsApi.tags}
              addTag={financeTagsApi.addTag}
              updateTag={financeTagsApi.updateTag}
              onDeleteTag={handleDeleteFinanceTag}
              reorderTags={financeTagsApi.reorderTags}
              creditCardConfig={financeCreditCardApi.config}
              onUpdateCreditCardConfig={financeCreditCardApi.updateConfig}
              paidInvoices={financePaidInvoicesApi.paidSet}
              onToggleInvoicePaid={financePaidInvoicesApi.togglePaid}
            />
          ) : (
            <ModulePlaceholder module={activeModule} />
          )}
          </ErrorBoundary>
        </main>

        {privacyHidden && <PrivacyOverlay />}
      </div>

      {modulesSettingsOpen && (
        <ModulesSettingsModal
          order={modulesConfigApi.order}
          hidden={modulesConfigApi.hidden}
          onReorder={modulesConfigApi.reorderModules}
          onToggleVisibility={modulesConfigApi.toggleModuleVisibility}
          theme={theme}
          onToggleTheme={toggleTheme}
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
