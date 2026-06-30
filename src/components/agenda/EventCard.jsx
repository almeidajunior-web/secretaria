import { AlertTriangle } from 'lucide-react'
import { fmt } from '../../lib/date'
import { withAlpha } from '../../constants'

const REFUSED_GRAY = '#9CA3AF'

// Visual representation of one event occurrence inside the time grid. The four
// statuses map to four distinct looks. Colors are data-driven, so the color
// styling is necessarily inline.
export default function EventCard({ occ, height, onClick }) {
  const style = statusStyle(occ.status, occ.color)
  const showTime = height > 28
  const showFaltas = occ.isAula && occ.faltasMax && height > 42

  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className="flex h-full w-full flex-col overflow-hidden rounded-md px-1.5 py-1 text-left leading-tight"
    >
      <span className="truncate text-[11px] font-medium">{occ.title}</span>
      {showTime && (
        <span className="text-[10px] opacity-90">
          {fmt(occ.start, 'HH:mm')}–{fmt(occ.end, 'HH:mm')}
        </span>
      )}
      {showFaltas && (
        <span className="mt-auto inline-flex items-center gap-0.5 text-[10px]">
          <AlertTriangle size={10} />
          {occ.faltasAtual || 0}/{occ.faltasMax}
        </span>
      )}
    </button>
  )
}

function statusStyle(status, color) {
  switch (status) {
    case 'confirmed':
      return { backgroundColor: color, color: '#ffffff' }
    case 'unconfirmed':
      return {
        backgroundColor: withAlpha(color, 0.06),
        border: `1.5px solid ${color}`,
        color,
      }
    case 'provisional':
      return {
        backgroundColor: withAlpha(color, 0.06),
        border: `1.5px dashed ${color}`,
        color,
      }
    case 'refused':
      return {
        backgroundImage: `repeating-linear-gradient(45deg, ${withAlpha(
          REFUSED_GRAY,
          0.3
        )} 0, ${withAlpha(REFUSED_GRAY, 0.3)} 1px, transparent 1px, transparent 7px)`,
        border: `1px solid ${withAlpha(REFUSED_GRAY, 0.7)}`,
        color: REFUSED_GRAY,
        opacity: 0.65,
      }
    default:
      return { backgroundColor: color, color: '#ffffff' }
  }
}
