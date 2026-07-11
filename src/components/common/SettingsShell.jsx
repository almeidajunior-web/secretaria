import { useState } from 'react'
import { X } from 'lucide-react'

// App-like settings modal: a left sidebar of topics + a content pane showing
// the active topic. Each settings modal becomes a thin wrapper that just
// builds a `sections` array — `[{ id, label, icon?, render: () => <node> }]` —
// and hands it to this shell. The section's `render()` carries its own
// content (usually an EditableListSection, or a custom panel); the shell only
// provides the layout, navigation and the close/backdrop behavior shared by
// every modal in the app.
export default function SettingsShell({ title = 'Configurações', sections, onClose }) {
  const [activeId, setActiveId] = useState(sections[0]?.id)
  const active = sections.find((s) => s.id === activeId) || sections[0]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[560px] max-h-[85vh] w-[700px] max-w-full overflow-hidden rounded-xl border border-border bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex w-[190px] shrink-0 flex-col border-r border-border bg-app-bg p-3">
          <p className="mb-3 px-1.5 text-[13px] font-semibold text-text">{title}</p>
          <nav className="flex flex-col gap-0.5">
            {sections.map((s) => {
              const Icon = s.icon
              const isActive = s.id === active?.id
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveId(s.id)}
                  className={[
                    'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors',
                    isActive
                      ? 'bg-accent-soft font-medium text-primary'
                      : 'text-text-secondary hover:bg-accent-soft/60 hover:text-text',
                  ].join(' ')}
                >
                  {Icon && <Icon size={15} className={isActive ? 'text-primary' : 'text-text-muted'} />}
                  {s.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-3 top-3 z-10 text-text-muted hover:text-text"
          >
            <X size={18} />
          </button>
          <div className="thin-scroll h-full overflow-auto p-5">{active?.render()}</div>
        </div>
      </div>
    </div>
  )
}
