import { X, Search } from 'lucide-react'

// Matches lançamentos by título as you type (see Financas.jsx#searchEntries,
// which also ignores accents). Narrow by default so it sits next to Filtros
// without pushing the right-hand actions around; Escape clears it, which is
// faster than selecting the text to delete it.
export default function SearchField({ value, onChange }) {
  return (
    <div className="relative flex items-center">
      <Search size={12} className="pointer-events-none absolute left-2.5 text-text-muted" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && onChange('')}
        placeholder="Buscar lançamento…"
        aria-label="Buscar lançamento pelo título"
        className="w-52 rounded-full border border-border bg-surface py-1 pl-7 pr-7 text-[11px] text-text outline-none placeholder:text-text-muted focus:border-primary"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Limpar busca"
          className="absolute right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-text-muted hover:bg-accent-soft hover:text-primary"
        >
          <X size={11} />
        </button>
      )}
    </div>
  )
}
