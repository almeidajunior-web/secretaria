import { format } from 'date-fns'
import { useEvents } from '../hooks/useEvents'
import { useTags } from '../hooks/useTags'
import { usePlanning } from '../hooks/usePlanning'
import { useTasks } from '../hooks/useTasks'
import { useTaskPriorities } from '../hooks/useTaskPriorities'
import { useTaskTags } from '../hooks/useTaskTags'
import { useTaskStatuses, canDeleteStatus } from '../hooks/useTaskStatuses'
import { useShoppingItems } from '../hooks/useShoppingItems'
import { useShoppingCategories } from '../hooks/useShoppingCategories'
import { useShoppingPriorities } from '../hooks/useShoppingPriorities'
import { useBills } from '../hooks/useBills'
import { useBillCategories } from '../hooks/useBillCategories'
import { useFinanceEntries } from '../hooks/useFinanceEntries'
import { useFinanceExpenseCategories } from '../hooks/useFinanceExpenseCategories'
import { useFinanceIncomeCategories } from '../hooks/useFinanceIncomeCategories'
import { useFinancePaymentMethods } from '../hooks/useFinancePaymentMethods'
import { useFinanceAccounts } from '../hooks/useFinanceAccounts'
import { useFinanceCreditCard } from '../hooks/useFinanceCreditCard'
import { useFinancePaidInvoices } from '../hooks/useFinancePaidInvoices'
import { useHabits } from '../hooks/useHabits'
import { useGoals } from '../hooks/useGoals'

// Every module's data and actions, assembled in one place: the domain hooks
// (each persisting itself — see src/storage), plus the few actions that cross
// lists, like deleting a category also clearing it from the items that used
// it. Returns, per module id, exactly the props that module's screen takes,
// and the counters the top bar shows. Keeping this apart from App.jsx leaves
// the shell about layout only — and gives another interface (the mobile
// version) the same data with no screen code attached.
export function useModuleData() {
  const eventsApi = useEvents()
  // Seed the tag list from tags already present on the events (first run only).
  const seedTags = [...new Set(eventsApi.events.flatMap((e) => e.tags || []))]
  const tagsApi = useTags(seedTags)
  const planningApi = usePlanning()
  const taskStatusesApi = useTaskStatuses()
  const tasksApi = useTasks(taskStatusesApi.statuses)
  const taskPrioritiesApi = useTaskPriorities()
  const taskTagsApi = useTaskTags()
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
  const financeCreditCardApi = useFinanceCreditCard()
  const financePaidInvoicesApi = useFinancePaidInvoices()
  const habitsApi = useHabits()
  const goalsApi = useGoals()
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
    // Checked here too, not only inside deleteStatus: when the deletion is
    // refused, the tasks must stay where they are rather than being moved
    // off a status that still exists.
    if (!canDeleteStatus(taskStatusesApi.statuses, id)) return
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

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const doneStatusIds = new Set(taskStatusesApi.statuses.filter((s) => s.isDone).map((s) => s.id))
  const overdueOrTodayCount = tasksApi.tasks.filter(
    (t) => t.dueDate && t.dueDate <= todayStr && !doneStatusIds.has(t.status)
  ).length
  const overdueOrTodayBillsCount = billsApi.bills.filter(
    (b) => !b.paid && b.dueDate && b.dueDate <= todayStr
  ).length

  const agenda = {
    ...eventsApi,
    allTags: tagsApi.tags,
    onCreateTag: tagsApi.addTag,
    onDeleteTag: handleDeleteTag,
    tasks: tasksApi.tasks,
    doneStatusIds,
    taskPriorities: taskPrioritiesApi.priorities,
    bills: billsApi.bills,
    billCategories: billCategoriesApi.categories,
  }
  const planning = planningApi
  const todos = {
    tasks: tasksApi.tasks,
    addTask: tasksApi.addTask,
    updateTask: tasksApi.updateTask,
    deleteTask: tasksApi.deleteTask,
    setTaskStatus: tasksApi.setTaskStatus,
    priorities: taskPrioritiesApi.priorities,
    addPriority: taskPrioritiesApi.addPriority,
    updatePriority: taskPrioritiesApi.updatePriority,
    onDeletePriority: handleDeleteTaskPriority,
    reorderPriorities: taskPrioritiesApi.reorderPriorities,
    tags: taskTagsApi.tags,
    onCreateTag: taskTagsApi.addTag,
    updateTag: taskTagsApi.updateTag,
    onDeleteTag: handleDeleteTaskTag,
    reorderTags: taskTagsApi.reorderTags,
    statuses: taskStatusesApi.statuses,
    addStatus: taskStatusesApi.addStatus,
    updateStatus: taskStatusesApi.updateStatus,
    setStatusDone: taskStatusesApi.setStatusDone,
    onDeleteStatus: handleDeleteTaskStatus,
    reorderStatuses: taskStatusesApi.reorderStatuses,
  }
  const compras = {
    items: shoppingItemsApi.items,
    addItem: shoppingItemsApi.addItem,
    updateItem: shoppingItemsApi.updateItem,
    deleteItem: shoppingItemsApi.deleteItem,
    togglePurchased: shoppingItemsApi.togglePurchased,
    categories: shoppingCategoriesApi.categories,
    addCategory: shoppingCategoriesApi.addCategory,
    updateCategory: shoppingCategoriesApi.updateCategory,
    onDeleteCategory: handleDeleteShoppingCategory,
    reorderCategories: shoppingCategoriesApi.reorderCategories,
    priorities: shoppingPrioritiesApi.priorities,
    addPriority: shoppingPrioritiesApi.addPriority,
    updatePriority: shoppingPrioritiesApi.updatePriority,
    onDeletePriority: handleDeleteShoppingPriority,
    reorderPriorities: shoppingPrioritiesApi.reorderPriorities,
  }
  const vencimentos = {
    bills: billsApi.bills,
    addBill: billsApi.addBill,
    updateBill: billsApi.updateBill,
    deleteBill: billsApi.deleteBill,
    togglePaid: billsApi.togglePaid,
    categories: billCategoriesApi.categories,
    addCategory: billCategoriesApi.addCategory,
    updateCategory: billCategoriesApi.updateCategory,
    onDeleteCategory: handleDeleteBillCategory,
    reorderCategories: billCategoriesApi.reorderCategories,
  }
  const finance = {
    entries: financeEntriesApi.entries,
    addEntry: financeEntriesApi.addEntry,
    updateEntry: financeEntriesApi.updateEntry,
    deleteEntry: financeEntriesApi.deleteEntry,
    duplicateEntry: financeEntriesApi.duplicateEntry,
    ensureNextOccurrences: financeEntriesApi.ensureNextOccurrences,
    expenseCategories: financeExpenseCategoriesApi.categories,
    addExpenseCategory: financeExpenseCategoriesApi.addCategory,
    updateExpenseCategory: financeExpenseCategoriesApi.updateCategory,
    onDeleteExpenseCategory: handleDeleteFinanceExpenseCategory,
    reorderExpenseCategories: financeExpenseCategoriesApi.reorderCategories,
    incomeCategories: financeIncomeCategoriesApi.categories,
    addIncomeCategory: financeIncomeCategoriesApi.addCategory,
    updateIncomeCategory: financeIncomeCategoriesApi.updateCategory,
    onDeleteIncomeCategory: handleDeleteFinanceIncomeCategory,
    reorderIncomeCategories: financeIncomeCategoriesApi.reorderCategories,
    paymentMethods: financePaymentMethodsApi.methods,
    addPaymentMethod: financePaymentMethodsApi.addMethod,
    updatePaymentMethod: financePaymentMethodsApi.updateMethod,
    onDeletePaymentMethod: handleDeleteFinancePaymentMethod,
    reorderPaymentMethods: financePaymentMethodsApi.reorderMethods,
    accounts: financeAccountsApi.accounts,
    addAccount: financeAccountsApi.addAccount,
    updateAccount: financeAccountsApi.updateAccount,
    onDeleteAccount: handleDeleteFinanceAccount,
    reorderAccounts: financeAccountsApi.reorderAccounts,
    creditCardConfig: financeCreditCardApi.config,
    onUpdateCreditCardConfig: financeCreditCardApi.updateConfig,
    paidInvoices: financePaidInvoicesApi.paidSet,
    onToggleInvoicePaid: financePaidInvoicesApi.togglePaid,
  }
  const metas = {
    habits: habitsApi.habits,
    habitLog: habitsApi.habitLog,
    addHabit: habitsApi.addHabit,
    updateHabit: habitsApi.updateHabit,
    deleteHabit: habitsApi.deleteHabit,
    cycleCell: habitsApi.cycleCell,
    reorderHabits: habitsApi.reorderHabits,
    goals: goalsApi.goals,
    addGoal: goalsApi.addGoal,
    updateGoal: goalsApi.updateGoal,
    deleteGoal: goalsApi.deleteGoal,
    setGoalStatus: goalsApi.setGoalStatus,
  }

  return {
    modules: { agenda, planning, todos, compras, vencimentos, finance, metas },
    badges: { todos: overdueOrTodayCount, vencimentos: overdueOrTodayBillsCount },
  }
}
