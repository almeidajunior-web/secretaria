import { useEffect, useRef, useState } from 'react'
import { ArrowUp, ArrowDown, ListFilter } from 'lucide-react'
import { tintVars } from '../../../lib/color'

// Column header: sort toggle and/or per-column checklist filter.
export default function HeaderCell({
  label,
  sortField,
  sortChain,
  onToggleSort,
  filterDim,
  filterOptions,
  filters,
  onToggleFilter,
  colorless = false,
  align = 'left',
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const sortIdx = sortField ? sortChain?.findIndex((s) => s.field === sortField) : -1
  const sortActive = sortIdx != null && sortIdx !== -1
  const direction = sortActive ? sortChain[sortIdx].direction : null
  const activeFilterCount = filterDim ? (filters?.[filterDim]?.length ?? 0) : 0

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div className={['flex items-center gap-1', align === 'right' ? 'justify-end' : ''].join(' ')}>
      {sortField ? (
        <button
          type="button"
          onClick={() => onToggleSort(sortField)}
          className={[
            'inline-flex items-center gap-1 font-semibold uppercase tracking-wide hover:text-text',
            sortActive ? 'text-primary' : 'text-text-muted',
          ].join(' ')}
        >
          {label}
          {sortActive && (direction === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
        </button>
      ) : (
        <span className="font-semibold uppercase tracking-wide text-text-muted">{label}</span>
      )}

      {filterDim && (
        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={`Filtrar ${label}`}
            className={[
              'flex h-4 w-4 items-center justify-center rounded hover:text-primary',
              activeFilterCount > 0 ? 'text-primary' : 'text-text-muted/60',
            ].join(' ')}
          >
            <ListFilter size={11} />
          </button>
          {open && (
            <div className="absolute left-0 top-full z-50 mt-1.5 max-h-56 w-48 overflow-auto rounded-xl border border-border bg-surface p-1.5 text-left shadow-lg">
              {filterOptions.length === 0 && (
                <p className="px-2 py-1 text-[11px] normal-case text-text-muted">Nada para filtrar.</p>
              )}
              {filterOptions.map((o) => {
                const checked = filters[filterDim].includes(o.id)
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => onToggleFilter(filterDim, o.id)}
                    className={[
                      'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium normal-case tracking-normal',
                      checked ? 'bg-accent-soft text-primary' : 'text-text-secondary hover:bg-accent-soft/50',
                    ].join(' ')}
                  >
                    <input type="checkbox" readOnly checked={checked} className="h-3 w-3" />
                    {!colorless && o.color && (
                      <span className="tint-fill h-2 w-2 shrink-0 rounded-full" style={tintVars(o.color)} />
                    )}
                    <span className="truncate">{o.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
