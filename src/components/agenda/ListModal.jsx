import { useEffect } from 'react'
import { X } from 'lucide-react'

// Shared shell for the entity lists (Provas / Eventos / Aulas): overlay, header,
// a controls row, and a scrollable body. Keeps the three lists visually
// identical.
export default function ListModal({ title, onClose, controls, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-[760px] flex-col overflow-hidden rounded-xl border border-border bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-base font-semibold text-text">{title}</h2>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-accent-soft hover:text-primary"
          >
            <X size={16} />
          </button>
        </div>

        {controls && (
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-2.5">
            {controls}
          </div>
        )}

        <div className="thin-scroll overflow-auto">{children}</div>
      </div>
    </div>
  )
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="flex items-center rounded-lg border border-border bg-app-bg p-0.5">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={[
              'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              active ? 'bg-primary text-white' : 'text-text-secondary hover:text-text',
            ].join(' ')}
          >
            {o.icon ? <o.icon size={13} /> : null}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function ToggleChip({ active, icon: Icon, onClick, className = '', children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-accent-soft text-primary'
          : 'border-border text-text-secondary hover:bg-accent-soft/50',
        className,
      ].join(' ')}
    >
      {Icon ? <Icon size={13} /> : null}
      {children}
    </button>
  )
}
