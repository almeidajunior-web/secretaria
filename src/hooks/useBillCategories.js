import { useEditableList } from '../storage/useEditableList'
import { billCategoriesStore } from '../storage/stores'

// User-editable, reorderable classification list for Vencimentos — its own
// domain.
export function useBillCategories() {
  const { items, add, update, remove, reorder } = useEditableList(billCategoriesStore, 'duecat')
  return {
    categories: items,
    addCategory: add,
    updateCategory: update,
    deleteCategory: remove,
    reorderCategories: reorder,
  }
}
