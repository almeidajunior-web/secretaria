import { Settings } from 'lucide-react'
import { MODULE_DEFS } from '../../data/modules'
import MiniCalendar from './MiniCalendar'

// 220px left rail: mini calendar on top, module navigation below. `badges`
// is an optional { [moduleId]: count } map — e.g. Tarefas' overdue+today
// count — rendered as a subtle outlined counter next to the module label.
// `moduleOrder`/`hiddenModules` (from useModulesConfig) control which
// modules show up and in what order; a fixed "Configurações" entry below
// the list opens the modal that edits both.
export default function Sidebar({
  activeModule,
  onSelectModule,
  currentDate,
  onSelectDate,
  badges = {},
  moduleOrder,
  hiddenModules,
  onOpenSettings,
}) {
  const modules = moduleOrder
    .map((id) => MODULE_DEFS.find((m) => m.id === id))
    .filter((m) => m && !hiddenModules.includes(m.id))

  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-border bg-sidebar p-3">
      <MiniCalendar currentDate={currentDate} onSelectDate={onSelectDate} />

      <div className="my-3 border-t border-border" />

      <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
        Módulos
      </p>

      <nav className="flex flex-col gap-0.5">
        {modules.map(({ id, label, icon: Icon }) => {
          const active = id === activeModule
          const badge = badges[id]
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
              {badge > 0 && (
                <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded border border-border-strong px-1 text-[13px] font-medium leading-none text-text-secondary">
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto pt-2">
        <div className="border-t border-border pt-2">
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-text-secondary transition-colors hover:bg-accent-soft/60 hover:text-text"
          >
            <Settings size={16} className="text-text-muted" />
            Configurações
          </button>
        </div>
      </div>
    </aside>
  )
}
