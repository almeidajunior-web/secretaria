import { useEditableList } from '../storage/useEditableList'
import { shoppingPrioritiesStore } from '../storage/stores'

// User-editable, reorderable priority list for Compras — array order is the
// rank (first = highest).
export function useShoppingPriorities() {
  const { items, add, update, remove, reorder } = useEditableList(shoppingPrioritiesStore, 'shopprio')
  return {
    priorities: items,
    addPriority: add,
    updatePriority: update,
    deletePriority: remove,
    reorderPriorities: reorder,
  }
}
