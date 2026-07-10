import { Eraser, Settings } from 'lucide-react'
import { reorderIds } from '../../lib/reorderList'
import { categoryHours, formatHours } from '../../lib/planningGrid'

export const ERASER = '__eraser__'

// Brush selector + legend: click a category to arm it as the active brush,
// then click/drag cells in the grid to paint them. Chips are also
// hold-and-drag reorderable (native HTML5 drag-and-drop — a plain click
// without movement still just arms the brush). Also exposes an eraser brush
// and an entry point to the settings modal. Each chip shows its current
// weekly total ("Categoria • 12h") once it has any time painted.
export default function CategoryPalette({ categories, grid, activeBrush, onSelectBrush, onReorder, onManageClick }) {
  const hours = categoryHours(grid)

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
      {categories.map((cat) => {
        const selected = activeBrush === cat.id
        const catHours = hours[cat.id] || 0
        return (
          <button
            key={cat.id}
            type="button"
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', cat.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const draggedId = e.dataTransfer.getData('text/plain')
              if (draggedId && draggedId !== cat.id) {
                onReorder(reorderIds(categories.map((c) => c.id), draggedId, cat.id))
              }
            }}
            onClick={() => onSelectBrush(cat.id)}
            className={[
              'inline-flex cursor-grab items-center gap-1.5 rounded-full border py-1 pl-1.5 pr-3 text-xs font-medium transition active:cursor-grabbing',
              selected
                ? 'border-primary bg-accent-soft text-primary'
                : 'border-border text-text-secondary hover:border-border-strong',
            ].join(' ')}
          >
            <span
              className="h-4 w-4 shrink-0 rounded-full border"
              style={{
                backgroundColor: cat.color,
                borderColor: selected ? 'var(--c-text)' : 'transparent',
                transform: selected ? 'scale(1.1)' : 'none',
              }}
            />
            {cat.label}
            {catHours > 0 && <span className="opacity-70">{' • '}{formatHours(catHours)}</span>}
          </button>
        )
      })}

      <button
        type="button"
        onClick={() => onSelectBrush(ERASER)}
        className={[
          'inline-flex items-center gap-1.5 rounded-full border border-dashed py-1 pl-2 pr-3 text-xs font-medium',
          activeBrush === ERASER
            ? 'border-primary text-primary'
            : 'border-border-strong text-text-secondary hover:text-primary',
        ].join(' ')}
      >
        <Eraser size={13} />
        Limpar
      </button>

      <button
        type="button"
        onClick={onManageClick}
        aria-label="Configurações"
        className="ml-auto flex h-7 w-7 items-center justify-center rounded-full text-text-muted hover:bg-accent-soft/50 hover:text-primary"
      >
        <Settings size={15} />
      </button>
    </div>
  )
}
