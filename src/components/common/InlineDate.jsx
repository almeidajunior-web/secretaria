import { useRef } from 'react'
import { fmt, fromDateInput } from '../../lib/date'

// Shows a date as plain text in the interface's normal type (no box, no
// native calendar-icon control), and opens the native date picker on click.
// Replaces inline `<input type="date">` where the boxed look is unwanted.
// `value` is a 'yyyy-MM-dd' string (or null); `onChange` receives the new
// string or null.
export default function InlineDate({
  value,
  onChange,
  overdue = false,
  muted = false,
  placeholder = 'Data',
  pattern = 'dd/MM/yyyy',
  className = '',
}) {
  const inputRef = useRef(null)

  const openPicker = (e) => {
    e.stopPropagation()
    const el = inputRef.current
    if (!el) return
    if (typeof el.showPicker === 'function') {
      try {
        el.showPicker()
        return
      } catch {
        // some browsers throw if not user-activated — fall through to focus
      }
    }
    el.focus()
    el.click()
  }

  const label = value ? fmt(fromDateInput(value), pattern) : placeholder

  return (
    <span className={`relative inline-flex shrink-0 items-center ${className}`}>
      <button
        type="button"
        onClick={openPicker}
        className={[
          'bg-transparent text-[11px] outline-none hover:underline',
          !value ? 'text-text-muted' : overdue ? 'font-semibold text-danger' : muted ? 'text-text-secondary' : 'text-text',
        ].join(' ')}
      >
        {label}
      </button>
      <input
        ref={inputRef}
        type="date"
        value={value || ''}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onChange(e.target.value || null)}
        // Kept in the DOM (needed for showPicker) but visually collapsed.
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        tabIndex={-1}
        aria-hidden="true"
      />
    </span>
  )
}
