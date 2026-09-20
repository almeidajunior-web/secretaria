import ChipSelect from './ChipSelect'
import InlineDate from './InlineDate'
import { RECURRENCE_OPTIONS } from '../../lib/billRecurrence'

const RECURRENCE_CHIP_OPTIONS = RECURRENCE_OPTIONS.map((r) => ({ id: r.value, label: r.label }))

// The recurrence chip plus its optional end date, as one inline control.
// The end date only exists once a recurrence is chosen — "até" is meaningless
// on a one-off — so picking "Não recorrente" also clears whatever limit was
// set, rather than leaving an invisible value behind to resurface later.
//
// Shared by Finanças (lançamentos) and Vencimentos (contas), which run
// different spawn engines over the same two fields — see nextDueDate in
// lib/billRecurrence.js, the one place the limit is actually enforced.
export default function RecurrenceChipField({ recurrence, recurrenceEnd, onChange }) {
  const value = recurrence || 'none'

  return (
    <div className="flex shrink-0 flex-col items-start gap-0.5">
      <ChipSelect
        value={value}
        options={RECURRENCE_CHIP_OPTIONS}
        onChange={(id) => {
          const next = id || 'none'
          onChange({ recurrence: next, recurrenceEnd: next === 'none' ? null : recurrenceEnd || null })
        }}
        allowNull={false}
        colorless
      />
      {value !== 'none' && (
        <InlineDate
          value={recurrenceEnd || null}
          onChange={(v) => onChange({ recurrence: value, recurrenceEnd: v })}
          muted
          placeholder="sem fim"
          pattern="'até' dd/MM/yy"
          className="pl-1"
        />
      )}
    </div>
  )
}
