import { useEditableList } from '../storage/useEditableList'
import { financeIncomeCategoriesStore } from '../storage/stores'

// Income categories for Finanças (see useFinanceExpenseCategories).
export function useFinanceIncomeCategories() {
  const { items, add, update, remove, reorder } = useEditableList(financeIncomeCategoriesStore, 'fincat_inc')
  return {
    categories: items,
    addCategory: add,
    updateCategory: update,
    deleteCategory: remove,
    reorderCategories: reorder,
  }
}
