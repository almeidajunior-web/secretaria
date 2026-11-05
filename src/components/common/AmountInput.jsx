import { useState } from 'react'

const displayFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

// Dots splitting the number into groups of exactly three digits ("1.500",
// "12.345.678") are thousands separators — that's how a value is written in
// pt-BR. A leading "0." ("0.500") can't be a thousands group, so it stays a
// decimal point.
const THOUSANDS_ONLY = /^-?[1-9]\d{0,2}(\.\d{3})+$/

// Reads what someone actually types into a money field: "1.500,5", "1500,50"
// and "1500.50" all mean the same thing. A comma present means the comma is
// the decimal separator, so every dot is a thousands separator. With no comma,
// dots in thousands groups ("1.500" = mil e quinhentos) are separators too;
// any other lone dot ("12.5") is the decimal point.
export function parseAmount(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return null
  const normalized = s.includes(',')
    ? s.replace(/\./g, '').replace(',', '.')
    : THOUSANDS_ONLY.test(s)
      ? s.replace(/\./g, '')
      : s
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

export function formatAmount(value) {
  return value == null || value === '' ? '' : displayFormatter.format(value)
}

// Money field that reads as plain text — always two decimals, pt-BR
// separators — until it's focused, when it hands the raw number over for
// editing. Commits on blur and on Enter, never per keystroke, so a half-typed
// "12," never reaches the store as 12. `onEnter` also receives the parsed
// number, since a quick-add row has to build its whole record on Enter and
// can't wait for the parent's state to catch up.
export default function AmountInput({
  value,
  onCommit,
  onEnter,
  className = '',
  placeholder = '0,00',
  ...rest
}) {
  // Non-null only while focused — that's what switches the field from its
  // formatted reading state to its raw editing state.
  const [draft, setDraft] = useState(null)

  const startEditing = () =>
    setDraft(value == null || value === '' ? '' : String(value).replace('.', ','))

  const commit = () => {
    if (draft === null) return null
    const parsed = parseAmount(draft) ?? 0
    setDraft(null)
    if (parsed !== (value ?? 0)) onCommit(parsed)
    return parsed
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={draft !== null ? draft : formatAmount(value)}
      onFocus={startEditing}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          const parsed = commit()
          onEnter?.(parsed ?? value ?? 0)
        }
        if (e.key === 'Escape') {
          setDraft(null)
          e.currentTarget.blur()
        }
      }}
      placeholder={placeholder}
      className={className}
      {...rest}
    />
  )
}
