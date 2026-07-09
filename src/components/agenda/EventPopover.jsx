import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  Clock,
  MapPin,
  Tag,
  AlertTriangle,
  OctagonAlert,
  Link2,
  Pencil,
  Copy,
  Trash2,
} from 'lucide-react'
import { fmt } from '../../lib/date'
import { computeFaltasGroup } from '../../lib/recurrence'
import { STATUSES } from '../../constants'

const WIDTH = 268

// Detail popover anchored next to a clicked event. Reads the live event from
// `events` so the editable status, derived absences and warnings stay current.
export default function EventPopover({
  occ,
  events,
  rect,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
  onSetStatus,
}) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ left: rect.right + 8, top: rect.top })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const w = el.offsetWidth || WIDTH
    const h = el.offsetHeight
    let left = rect.right + 8
    if (left + w > window.innerWidth - 8) left = rect.left - w - 8
    left = Math.max(8, left)
    let top = rect.top
    if (top + h > window.innerHeight - 8) top = window.innerHeight - h - 8
    top = Math.max(8, top)
    setPos({ left, top })
  }, [rect])

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [onClose])

  const live = events.find((e) => e.id === occ.eventId) || occ
  const currentStatus =
    live.recurrence === 'none'
      ? live.status
      : (live.occStatus || {})[occ.occKey] || live.status
  const faltasMax = live.faltasMax
  const faltas = computeFaltasGroup(events, live)
  const pct = faltasMax ? Math.round((faltas / faltasMax) * 100) : 0
  const limitReached = live.isAula && faltasMax && faltas >= faltasMax
  const linkedNames = (live.linkedIds || [])
    .map((id) => events.find((e) => e.id === id)?.title)
    .filter(Boolean)

  return (
    <div
      ref={ref}
      style={{ left: pos.left, top: pos.top, width: WIDTH }}
      className="fixed z-50 rounded-xl border border-border bg-surface p-3 shadow-lg"
    >
      <h3 className="mb-2 text-sm font-semibold" style={{ color: occ.color }}>
        {occ.title}
      </h3>

      <div className="flex flex-col gap-1.5 text-[12px] text-text-secondary">
        <Row icon={Clock}>
          {fmt(occ.start, 'HH:mm')} – {fmt(occ.end, 'HH:mm')}
        </Row>
        {occ.local && <Row icon={MapPin}>{occ.local}</Row>}
        {occ.tags?.length > 0 && <Row icon={Tag}>{occ.tags.join(', ')}</Row>}
        {live.isAula && faltasMax > 0 && (
          <Row icon={AlertTriangle}>
            <span className={pct >= 75 ? 'font-medium text-danger' : ''}>
              Faltas: {faltas}/{faltasMax} ({pct}%)
            </span>
          </Row>
        )}
        {linkedNames.length > 0 && (
          <Row icon={Link2}>Conectada com: {linkedNames.join(', ')}</Row>
        )}
        {limitReached && (
          <div className="flex items-center gap-2 rounded-md bg-danger/10 px-2 py-1 font-medium text-danger">
            <OctagonAlert size={14} className="shrink-0" />
            Limite de faltas atingido
          </div>
        )}
      </div>

      <div className="mt-3">
        <p className="mb-1.5 text-[11px] font-medium text-text-secondary">Status</p>
        <div className="grid grid-cols-2 gap-1.5">
          {STATUSES.map((s) => {
            const active = s.value === currentStatus
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => onSetStatus(occ.eventId, occ.occKey, s.value)}
                className={[
                  'rounded-md border px-2 py-1.5 text-[11px] font-medium',
                  active
                    ? 'border-primary bg-primary text-white'
                    : 'border-border text-text-secondary hover:bg-accent-soft/60',
                ].join(' ')}
              >
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-3 flex gap-1.5 border-t border-border pt-3">
        <button
          type="button"
          onClick={() => onEdit(occ)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border py-1.5 text-xs font-medium text-text-secondary hover:bg-accent-soft hover:text-primary"
        >
          <Pencil size={13} />
          Editar
        </button>
        <button
          type="button"
          aria-label="Duplicar"
          onClick={() => onDuplicate(occ)}
          className="flex items-center justify-center rounded-md border border-border px-2.5 py-1.5 text-text-secondary hover:bg-accent-soft hover:text-primary"
        >
          <Copy size={14} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(occ)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border py-1.5 text-xs font-medium text-danger hover:bg-danger/10"
        >
          <Trash2 size={13} />
          Excluir
        </button>
      </div>
    </div>
  )
}

function Row({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={13} className="shrink-0 text-text-muted" />
      <span className="truncate">{children}</span>
    </div>
  )
}
