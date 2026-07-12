import { useState } from 'react'
import { Plus, X, Trash2, Check, GripVertical } from 'lucide-react'
import { EVENT_COLORS } from '../../constants'
import { reorderIds } from '../../lib/reorderList'
import ConfirmDialog from './ConfirmDialog'

const inputClass =
  'w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-[13px] text-text outline-none focus:border-primary'

// Generic add/edit-color/delete-with-confirm/drag-to-reorder list editor,
// shared by every settings modal that manages a simple {id,label,color}
// list (Tarefas' priorities/tags/status, Compras' categories/priorities).
// `isItemDeletable(item)` lets a caller veto deleting a specific item beyond
// the plain `minItems` count guard (e.g. "can't delete the only status that
// counts as done"). `renderExtra(item)` appends caller-specific controls
// (e.g. Tarefas' "conta como concluída" checkbox) to the color-swatch row.
export default function EditableListSection({
  title,
  hint,
  items,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
  addLabel,
  deleteWarning,
  minItems = 0,
  isItemDeletable,
  isItemLabelLocked,
  renderExtra,
  hideColor = false,
}) {
  const [pendingDelete, setPendingDelete] = useState(null)
  const [creating, setCreating] = useState(false)
  const [newLabel, setNewLabel] = useState('')

  const confirmCreate = () => {
    const l = newLabel.trim()
    if (l) onAdd(l, EVENT_COLORS[items.length % EVENT_COLORS.length])
    setNewLabel('')
    setCreating(false)
  }

  return (
    <div className="mb-5">
      <p className="mb-2 text-[11px] font-medium text-text-secondary">
        {title} {hint && <span className="font-normal text-text-muted">({hint})</span>}
      </p>

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <EditableRow
            key={item.id}
            item={item}
            onUpdate={(patch) => onUpdate(item.id, patch)}
            onDeleteClick={() => setPendingDelete(item)}
            canDelete={items.length > minItems && (isItemDeletable ? isItemDeletable(item) : true)}
            onDrop={(draggedId) =>
              onReorder(reorderIds(items.map((x) => x.id), draggedId, item.id))
            }
            extra={renderExtra ? renderExtra(item) : null}
            hideColor={hideColor}
            labelLocked={isItemLabelLocked ? isItemLabelLocked(item) : false}
          />
        ))}
      </div>

      <div className="mt-2">
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
              placeholder={addLabel}
              className={inputClass}
            />
            <button
              type="button"
              onClick={confirmCreate}
              aria-label={`Confirmar ${addLabel}`}
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
            {addLabel}
          </button>
        )}
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title={`Excluir "${pendingDelete.label}"?`}
          message={`${deleteWarning(pendingDelete)} Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          onConfirm={() => {
            onDelete(pendingDelete.id)
            setPendingDelete(null)
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}

function EditableRow({ item, onUpdate, onDeleteClick, canDelete, onDrop, extra, hideColor, labelLocked }) {
  const [label, setLabel] = useState(item.label)

  const commitLabel = () => {
    const l = label.trim()
    if (l && l !== item.label) onUpdate({ label: l })
    else setLabel(item.label)
  }

  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-border p-2.5"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const draggedId = e.dataTransfer.getData('text/plain')
        if (draggedId) onDrop(draggedId)
      }}
    >
      <div className="flex items-center gap-2">
        <span
          draggable
          onDragStart={(e) => e.dataTransfer.setData('text/plain', item.id)}
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
          disabled={labelLocked}
          className={[inputClass, labelLocked ? 'cursor-default opacity-70' : ''].join(' ')}
        />
        <button
          type="button"
          onClick={onDeleteClick}
          disabled={!canDelete}
          aria-label={`Excluir ${item.label}`}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-danger/15 hover:text-danger disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Trash2 size={14} />
        </button>
      </div>
      {(!hideColor || extra) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {!hideColor &&
            EVENT_COLORS.map((c) => {
              const selected = c === item.color
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
          {extra}
        </div>
      )}
    </div>
  )
}
