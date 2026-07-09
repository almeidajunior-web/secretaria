// Returns a new array of ids with `draggedId` moved to just before `targetId`.
// Shared by any drag-to-reorder UI (category palette, category manager list).
export function reorderIds(ids, draggedId, targetId) {
  if (draggedId === targetId) return ids
  const without = ids.filter((id) => id !== draggedId)
  const targetIndex = without.indexOf(targetId)
  if (targetIndex === -1) return ids
  return [...without.slice(0, targetIndex), draggedId, ...without.slice(targetIndex)]
}
