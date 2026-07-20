import { Settings, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { MODULE_DEFS } from '../../data/modules'
import { usePersistentState } from '../../hooks/usePersistentState'
import MiniCalendar from './MiniCalendar'

// Left rail: mini calendar on top, module navigation below. `badges` is an
// optional { [moduleId]: count } map — e.g. Tarefas' overdue+today count —
// rendered as a subtle outlined counter next to the module label (a small
// dot on the icon when collapsed). `moduleOrder`/`hiddenModules` (from
// useModulesConfig) control which modules show up and in what order; a fixed
// "Configurações" entry below the list opens the modal that edits both.
//
// A collapse toggle (persisted) narrows the rail to an icons-only strip,
// hiding the calendar and labels to give each module more working width.
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
  const [collapsed, setCollapsed] = usePersistentState('secretaria:sidebarCollapsed', false)

  const modules = moduleOrder
    .map((id) => MODULE_DEFS.find((m) => m.id === id))
    .filter((m) => m && !hiddenModules.includes(m.id))

  const collapseButton = (
    <button
      type="button"
      onClick={() => setCollapsed((v) => !v)}
      aria-label={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
      title={collapsed ? 'Expandir' : 'Recolher'}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-accent-soft/60 hover:text-primary"
    >
      {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
    </button>
  )

  return (
    <aside
      className={[
        'flex shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200',
        collapsed ? 'w-16 p-2' : 'w-[220px] p-3',
      ].join(' ')}
    >
      {collapsed ? (
        <>
          <div className="flex justify-center">{collapseButton}</div>
          <div className="my-2 border-t border-border" />
        </>
      ) : (
        <>
          {/* Month label, month nav and the collapse control share one line. */}
          <MiniCalendar
            currentDate={currentDate}
            onSelectDate={onSelectDate}
            headerTrailing={collapseButton}
          />
          <div className="my-3 border-t border-border" />
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
            Módulos
          </p>
        </>
      )}

      <nav className={['flex flex-col', collapsed ? 'gap-1' : 'gap-0.5'].join(' ')}>
        {modules.map(({ id, label, icon: Icon }) => {
          const active = id === activeModule
          const badge = badges[id]
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectModule(id)}
              title={collapsed ? label : undefined}
              aria-label={label}
              className={[
                'relative flex items-center rounded-md text-[13px] transition-colors',
                collapsed ? 'justify-center py-2.5' : 'gap-2.5 px-2.5 py-2',
                active
                  ? 'bg-accent-soft font-medium text-primary'
                  : 'text-text-secondary hover:bg-accent-soft/60 hover:text-text',
              ].join(' ')}
            >
              <Icon size={16} className={active ? 'text-primary' : 'text-text-muted'} />
              {!collapsed && label}
              {badge > 0 &&
                (collapsed ? (
                  <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full border border-sidebar bg-primary" />
                ) : (
                  <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded border border-border-strong px-1 text-[13px] font-medium leading-none text-text-secondary">
                    {badge}
                  </span>
                ))}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto pt-2">
        <div className="border-t border-border pt-2">
          <button
            type="button"
            onClick={onOpenSettings}
            title={collapsed ? 'Configurações' : undefined}
            aria-label="Configurações"
            className={[
              'flex w-full items-center rounded-md text-[13px] text-text-secondary transition-colors hover:bg-accent-soft/60 hover:text-text',
              collapsed ? 'justify-center py-2.5' : 'gap-2.5 px-2.5 py-2',
            ].join(' ')}
          >
            <Settings size={16} className="text-text-muted" />
            {!collapsed && 'Configurações'}
          </button>
        </div>
      </div>
    </aside>
  )
}
