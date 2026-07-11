import { useEffect, useRef, useState } from 'react'
import { Plus, Tag as TagIcon } from 'lucide-react'
import { EVENT_COLORS } from '../../constants'

// Compact tag multi-select: click the trigger to open a checklist popover
// with an inline "create new tag" affordance. Used by TaskModal, the list
// row's inline editor, and the quick-add row. `onClick` on the trigger stops
// propagation since it's always nested inside a clickable row/card.
export default function TagPickerPopover({ tags, selectedIds, onToggle, onCreate, triggerClassName }) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setCreating(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const selected = tags.filter((t) => selectedIds.includes(t.id))

  const confirmCreate = () => {
    const l = newLabel.trim()
    if (!l) return
    const id = onCreate(l, EVENT_COLORS[tags.length % EVENT_COLORS.length])
    if (id) onToggle(id)
    setNewLabel('')
    setCreating(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className={
          triggerClassName ||
          'inline-flex items-center gap-1.5 rounded-full border border-dashed border-border-strong px-2 py-0.5 text-[11px] font-medium text-text-secondary hover:border-primary hover:text-primary'
        }
      >
        {selected.length > 0 ? (
          selected.map((t) => (
            <span key={t.id} className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.color }} />
              {t.label}
            </span>
          ))
        ) : (
          <>
            <TagIcon size={11} />
            Tags
          </>
        )}
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 top-full z-50 mt-1.5 w-52 rounded-xl border border-border bg-surface p-2 shadow-lg"
        >
          <div className="flex max-h-48 flex-col gap-0.5 overflow-auto">
            {tags.map((t) => {
              const isSelected = selectedIds.includes(t.id)
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onToggle(t.id)}
                  className={[
                    'flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium',
                    isSelected
                      ? 'bg-accent-soft text-primary'
                      : 'text-text-secondary hover:bg-accent-soft/50',
                  ].join(' ')}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />
                  {t.label}
                </button>
              )
            })}
            {tags.length === 0 && (
              <p className="px-2 py-1 text-[11px] text-text-muted">Nenhuma tag ainda.</p>
            )}
          </div>

          <div className="mt-1.5 border-t border-border pt-1.5">
            {creating ? (
              <div className="flex items-center gap-1.5">
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
                  placeholder="Nova tag"
                  className="w-full rounded-md border border-border-strong bg-surface px-2 py-1 text-[11px] text-text outline-none focus:border-primary"
                />
                <button type="button" onClick={confirmCreate} className="shrink-0 text-primary">
                  <Plus size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-text-secondary hover:bg-accent-soft/50 hover:text-primary"
              >
                <Plus size={13} />
                Nova tag
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
