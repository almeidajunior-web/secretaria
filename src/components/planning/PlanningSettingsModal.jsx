import { useState } from 'react'
import { Plus, X, Trash2, Check, GripVertical } from 'lucide-react'
import { EVENT_COLORS } from '../../constants'
import { reorderIds } from '../../lib/reorderList'
import ConfirmDialog from '../common/ConfirmDialog'

const inputClass =
  'w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-[13px] text-text outline-none focus:border-primary'

const HOURS = Array.from({ length: 24 }, (_, h) => h)

// Planejamento settings: hour range, reorderable categories (add/edit/color/
// delete). Hour-range and category-delete edits that would discard existing
// grid data are confirmed first.
export default function PlanningSettingsModal({
  categories,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
  hourStart,
  hourEnd,
  onSetHourRange,
  windowsOutsideRange,
  onClose,
}) {
  const [pendingDelete, setPendingDelete] = useState(null)
  const [pendingRange, setPendingRange] = useState(null)
  const [creating, setCreating] = useState(false)
  const [newLabel, setNewLabel] = useState('')

  const confirmCreate = () => {
    const l = newLabel.trim()
    if (l) onAdd(l, EVENT_COLORS[categories.length % EVENT_COLORS.length])
    setNewLabel('')
    setCreating(false)
  }

  const requestRangeChange = (start, end) => {
    if (start >= end) return
    if (windowsOutsideRange(start, end)) {
      setPendingRange({ start, end })
    } else {
      onSetHourRange(start, end)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="thin-scroll max-h-[85vh] w-[420px] overflow-auto rounded-xl border border-border bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text">Configurações</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-text-muted hover:text-text"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 rounded-lg border border-border p-3">
          <p className="mb-2 text-[11px] font-medium text-text-secondary">Faixa de horário da grade</p>
          <div className="flex items-center gap-2">
            <select
              value={hourStart}
              onChange={(e) => requestRangeChange(Number(e.target.value), hourEnd)}
              className={inputClass}
            >
              {HOURS.filter((h) => h < hourEnd).map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}:00
                </option>
              ))}
            </select>
            <span className="shrink-0 text-xs text-text-muted">até</span>
            <select
              value={hourEnd}
              onChange={(e) => requestRangeChange(hourStart, Number(e.target.value))}
              className={inputClass}
            >
              {HOURS.filter((h) => h > hourStart).map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {categories.map((cat) => (
            <CategoryRow
              key={cat.id}
              category={cat}
              onUpdate={(patch) => onUpdate(cat.id, patch)}
              onDeleteClick={() => setPendingDelete(cat)}
              onDropCategory={(draggedId) =>
                onReorder(reorderIds(categories.map((c) => c.id), draggedId, cat.id))
              }
            />
          ))}
        </div>

        <div className="mt-4 border-t border-border pt-3">
          {creating ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    confirmCreate()
                  }
                  if (e.key === 'Escape') {
                    setNewLabel('')
                    setCreating(false)
                  }
                }}
                placeholder="Nova categoria"
                className={inputClass}
              />
              <button
                type="button"
                onClick={confirmCreate}
                aria-label="Confirmar nova categoria"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-primary hover:bg-accent-soft"
              >
                <Check size={15} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border-strong px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-primary hover:text-primary"
            >
              <Plus size={13} />
              Nova categoria
            </button>
          )}
        </div>
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title={`Excluir "${pendingDelete.label}"?`}
          message="As células da grade pintadas com esta categoria serão limpas. Esta ação não pode ser desfeita."
          confirmLabel="Excluir"
          onConfirm={() => {
            onDelete(pendingDelete.id)
            setPendingDelete(null)
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {pendingRange && (
        <ConfirmDialog
          title="Alterar faixa de horário?"
          message="Pinturas, divisões e descrições fora da nova faixa serão apagadas permanentemente. Esta ação não pode ser desfeita."
          confirmLabel="Alterar"
          onConfirm={() => {
            onSetHourRange(pendingRange.start, pendingRange.end)
            setPendingRange(null)
          }}
          onCancel={() => setPendingRange(null)}
        />
      )}
    </div>
  )
}

function CategoryRow({ category, onUpdate, onDeleteClick, onDropCategory }) {
  const [label, setLabel] = useState(category.label)

  const commitLabel = () => {
    const l = label.trim()
    if (l && l !== category.label) onUpdate({ label: l })
    else setLabel(category.label)
  }

  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-border p-2.5"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const draggedId = e.dataTransfer.getData('text/plain')
        if (draggedId) onDropCategory(draggedId)
      }}
    >
      <div className="flex items-center gap-2">
        <span
          draggable
          onDragStart={(e) => e.dataTransfer.setData('text/plain', category.id)}
          aria-label="Arrastar para reordenar"
          className="shrink-0 cursor-grab text-text-muted active:cursor-grabbing"
        >
          <GripVertical size={14} />
        </span>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={commitLabel}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className={inputClass}
        />
        <button
          type="button"
          onClick={onDeleteClick}
          aria-label={`Excluir categoria ${category.label}`}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-danger/15 hover:text-danger"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {EVENT_COLORS.map((c) => {
          const selected = c === category.color
          return (
            <button
              key={c}
              type="button"
              aria-label={`Cor ${c}`}
              onClick={() => onUpdate({ color: c })}
              style={{
                backgroundColor: c,
                transform: selected ? 'scale(1.15)' : 'none',
                borderColor: selected ? 'var(--c-text)' : 'transparent',
                borderWidth: selected ? '2.5px' : '2px',
              }}
              className="h-5 w-5 rounded-full border"
            />
          )
        })}
      </div>
    </div>
  )
}
