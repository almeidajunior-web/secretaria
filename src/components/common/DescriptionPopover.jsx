import { useEffect, useRef, useState } from 'react'
import { StickyNote } from 'lucide-react'

// Small icon that opens a popover with a textarea for a brief free-text
// description — outline when empty, filled/colored once there's content.
// Shared by Compras and Vencimentos, whose rows both edit a plain
// `item.description` string via a generic `onUpdateItem(fullObject)` call.
export default function DescriptionPopover({ item, onUpdateItem, dropUp = false }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(item.description || '')
  const ref = useRef(null)
  const hasDescription = !!item.description

  const commit = () => {
    const v = value.trim()
    if (v !== (item.description || '')) onUpdateItem({ ...item, description: v })
  }

  // Kept in a ref so the click-outside listener below always calls the
  // current closure without having to resubscribe on every keystroke.
  const commitRef = useRef(commit)
  commitRef.current = commit

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        // Saving here rather than leaving it to the textarea's onBlur: this
        // fires on mousedown, which unmounts the textarea before any blur
        // event reaches React, so a description typed and then dismissed by
        // clicking away used to be dropped silently.
        commitRef.current()
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={hasDescription ? 'Editar descrição' : 'Adicionar descrição'}
        className={[
          'flex h-6 w-6 items-center justify-center rounded-full hover:bg-accent-soft/60',
          hasDescription ? 'text-primary' : 'text-text-muted',
        ].join(' ')}
      >
        <StickyNote size={14} fill={hasDescription ? 'currentColor' : 'none'} fillOpacity={0.15} />
      </button>
      {open && (
        <div
          className={[
            'absolute right-0 z-50 w-56 rounded-xl border border-border bg-surface p-2 shadow-lg',
            dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
          ].join(' ')}
        >
          <textarea
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                commit()
                setOpen(false)
              }
            }}
            placeholder="Descrição breve…"
            rows={3}
            className="w-full resize-none rounded-md border border-border-strong bg-surface px-2 py-1.5 text-[12px] text-text outline-none focus:border-primary"
          />
        </div>
      )}
    </div>
  )
}
