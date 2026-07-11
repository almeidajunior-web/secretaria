import { X } from 'lucide-react'
import EditableListSection from '../common/EditableListSection'

// Manage Vencimentos' one customizable list — Classificações — same
// add/edit-color/delete/drag-to-reorder pattern as Tarefas/Compras.
export default function DuesSettingsModal({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onReorderCategories,
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
          deleteWarning={(item) => `As contas com "${item.label}" ficam sem classificação.`}
        />
      </div>
    </div>
  )
}
