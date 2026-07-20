import { Eye, EyeOff } from 'lucide-react'
import Logo from './Logo'

// Fixed 52px header: brand on the left, privacy toggle on the right (the
// theme toggle lives in Configurações). Always rendered above the
// PrivacyOverlay, so it stays reachable even while the rest of the app is
// blurred and click-blocked.
export default function Topbar({ theme, privacyHidden, onTogglePrivacy }) {
  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-border bg-surface px-4">
      <div className="flex items-center gap-2">
        <Logo size={22} theme={theme} />
        <div className="flex items-baseline gap-0 text-lg tracking-tight">
          <span className="font-bold text-primary-deep">Secretar</span>
          <span className="font-normal text-text-muted">.ia</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
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
