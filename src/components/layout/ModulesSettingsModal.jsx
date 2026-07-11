import { useRef, useState } from 'react'
import { X, GripVertical, Eye, EyeOff, Download, Upload } from 'lucide-react'
import { MODULE_DEFS } from '../../data/modules'
import { reorderIds } from '../../lib/reorderList'
import { downloadBackup, parseBackupFile, restoreBackupData } from '../../lib/backup'
import ConfirmDialog from '../common/ConfirmDialog'

// Reorder the sidebar's module list and toggle which modules show up in it.
// Hiding a module never touches its data — it's purely a nav-visibility
// flag, so anything that links directly into a hidden module (e.g. Agenda's
// day quick-links) keeps working. Also hosts the manual backup
// export/import, since it's the one app-wide settings surface.
export default function ModulesSettingsModal({ order, hidden, onReorder, onToggleVisibility, onClose }) {
  const modules = order.map((id) => MODULE_DEFS.find((m) => m.id === id)).filter(Boolean)
  const fileInputRef = useRef(null)
  const [importError, setImportError] = useState('')
  const [pendingImport, setPendingImport] = useState(null) // parsed backup data awaiting confirm

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return
    setImportError('')
    try {
      const data = await parseBackupFile(file)
      setPendingImport(data)
    } catch (err) {
      setImportError(err.message)
    }
  }

  const confirmImport = () => {
    restoreBackupData(pendingImport)
    window.location.reload()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="thin-scroll max-h-[85vh] w-[380px] overflow-auto rounded-xl border border-border bg-surface p-5"
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

        <p className="mb-2 text-[11px] font-medium text-text-secondary">
          Módulos{' '}
          <span className="font-normal text-text-muted">
            (arraste para reordenar, oculte os que não usa)
          </span>
        </p>

        <div className="flex flex-col gap-1.5">
          {modules.map((mod) => {
            const isHidden = hidden.includes(mod.id)
            const Icon = mod.icon
            return (
              <div
                key={mod.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const draggedId = e.dataTransfer.getData('text/plain')
                  if (draggedId) onReorder(reorderIds(order, draggedId, mod.id))
                }}
                className="flex items-center gap-2 rounded-lg border border-border p-2"
              >
                <span
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', mod.id)}
                  aria-label="Arrastar para reordenar"
                  className="shrink-0 cursor-grab text-text-muted active:cursor-grabbing"
                >
                  <GripVertical size={14} />
                </span>
                <Icon size={15} className={isHidden ? 'text-text-muted' : 'text-text-secondary'} />
                <span
                  className={[
                    'flex-1 text-[13px]',
                    isHidden ? 'text-text-muted' : 'text-text',
                  ].join(' ')}
                >
                  {mod.label}
                </span>
                <button
                  type="button"
                  onClick={() => onToggleVisibility(mod.id)}
                  aria-label={isHidden ? `Exibir ${mod.label}` : `Ocultar ${mod.label}`}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-accent-soft/60 hover:text-primary"
                >
                  {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            )
          })}
        </div>

        <div className="my-4 border-t border-border" />

        <p className="mb-2 text-[11px] font-medium text-text-secondary">
          Backup{' '}
          <span className="font-normal text-text-muted">
            (todos os dados de todos os módulos, num único arquivo)
          </span>
        </p>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={downloadBackup}
            className="flex items-center gap-2 rounded-lg border border-border p-2 text-[13px] text-text hover:border-border-strong hover:bg-accent-soft/40"
          >
            <Download size={15} className="text-text-secondary" />
            Exportar backup (.json)
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-border p-2 text-[13px] text-text hover:border-border-strong hover:bg-accent-soft/40"
          >
            <Upload size={15} className="text-text-secondary" />
            Importar backup (.json)
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
          {importError && <p className="text-[11px] text-danger">{importError}</p>}
        </div>

        {pendingImport && (
          <ConfirmDialog
            title="Restaurar este backup?"
            message="Todos os dados atuais (eventos, tarefas, compras, contas, categorias e preferências) serão substituídos pelo conteúdo do arquivo. Esta ação não pode ser desfeita."
            confirmLabel="Restaurar"
            onConfirm={confirmImport}
            onCancel={() => setPendingImport(null)}
          />
        )}
      </div>
    </div>
  )
}
