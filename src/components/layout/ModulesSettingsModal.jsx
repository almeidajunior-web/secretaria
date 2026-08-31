import { useRef, useState } from 'react'
import {
  GripVertical,
  Eye,
  EyeOff,
  Trash2,
  Check,
  FolderPlus,
  Download,
  Upload,
  LayoutGrid,
  Database,
  SunMoon,
  Sun,
  Moon,
} from 'lucide-react'
import { MODULE_DEFS } from '../../data/modules'
import { EVENT_COLORS } from '../../constants'
import { downloadBackup, parseBackupFile, restoreBackupData } from '../../lib/backup'
import ConfirmDialog from '../common/ConfirmDialog'
import ColorSwatchPicker from '../common/ColorSwatchPicker'
import SettingsShell from '../common/SettingsShell'

const inputClass =
  'w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-[13px] text-text outline-none focus:border-primary'

// Drag payloads are prefixed with what's being dragged — a bare module id
// isn't enough once a module and a group can both be dropped onto the same
// target, and the drop handler needs to know which hook method to call.
function parseDragPayload(dataTransfer) {
  const raw = dataTransfer.getData('text/plain')
  const i = raw.indexOf(':')
  return i === -1 ? null : { kind: raw.slice(0, i), id: raw.slice(i + 1) }
}

// Global Configurações (opened from the topbar gear): reorder/hide/group
// modules and the manual backup export/import — each on its own tab in the
// shared settings-sidebar shell. Hiding a module never touches its data;
// it's purely a nav-visibility flag, same as before groups existed.
export default function ModulesSettingsModal({
  order,
  hidden,
  groups,
  onToggleVisibility,
  onMoveModule,
  onMoveGroup,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  theme,
  onToggleTheme,
  onClose,
}) {
  const fileInputRef = useRef(null)
  const [importError, setImportError] = useState('')
  const [pendingImport, setPendingImport] = useState(null)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
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

  const modulesPanel = () => (
    <ModulesPanel
      order={order}
      hidden={hidden}
      groups={groups}
      onToggleVisibility={onToggleVisibility}
      onMoveModule={onMoveModule}
      onMoveGroup={onMoveGroup}
      onCreateGroup={onCreateGroup}
      onUpdateGroup={onUpdateGroup}
      onDeleteGroup={onDeleteGroup}
    />
  )

  const appearancePanel = () => (
    <div>
      <p className="mb-3 text-[11px] font-medium text-text-secondary">
        Tema <span className="font-normal text-text-muted">(claro ou escuro)</span>
      </p>
      <div className="flex gap-2">
        {[
          { value: 'light', label: 'Claro', icon: Sun },
          { value: 'dark', label: 'Escuro', icon: Moon },
        ].map(({ value, label, icon: Icon }) => {
          const active = theme === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => {
                if (!active) onToggleTheme()
              }}
              className={[
                'flex flex-1 items-center justify-center gap-2 rounded-lg border p-2.5 text-[13px]',
                active
                  ? 'border-primary bg-accent-soft font-medium text-primary'
                  : 'border-border text-text-secondary hover:border-border-strong hover:bg-accent-soft/40',
              ].join(' ')}
            >
              <Icon size={15} />
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )

  const backupPanel = () => (
    <div>
      <p className="mb-3 text-[11px] font-medium text-text-secondary">
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
    </div>
  )

  const sections = [
    { id: 'modules', label: 'Módulos', icon: LayoutGrid, render: modulesPanel },
    { id: 'appearance', label: 'Aparência', icon: SunMoon, render: appearancePanel },
    { id: 'backup', label: 'Backup', icon: Database, render: backupPanel },
  ]

  return (
    <>
      <SettingsShell sections={sections} onClose={onClose} />

      {pendingImport && (
        <ConfirmDialog
          title="Restaurar este backup?"
          message="Todos os dados atuais (eventos, tarefas, compras, contas, categorias e preferências) serão substituídos pelo conteúdo do arquivo. Esta ação não pode ser desfeita."
          confirmLabel="Restaurar"
          onConfirm={confirmImport}
          onCancel={() => setPendingImport(null)}
        />
      )}
    </>
  )
}

function ModulesPanel({
  order,
  hidden,
  groups,
  onToggleVisibility,
  onMoveModule,
  onMoveGroup,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
}) {
  const groupById = Object.fromEntries(groups.map((g) => [g.id, g]))
  const [pendingDeleteGroup, setPendingDeleteGroup] = useState(null)
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [newGroupLabel, setNewGroupLabel] = useState('')

  const confirmCreateGroup = () => {
    const l = newGroupLabel.trim()
    if (l) onCreateGroup(l, EVENT_COLORS[groups.length % EVENT_COLORS.length])
    setNewGroupLabel('')
    setCreatingGroup(false)
  }

  // Reordering the top level (loose modules and whole groups alike), or a
  // module dropped here to leave whatever group it was in. `beforeEntry` is
  // the id/sentinel to insert ahead of, or null to append at the very end.
  const dropAtTopLevel = (e, beforeEntry) => {
    e.preventDefault()
    e.stopPropagation()
    const payload = parseDragPayload(e.dataTransfer)
    if (!payload) return
    if (payload.kind === 'group') onMoveGroup(payload.id, beforeEntry)
    else onMoveModule(payload.id, null, beforeEntry)
  }

  return (
    <div>
      <p className="mb-3 text-[11px] font-medium text-text-secondary">
        Módulos{' '}
        <span className="font-normal text-text-muted">
          (arraste para reordenar, oculte os que não usa, ou arraste para dentro de um grupo)
        </span>
      </p>

      <div className="flex flex-col gap-1.5">
        {order.map((entry) => {
          if (entry.startsWith('group:')) {
            const group = groupById[entry.slice('group:'.length)]
            if (!group) return null
            return (
              <GroupBox
                key={group.id}
                group={group}
                hidden={hidden}
                onDropBefore={(e) => dropAtTopLevel(e, entry)}
                onToggleVisibility={onToggleVisibility}
                onRename={(label) => onUpdateGroup(group.id, { label })}
                onRecolor={(color) => onUpdateGroup(group.id, { color })}
                onDeleteClick={() => setPendingDeleteGroup(group)}
                onMoveModuleIn={(moduleId, beforeModuleId) =>
                  onMoveModule(moduleId, group.id, beforeModuleId)
                }
              />
            )
          }
          const mod = MODULE_DEFS.find((m) => m.id === entry)
          if (!mod) return null
          return (
            <ModuleRow
              key={mod.id}
              mod={mod}
              hidden={hidden.includes(mod.id)}
              onToggleVisibility={() => onToggleVisibility(mod.id)}
              onDropBefore={(e) => dropAtTopLevel(e, entry)}
            />
          )
        })}

        {/* Catch-all target: drop past the last item to append there — the
            only way to place something after everything else, or to free a
            module from a group when nothing is loose to drop next to. */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => dropAtTopLevel(e, null)}
          className="h-4"
        />
      </div>

      <div className="mt-2">
        {creatingGroup ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={newGroupLabel}
              onChange={(e) => setNewGroupLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  confirmCreateGroup()
                }
                if (e.key === 'Escape') {
                  setNewGroupLabel('')
                  setCreatingGroup(false)
                }
              }}
              placeholder="Nome do grupo"
              className={inputClass}
            />
            <button
              type="button"
              onClick={confirmCreateGroup}
              aria-label="Confirmar novo grupo"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-primary hover:bg-accent-soft"
            >
              <Check size={15} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreatingGroup(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border-strong px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-primary hover:text-primary"
          >
            <FolderPlus size={13} />
            Novo grupo
          </button>
        )}
      </div>

      {pendingDeleteGroup && (
        <ConfirmDialog
          title={`Excluir o grupo "${pendingDeleteGroup.label}"?`}
          message="Os módulos deste grupo voltam a aparecer soltos no topbar. Esta ação não pode ser desfeita."
          confirmLabel="Excluir"
          onConfirm={() => {
            onDeleteGroup(pendingDeleteGroup.id)
            setPendingDeleteGroup(null)
          }}
          onCancel={() => setPendingDeleteGroup(null)}
        />
      )}
    </div>
  )
}

function ModuleRow({ mod, hidden, onToggleVisibility, onDropBefore, nested }) {
  const Icon = mod.icon
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDropBefore}
      className={['flex items-center gap-2 rounded-lg border border-border p-2', nested ? 'bg-inset' : ''].join(' ')}
    >
      <span
        draggable
        onDragStart={(e) => e.dataTransfer.setData('text/plain', `module:${mod.id}`)}
        aria-label="Arrastar para reordenar"
        className="shrink-0 cursor-grab text-text-muted active:cursor-grabbing"
      >
        <GripVertical size={14} />
      </span>
      <Icon size={15} className={hidden ? 'text-text-muted' : 'text-text-secondary'} />
      <span className={['flex-1 text-[13px]', hidden ? 'text-text-muted' : 'text-text'].join(' ')}>
        {mod.label}
      </span>
      <button
        type="button"
        onClick={onToggleVisibility}
        aria-label={hidden ? `Exibir ${mod.label}` : `Ocultar ${mod.label}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-accent-soft/60 hover:text-primary"
      >
        {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  )
}

function GroupBox({
  group,
  hidden,
  onDropBefore,
  onToggleVisibility,
  onRename,
  onRecolor,
  onDeleteClick,
  onMoveModuleIn,
}) {
  const [label, setLabel] = useState(group.label)

  const commitLabel = () => {
    const l = label.trim()
    if (l && l !== group.label) onRename(l)
    else setLabel(group.label)
  }

  // The member list is its own, more specific drop target — stopping
  // propagation is what makes "drop inside the group" and "drop on the
  // group's header to reorder it" two different gestures on nested elements.
  const dropIntoGroup = (e, beforeModuleId) => {
    e.preventDefault()
    e.stopPropagation()
    const payload = parseDragPayload(e.dataTransfer)
    if (!payload || payload.kind !== 'module') return
    onMoveModuleIn(payload.id, beforeModuleId)
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDropBefore}
      className="rounded-lg border border-border-strong p-2"
    >
      <div className="flex items-center gap-2">
        <span
          draggable
          onDragStart={(e) => e.dataTransfer.setData('text/plain', `group:${group.id}`)}
          aria-label="Arrastar para reordenar"
          className="shrink-0 cursor-grab text-text-muted active:cursor-grabbing"
        >
          <GripVertical size={14} />
        </span>
        <ColorSwatchPicker value={group.color} onSelect={onRecolor} />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={commitLabel}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className="min-w-0 flex-1 rounded-md border border-border-strong bg-surface px-2 py-1 text-[13px] font-medium text-text outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={onDeleteClick}
          aria-label={`Excluir grupo ${group.label}`}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-danger/15 hover:text-danger"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => dropIntoGroup(e, null)}
        className="mt-1.5 flex flex-col gap-1.5 border-t border-border py-1.5 pl-5"
      >
        {group.moduleIds.length === 0 && (
          <p className="py-1 text-[11px] text-text-muted">Arraste um módulo para cá.</p>
        )}
        {group.moduleIds.map((id) => {
          const mod = MODULE_DEFS.find((m) => m.id === id)
          if (!mod) return null
          return (
            <ModuleRow
              key={id}
              mod={mod}
              hidden={hidden.includes(id)}
              onToggleVisibility={() => onToggleVisibility(id)}
              onDropBefore={(e) => dropIntoGroup(e, id)}
              nested
            />
          )
        })}
      </div>
    </div>
  )
}
