import { useEffect } from 'react'

const TITLES = {
  move: 'Mover evento recorrente',
  edit: 'Editar evento recorrente',
  delete: 'Excluir evento recorrente',
}

// Asks how a change to a recurring event should be applied.
export default function RecurrenceScopeDialog({ kind, onChoose, onCancel }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  const danger = kind === 'delete'

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        className="w-[360px] rounded-xl border border-border bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-3 text-sm font-semibold text-text">{TITLES[kind]}</h3>
        <div className="flex flex-col gap-2">
          <ScopeButton label="Somente este evento" onClick={() => onChoose('this')} />
          <ScopeButton label="Este e os próximos" onClick={() => onChoose('following')} />
          <ScopeButton
            label={danger ? 'Todos os eventos da série' : 'Todos os eventos'}
            onClick={() => onChoose('all')}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border px-4 py-2 text-xs font-medium text-text-secondary hover:bg-accent-soft/50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

function ScopeButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-border px-3 py-2.5 text-left text-[13px] font-medium text-text hover:border-primary hover:bg-accent-soft/50 hover:text-primary"
    >
      {label}
    </button>
  )
}
