import { EyeOff } from 'lucide-react'

// Full-coverage blur + click-block layer, rendered over the sidebar/main
// area only — never the Topbar, so the toggle that turns this back off
// stays reachable. Doesn't touch, clear, or alter any data; it's purely a
// display-layer mask. There's no click-to-dismiss on this overlay on
// purpose: every interactive element underneath must stay non-clickable so
// a stray click while the screen is blurred can never accidentally reveal
// or change anything — the only way out is the dedicated button in the
// Topbar.
export default function PrivacyOverlay() {
  return (
    <div
      className="absolute inset-0 z-40 flex select-none flex-col items-center justify-center gap-2 bg-app-bg/40 text-text-muted backdrop-blur-xl"
      onClick={(e) => e.preventDefault()}
    >
      <EyeOff size={28} strokeWidth={1.5} />
      <p className="text-xs">Modo privado ativado</p>
    </div>
  )
}
