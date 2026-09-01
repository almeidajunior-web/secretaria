import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Eye, EyeOff, Folder, Settings } from 'lucide-react'
import { MODULE_DEFS } from '../../data/modules'
import Logo from './Logo'

const moduleById = Object.fromEntries(MODULE_DEFS.map((m) => [m.id, m]))

// Fixed 52px header: brand, module navigation, and the global controls
// (Configurações, privacy toggle — the theme toggle lives inside
// Configurações). The nav used to be a 220px left rail; moving it up here
// gives every module that width back, so the only date affordance that
// survives is the Agenda's own mini calendar.
//
// `badges` is an optional { [moduleId]: count } map — e.g. Tarefas' overdue+
// today count — rendered as a subtle outlined counter after the label.
// `moduleOrder` (from useModulesConfig) is the literal top-level sequence —
// each entry is either a bare module id or a `'group:<id>'` sentinel — and
// `moduleGroups` supplies each group's own label and members. A module the
// user never grouped renders exactly as before; grouping is opt-in, edited
// from the Configurações modal the gear button opens.
export default function Topbar({
  theme,
  privacyHidden,
  onTogglePrivacy,
  activeModule,
  onSelectModule,
  moduleOrder,
  hiddenModules,
  moduleGroups,
  badges = {},
  onOpenSettings,
}) {
  const groupById = Object.fromEntries(moduleGroups.map((g) => [g.id, g]))

  const items = moduleOrder
    .map((entry) => {
      if (entry.startsWith('group:')) {
        const group = groupById[entry.slice('group:'.length)]
        if (!group) return null
        const members = group.moduleIds
          .map((id) => moduleById[id])
          .filter((m) => m && !hiddenModules.includes(m.id))
        // A group emptied out by hiding every member has nothing to open —
        // skip it rather than render a dropdown with no rows.
        return members.length > 0 ? { type: 'group', group, members } : null
      }
      const mod = moduleById[entry]
      return mod && !hiddenModules.includes(mod.id) ? { type: 'module', mod } : null
    })
    .filter(Boolean)

  return (
    <header className="relative z-30 flex h-[52px] shrink-0 items-center gap-4 glass border-b px-4">
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
        {items.map((item) =>
          item.type === 'module' ? (
            <ModuleNavItem
              key={item.mod.id}
              mod={item.mod}
              active={item.mod.id === activeModule}
              badge={badges[item.mod.id]}
              onSelect={() => onSelectModule(item.mod.id)}
            />
          ) : (
            <GroupNavItem
              key={item.group.id}
              group={item.group}
              members={item.members}
              activeModule={activeModule}
              badges={badges}
              onSelect={onSelectModule}
            />
          )
        )}
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

function NavBadge({ count }) {
  if (!(count > 0)) return null
  return (
    <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded border border-border-strong px-1 text-[12px] font-medium leading-none text-text-secondary">
      {count}
    </span>
  )
}

function ModuleNavItem({ mod, active, badge, onSelect }) {
  const Icon = mod.icon
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={mod.label}
      aria-current={active ? 'page' : undefined}
      className={[
        'flex shrink-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors',
        active
          ? 'bg-accent-soft font-medium text-primary'
          : 'text-text-secondary hover:bg-accent-soft/60 hover:text-text',
      ].join(' ')}
    >
      <Icon size={16} className={active ? 'text-primary' : 'text-text-muted'} />
      {mod.label}
      <NavBadge count={badge} />
    </button>
  )
}

// A group's trigger looks like a module button (so grouping a module doesn't
// change how "using" it feels) but opens a small dropdown of its members
// instead of navigating directly. It reads as active whenever the current
// module is one of its members, since the trigger alone can't show which.
function GroupNavItem({ group, members, activeModule, badges, onSelect }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const btnRef = useRef(null)
  const panelRef = useRef(null)
  const active = members.some((m) => m.id === activeModule)
  const badgeTotal = members.reduce((sum, m) => sum + (badges[m.id] || 0), 0)

  // The dropdown is portaled to <body> rather than absolutely positioned
  // inside this button's own container: the nav it lives in scrolls
  // horizontally (`overflow-x-auto`), and a scrollable ancestor clips any
  // absolutely-positioned child that overflows its box — silently, no matter
  // how high that child's z-index is. Fixed-positioning a portaled panel from
  // the trigger's own on-screen rect sidesteps that clipping entirely.
  const openDropdown = () => {
    const rect = btnRef.current.getBoundingClientRect()
    setPos({ top: rect.bottom + 6, left: rect.left })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (btnRef.current?.contains(e.target)) return
      if (panelRef.current?.contains(e.target)) return
      setOpen(false)
    }
    // Closes rather than re-tracks on scroll/resize — the trigger may have
    // moved (nav's own horizontal scroll, or a window resize), and a stale
    // fixed position would leave the panel floating over the wrong spot.
    const onDismiss = () => setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('scroll', onDismiss, true)
    window.addEventListener('resize', onDismiss)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('scroll', onDismiss, true)
      window.removeEventListener('resize', onDismiss)
    }
  }, [open])

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        ref={btnRef}
        onClick={() => (open ? setOpen(false) : openDropdown())}
        aria-expanded={open}
        className={[
          'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors',
          active
            ? 'bg-accent-soft font-medium text-primary'
            : 'text-text-secondary hover:bg-accent-soft/60 hover:text-text',
        ].join(' ')}
      >
        <Folder size={16} className={active ? 'text-primary' : 'text-text-muted'} />
        {group.label}
        <NavBadge count={badgeTotal} />
        <ChevronDown size={13} className={active ? 'text-primary' : 'text-text-muted'} />
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: 'fixed', top: pos.top, left: pos.left }}
            className="z-50 w-52 rounded-xl border border-border bg-surface p-1.5 shadow-lg"
          >
            {members.map((mod) => {
              const Icon = mod.icon
              const isActive = mod.id === activeModule
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => {
                    onSelect(mod.id)
                    setOpen(false)
                  }}
                  className={[
                    'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px]',
                    isActive ? 'bg-accent-soft font-medium text-primary' : 'text-text-secondary hover:bg-accent-soft/50',
                  ].join(' ')}
                >
                  <Icon size={15} className={isActive ? 'text-primary' : 'text-text-muted'} />
                  <span className="flex-1">{mod.label}</span>
                  <NavBadge count={badges[mod.id]} />
                </button>
              )
            })}
          </div>,
          document.body
        )}
    </div>
  )
}
