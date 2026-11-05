import { useStoredState } from './useStoredState'

let seq = 1

// The editable, reorderable lists every module manages in its settings —
// categories, priorities, tags, payment methods, accounts: items shaped
// { id, label, color, ...extra } whose array order is the order shown.
// `idPrefix` keeps the ids each list has always used.
export function useEditableList(store, idPrefix) {
  const [items, setItems] = useStoredState(store)

  // Returns the new id (computed outside the state updater) so a caller can
  // select the item right away — e.g. TagPickerPopover's "create and tick".
  const add = (label, color) => {
    const l = label.trim()
    if (!l) return null
    const id = `${idPrefix}_${Date.now()}_${seq++}`
    setItems((prev) => [...prev, { id, label: l, color }])
    return id
  }

  const update = (id, patch) => setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))

  const remove = (id) => setItems((prev) => prev.filter((x) => x.id !== id))

  const reorder = (newOrderIds) =>
    setItems((prev) => newOrderIds.map((id) => prev.find((x) => x.id === id)).filter(Boolean))

  return { items, setItems, add, update, remove, reorder }
}
