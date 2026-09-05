import { useState } from 'react'

const inputClass =
  'w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-[13px] text-text outline-none focus:border-primary'

// Optional, more visual entry point for creating a new item — the quick-add
// row at the bottom of the list stays as the fast path. Create-only (no
// edit/delete here): every field is already editable inline once the item
// exists, matching the rest of the module's low-friction feel — no
// discard-confirmation on close either, same spirit as skipping the delete
// confirmation elsewhere in Compras.
export default function ShoppingItemModal({ categories, priorities, onSave, onClose }) {
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priorityId, setPriorityId] = useState('')

  const canSave = title.trim().length > 0

  const handleSave = () => {
    if (!canSave) return
    onSave({
      title: title.trim(),
      categoryId: categoryId || null,
      priorityId: priorityId || null,
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
        <h2 className="mb-4 text-base font-semibold text-text">Novo item</h2>

        <div className="flex flex-col gap-4">
          <Field label="Título">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="O que você precisa comprar?"
              className={inputClass}
            />
          </Field>

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
            <Field label="Prioridade">
              <select
                value={priorityId}
                onChange={(e) => setPriorityId(e.target.value)}
                className={inputClass}
              >
                <option value="">Sem prioridade</option>
                {priorities.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
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
