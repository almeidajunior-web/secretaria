import { Flag, Tag, CircleDot } from 'lucide-react'
import EditableListSection from '../common/EditableListSection'
import SettingsShell from '../common/SettingsShell'

// Manage Tarefas' three customizable lists — Prioridades, Tags and Status —
// each on its own tab in the settings sidebar (shared shell). Status
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

  const sections = [
    {
      id: 'priorities',
      label: 'Prioridades',
      icon: Flag,
      render: () => (
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
      ),
    },
    {
      id: 'tags',
      label: 'Tags',
      icon: Tag,
      render: () => (
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
      ),
    },
    {
      id: 'status',
      label: 'Status',
      icon: CircleDot,
      render: () => (
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
      ),
    },
  ]

  return <SettingsShell sections={sections} onClose={onClose} />
}
