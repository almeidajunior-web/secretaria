import { Tag, Flag } from 'lucide-react'
import EditableListSection from '../common/EditableListSection'
import SettingsShell from '../common/SettingsShell'

// Manage Compras' two customizable lists — Classificações and Prioridades —
// each on its own tab in the settings sidebar (shared shell).
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
  const sections = [
    {
      id: 'categories',
      label: 'Classificações',
      icon: Tag,
      render: () => (
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
      ),
    },
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
          deleteWarning={(item) => `Os itens com "${item.label}" ficam sem prioridade.`}
        />
      ),
    },
  ]

  return <SettingsShell sections={sections} onClose={onClose} />
}
