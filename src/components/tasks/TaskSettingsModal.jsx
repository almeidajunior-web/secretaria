import { useState } from 'react'
import { Plus, X, Trash2, Check, GripVertical } from 'lucide-react'
import { EVENT_COLORS } from '../../constants'
import { reorderIds } from '../../lib/reorderList'
import ConfirmDialog from '../common/ConfirmDialog'

const inputClass =
  'w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-[13px] text-text outline-none focus:border-primary'

// Manage Tarefas' three customizable lists — Prioridades, Tags and Status —
// with the same add/edit-color/delete/drag-to-reorder pattern for each
// (mirrors Planejamento's category manager). Status additionally exposes an
// "isDone" toggle per row, since that flag drives recurrence rollover and
// the hide-finished filter elsewhere in the module.
export default function TaskSettingsModal({
  priorities,
  onAddPriority,
  onUpdatePriority,
  onDeletePriority,
  onReorderPriorities,
  tags,
  onAddTag,
  onUpdateTag,
  onDeleteTag,
  onReorderTags,
  statuses,
  onAddStatus,
  onUpdateStatus,
  onSetStatusDone,
  onDeleteStatus,
  onReorderStatuses,
  onClose,
}) {
  const onlyDoneStatusId =
    statuses.filter((s) => s.isDone).length === 1 ? statuses.find((s) => s.isDone)?.id : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="thin-scroll max-h-[85vh] w-[440px] overflow-auto rounded-xl border border-border bg-surface p-5"
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

        <EditableListSection
          title="Prioridades"
          hint="arraste para reordenar — a primeira é a mais alta"
          items={priorities}
          onAdd={onAddPriority}
          onUpdate={onUpdatePriority}
          onDelete={onDeletePriority}
          onReorder={onReorderPriorities}
          addLabel="Nova prioridade"
          deleteWarning={(item) => `As tarefas com "${item.label}" ficam sem prioridade.`}
        />

        <EditableListSection
          title="Tags"
          hint="arraste para reordenar"
          items={tags}
          onAdd={onAddTag}
          onUpdate={onUpdateTag}
          onDelete={onDeleteTag}
          onReorder={onReorderTags}
          addLabel="Nova tag"
          deleteWarning={(item) => `A tag "${item.label}" será removida de todas as tarefas.`}
        />

        <EditableListSection
          title="Status"
          hint="arraste para reordenar — também define a ordem das colunas do Kanban"
          items={statuses}
          onAdd={onAddStatus}
          onUpdate={onUpdateStatus}
          onDelete={onDeleteStatus}
          onReorder={onReorderStatuses}
          addLabel="Novo status"
          deleteWarning={(item) => `As tarefas com "${item.label}" voltam para o primeiro status.`}
          minItems={1}
          isItemDeletable={(item) => item.id !== onlyDoneStatusId}
          renderExtra={(item) => {
            const isOnlyDone = item.id === onlyDoneStatusId
            return (
              <label
                className={[
                  'ml-auto flex items-center gap-1.5 text-[11px]',
                  isOnlyDone ? 'text-text-muted' : 'text-text-secondary',
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  checked={item.isDone}
                  disabled={isOnlyDone}
                  onChange={(e) => onSetStatusDone(item.id, e.target.checked)}
                />
                Conta como concluída
              </label>
            )
          }}
        />
      </div>
    </div>
  )
}

function EditableListSection({
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
  renderExtra,
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

function EditableRow({ item, onUpdate, onDeleteClick, canDelete, onDrop, extra }) {
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
          className={inputClass}
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
      <div className="flex flex-wrap items-center gap-1.5">
        {EVENT_COLORS.map((c) => {
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
    </div>
  )
}
