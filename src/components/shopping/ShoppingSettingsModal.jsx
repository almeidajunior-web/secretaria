import { X } from 'lucide-react'
import EditableListSection from '../common/EditableListSection'

// Manage Compras' two customizable lists — Classificações and Prioridades —
// same add/edit-color/delete/drag-to-reorder pattern as Tarefas' settings.
export default function ShoppingSettingsModal({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onReorderCategories,
  priorities,
  onAddPriority,
  onUpdatePriority,
  onDeletePriority,
  onReorderPriorities,
  onClose,
}) {
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
          title="Classificações"
          hint="arraste para reordenar"
          items={categories}
          onAdd={onAddCategory}
          onUpdate={onUpdateCategory}
          onDelete={onDeleteCategory}
          onReorder={onReorderCategories}
          addLabel="Nova classificação"
          deleteWarning={(item) => `Os itens com "${item.label}" ficam sem classificação.`}
        />

        <EditableListSection
          title="Prioridades"
          hint="arraste para reordenar — a primeira é a mais alta"
          items={priorities}
          onAdd={onAddPriority}
          onUpdate={onUpdatePriority}
          onDelete={onDeletePriority}
          onReorder={onReorderPriorities}
          addLabel="Nova prioridade"
          deleteWarning={(item) => `Os itens com "${item.label}" ficam sem prioridade.`}
        />
      </div>
    </div>
  )
}
