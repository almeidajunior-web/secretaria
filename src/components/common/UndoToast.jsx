import { useEffect } from 'react'
import { Undo2, X } from 'lucide-react'

const AUTO_DISMISS_MS = 6000

// Fixed toast at the bottom of the screen offering to undo the last
// destructive action. Auto-dismisses after a few seconds.
export default function UndoToast({ message, onUndo, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="fixed bottom-5 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-3 rounded-lg border border-border bg-surface px-4 py-2.5 shadow-lg">
      <span className="text-[13px] text-text">{message}</span>
      <button
        type="button"
        onClick={onUndo}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium text-primary hover:bg-accent-soft"
      >
        <Undo2 size={14} />
        Desfazer
      </button>
      <button
        type="button"
        aria-label="Fechar"
        onClick={onDismiss}
        className="flex h-6 w-6 items-center justify-center rounded-md text-text-muted hover:bg-accent-soft hover:text-text"
      >
        <X size={13} />
      </button>
    </div>
  )
}
