import { useEditableList } from '../storage/useEditableList'
import { taskPrioritiesStore } from '../storage/stores'

// User-editable, reorderable priority list for Tarefas — array order is the
// rank (first = highest).
export function useTaskPriorities() {
  const { items, add, update, remove, reorder } = useEditableList(taskPrioritiesStore, 'prio')
  return {
    priorities: items,
    addPriority: add,
    updatePriority: update,
    deletePriority: remove,
    reorderPriorities: reorder,
  }
}
