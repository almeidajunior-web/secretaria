import { Moon, Sun } from 'lucide-react'
import Logo from './Logo'

// Fixed 52px header: brand on the left, theme toggle on the right.
export default function Topbar({ theme, onToggleTheme }) {
  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-border bg-surface px-4">
      <div className="flex items-center gap-2">
        <Logo size={22} theme={theme} />
        <div className="flex items-baseline gap-0 text-lg tracking-tight">
          <span className="font-bold text-primary-deep">Secretar</span>
          <span className="font-normal text-text-muted">.ia</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggleTheme}
        aria-label="Alternar tema"
        className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-secondary hover:bg-accent-soft hover:text-primary"
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </header>
  )
}
