import { useMemo, useState } from 'react'
import { buildShoppingComparator, rankMap } from '../../lib/shoppingSort'
import { groupItemsByCategory } from '../../lib/shoppingGroups'
import ComprasToolbar from './ComprasToolbar'
import ComprasListView from './ComprasListView'
import ShoppingSettingsModal from './ShoppingSettingsModal'

function filterItems(items, filters) {
  return items.filter((it) => {
    if (filters.categoryIds.length && !filters.categoryIds.includes(it.categoryId)) return false
    if (filters.priorityIds.length && !filters.priorityIds.includes(it.priorityId)) return false
    if (filters.hidePurchased && it.purchased) return false
    return true
  })
}

const DEFAULT_FILTERS = { categoryIds: [], priorityIds: [], hidePurchased: true }

// Compras module: a single flat/grouped list, no modal anywhere — every
// field is editable inline (title, classificação, prioridade, descrição via
// a small popover) or via the quick-add row. Deleting an item is immediate,
// no confirmation (unlike Tarefas), and items checked off auto-delete the
// day after they were marked purchased (see useShoppingItems).
export default function Compras({
  items,
  addItem,
  updateItem,
  deleteItem,
  togglePurchased,
  categories,
  addCategory,
  updateCategory,
  onDeleteCategory,
  reorderCategories,
  priorities,
  addPriority,
  updatePriority,
  onDeletePriority,
  reorderPriorities,
}) {
  const [sortChain, setSortChain] = useState([])
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [groupByCategory, setGroupByCategory] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())

  const toggleSort = (field) => {
    setSortChain((prev) => {
      const idx = prev.findIndex((s) => s.field === field)
      if (idx === -1) return [...prev, { field, direction: 'asc' }]
      if (prev[idx].direction === 'asc') {
        const next = [...prev]
        next[idx] = { field, direction: 'desc' }
        return next
      }
      return prev.filter((s) => s.field !== field)
    })
  }

  const toggleFilter = (dimension, value) => {
    setFilters((prev) => {
      const list = prev[dimension]
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
      return { ...prev, [dimension]: next }
    })
  }

  const toggleSelectMode = () => {
    setSelectMode((v) => !v)
    setSelectedIds(new Set())
  }

  const toggleSelectItem = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const priorityRank = useMemo(() => rankMap(priorities), [priorities])
  const categoryLabelById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.label])),
    [categories]
  )
  const comparator = useMemo(
    () => buildShoppingComparator(sortChain, priorityRank, categoryLabelById),
    [sortChain, priorityRank, categoryLabelById]
  )

  const visibleItems = useMemo(() => filterItems(items, filters), [items, filters])
  const sortedItems = useMemo(() => [...visibleItems].sort(comparator), [visibleItems, comparator])

  const groups = useMemo(
    () =>
      groupByCategory
        ? groupItemsByCategory(sortedItems, categories)
        : [{ key: 'all', label: null, items: sortedItems }],
    [groupByCategory, sortedItems, categories]
  )

  const selectAllVisible = () => setSelectedIds(new Set(sortedItems.map((it) => it.id)))
  const clearSelection = () => setSelectedIds(new Set())

  const bulkSetCategory = (categoryId) => {
    selectedIds.forEach((id) => updateItem({ id, categoryId: categoryId || null }))
  }
  const bulkSetPriority = (priorityId) => {
    selectedIds.forEach((id) => updateItem({ id, priorityId: priorityId || null }))
  }
  const bulkTogglePurchased = (purchased) => {
    selectedIds.forEach((id) => togglePurchased(id, purchased))
  }
  const bulkDelete = () => {
    selectedIds.forEach((id) => deleteItem(id))
    toggleSelectMode()
  }

  const handleQuickAdd = (partial) => {
    addItem({
      title: '',
      description: '',
      categoryId: null,
      priorityId: null,
      purchased: false,
      purchasedDate: null,
      ...partial,
    })
  }

  return (
    <div className="flex h-full flex-col">
      <ComprasToolbar
        sortChain={sortChain}
        onToggleSort={toggleSort}
        filters={filters}
        onToggleFilter={toggleFilter}
        onToggleHidePurchased={() => setFilters((f) => ({ ...f, hidePurchased: !f.hidePurchased }))}
        onClearFilters={() => setFilters(DEFAULT_FILTERS)}
        categories={categories}
        priorities={priorities}
        groupByCategory={groupByCategory}
        onToggleGroupByCategory={() => setGroupByCategory((v) => !v)}
        onManageClick={() => setSettingsOpen(true)}
        selectMode={selectMode}
        onToggleSelectMode={toggleSelectMode}
        selectedCount={selectedIds.size}
        onSelectAll={selectAllVisible}
        onClearSelection={clearSelection}
        onBulkSetCategory={bulkSetCategory}
        onBulkSetPriority={bulkSetPriority}
        onBulkTogglePurchased={bulkTogglePurchased}
        onBulkDeleteClick={bulkDelete}
      />

      <div className="flex-1 overflow-hidden">
        <ComprasListView
          groups={groups}
          categories={categories}
          priorities={priorities}
          onToggle={togglePurchased}
          onUpdateItem={updateItem}
          onDeleteClick={deleteItem}
          selectMode={selectMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelectItem}
          onQuickAdd={handleQuickAdd}
        />
      </div>

      {settingsOpen && (
        <ShoppingSettingsModal
          categories={categories}
          onAddCategory={addCategory}
          onUpdateCategory={updateCategory}
          onDeleteCategory={onDeleteCategory}
          onReorderCategories={reorderCategories}
          priorities={priorities}
          onAddPriority={addPriority}
          onUpdatePriority={updatePriority}
          onDeletePriority={onDeletePriority}
          onReorderPriorities={reorderPriorities}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
