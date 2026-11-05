import { AlertTriangle, X } from 'lucide-react'
import { useStorageProblems, dismissProblems } from '../../storage/problems'

const labelsOf = (problems) => [...new Set(problems.map((p) => p.label).filter(Boolean))].join(', ')

// Thin bar under the top bar, shown only when saving or reading the browser's
// storage went wrong — never in normal use. A refused save means changes live
// only in this tab; an unreadable value was set aside, not overwritten.
export default function StorageNotice() {
  const problems = useStorageProblems()
  if (problems.length === 0) return null

  const writes = problems.filter((p) => p.kind === 'write')
  const corrupt = problems.filter((p) => p.kind === 'corrupt')

  return (
    <div
      role="alert"
      className="flex shrink-0 items-start gap-2.5 border-b border-danger/30 bg-danger/10 px-4 py-2 text-[12px] leading-relaxed text-text"
    >
      <AlertTriangle size={15} className="mt-0.5 shrink-0 text-danger" />
      <div className="flex flex-1 flex-col gap-0.5">
        {writes.length > 0 && (
          <p>
            <span className="font-semibold">Não foi possível salvar as últimas alterações</span> (
            {labelsOf(writes)}): o armazenamento do navegador está cheio ou bloqueado. Por enquanto elas valem só
            nesta aba — exporte um backup em Configurações → Backup.
          </p>
        )}
        {corrupt.length > 0 && (
          <p>
            <span className="font-semibold">Alguns dados salvos estavam ilegíveis</span> ({labelsOf(corrupt)}). Uma
            cópia foi guardada à parte e o módulo começou vazio; se tiver um backup, restaure-o em Configurações →
            Backup.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={dismissProblems}
        aria-label="Fechar aviso"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-danger/15 hover:text-danger"
      >
        <X size={13} />
      </button>
    </div>
  )
}
