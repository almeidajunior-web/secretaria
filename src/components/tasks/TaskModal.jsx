import { useState } from 'react'
import RecurrenceField from '../common/RecurrenceField'
import TagPickerPopover from './TagPickerPopover'
import ConfirmDialog from '../common/ConfirmDialog'

const inputClass =
  'w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-[13px] text-text outline-none focus:border-primary'

// Create/edit form. `initial` is a full task object (blank for new tasks,
// populated for edits). Only título is required — no description field by
// design (tasks are meant to be self-explanatory). Field order follows the
// natural Tab order: Título → Prazo → Hora → Prioridade → Status → Tags →
// Recorrência.
export default function TaskModal({
  initial,
  priorities,
  tags,
  statuses,
  onCreateTag,
  onSave,
  onDelete,
  onClose,
}) {
  const [title, setTitle] = useState(initial.title || '')
  const [dueDate, setDueDate] = useState(initial.dueDate || '')
  const [dueTime, setDueTime] = useState(initial.dueTime || '')
  const [priorityId, setPriorityId] = useState(initial.priorityId || '')
  const [status, setStatus] = useState(initial.status || statuses[0]?.id)
  const [tagIds, setTagIds] = useState(initial.tagIds || [])
  const [recurrence, setRecurrence] = useState(initial.recurrence || 'none')
  const [recurrenceDays, setRecurrenceDays] = useState(initial.recurrenceDays || [])
  const [recurrenceUntil, setRecurrenceUntil] = useState(initial.recurrenceUntil || '')
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  // Compared directly against `initial` on every render (not an effect-based
  // "did something change since mount" flag) — that pattern breaks under
  // StrictMode's dev-only double effect invocation, which flips it to dirty
  // immediately even with zero edits.
  const dirty =
    title !== (initial.title || '') ||
    dueDate !== (initial.dueDate || '') ||
    dueTime !== (initial.dueTime || '') ||
    priorityId !== (initial.priorityId || '') ||
    status !== (initial.status || statuses[0]?.id) ||
    JSON.stringify(tagIds) !== JSON.stringify(initial.tagIds || []) ||
    recurrence !== (initial.recurrence || 'none') ||
    JSON.stringify(recurrenceDays) !== JSON.stringify(initial.recurrenceDays || []) ||
    recurrenceUntil !== (initial.recurrenceUntil || '')

  const requestClose = () => {
    if (dirty) setConfirmDiscard(true)
    else onClose()
  }

  const toggleTag = (tagId) =>
    setTagIds((prev) => (prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]))

  const canSave = title.trim().length > 0

  const handleSave = () => {
    if (!canSave) return
    onSave({
      title: title.trim(),
      dueDate: dueDate || null,
      dueTime: dueTime || null,
      priorityId: priorityId || null,
      status,
      tagIds,
      recurrence,
      recurrenceDays: recurrence === 'custom' ? recurrenceDays : [],
      recurrenceUntil: recurrence === 'custom' && recurrenceUntil ? recurrenceUntil : null,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={requestClose}
    >
      <div
        className="thin-scroll max-h-[90vh] w-[420px] overflow-auto rounded-xl border border-border bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-semibold text-text">
          {initial.id ? 'Editar tarefa' : 'Nova tarefa'}
        </h2>

        <div className="flex flex-col gap-4">
          <Field label="Título">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="Título da tarefa"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Prazo">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Hora (opcional)">
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Prioridade">
              <select
                value={priorityId}
                onChange={(e) => setPriorityId(e.target.value)}
                className={inputClass}
              >
                <option value="">Nenhuma</option>
                {priorities.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputClass}
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Tags">
            <TagPickerPopover tags={tags} selectedIds={tagIds} onToggle={toggleTag} onCreate={onCreateTag} />
          </Field>

          <RecurrenceField
            value={recurrence}
            onChange={setRecurrence}
            days={recurrenceDays}
            onChangeDays={setRecurrenceDays}
            until={recurrenceUntil}
            onChangeUntil={setRecurrenceUntil}
          />
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-md border border-border px-4 py-2 text-xs font-medium text-danger hover:bg-danger/10"
            >
              Excluir
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
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

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium text-text-secondary">{label}</span>
      {children}
    </label>
  )
}
