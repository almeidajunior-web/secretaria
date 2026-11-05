import { useEditableList } from '../storage/useEditableList'
import { financeExpenseCategoriesStore } from '../storage/stores'

// Expense categories for Finanças. Kept apart from income categories on
// purpose: "Salário" next to "Moradia" in one list makes no sense.
export function useFinanceExpenseCategories() {
  const { items, add, update, remove, reorder } = useEditableList(financeExpenseCategoriesStore, 'fincat_exp')
  return {
    categories: items,
    addCategory: add,
    updateCategory: update,
    deleteCategory: remove,
    reorderCategories: reorder,
  }
}
