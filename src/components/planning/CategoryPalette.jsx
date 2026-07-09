import { Eraser, Settings } from 'lucide-react'

export const ERASER = '__eraser__'

// Brush selector + legend: click a category to arm it as the active brush,
// then click/drag cells in the grid to paint them. Also exposes an eraser
// brush and an entry point to the category manager.
export default function CategoryPalette({ categories, activeBrush, onSelectBrush, onManageClick }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
      {categories.map((cat) => {
        const selected = activeBrush === cat.id
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectBrush(cat.id)}
            className={[
              'inline-flex items-center gap-1.5 rounded-full border py-1 pl-1.5 pr-3 text-xs font-medium transition',
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
        aria-label="Gerenciar categorias"
        className="ml-auto flex h-7 w-7 items-center justify-center rounded-full text-text-muted hover:bg-accent-soft/50 hover:text-primary"
      >
        <Settings size={15} />
      </button>
    </div>
  )
}
