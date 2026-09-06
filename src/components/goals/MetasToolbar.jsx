import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

const PERIODS = [
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
]

// Same bar shell and stepper vocabulary as the Agenda's toolbar, so moving
// between periods feels identical across modules.
export default function MetasToolbar({ period, onChangePeriod, title, onPrev, onNext, onToday, onNewHabit }) {
  return (
    <div className="relative z-30 flex shrink-0 flex-wrap items-center gap-3 glass border-b px-4 py-2.5">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          aria-label="Período anterior"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-secondary hover:border-border-strong hover:text-primary"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={onNext}
          aria-label="Próximo período"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-secondary hover:border-border-strong hover:text-primary"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <button
        type="button"
        onClick={onToday}
        className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-text-secondary hover:border-border-strong"
      >
        Hoje
      </button>

      <h2 className="text-[15px] font-semibold text-text">{title}</h2>

      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-md bg-inset p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => onChangePeriod(p.value)}
              className={[
                'rounded px-2.5 py-1 text-[11px] font-medium transition-colors',
                period === p.value
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text',
              ].join(' ')}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onNewHabit}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover"
        >
          <Plus size={13} />
          Nova rotina
        </button>
      </div>
    </div>
  )
}
