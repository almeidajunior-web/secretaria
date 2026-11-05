// Shared form vocabulary for every modal and settings panel, so a field looks
// the same wherever it appears.

export const inputClass =
  'w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-[13px] text-text outline-none focus:border-primary'

// A labelled form field: small secondary-colored label above its control.
export function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium text-text-secondary">{label}</span>
      {children}
    </label>
  )
}
