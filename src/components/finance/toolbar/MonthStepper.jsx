import { ChevronLeft, ChevronRight } from 'lucide-react'

// Same stepper vocabulary as the Agenda's and Metas' toolbars (bordered
// arrows, a pill to jump back, the period as a title), so moving through time
// reads the same in every module. The pill says "Mês atual" rather than
// "Hoje" — the unit here is the month — and only shows up once you've left
// the present: it's the way back, not a control you need while already there.
export default function MonthStepper({ title, showToday, onPrev, onNext, onToday }) {
  const arrow =
    'flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-secondary hover:border-border-strong hover:text-primary'
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <button type="button" onClick={onPrev} aria-label="Mês anterior" className={arrow}>
          <ChevronLeft size={16} />
        </button>
        <button type="button" onClick={onNext} aria-label="Próximo mês" className={arrow}>
          <ChevronRight size={16} />
        </button>
      </div>
      <h2 className="min-w-[150px] text-[14px] font-semibold text-text">{title}</h2>
      {showToday && (
        <button
          type="button"
          onClick={onToday}
          className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-text-secondary hover:border-border-strong"
        >
          Mês atual
        </button>
      )}
    </div>
  )
}
