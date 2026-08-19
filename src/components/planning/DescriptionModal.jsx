import { useState } from 'react'

// Add/edit/delete the free-text description tied to one grid window.
// Opened either from WindowOptionsPopover ("Adicionar/Editar descrição") or
// directly from a window's corner note icon.
export default function DescriptionModal({ windowLabel, initialText, onSave, onDelete, onClose }) {
  const [text, setText] = useState(initialText || '')

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-primary-deep/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-[420px] rounded-xl border border-border bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-text">Descrição</h2>
        <p className="mb-3 mt-0.5 text-[11px] text-text-secondary">{windowLabel}</p>

        <textarea
          autoFocus
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva uma nota para esta janela…"
          className="w-full resize-none rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-[13px] text-text outline-none focus:border-primary"
        />

        <div className="mt-4 flex items-center justify-between gap-2">
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
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-xs font-medium text-text-secondary hover:bg-accent-soft/50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onSave(text)}
              className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-hover"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
