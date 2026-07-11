import { Tag } from 'lucide-react'
import EditableListSection from '../common/EditableListSection'
import SettingsShell from '../common/SettingsShell'

// Manage Vencimentos' one customizable list — Classificações — in the shared
// settings-sidebar shell (a single-topic sidebar, kept for consistency with
// the other modules).
export default function DuesSettingsModal({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onReorderCategories,
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
          deleteWarning={(item) => `As contas com "${item.label}" ficam sem classificação.`}
        />
      ),
    },
  ]

  return <SettingsShell sections={sections} onClose={onClose} />
}
