import { CalendarDays, CircleCheck, Wallet, LayoutDashboard } from 'lucide-react'
import MiniCalendar from './MiniCalendar'

const MODULES = [
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'planning', label: 'Planejamento', icon: LayoutDashboard },
  { id: 'todos', label: 'Tarefas', icon: CircleCheck },
  { id: 'finance', label: 'Finanças', icon: Wallet },
]

// 220px left rail: mini calendar on top, module navigation below.
export default function Sidebar({ activeModule, onSelectModule, currentDate, onSelectDate }) {
  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-border bg-sidebar p-3">
      <MiniCalendar currentDate={currentDate} onSelectDate={onSelectDate} />

      <div className="my-3 border-t border-border" />

      <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
        Módulos
      </p>

      <nav className="flex flex-col gap-0.5">
        {MODULES.map(({ id, label, icon: Icon }) => {
          const active = id === activeModule
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectModule(id)}
              className={[
                'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors',
                active
                  ? 'bg-accent-soft font-medium text-primary'
                  : 'text-text-secondary hover:bg-accent-soft/60 hover:text-text',
              ].join(' ')}
            >
              <Icon size={16} className={active ? 'text-primary' : 'text-text-muted'} />
              {label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
