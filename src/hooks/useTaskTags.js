import { useEditableList } from '../storage/useEditableList'
import { taskTagsStore } from '../storage/stores'

// User-editable, reorderable tag list for Tarefas — its own domain,
// independent from Agenda's plain-string tags.
export function useTaskTags() {
  const { items, add, update, remove, reorder } = useEditableList(taskTagsStore, 'tag')
  return {
    tags: items,
    addTag: add,
    updateTag: update,
    deleteTag: remove,
    reorderTags: reorder,
  }
}
