import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  Clock,
  MapPin,
  Tag,
  AlertTriangle,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react'
import { fmt } from '../../lib/date'

const WIDTH = 264

// Detail popover anchored next to a clicked event. Reads the live event from
// `events` so presence toggles update the badge and buttons immediately.
export default function EventPopover({
  occ,
  events,
  rect,
  onClose,
  onEdit,
  onDelete,
  onTogglePresence,
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
  const faltasMax = live.faltasMax
  const faltasAtual = live.faltasAtual || 0
  const presence = (live.presenca || {})[occ.occKey]
  const pct = faltasMax ? Math.round((faltasAtual / faltasMax) * 100) : 0
  const isPast = occ.end < new Date()

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
        {occ.isAula && faltasMax > 0 && (
          <Row icon={AlertTriangle}>
            <span className={pct >= 75 ? 'font-medium text-danger' : ''}>
              Faltas: {faltasAtual}/{faltasMax} ({pct}%)
            </span>
          </Row>
        )}
      </div>

      {occ.isAula && isPast && (
        <div className="mt-3 flex gap-2">
          <PresenceButton
            active={presence === 'present'}
            tone="success"
            icon={Check}
            label="Presente"
            onClick={() => onTogglePresence(occ.eventId, occ.occKey, 'present')}
          />
          <PresenceButton
            active={presence === 'absent'}
            tone="danger"
            icon={X}
            label="Falta"
            onClick={() => onTogglePresence(occ.eventId, occ.occKey, 'absent')}
          />
        </div>
      )}

      <div className="mt-3 flex gap-2 border-t border-border pt-3">
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

function PresenceButton({ active, tone, icon: Icon, label, onClick }) {
  const activeClass =
    tone === 'success'
      ? 'border-success bg-success text-white'
      : 'border-danger bg-danger text-white'
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex flex-1 items-center justify-center gap-1.5 rounded-md border py-1.5 text-xs font-medium',
        active ? activeClass : 'border-border text-text-secondary hover:bg-accent-soft',
      ].join(' ')}
    >
      <Icon size={13} />
      {label}
    </button>
  )
}
