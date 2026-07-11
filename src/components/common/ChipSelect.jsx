import { useEffect, useRef, useState } from 'react'
import { withAlpha } from '../../constants'

// Single-select attribute picker rendered as a tag-style chip instead of a
// native <select> box+arrow. Trigger: a rounded chip — tinted with the
// selected option's color (like the tag chips) or neutral when `colorless`;
// a dashed muted chip with `nullLabel` when nothing is selected. Clicking
// opens a small popover list (same click-outside pattern as
// TagPickerPopover). Used inline in every module's rows, so the trigger
// stops click propagation (rows are often clickable).
export default function ChipSelect({
  value,
  options,
  onChange,
  allowNull = true,
  nullLabel = 'Definir',
  clearLabel = 'Limpar',
  colorless = false,
  align = 'right',
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const selected = options.find((o) => o.id === value) || null

  const chipStyle =
    selected && !colorless
      ? { backgroundColor: withAlpha(selected.color, 0.15), color: selected.color }
      : undefined

  const chipClass = selected
    ? colorless
      ? 'border border-border bg-app-bg text-text-secondary'
      : 'border border-transparent'
    : 'border border-dashed border-border-strong text-text-muted'

  const pick = (id) => {
    onChange(id)
    setOpen(false)
  }

  return (
    <div className={`relative shrink-0 ${className}`} ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        style={chipStyle}
        className={[
          'inline-flex max-w-full items-center gap-1 truncate rounded-md px-2 py-1 text-[11px] font-medium',
          chipClass,
        ].join(' ')}
      >
        {selected ? selected.label : nullLabel}
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={[
            'absolute top-full z-50 mt-1.5 max-h-56 w-48 overflow-auto rounded-xl border border-border bg-surface p-1.5 shadow-lg',
            align === 'left' ? 'left-0' : 'right-0',
          ].join(' ')}
        >
          {allowNull && (
            <button
              type="button"
              onClick={() => pick(null)}
              className={[
                'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium',
                value == null ? 'bg-accent-soft text-primary' : 'text-text-muted hover:bg-accent-soft/50',
              ].join(' ')}
            >
              {clearLabel}
            </button>
          )}
          {options.map((o) => {
            const isSelected = o.id === value
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => pick(o.id)}
                className={[
                  'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium',
                  isSelected ? 'bg-accent-soft text-primary' : 'text-text-secondary hover:bg-accent-soft/50',
                ].join(' ')}
              >
                {!colorless && (
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: o.color }} />
                )}
                <span className="truncate">{o.label}</span>
              </button>
            )
          })}
          {options.length === 0 && (
            <p className="px-2 py-1 text-[11px] text-text-muted">Nenhuma opção.</p>
          )}
        </div>
      )}
    </div>
  )
}
