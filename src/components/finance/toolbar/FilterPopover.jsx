import { useEffect, useRef } from 'react'
import { Filter } from 'lucide-react'
import { tintVars } from '../../../lib/color'
import { FilterChip, FilterSection } from '../../common/FilterControls'

const TYPE_OPTIONS = [
  { id: 'income', label: 'Receita' },
  { id: 'expense', label: 'Despesa' },
]

export default function FilterPopover({
  open,
  onOpenChange,
  filters,
  onToggleFilter,
  onClearFilters,
  expenseCategories,
  incomeCategories,
  paymentMethods,
  accounts,
  activeFilterCount,
}) {
  const ref = useRef(null)
  const allCategories = [...expenseCategories, ...incomeCategories]

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onOpenChange(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, onOpenChange])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className={[
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium',
          activeFilterCount > 0
            ? 'border-primary bg-accent-soft text-primary'
            : 'border-border text-text-secondary hover:border-border-strong',
        ].join(' ')}
      >
        <Filter size={12} />
        Filtros
        {activeFilterCount > 0 && ` (${activeFilterCount})`}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 max-h-[70vh] w-64 overflow-auto rounded-xl border border-border bg-surface p-3 shadow-lg">
          <FilterSection label="Tipo">
            {TYPE_OPTIONS.map((o) => (
              <FilterChip
                key={o.id}
                active={(filters.types || []).includes(o.id)}
                onClick={() => onToggleFilter('types', o.id)}
              >
                {o.label}
              </FilterChip>
            ))}
          </FilterSection>

          <FilterSection label="Categoria">
            {allCategories.length === 0 && (
              <p className="text-[11px] text-text-muted">Nenhuma categoria criada ainda.</p>
            )}
            {allCategories.map((c) => (
              <FilterChip
                key={c.id}
                active={(filters.categoryIds || []).includes(c.id)}
                onClick={() => onToggleFilter('categoryIds', c.id)}
              >
                <span className="tint-fill h-2 w-2 shrink-0 rounded-full" style={tintVars(c.color)} />
                {c.label}
              </FilterChip>
            ))}
          </FilterSection>

          <FilterSection label="Forma de pagamento">
            {paymentMethods.map((m) => (
              <FilterChip
                key={m.id}
                active={(filters.paymentMethodIds || []).includes(m.id)}
                onClick={() => onToggleFilter('paymentMethodIds', m.id)}
              >
                <span className="tint-fill h-2 w-2 shrink-0 rounded-full" style={tintVars(m.color)} />
                {m.label}
              </FilterChip>
            ))}
          </FilterSection>

          {accounts.length > 0 && (
            <FilterSection label="Conta">
              {accounts.map((a) => (
                <FilterChip
                  key={a.id}
                  active={(filters.accountIds || []).includes(a.id)}
                  onClick={() => onToggleFilter('accountIds', a.id)}
                >
                  <span className="tint-fill h-2 w-2 shrink-0 rounded-full" style={tintVars(a.color)} />
                  {a.label}
                </FilterChip>
              ))}
            </FilterSection>
          )}

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-1 w-full rounded-md border border-border py-1.5 text-[11px] font-medium text-text-secondary hover:bg-accent-soft/50"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </div>
  )
}
