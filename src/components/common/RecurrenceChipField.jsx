import { X } from 'lucide-react'
import ChipSelect from './ChipSelect'
import InlineDate from './InlineDate'
import { RECURRENCE_OPTIONS } from '../../lib/billRecurrence'

const RECURRENCE_CHIP_OPTIONS = RECURRENCE_OPTIONS.map((r) => ({ id: r.value, label: r.label }))

// The recurrence chip plus its optional end date.
//
// At rest the row shows only the chip — and the date underneath it when, and
// only when, a limit was actually set. Most series never end, so a permanent
// "sem fim" under every recurring row was pure noise on a list where every
// line repeats. Setting the limit therefore lives inside the chip's own
// dropdown, next to the choice it qualifies.
//
// Shared by Finanças (lançamentos) and Vencimentos (contas), which run
// different spawn engines over the same two fields — see nextDueDate in
// lib/billRecurrence.js, the one place the limit is actually enforced.
export default function RecurrenceChipField({ recurrence, recurrenceEnd, onChange }) {
  const value = recurrence || 'none'
  const setEnd = (v) => onChange({ recurrence: value, recurrenceEnd: v })

  return (
    <div className="flex shrink-0 flex-col items-start gap-0.5">
      <ChipSelect
        value={value}
        options={RECURRENCE_CHIP_OPTIONS}
        onChange={(id) => {
          const next = id || 'none'
          // "Não recorrente" drops the limit too — otherwise it lingers
          // invisibly and reappears the next time something is set to repeat.
          onChange({ recurrence: next, recurrenceEnd: next === 'none' ? null : recurrenceEnd || null })
        }}
        allowNull={false}
        colorless
        footer={
          value === 'none' ? null : (
            <div className="flex items-center justify-between gap-2 px-2 py-1">
              <span className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
                Repetir até
              </span>
              <span className="flex items-center gap-1">
                <InlineDate
                  value={recurrenceEnd || null}
                  onChange={setEnd}
                  muted
                  placeholder="definir"
                  pattern="dd/MM/yy"
                />
                {recurrenceEnd && (
                  <button
                    type="button"
                    onClick={() => setEnd(null)}
                    aria-label="Remover data de fim"
                    className="flex h-4 w-4 items-center justify-center rounded-full text-text-muted hover:bg-danger/15 hover:text-danger"
                  >
                    <X size={10} />
                  </button>
                )}
              </span>
            </div>
          )
        }
      />
      {recurrenceEnd && (
        <InlineDate
          value={recurrenceEnd}
          onChange={setEnd}
          muted
          pattern="'até' dd/MM/yy"
          className="pl-1"
        />
      )}
    </div>
  )
}
