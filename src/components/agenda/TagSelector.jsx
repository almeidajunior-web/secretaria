import { useState } from 'react'
import { Plus, X, Check } from 'lucide-react'
import ConfirmDialog from '../common/ConfirmDialog'

// Tag picker with inline creation and deletion. Tags are user-defined: click a
// tag to (de)select it for the event, the "x" deletes it everywhere, and "+"
// creates a new one.
export default function TagSelector({ allTags, selected, onToggle, onCreate, onDeleteTag }) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)

  const confirmCreate = () => {
    const n = name.trim()
    if (n) {
      onCreate(n)
      if (!selected.includes(n)) onToggle(n)
    }
    setName('')
    setCreating(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {allTags.map((tag) => {
        const isSelected = selected.includes(tag)
        return (
          <span
            key={tag}
            className={[
              'inline-flex items-center gap-1 rounded-full border py-1 pl-3 pr-1.5 text-xs font-medium',
              isSelected
                ? 'border-primary bg-accent-soft text-primary'
                : 'border-border text-text-secondary',
            ].join(' ')}
          >
            <button type="button" onClick={() => onToggle(tag)} className="leading-none">
              {tag}
            </button>
            <button
              type="button"
              aria-label={`Excluir tag ${tag}`}
              onClick={() => setPendingDelete(tag)}
              className="flex h-4 w-4 items-center justify-center rounded-full text-text-muted hover:bg-danger/15 hover:text-danger"
            >
              <X size={12} />
            </button>
          </span>
        )
      })}

      {creating ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-primary py-0.5 pl-2.5 pr-1 text-xs">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                confirmCreate()
              }
              if (e.key === 'Escape') {
                setName('')
                setCreating(false)
              }
            }}
            placeholder="Nova tag"
            className="w-20 bg-transparent text-text outline-none placeholder:text-text-muted"
          />
          <button
            type="button"
            aria-label="Confirmar nova tag"
            onClick={confirmCreate}
            className="flex h-5 w-5 items-center justify-center rounded-full text-primary hover:bg-accent-soft"
          >
            <Check size={13} />
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border-strong px-3 py-1 text-xs font-medium text-text-secondary hover:border-primary hover:text-primary"
        >
          <Plus size={13} />
          Tag
        </button>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={`Excluir a tag "${pendingDelete}"?`}
          message="A tag será removida de todos os eventos marcados com ela. Esta ação não pode ser desfeita."
          confirmLabel="Excluir tag"
          onConfirm={() => {
            onDeleteTag(pendingDelete)
            setPendingDelete(null)
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}
