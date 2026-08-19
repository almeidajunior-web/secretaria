import { Eye, EyeOff, Settings } from 'lucide-react'
import { MODULE_DEFS } from '../../data/modules'
import Logo from './Logo'

// Fixed 52px header: brand, module navigation, and the global controls
// (Configurações, privacy toggle — the theme toggle lives inside
// Configurações). The nav used to be a 220px left rail; moving it up here
// gives every module that width back, so the only date affordance that
// survives is the Agenda's own mini calendar.
//
// `badges` is an optional { [moduleId]: count } map — e.g. Tarefas' overdue+
// today count — rendered as a subtle outlined counter after the label.
// `moduleOrder`/`hiddenModules` (from useModulesConfig) control which modules
// show up and in what order; the Configurações button opens the modal that
// edits both.
//
// The header always renders above PrivacyOverlay, so navigation and the
// privacy toggle stay reachable while the rest of the app is blurred.
export default function Topbar({
  theme,
  privacyHidden,
  onTogglePrivacy,
  activeModule,
  onSelectModule,
  moduleOrder,
  hiddenModules,
  badges = {},
  onOpenSettings,
}) {
  const modules = moduleOrder
    .map((id) => MODULE_DEFS.find((m) => m.id === id))
    .filter((m) => m && !hiddenModules.includes(m.id))

  return (
    <header className="flex h-[52px] shrink-0 items-center gap-4 border-b border-border bg-surface px-4">
      <div className="flex shrink-0 items-center gap-2">
        <Logo size={22} theme={theme} />
        <div className="flex items-baseline gap-0 text-lg tracking-tight">
          <span className="font-bold text-primary-deep">Secretar</span>
          <span className="font-normal text-text-muted">.ia</span>
        </div>
      </div>

      {/* Scrolls rather than wraps or squeezes: the header is a fixed 52px, so
          a narrow window has to move the overflow sideways. */}
      <nav className="thin-scroll flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {modules.map(({ id, label, icon: Icon }) => {
          const active = id === activeModule
          const badge = badges[id]
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectModule(id)}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={[
                'flex shrink-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors',
                active
                  ? 'bg-accent-soft font-medium text-primary'
                  : 'text-text-secondary hover:bg-accent-soft/60 hover:text-text',
              ].join(' ')}
            >
              <Icon size={16} className={active ? 'text-primary' : 'text-text-muted'} />
              {label}
              {badge > 0 && (
                <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded border border-border-strong px-1 text-[12px] font-medium leading-none text-text-secondary">
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Configurações"
          title="Configurações"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-secondary hover:bg-accent-soft hover:text-primary"
        >
          <Settings size={16} />
        </button>
        <button
          type="button"
          onClick={onTogglePrivacy}
          aria-label={privacyHidden ? 'Desativar modo privado' : 'Ativar modo privado'}
          className={[
            'flex h-8 w-8 items-center justify-center rounded-md border text-text-secondary hover:bg-accent-soft hover:text-primary',
            privacyHidden ? 'border-primary bg-accent-soft text-primary' : 'border-border',
          ].join(' ')}
        >
          {privacyHidden ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </header>
  )
}
