import { Fragment, useState } from 'react'
import { differenceInCalendarDays } from 'date-fns'
import { Layers, Eye, EyeOff, Trash2 } from 'lucide-react'
import { fmt } from '../../lib/date'
import ListModal, { ToggleChip } from './ListModal'
import ConfirmDialog from '../common/ConfirmDialog'

// List of exams (Provas), always soonest-first, with discipline grouping,
// show/hide finished, and click-to-edit. Finished exams are struck through.
export default function ProvasList({ events, onEdit, onDelete, onClose }) {
  const [groupBy, setGroupBy] = useState(false)
  const [showFinished, setShowFinished] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)

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
  const visible = (showFinished ? all : all.filter((p) => !isFinished(p))).sort(
    (a, b) => a.start - b.start
  )

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

  const finishedCount = all.filter(isFinished).length

  const renderRow = (p) => (
    <ProvaRow
      key={p.id}
      prova={p}
      now={now}
      finished={isFinished(p)}
      discipline={groupBy ? null : disciplinaOf(p)}
      onEdit={() => onEdit(p)}
      onDelete={() => setPendingDelete(p)}
    />
  )

  const controls = (
    <>
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
    </>
  )

  return (
    <ListModal title="Provas" onClose={onClose} controls={controls}>
      {visible.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-text-muted">
          {all.length === 0
            ? 'Nenhuma prova cadastrada. Crie um evento com a classificação “Prova”.'
            : 'Nenhuma prova futura. Ative “Ver finalizadas” para ver as anteriores.'}
        </p>
      ) : (
        <table className="w-full text-left text-[13px]">
          <thead className="sticky top-0 bg-inset text-[11px] uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-5 py-2 font-semibold">Título</th>
              <th className="px-3 py-2 font-semibold">Disciplina</th>
              <th className="px-3 py-2 font-semibold">Data</th>
              <th className="px-3 py-2 text-right font-semibold">Dias restantes</th>
              <th className="px-5 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {groupBy
              ? groups.map((g) => (
                  <Fragment key={g.discipline}>
                    <tr className="bg-inset/60">
                      <td
                        colSpan={5}
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

      {pendingDelete && (
        <ConfirmDialog
          title={`Excluir "${pendingDelete.title}"?`}
          message="A prova será removida da agenda. Esta ação não pode ser desfeita."
          confirmLabel="Excluir"
          onConfirm={() => {
            onDelete(pendingDelete)
            setPendingDelete(null)
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </ListModal>
  )
}

function ProvaRow({ prova, now, finished, discipline, onEdit, onDelete }) {
  const days = differenceInCalendarDays(prova.start, now)
  return (
    <tr
      onClick={onEdit}
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
      <td className="px-3 py-2.5 text-right">
        {finished ? (
          <span className="text-text-muted">Realizada</span>
        ) : days === 0 ? (
          <span className="font-semibold text-danger">Hoje</span>
        ) : (
          <span className={days <= 7 ? 'font-semibold text-danger' : 'font-medium text-text'}>
            {days} {days === 1 ? 'dia' : 'dias'}
          </span>
        )}
      </td>
      <RowDelete onDelete={onDelete} />
    </tr>
  )
}

// Trailing delete action; shared shape across the lists.
export function RowDelete({ onDelete }) {
  return (
    <td className="px-5 py-2.5 text-right">
      <button
        type="button"
        aria-label="Excluir"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-danger/10 hover:text-danger"
      >
        <Trash2 size={14} />
      </button>
    </td>
  )
}
