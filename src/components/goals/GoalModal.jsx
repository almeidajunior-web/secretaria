import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import ConfirmDialog from '../common/ConfirmDialog'

const inputClass =
  'w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-[13px] text-text outline-none focus:border-primary'

// Create/edit a meta. Progress lives here rather than on the card — the card
// is a click target for opening this modal now, not an inline-editable
// surface — so dragging the slider or typing the number both only take effect
// once you hit Salvar, same as every other field.
export default function GoalModal({ goal, onSave, onDelete, onClose }) {
  const editing = !!goal
  const [title, setTitle] = useState(goal?.title ?? '')
  const [description, setDescription] = useState(goal?.description ?? '')
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? '')
  const [progress, setProgress] = useState(goal?.progress ?? 0)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const canSave = title.trim().length > 0

  const setProgressClamped = (value) => setProgress(Math.max(0, Math.min(100, Math.round(Number(value) || 0))))

  const handleSave = () => {
    if (!canSave) return
    onSave({
      ...(goal ?? { status: 'active' }),
      title: title.trim(),
      description: description.trim(),
      targetDate: targetDate || null,
      progress,
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
          {editing ? 'Editar meta' : 'Nova meta'}
        </h2>

        <div className="flex flex-col gap-4">
          <Field label="Meta">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="Ex.: Terminar a especialização"
              className={inputClass}
            />
          </Field>

          <Field label="Descrição (opcional)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="O que precisa acontecer para considerar concluída?"
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </Field>

          <Field label="Prazo (opcional)">
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Progresso">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={progress}
                onChange={(e) => setProgressClamped(e.target.value)}
                aria-label="Progresso"
                className="progress-slider min-w-0 flex-1"
                style={{
                  background: `linear-gradient(to right, rgb(var(--c-primary)) ${progress}%, rgb(var(--c-border-strong)) ${progress}%)`,
                }}
              />
              <div className="flex shrink-0 items-center gap-0.5">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgressClamped(e.target.value)}
                  aria-label="Progresso em porcentagem"
                  className="w-[50px] rounded-md border border-border-strong bg-surface px-1.5 py-1 text-right text-[12px] tabular-nums text-text outline-none focus:border-primary"
                />
                <span className="text-[12px] text-text-muted">%</span>
              </div>
            </div>
          </Field>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          {editing && (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              aria-label="Excluir meta"
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
          title={`Excluir "${goal.title}"?`}
          message="Esta ação não pode ser desfeita."
          confirmLabel="Excluir"
          onConfirm={() => {
            onDelete(goal.id)
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
