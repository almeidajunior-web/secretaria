import { useEffect, useMemo, useState } from 'react'
import { getDay } from 'date-fns'
import { OctagonAlert } from 'lucide-react'
import {
  toInputValue,
  fromInputValue,
  toDateInput,
  fromDateInput,
} from '../../lib/date'
import { computeFaltas, hasUpcomingOccurrence } from '../../lib/recurrence'
import { EVENT_COLORS, STATUSES, CLASSIFICATIONS } from '../../constants'
import TagSelector from '../common/TagSelector'
import RecurrenceField from '../common/RecurrenceField'
import LinkedClassesField from './LinkedClassesField'
import ConfirmDialog from '../common/ConfirmDialog'

// Create/edit form. `initial` is a full event object (blank for new events,
// populated for edits). Title is required.
export default function EventModal({
  initial,
  events,
  allTags,
  onCreateTag,
  onDeleteTag,
  onSave,
  onClose,
}) {
  const [kind, setKind] = useState(initial.kind || (initial.isAula ? 'aula' : 'event'))
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
  const [faltasMax, setFaltasMax] = useState(
    initial.faltasMax == null ? '' : String(initial.faltasMax)
  )
  const [linkedIds, setLinkedIds] = useState(initial.linkedIds || [])
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  // Compared directly against `initial` on every render (not an effect-based
  // "did something change since mount" flag) — that pattern breaks under
  // StrictMode's dev-only double effect invocation, which flips it to dirty
  // immediately even with zero edits.
  const dirty =
    kind !== (initial.kind || (initial.isAula ? 'aula' : 'event')) ||
    title !== (initial.title || '') ||
    start !== toInputValue(initial.start) ||
    end !== toInputValue(initial.end) ||
    local !== (initial.local || '') ||
    color !== (initial.color || EVENT_COLORS[0]) ||
    JSON.stringify(tags) !== JSON.stringify(initial.tags || []) ||
    recurrence !== (initial.recurrence || 'none') ||
    JSON.stringify(recurrenceDays) !== JSON.stringify(initial.recurrenceDays || []) ||
    recurrenceUntil !== (initial.recurrenceUntil ? toDateInput(initial.recurrenceUntil) : '') ||
    status !== (initial.status || 'unconfirmed') ||
    faltasMax !== (initial.faltasMax == null ? '' : String(initial.faltasMax)) ||
    JSON.stringify(linkedIds) !== JSON.stringify(initial.linkedIds || [])

  const requestClose = () => {
    if (dirty) setConfirmDiscard(true)
    else onClose()
  }

  const isClass = kind === 'aula' || kind === 'prova'
  const isProva = kind === 'prova'
  const effRecurrence = isProva ? 'none' : recurrence

  // Offer classes AND exams for connection (an exam counting toward its
  // discipline's attendance is intentional). Finished one-off items are
  // hidden unless already linked, so they stay visible to be unlinked.
  const linkCandidates = (events || []).filter(
    (e) =>
      e.id !== initial.id &&
      (e.kind === 'aula' || e.kind === 'prova') &&
      (hasUpcomingOccurrence(e) || linkedIds.includes(e.id))
  )
  const toggleLink = (id) =>
    setLinkedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  // Absences are derived from the per-occurrence status; preview live and pool
  // any connected classes' (already saved) absences into the total.
  const derivedFaltas = useMemo(() => {
    const own = computeFaltas({
      ...initial,
      isAula: isClass,
      start: fromInputValue(start),
      end: fromInputValue(end),
      recurrence: effRecurrence,
      recurrenceDays: effRecurrence === 'custom' ? recurrenceDays : [],
      recurrenceUntil:
        effRecurrence === 'custom' && recurrenceUntil ? fromDateInput(recurrenceUntil) : null,
      occStatus: initial.occStatus || {},
    })
    const linkedTotal = linkedIds.reduce((sum, id) => {
      const linked = (events || []).find((e) => e.id === id)
      return sum + (linked ? computeFaltas(linked) : 0)
    }, 0)
    return own + linkedTotal
  }, [initial, isClass, effRecurrence, start, end, recurrenceDays, recurrenceUntil, linkedIds, events])
  const limitReached =
    kind === 'aula' &&
    faltasMax !== '' &&
    Number(faltasMax) > 0 &&
    derivedFaltas >= Number(faltasMax)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape' || confirmDiscard) return // ConfirmDialog owns Escape while open
      requestClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [dirty, confirmDiscard])

  const toggleTag = (tag) =>
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))

  // Classes/exams default to "Confirmado" (presence as default). Exams are
  // one-off, so recurrence is dropped when switching to Prova.
  const changeKind = (k) => {
    if (k !== 'event' && kind === 'event') setStatus('confirmed')
    if (k === 'event') setLinkedIds([])
    if (k === 'prova') setRecurrence('none')
    setKind(k)
  }

  const deleteTag = (tag) => {
    onDeleteTag(tag)
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  const handleRecurrenceChange = (value) => {
    setRecurrence(value)
    if (value === 'custom' && recurrenceDays.length === 0) {
      setRecurrenceDays([getDay(fromInputValue(start))])
    }
  }

  // Guards against saving an inverted range (e.g. picking the wrong day for
  // "Fim") — nothing else in the data model catches this, and it silently
  // produces nonsensical negative/zero durations downstream.
  const datesValid = fromInputValue(end) > fromInputValue(start)
  const canSave = title.trim().length > 0 && datesValid

  const handleSave = () => {
    if (!canSave) return
    onSave({
      ...(initial.id ? { id: initial.id } : {}),
      kind,
      title: title.trim(),
      start: fromInputValue(start),
      end: fromInputValue(end),
      local: local.trim(),
      color,
      tags,
      status,
      recurrence: effRecurrence,
      recurrenceDays: effRecurrence === 'custom' ? recurrenceDays : [],
      recurrenceUntil:
        effRecurrence === 'custom' && recurrenceUntil ? fromDateInput(recurrenceUntil) : null,
      isAula: isClass,
      faltasMax: kind === 'aula' ? (faltasMax === '' ? null : Number(faltasMax)) : null,
      linkedIds: isClass ? linkedIds : [],
      occStatus: initial.occStatus || {},
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={requestClose}
    >
      <div
        className="thin-scroll max-h-[90vh] w-[440px] overflow-auto rounded-xl border border-border bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-semibold text-text">
          {initial.id ? 'Editar evento' : 'Novo evento'}
        </h2>

        <div className="flex flex-col gap-4">
          <Field label="Classificação">
            <div className="grid grid-cols-3 gap-2">
              {CLASSIFICATIONS.map((c) => {
                const selected = c.value === kind
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => changeKind(c.value)}
                    className={[
                      'rounded-md border px-3 py-1.5 text-xs font-medium',
                      selected
                        ? 'border-primary bg-primary text-white'
                        : 'border-border text-text-secondary hover:bg-accent-soft/50',
                    ].join(' ')}
                  >
                    {c.label}
                  </button>
                )
              })}
            </div>
          </Field>

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
          {!datesValid && (
            <p className="-mt-3 text-[11px] text-danger">O fim deve ser depois do início.</p>
          )}

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

          {!isProva && (
            <RecurrenceField
              value={recurrence}
              onChange={handleRecurrenceChange}
              days={recurrenceDays}
              onChangeDays={setRecurrenceDays}
              until={recurrenceUntil}
              onChangeUntil={setRecurrenceUntil}
            />
          )}

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

          {isClass && (
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-app-bg p-3">
              {kind === 'aula' ? (
                <>
                  <Field label="Limite de faltas">
                    <input
                      type="number"
                      min="0"
                      value={faltasMax}
                      onChange={(e) => setFaltasMax(e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <p className="text-[11px] text-text-secondary">
                    Faltas (automático):{' '}
                    <span className="font-semibold text-text">{derivedFaltas}</span>
                    {faltasMax !== '' && ` de ${faltasMax}`}
                    {linkedIds.length > 0 && ' · somadas com as aulas conectadas'}
                  </p>
                  <p className="text-[11px] leading-relaxed text-text-muted">
                    Conta as aulas passadas sem status “Confirmado”. Marque a presença pelo
                    status de cada aula.
                  </p>
                </>
              ) : (
                <p className="text-[11px] leading-relaxed text-text-muted">
                  A prova é pontual (sem recorrência) e conta para a presença da disciplina.
                  Conecte-a à aula correspondente para somar na frequência.
                </p>
              )}

              <div className={kind === 'aula' ? 'border-t border-border pt-3' : ''}>
                <LinkedClassesField
                  candidates={linkCandidates}
                  selected={linkedIds}
                  onToggle={toggleLink}
                />
              </div>

              {limitReached && (
                <div className="flex items-center gap-2 rounded-md bg-danger/10 px-2 py-1.5 text-[11px] font-medium text-danger">
                  <OctagonAlert size={14} className="shrink-0" />
                  Limite de faltas atingido
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={requestClose}
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

      {confirmDiscard && (
        <ConfirmDialog
          title="Descartar alterações não salvas?"
          message="As alterações feitas neste formulário serão perdidas."
          confirmLabel="Descartar"
          onConfirm={onClose}
          onCancel={() => setConfirmDiscard(false)}
        />
      )}
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
