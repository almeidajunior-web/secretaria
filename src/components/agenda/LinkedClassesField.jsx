import { getDay } from 'date-fns'
import { GraduationCap, FileText } from 'lucide-react'
import { fmt } from '../../lib/date'
import { WEEKDAYS_SHORT } from '../../constants'

// Lets a class or exam event be connected to other classes/exams (e.g. the
// same discipline meeting on different weekdays, or an exam that counts
// toward its discipline's attendance) so their absences are pooled into a
// single count. `candidates` are the other Aula/Prova events available to link.
export default function LinkedClassesField({ candidates, selected, onToggle }) {
  if (candidates.length === 0) {
    return (
      <p className="text-[11px] text-text-muted">
        Nenhuma outra aula/prova cadastrada ainda para conectar.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium text-text-secondary">
        Conectar com outras aulas/provas (soma as faltas)
      </span>
      <div className="flex flex-wrap gap-2">
        {candidates.map((c) => {
          const isSelected = selected.includes(c.id)
          const Icon = c.kind === 'prova' ? FileText : GraduationCap
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onToggle(c.id)}
              className={[
                'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
                isSelected
                  ? 'border-primary bg-accent-soft text-primary'
                  : 'border-border text-text-secondary hover:bg-accent-soft/50',
              ].join(' ')}
            >
              <Icon size={12} className="shrink-0" />
              {c.title} — {WEEKDAYS_SHORT[getDay(c.start)]} {fmt(c.start, 'HH:mm')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
