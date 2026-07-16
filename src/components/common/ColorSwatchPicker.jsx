import { EVENT_COLORS, EVENT_COLORS_PASTEL } from '../../constants'

const SIZE_CLASSES = { sm: 'h-5 w-5', md: 'h-6 w-6' }

// Two-row color swatch picker shared by every "pick a color" UI in the app
// (Agenda events, Planejamento categories, and every EditableListSection
// list: Tarefas/Compras/Vencimentos/Finanças). First row is the standard
// EVENT_COLORS, second row their pastel counterparts (EVENT_COLORS_PASTEL,
// same order/hue) for a softer look. `extra` renders after the pastel row —
// e.g. Tarefas' "conta como concluída" checkbox in EditableListSection.
export default function ColorSwatchPicker({ value, onSelect, size = 'sm', gap = 'gap-1.5', extra }) {
  const dim = SIZE_CLASSES[size]

  const swatch = (c) => {
    const selected = c === value
    return (
      <button
        key={c}
        type="button"
        aria-label={`Cor ${c}`}
        onClick={() => onSelect(c)}
        style={{
          backgroundColor: c,
          transform: selected ? 'scale(1.15)' : 'none',
          borderColor: selected ? 'var(--c-text)' : 'transparent',
          borderWidth: selected ? '2.5px' : '2px',
        }}
        className={`${dim} rounded-full border`}
      />
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className={`flex flex-wrap items-center ${gap}`}>{EVENT_COLORS.map(swatch)}</div>
      <div className={`flex flex-wrap items-center ${gap}`}>
        {EVENT_COLORS_PASTEL.map(swatch)}
        {extra}
      </div>
    </div>
  )
}
