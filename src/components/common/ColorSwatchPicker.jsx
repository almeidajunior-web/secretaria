import { useEffect, useRef, useState } from 'react'
import { EVENT_COLORS, EVENT_COLORS_PASTEL } from '../../constants'

const SIZE_CLASSES = { sm: 'h-5 w-5', md: 'h-6 w-6' }

// Compact color picker shared by every "pick a color" UI in the app (Agenda
// events, Planejamento categories, and every EditableListSection list:
// Tarefas/Compras/Vencimentos/Finanças). The trigger is a single dot in the
// current color; clicking it opens a small popover with the full palette —
// the vivid EVENT_COLORS on the first row and their softer EVENT_COLORS_PASTEL
// counterparts on the second. Same click-outside pattern as ChipSelect, and
// like it the trigger stops click propagation since it sits inside clickable
// rows.
export default function ColorSwatchPicker({ value, onSelect, size = 'sm' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const dim = SIZE_CLASSES[size]

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const swatch = (c) => {
    const selected = c === value
    return (
      <button
        key={c}
        type="button"
        aria-label={`Cor ${c}`}
        onClick={() => {
          onSelect(c)
          setOpen(false)
        }}
        style={{
          backgroundColor: c,
          transform: selected ? 'scale(1.15)' : 'none',
          borderColor: selected ? 'var(--c-text)' : 'transparent',
          borderWidth: selected ? '2.5px' : '2px',
        }}
        className="h-5 w-5 rounded-full border"
      />
    )
  }

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        aria-label="Escolher cor"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        style={{ backgroundColor: value }}
        className={`${dim} rounded-full border-2 border-border-strong`}
      />

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 top-full z-50 mt-1.5 flex w-max flex-col gap-1.5 rounded-xl border border-border bg-surface p-2 shadow-lg"
        >
          <div className="flex items-center gap-1.5">{EVENT_COLORS.map(swatch)}</div>
          <div className="flex items-center gap-1.5">{EVENT_COLORS_PASTEL.map(swatch)}</div>
        </div>
      )}
    </div>
  )
}
