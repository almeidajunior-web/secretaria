import { useEffect } from 'react'
import { differenceInCalendarDays } from 'date-fns'
import { X } from 'lucide-react'
import { fmt } from '../../lib/date'

// Simple list of every exam (Prova), sorted by date, with a countdown to help
// plan study time. Discipline is pulled from the exam's connected class.
export default function ProvasList({ events, onSelectDay, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const now = new Date()
  const provas = events
    .filter((e) => e.kind === 'prova')
    .sort((a, b) => a.start - b.start)

  const disciplinaOf = (prova) => {
    const names = (prova.linkedIds || [])
      .map((id) => events.find((e) => e.id === id)?.title)
      .filter(Boolean)
    if (names.length) return names.join(', ')
    return prova.tags?.length ? prova.tags.join(', ') : '—'
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-[680px] overflow-hidden rounded-xl border border-border bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-base font-semibold text-text">Provas</h2>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-accent-soft hover:text-primary"
          >
            <X size={16} />
          </button>
        </div>

        <div className="thin-scroll max-h-[70vh] overflow-auto">
          {provas.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-text-muted">
              Nenhuma prova cadastrada. Crie um evento com a classificação “Prova”.
            </p>
          ) : (
            <table className="w-full text-left text-[13px]">
              <thead className="sticky top-0 bg-app-bg text-[11px] uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-5 py-2 font-semibold">Título</th>
                  <th className="px-3 py-2 font-semibold">Disciplina</th>
                  <th className="px-3 py-2 font-semibold">Data</th>
                  <th className="px-5 py-2 text-right font-semibold">Dias restantes</th>
                </tr>
              </thead>
              <tbody>
                {provas.map((p) => {
                  const days = differenceInCalendarDays(p.start, now)
                  return (
                    <tr
                      key={p.id}
                      onClick={() => onSelectDay(p.start)}
                      className="cursor-pointer border-t border-border hover:bg-accent-soft/50"
                    >
                      <td className="px-5 py-2.5 font-medium text-text">
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: p.color }}
                          />
                          {p.title}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-text-secondary">{disciplinaOf(p)}</td>
                      <td className="px-3 py-2.5 text-text-secondary">
                        {fmt(p.start, "dd/MM/yyyy 'às' HH:mm")}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <Countdown days={days} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function Countdown({ days }) {
  if (days < 0) return <span className="text-text-muted">Realizada</span>
  if (days === 0) return <span className="font-semibold text-danger">Hoje</span>
  const urgent = days <= 7
  return (
    <span className={urgent ? 'font-semibold text-danger' : 'font-medium text-text'}>
      {days} {days === 1 ? 'dia' : 'dias'}
    </span>
  )
}
