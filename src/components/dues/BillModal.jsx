import { useState } from 'react'
import { RECURRENCE_OPTIONS } from '../../lib/billRecurrence'

const inputClass =
  'w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-[13px] text-text outline-none focus:border-primary'

// More visual entry point for creating a new bill — the quick-add row
// stays as the fast path. Create-only, no dirty/discard-confirmation, same
// low-friction spirit as the rest of this module (no delete confirmation
// either). Vencimento is the one required field besides título, since a
// bill with no due date doesn't fit this module's whole premise.
export default function BillModal({ categories, onSave, onClose }) {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [recurrence, setRecurrence] = useState('none')
  const [description, setDescription] = useState('')

  const canSave = title.trim().length > 0 && dueDate

  const handleSave = () => {
    if (!canSave) return
    onSave({
      title: title.trim(),
      amount: amount === '' ? 0 : Number(amount),
      dueDate,
      categoryId: categoryId || null,
      recurrence,
      description: description.trim(),
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary-deep/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-[420px] rounded-xl border border-border bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-semibold text-text">Novo vencimento</h2>

        <div className="flex flex-col gap-4">
          <Field label="Título">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="Ex.: Conta de luz, Netflix, Aluguel…"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] text-text-muted">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className={inputClass}
                />
              </div>
            </Field>
            <Field label="Vencimento">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Classificação">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={inputClass}
              >
                <option value="">Sem classificação</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Recorrência">
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className={inputClass}
              >
                {RECURRENCE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Descrição (opcional)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição breve…"
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </Field>
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
            Adicionar
          </button>
        </div>
      </div>
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
