// Building blocks of the "Filtros" popovers in Tarefas, Compras and Finanças.

export function FilterSection({ label, children }) {
  return (
    <div className="mb-2.5 flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

export function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium',
        active
          ? 'border-primary bg-accent-soft text-primary'
          : 'border-border text-text-secondary hover:border-border-strong',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
