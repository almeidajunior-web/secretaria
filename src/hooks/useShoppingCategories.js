import { useEditableList } from '../storage/useEditableList'
import { shoppingCategoriesStore } from '../storage/stores'

// User-editable, reorderable classification list for Compras — its own domain,
// independent from every other module's lists.
export function useShoppingCategories() {
  const { items, add, update, remove, reorder } = useEditableList(shoppingCategoriesStore, 'shopcat')
  return {
    categories: items,
    addCategory: add,
    updateCategory: update,
    deleteCategory: remove,
    reorderCategories: reorder,
  }
}
