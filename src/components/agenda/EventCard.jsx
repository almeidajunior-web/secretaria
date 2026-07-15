import { AlertTriangle, GraduationCap, FileText, OctagonAlert } from 'lucide-react'
import { fmt } from '../../lib/date'
import { withAlpha } from '../../constants'
import { fillColorForTheme } from '../../lib/color'

const REFUSED_GRAY = '#9CA3AF'

// Visual representation of one event occurrence inside the time grid. Adapts to
// the available height: the title is always shown (truncated if needed) with
// the time, and extra details appear as the box grows. Past occurrences are
// dimmed; classes show a cap above the title and an alarm when the absence
// limit is reached.
export default function EventCard({ occ, height, isPast, faltas = 0, isDark }) {
  const { style, textColor } = statusVisual(occ.status, occ.color, isDark)
  const opacity = isPast ? 0.5 : occ.status === 'refused' ? 0.7 : 1

  const compact = height < 38
  const limitReached = occ.isAula && occ.faltasMax && faltas >= occ.faltasMax
  const KindIcon = occ.kind === 'prova' ? FileText : GraduationCap
  const showCapRow = !compact && occ.isAula && height >= 44
  const showTime = !compact && height >= 40
  const showTags = !compact && height >= 66 && occ.tags?.length > 0
  const showFaltas = !compact && occ.isAula && occ.faltasMax && height >= 58

  const timeRange = `${fmt(occ.start, 'HH:mm')}–${fmt(occ.end, 'HH:mm')}`

  return (
    <div
      style={{ ...style, opacity }}
      className={`flex h-full w-full flex-col overflow-hidden rounded-md px-1.5 text-left leading-tight ${
        compact ? 'py-0.5' : 'py-1'
      }`}
    >
      {showCapRow && (
        <span className="flex items-center gap-1 opacity-80">
          <KindIcon size={11} />
          {limitReached && <OctagonAlert size={11} />}
        </span>
      )}

      {compact ? (
        <span className="flex min-w-0 items-center gap-1">
          {occ.isAula && <KindIcon size={10} className="shrink-0 opacity-80" />}
          {limitReached && <OctagonAlert size={10} className="shrink-0" />}
          <span className="truncate text-[11px] font-medium">{occ.title}</span>
          <span className="shrink-0 text-[10px] opacity-80">{timeRange}</span>
        </span>
      ) : (
        <span className="truncate text-[11px] font-medium">{occ.title}</span>
      )}

      {showTime && <span className="text-[10px] opacity-90">{timeRange}</span>}

      {showTags && (
        <span className="mt-0.5 flex flex-wrap gap-1 overflow-hidden">
          {occ.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="truncate rounded px-1 text-[9px]"
              style={{ backgroundColor: withAlpha(textColor, 0.18) }}
            >
              {t}
            </span>
          ))}
        </span>
      )}

      {showFaltas && (
        <span className="mt-auto inline-flex items-center gap-0.5 pt-0.5 text-[10px]">
          {limitReached ? <OctagonAlert size={11} /> : <AlertTriangle size={10} />}
          {faltas}/{occ.faltasMax}
        </span>
      )}
    </div>
  )
}

function statusVisual(status, color, isDark) {
  switch (status) {
    case 'confirmed':
      return {
        style: { backgroundColor: fillColorForTheme(color, isDark), color: '#ffffff' },
        textColor: '#ffffff',
      }
    case 'unconfirmed':
      return {
        style: { backgroundColor: withAlpha(color, 0.06), border: `1.5px solid ${color}`, color },
        textColor: color,
      }
    case 'provisional':
      return {
        style: { backgroundColor: withAlpha(color, 0.06), border: `1.5px dashed ${color}`, color },
        textColor: color,
      }
    case 'refused':
      return {
        style: {
          backgroundImage: `repeating-linear-gradient(45deg, ${withAlpha(
            REFUSED_GRAY,
            0.3
          )} 0, ${withAlpha(REFUSED_GRAY, 0.3)} 1px, transparent 1px, transparent 7px)`,
          border: `1px solid ${withAlpha(REFUSED_GRAY, 0.7)}`,
          color: REFUSED_GRAY,
        },
        textColor: REFUSED_GRAY,
      }
    default:
      return {
        style: { backgroundColor: fillColorForTheme(color, isDark), color: '#ffffff' },
        textColor: '#ffffff',
      }
  }
}
