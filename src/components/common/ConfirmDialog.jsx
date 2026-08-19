import { useEffect } from 'react'

// Small confirmation dialog rendered above other modals. `tone` controls the
// confirm button color ('danger' or 'primary').
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Excluir',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  const confirmClass =
    tone === 'danger'
      ? 'bg-danger hover:opacity-90'
      : 'bg-primary hover:bg-primary-hover'

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-primary-deep/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        e.stopPropagation()
        onCancel()
      }}
    >
      <div
        className="w-[360px] rounded-xl border border-border bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        {message && (
          <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">{message}</p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border px-4 py-2 text-xs font-medium text-text-secondary hover:bg-accent-soft/50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-md px-4 py-2 text-xs font-medium text-white ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
