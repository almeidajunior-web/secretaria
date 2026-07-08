import { ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react'
import { VIEWS } from '../../constants'

// Period navigation, view switcher, exams shortcut, and the new-event button.
export default function AgendaToolbar({
  view,
  onChangeView,
  title,
  onPrev,
  onNext,
  onToday,
  onNew,
  onOpenProvas,
}) {
  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-2.5">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Anterior"
          onClick={onPrev}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-secondary hover:bg-accent-soft hover:text-primary"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          aria-label="Próximo"
          onClick={onNext}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-secondary hover:bg-accent-soft hover:text-primary"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <button
        type="button"
        onClick={onToday}
        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-accent-soft hover:text-primary"
      >
        Hoje
      </button>

      <h2 className="text-[15px] font-semibold text-text">{title}</h2>

      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center rounded-lg border border-border bg-app-bg p-0.5">
          {VIEWS.map((v) => {
            const active = v.value === view
            return (
              <button
                key={v.value}
                type="button"
                onClick={() => onChangeView(v.value)}
                className={[
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  active
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:text-text',
                ].join(' ')}
              >
                {v.label}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={onOpenProvas}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-accent-soft hover:text-primary"
        >
          <GraduationCap size={15} />
          Provas
        </button>

        <button
          type="button"
          onClick={onNew}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover"
        >
          Novo evento
        </button>
      </div>
    </div>
  )
}
