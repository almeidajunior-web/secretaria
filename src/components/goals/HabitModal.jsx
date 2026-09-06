import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import ColorSwatchPicker from '../common/ColorSwatchPicker'
import ConfirmDialog from '../common/ConfirmDialog'
import { EVENT_COLORS, WEEKDAYS_LETTERS_ORDERED, WEEKDAYS_SHORT_ORDERED } from '../../constants'
import { toKey } from '../../lib/habitStats'

const inputClass =
  'w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-[13px] text-text outline-none focus:border-primary'

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]

// Create/edit a habit. Unlike the quick-add rows elsewhere in the app this is
// modal-only: a habit carries a run (start/end) and a weekday schedule, and
// those three fields are what decide whether a cell in the grid even exists —
// too much to guess from a single inline text field.
export default function HabitModal({ habit, colorSeed = 0, onSave, onDelete, onClose }) {
  const editing = !!habit
  const [label, setLabel] = useState(habit?.label ?? '')
  const [color, setColor] = useState(habit?.color ?? EVENT_COLORS[colorSeed % EVENT_COLORS.length])
  const [weekdays, setWeekdays] = useState(habit?.weekdays ?? EVERY_DAY)
  const [startDate, setStartDate] = useState(habit?.startDate ?? toKey(new Date()))
  // Two controls for one field: the checkbox is the plain-language version of
  // "endDate === null", which is otherwise an empty date input the user has no
  // reason to read as "forever".
  const [openEnded, setOpenEnded] = useState(!habit?.endDate)
  const [endDate, setEndDate] = useState(habit?.endDate ?? '')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const canSave = label.trim().length > 0 && weekdays.length > 0 && !!startDate

  const toggleWeekday = (index) =>
    setWeekdays((prev) =>
      prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index].sort((a, b) => a - b)
    )

  const handleSave = () => {
    if (!canSave) return
    onSave({
      ...(habit ?? {}),
      label: label.trim(),
      color,
      weekdays,
      startDate,
      endDate: openEnded ? null : endDate || null,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary-deep/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-[440px] rounded-xl border border-border bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-semibold text-text">
          {editing ? 'Editar rotina' : 'Nova rotina'}
        </h2>

        <div className="flex flex-col gap-4">
          <Field label="Rotina">
            <div className="flex items-center gap-2">
              <ColorSwatchPicker value={color} onSelect={setColor} size="md" />
              <input
                autoFocus
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="Ex.: Beber 2 litros de água"
                className={inputClass}
              />
            </div>
          </Field>

          <Field label="Dias da semana">
            <div className="flex gap-1.5">
              {WEEKDAYS_LETTERS_ORDERED.map((letter, index) => {
                const on = weekdays.includes(index)
                return (
                  <button
                    key={WEEKDAYS_SHORT_ORDERED[index]}
                    type="button"
                    onClick={() => toggleWeekday(index)}
                    aria-pressed={on}
                    aria-label={WEEKDAYS_SHORT_ORDERED[index]}
                    title={WEEKDAYS_SHORT_ORDERED[index]}
                    className={[
                      'h-8 flex-1 rounded-md border text-[12px] font-medium transition-colors',
                      on
                        ? 'border-primary bg-accent-soft text-primary'
                        : 'border-border text-text-muted hover:border-border-strong',
                    ].join(' ')}
                  >
                    {letter}
                  </button>
                )
              })}
            </div>
            {weekdays.length === 0 && (
              <span className="text-[11px] text-danger">Escolha ao menos um dia.</span>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Início">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Fim">
              <input
                type="date"
                value={openEnded ? '' : endDate}
                min={startDate || undefined}
                disabled={openEnded}
                onChange={(e) => setEndDate(e.target.value)}
                className={`${inputClass} disabled:opacity-40`}
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-[12px] text-text-secondary">
            <input
              type="checkbox"
              checked={openEnded}
              onChange={(e) => setOpenEnded(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            Indefinidamente
          </label>

          <p className="text-[11px] text-text-muted">
            A rotina só aparece na grade — e só entra na conta do gráfico — nos dias escolhidos,
            dentro desse período.
          </p>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          {editing && (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              aria-label="Excluir rotina"
              className="mr-auto flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-danger/15 hover:text-danger"
            >
              <Trash2 size={15} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-xs font-medium text-text-secondary hover:bg-accent-soft/50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {editing ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          title={`Excluir "${habit.label}"?`}
          message="Todo o histórico de marcações dessa rotina também é apagado. Esta ação não pode ser desfeita."
          confirmLabel="Excluir"
          onConfirm={() => {
            onDelete(habit.id)
            onClose()
          }}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium text-text-secondary">{label}</span>
      {children}
    </label>
  )
}
