import { useState } from 'react'
import CategoryPalette from './CategoryPalette'
import PlanningGrid from './PlanningGrid'
import CategoryManagerModal from './CategoryManagerModal'

// Planejamento module: a single fixed weekly grid representing the user's
// default routine (no dates, no navigation) — painted cell-by-cell with a
// brush selected from a user-editable category list. Fully independent from
// the Agenda module.
export default function Planejamento({
  categories,
  grid,
  paintCell,
  addCategory,
  updateCategory,
  deleteCategory,
}) {
  const [activeBrush, setActiveBrush] = useState(null)
  const [managerOpen, setManagerOpen] = useState(false)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-base font-semibold text-text">Planejamento</h1>
      </div>

      <CategoryPalette
        categories={categories}
        activeBrush={activeBrush}
        onSelectBrush={setActiveBrush}
        onManageClick={() => setManagerOpen(true)}
      />

      <div className="flex-1 overflow-hidden">
        <PlanningGrid
          categories={categories}
          grid={grid}
          activeBrush={activeBrush}
          onPaintCell={paintCell}
        />
      </div>

      {managerOpen && (
        <CategoryManagerModal
          categories={categories}
          onAdd={addCategory}
          onUpdate={updateCategory}
          onDelete={deleteCategory}
          onClose={() => setManagerOpen(false)}
        />
      )}
    </div>
  )
}
