import { X } from 'lucide-react'
import EditableListSection from '../common/EditableListSection'

// Manage Tarefas' three customizable lists — Prioridades, Tags and Status —
// with the same add/edit-color/delete/drag-to-reorder pattern for each
// (shared with Compras' own settings modal via EditableListSection). Status
// additionally exposes an "isDone" toggle per row, since that flag drives
// recurrence rollover and the hide-finished filter elsewhere in the module.
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
