import { RECURRENCES, WEEKDAYS_LETTERS } from '../../constants'

const inputClass =
  'w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-[13px] text-text outline-none focus:border-primary'

// Recurrence selector. Choosing "Personalizar…" reveals weekday toggles and an
// optional end date.
export default function RecurrenceField({
  value,
  onChange,
  days,
  onChangeDays,
  until,
  onChangeUntil,
}) {
  const toggleDay = (idx) => {
    if (days.includes(idx)) onChangeDays(days.filter((d) => d !== idx))
    else onChangeDays([...days, idx].sort())
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium text-text-secondary">Recorrência</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        {RECURRENCES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>

      {value === 'custom' && (
        <div className="mt-1 flex flex-col gap-3 rounded-lg border border-border bg-inset p-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-text-secondary">
              Repetir nos dias
            </span>
            <div className="flex gap-1.5">
              {WEEKDAYS_LETTERS.map((letter, idx) => {
                const on = days.includes(idx)
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={[
                      'flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-medium',
                      on
                        ? 'bg-primary text-white'
                        : 'border border-border-strong text-text-secondary hover:border-primary',
                    ].join(' ')}
                  >
                    {letter}
                  </button>
                )
              })}
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-text-secondary">
              Repetir até (opcional)
            </span>
            <input
              type="date"
              value={until}
              onChange={(e) => onChangeUntil(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>
      )}
    </div>
  )
}
