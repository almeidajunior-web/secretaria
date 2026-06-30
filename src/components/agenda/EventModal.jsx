import { useEffect, useState } from 'react'
import { getDay } from 'date-fns'
import { GraduationCap } from 'lucide-react'
import {
  toInputValue,
  fromInputValue,
  toDateInput,
  fromDateInput,
} from '../../lib/date'
import { EVENT_COLORS, STATUSES } from '../../constants'
import TagSelector from './TagSelector'
import RecurrenceField from './RecurrenceField'

// Create/edit form. `initial` is a full event object (blank for new events,
// populated for edits). Title is required.
export default function EventModal({
  initial,
  allTags,
  onCreateTag,
  onDeleteTag,
  onSave,
  onClose,
}) {
  const [title, setTitle] = useState(initial.title || '')
  const [start, setStart] = useState(toInputValue(initial.start))
  const [end, setEnd] = useState(toInputValue(initial.end))
  const [local, setLocal] = useState(initial.local || '')
  const [color, setColor] = useState(initial.color || EVENT_COLORS[0])
  const [tags, setTags] = useState(initial.tags || [])
  const [recurrence, setRecurrence] = useState(initial.recurrence || 'none')
  const [recurrenceDays, setRecurrenceDays] = useState(initial.recurrenceDays || [])
  const [recurrenceUntil, setRecurrenceUntil] = useState(
    initial.recurrenceUntil ? toDateInput(initial.recurrenceUntil) : ''
  )
  const [status, setStatus] = useState(initial.status || 'unconfirmed')
  const [isAula, setIsAula] = useState(!!initial.isAula)
  const [faltasMax, setFaltasMax] = useState(
    initial.faltasMax == null ? '' : String(initial.faltasMax)
  )
  const [faltasAtual, setFaltasAtual] = useState(initial.faltasAtual || 0)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const toggleTag = (tag) =>
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))

  const deleteTag = (tag) => {
    onDeleteTag(tag)
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  const handleRecurrenceChange = (value) => {
    setRecurrence(value)
    // When switching to custom, seed the weekday from the event's start day.
    if (value === 'custom' && recurrenceDays.length === 0) {
      setRecurrenceDays([getDay(fromInputValue(start))])
    }
  }

  const canSave = title.trim().length > 0

  const handleSave = () => {
    if (!canSave) return
    onSave({
      ...(initial.id ? { id: initial.id } : {}),
      title: title.trim(),
      start: fromInputValue(start),
      end: fromInputValue(end),
      local: local.trim(),
      color,
      tags,
      status,
      recurrence,
      recurrenceDays: recurrence === 'custom' ? recurrenceDays : [],
      recurrenceUntil:
        recurrence === 'custom' && recurrenceUntil ? fromDateInput(recurrenceUntil) : null,
      isAula,
      faltasMax: isAula ? (faltasMax === '' ? null : Number(faltasMax)) : null,
      faltasAtual: isAula ? Number(faltasAtual) || 0 : 0,
      presenca: initial.presenca || {},
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="thin-scroll max-h-[90vh] w-[440px] overflow-auto rounded-xl border border-border bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-semibold text-text">
          {initial.id ? 'Editar evento' : 'Novo evento'}
        </h2>

        <div className="flex flex-col gap-4">
          <Field label="Título">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="Título do evento"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Início">
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Fim">
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Cor">
            <div className="flex flex-wrap gap-2">
              {EVENT_COLORS.map((c) => {
                const selected = c === color
                return (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Cor ${c}`}
                    onClick={() => setColor(c)}
                    style={{
                      backgroundColor: c,
                      transform: selected ? 'scale(1.15)' : 'none',
                      borderColor: selected ? 'var(--c-text)' : 'transparent',
                      borderWidth: selected ? '2.5px' : '2px',
                    }}
                    className="h-6 w-6 rounded-full border"
                  />
                )
              })}
            </div>
          </Field>

          <Field label="Tags">
            <TagSelector
              allTags={allTags}
              selected={tags}
              onToggle={toggleTag}
              onCreate={onCreateTag}
              onDeleteTag={deleteTag}
            />
          </Field>

          <RecurrenceField
            value={recurrence}
            onChange={handleRecurrenceChange}
            days={recurrenceDays}
            onChangeDays={setRecurrenceDays}
            until={recurrenceUntil}
            onChangeUntil={setRecurrenceUntil}
          />

          <Field label="Local">
            <input
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Local ou link"
              className={inputClass}
            />
          </Field>

          <Field label="Status">
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map((s) => {
                const selected = s.value === status
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStatus(s.value)}
                    className={[
                      'rounded-md border px-3 py-1.5 text-xs font-medium',
                      selected
                        ? 'border-primary bg-primary text-white'
                        : 'border-border text-text-secondary hover:bg-accent-soft/50',
                    ].join(' ')}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
          </Field>

          <div>
            <button
              type="button"
              onClick={() => setIsAula((v) => !v)}
              className={[
                'flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium',
                isAula
                  ? 'border-primary bg-accent-soft text-primary'
                  : 'border-border text-text-secondary hover:bg-accent-soft/50',
              ].join(' ')}
            >
              <GraduationCap size={15} />
              Aula
            </button>

            {isAula && (
              <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg border border-border bg-app-bg p-3">
                <Field label="Limite de faltas">
                  <input
                    type="number"
                    min="0"
                    value={faltasMax}
                    onChange={(e) => setFaltasMax(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Faltas atuais">
                  <input
                    type="number"
                    min="0"
                    value={faltasAtual}
                    onChange={(e) => setFaltasAtual(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
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
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

const inputClass =
  'w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-[13px] text-text outline-none focus:border-primary'

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium text-text-secondary">{label}</span>
      {children}
    </label>
  )
}
