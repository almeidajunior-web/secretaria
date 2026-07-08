import { useState } from 'react'
import { getDay } from 'date-fns'
import { Layers, Eye, EyeOff, OctagonAlert } from 'lucide-react'
import { fmt, durationLabel, weekdayOrder } from '../../lib/date'
import {
  computeFaltasGroup,
  getLinkedGroup,
  hasUpcomingOccurrence,
} from '../../lib/recurrence'
import { WEEKDAYS_SHORT, RECURRENCES } from '../../constants'
import ListModal, { ToggleChip } from './ListModal'
import { RowDelete } from './ProvasList'
import ConfirmDialog from '../common/ConfirmDialog'

const minsOf = (d) => d.getHours() * 60 + d.getMinutes()
const byWeekday = (a, b) =>
  weekdayOrder(a.start) - weekdayOrder(b.start) || minsOf(a.start) - minsOf(b.start)

function recLabel(e) {
  if (!e.recurrence || e.recurrence === 'none') return ''
  return RECURRENCES.find((r) => r.value === e.recurrence)?.label || ''
}

function dayTimeDur(e) {
  return `${WEEKDAYS_SHORT[getDay(e.start)]} ${fmt(e.start, 'HH:mm')}–${fmt(
    e.end,
    'HH:mm'
  )} · ${durationLabel(e.start, e.end)}`
}

// List of Eventos (kind 'event') or Aulas (kind 'aula'), ordered by weekday,
// with show/hide finished and click-to-edit. Aula mode adds a Faltas column and
// a "group by discipline" toggle that merges connected classes into one row.
export default function EventListModal({ mode, events, onEdit, onDelete, onClose }) {
  const [showFinished, setShowFinished] = useState(false)
  const [groupBy, setGroupBy] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)

  const isAula = mode === 'aula'
  const now = new Date()
  const isFinished = (e) => !hasUpcomingOccurrence(e, now)

  const items = events.filter((e) => e.kind === mode)
  const visible = (showFinished ? items : items.filter((e) => !isFinished(e))).sort(byWeekday)
  const visibleIds = new Set(visible.map((e) => e.id))
  const finishedCount = items.filter(isFinished).length

  // Build render records (single events, or merged discipline groups for aulas).
  const records = []
  if (isAula && groupBy) {
    const seen = new Set()
    visible.forEach((e) => {
      if (seen.has(e.id)) return
      const grp = getLinkedGroup(events, e.id).filter(
        (g) => g.kind === 'aula' && visibleIds.has(g.id)
      )
      const uniq = (grp.length ? grp : [e]).sort(byWeekday)
      uniq.forEach((g) => seen.add(g.id))
      records.push(toRecord(uniq, events, now, onEdit, setPendingDelete))
    })
  } else {
    visible.forEach((e) =>
      records.push(toRecord([e], events, now, onEdit, setPendingDelete))
    )
  }

  const controls = (
    <>
      {isAula && (
        <ToggleChip active={groupBy} icon={Layers} onClick={() => setGroupBy((v) => !v)}>
          Agrupar por disciplina
        </ToggleChip>
      )}
      <ToggleChip
        active={showFinished}
        icon={showFinished ? EyeOff : Eye}
        onClick={() => setShowFinished((v) => !v)}
        className="ml-auto"
      >
        {showFinished ? 'Ocultar finalizados' : 'Ver finalizados'}
        {!showFinished && finishedCount > 0 ? ` (${finishedCount})` : ''}
      </ToggleChip>
    </>
  )

  return (
    <ListModal title={isAula ? 'Aulas' : 'Eventos'} onClose={onClose} controls={controls}>
      {records.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-text-muted">
          {items.length === 0
            ? `Nenhum ${isAula ? 'registro de aula' : 'evento'} cadastrado.`
            : `Nenhum ${isAula ? 'a aula' : 'evento'} em andamento. Ative “Ver finalizados”.`}
        </p>
      ) : (
        <table className="w-full text-left text-[13px]">
          <thead className="sticky top-0 bg-app-bg text-[11px] uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-5 py-2 font-semibold">Título</th>
              <th className="px-3 py-2 font-semibold">Horário / Duração</th>
              <th className="px-3 py-2 font-semibold">Recorrência</th>
              <th className="px-3 py-2 font-semibold">Tags</th>
              {isAula && <th className="px-3 py-2 font-semibold">Faltas</th>}
              <th className="px-5 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <Row key={r.key} record={r} isAula={isAula} />
            ))}
          </tbody>
        </table>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={`Excluir "${pendingDelete.label}"?`}
          message={
            pendingDelete.events.length > 1
              ? `As ${pendingDelete.events.length} aulas conectadas desta disciplina serão removidas. Esta ação não pode ser desfeita.`
              : 'O item será removido da agenda. Esta ação não pode ser desfeita.'
          }
          confirmLabel="Excluir"
          onConfirm={() => {
            pendingDelete.events.forEach((e) => onDelete(e))
            setPendingDelete(null)
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </ListModal>
  )
}

// Builds a flat render record from one or more events (merged for groups).
function toRecord(list, allEvents, now, onEdit, setPendingDelete) {
  const first = list[0]
  const titles = [...new Set(list.map((e) => e.title))].join(' / ')
  const horario = list.map(dayTimeDur).join(', ')
  const recorrencia = [...new Set(list.map(recLabel).filter(Boolean))].join(', ')
  const tags = [...new Set(list.flatMap((e) => e.tags || []))]
  const faltas = computeFaltasGroup(allEvents, first, now)
  const finished = list.every((e) => !hasUpcomingOccurrence(e, now))
  return {
    key: list.map((e) => e.id).join('_'),
    color: first.color,
    title: titles,
    horario,
    recorrencia,
    tags,
    faltas,
    faltasMax: first.faltasMax,
    finished,
    onEdit: () => onEdit(first),
    onDelete: () => setPendingDelete({ label: titles, events: list }),
  }
}

function Row({ record, isAula }) {
  const limitReached = record.faltasMax && record.faltas >= record.faltasMax
  return (
    <tr
      onClick={record.onEdit}
      className={[
        'cursor-pointer border-t border-border align-top hover:bg-accent-soft/50',
        record.finished ? 'opacity-60' : '',
      ].join(' ')}
    >
      <td className="px-5 py-2.5 font-medium text-text">
        <span className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: record.color }}
          />
          <span className={record.finished ? 'line-through' : ''}>{record.title}</span>
        </span>
      </td>
      <td className="px-3 py-2.5 text-text-secondary">{record.horario}</td>
      <td className="px-3 py-2.5 text-text-secondary">{record.recorrencia || '—'}</td>
      <td className="px-3 py-2.5">
        <span className="flex flex-wrap gap-1">
          {record.tags.map((t) => (
            <span
              key={t}
              className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-primary"
            >
              {t}
            </span>
          ))}
        </span>
      </td>
      {isAula && (
        <td className="px-3 py-2.5">
          {record.faltasMax ? (
            <span
              className={
                limitReached
                  ? 'inline-flex items-center gap-1 font-semibold text-danger'
                  : 'text-text'
              }
            >
              {limitReached && <OctagonAlert size={13} />}
              {record.faltas}/{record.faltasMax}
            </span>
          ) : (
            <span className="text-text-secondary">{record.faltas}</span>
          )}
        </td>
      )}
      <RowDelete onDelete={record.onDelete} />
    </tr>
  )
}
