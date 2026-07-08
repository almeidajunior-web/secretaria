import { Fragment, useEffect, useState } from 'react'
import { differenceInCalendarDays } from 'date-fns'
import { X, ArrowUp, ArrowDown, Layers, Eye, EyeOff } from 'lucide-react'
import { fmt } from '../../lib/date'

// List of exams (Provas) with sorting, discipline grouping, and the option to
// show/hide finished exams (past ones are struck through). Discipline is pulled
// from each exam's connected class.
export default function ProvasList({ events, onSelectDay, onClose }) {
  const [sortDir, setSortDir] = useState('asc') // 'asc' = soonest first
  const [groupBy, setGroupBy] = useState(false)
  const [showFinished, setShowFinished] = useState(false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const now = new Date()
  const isFinished = (p) => p.end < now

  const disciplinaOf = (prova) => {
    const names = (prova.linkedIds || [])
      .map((id) => events.find((e) => e.id === id)?.title)
      .filter(Boolean)
    if (names.length) return names.join(', ')
    return prova.tags?.length ? prova.tags.join(', ') : '—'
  }

  const all = events.filter((e) => e.kind === 'prova')
  const visible = (showFinished ? all : all.filter((p) => !isFinished(p))).sort((a, b) =>
    sortDir === 'asc' ? a.start - b.start : b.start - a.start
  )

  // Preserve the sorted order while grouping by discipline.
  const groups = []
  const groupIndex = new Map()
  visible.forEach((p) => {
    const key = disciplinaOf(p)
    if (!groupIndex.has(key)) {
      groupIndex.set(key, groups.length)
      groups.push({ discipline: key, items: [] })
    }
    groups[groupIndex.get(key)].items.push(p)
  })

  const renderRow = (p) => (
    <ProvaRow
      key={p.id}
      prova={p}
      now={now}
      finished={isFinished(p)}
      discipline={groupBy ? null : disciplinaOf(p)}
      onSelect={() => onSelectDay(p.start)}
    />
  )

  const finishedCount = all.filter(isFinished).length

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-[720px] overflow-hidden rounded-xl border border-border bg-surface"
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

        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-2.5">
          <div className="flex items-center rounded-lg border border-border bg-app-bg p-0.5">
            <SortButton
              active={sortDir === 'asc'}
              icon={ArrowUp}
              label="Mais próximas"
              onClick={() => setSortDir('asc')}
            />
            <SortButton
              active={sortDir === 'desc'}
              icon={ArrowDown}
              label="Mais distantes"
              onClick={() => setSortDir('desc')}
            />
          </div>

          <ToggleChip active={groupBy} icon={Layers} onClick={() => setGroupBy((v) => !v)}>
            Agrupar por disciplina
          </ToggleChip>

          <ToggleChip
            active={showFinished}
            icon={showFinished ? EyeOff : Eye}
            onClick={() => setShowFinished((v) => !v)}
            className="ml-auto"
          >
            {showFinished ? 'Ocultar finalizadas' : 'Ver finalizadas'}
            {!showFinished && finishedCount > 0 ? ` (${finishedCount})` : ''}
          </ToggleChip>
        </div>

        <div className="thin-scroll max-h-[65vh] overflow-auto">
          {visible.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-text-muted">
              {all.length === 0
                ? 'Nenhuma prova cadastrada. Crie um evento com a classificação “Prova”.'
                : 'Nenhuma prova futura. Ative “Ver finalizadas” para ver as anteriores.'}
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
                {groupBy
                  ? groups.map((g) => (
                      <Fragment key={g.discipline}>
                        <tr className="bg-app-bg/60">
                          <td
                            colSpan={4}
                            className="px-5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-secondary"
                          >
                            {g.discipline}
                          </td>
                        </tr>
                        {g.items.map(renderRow)}
                      </Fragment>
                    ))
                  : visible.map(renderRow)}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function ProvaRow({ prova, now, finished, discipline, onSelect }) {
  const days = differenceInCalendarDays(prova.start, now)
  return (
    <tr
      onClick={onSelect}
      className={[
        'cursor-pointer border-t border-border hover:bg-accent-soft/50',
        finished ? 'opacity-60' : '',
      ].join(' ')}
    >
      <td className="px-5 py-2.5 font-medium text-text">
        <span className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: prova.color }}
          />
          <span className={finished ? 'line-through' : ''}>{prova.title}</span>
        </span>
      </td>
      <td className="px-3 py-2.5 text-text-secondary">{discipline ?? ''}</td>
      <td className={`px-3 py-2.5 text-text-secondary ${finished ? 'line-through' : ''}`}>
        {fmt(prova.start, "dd/MM/yyyy 'às' HH:mm")}
      </td>
      <td className="px-5 py-2.5 text-right">
        <Countdown days={days} finished={finished} />
      </td>
    </tr>
  )
}

function Countdown({ days, finished }) {
  if (finished) return <span className="text-text-muted">Realizada</span>
  if (days === 0) return <span className="font-semibold text-danger">Hoje</span>
  const urgent = days <= 7
  return (
    <span className={urgent ? 'font-semibold text-danger' : 'font-medium text-text'}>
      {days} {days === 1 ? 'dia' : 'dias'}
    </span>
  )
}

function SortButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
        active ? 'bg-primary text-white' : 'text-text-secondary hover:text-text',
      ].join(' ')}
    >
      <Icon size={13} />
      {label}
    </button>
  )
}

function ToggleChip({ active, icon: Icon, onClick, className = '', children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-accent-soft text-primary'
          : 'border-border text-text-secondary hover:bg-accent-soft/50',
        className,
      ].join(' ')}
    >
      <Icon size={13} />
      {children}
    </button>
  )
}
