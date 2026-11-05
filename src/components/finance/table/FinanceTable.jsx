import { Fragment, useEffect, useRef, useState } from 'react'
import { Star } from 'lucide-react'
import { buildRenderUnits } from './rows'
import HeaderCell from './HeaderCell'
import EntryRow from './EntryRow'
import InstallmentGroupRow from './InstallmentGroupRow'
import QuickAddRow from './QuickAddRow'

const TYPE_OPTIONS = [
  { id: 'income', label: 'Receita' },
  { id: 'expense', label: 'Despesa' },
]

// Excel-style table: a sticky header whose column titles sort (asc→desc→off)
// and whose categorical columns carry a funnel that opens a per-column
// checklist filter. Rows stay fully inline-editable (chips + inline date from
// F1). Sort/filter state lives in the parent (Financas.jsx, persisted) and is
// shared by the Resumo and Lançamentos tables; this component only renders the
// controls and reports changes. A `today` string lets rows dim future
// (previsto) effective dates — the visual side of F3.
export default function FinanceTable({
  entries,
  expenseCategories,
  incomeCategories,
  paymentMethods,
  accounts,
  sortChain,
  onToggleSort,
  filters,
  onToggleFilter,
  onUpdateEntry,
  onDeleteClick,
  onDuplicate,
  selectMode,
  selectedIds,
  onToggleSelect,
  onQuickAdd,
  today,
  creditCardConfig,
  groupInstallments = false,
}) {
  // Installment series collapse into one expandable row — but only in the full
  // table and never while bulk-selecting (there you want each parcela's own
  // checkbox). Grouped-open state is keyed by installmentGroupId.
  const [expandedGroups, setExpandedGroups] = useState(() => new Set())
  const toggleGroup = (gid) =>
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(gid)) next.delete(gid)
      else next.add(gid)
      return next
    })
  // The quick-add row sticks directly below the sticky header, so it needs
  // that header's live height — the column filters can wrap and change it.
  const theadRef = useRef(null)
  const [headerHeight, setHeaderHeight] = useState(0)
  useEffect(() => {
    const el = theadRef.current
    if (!el) return
    const measure = () => setHeaderHeight(el.getBoundingClientRect().height)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const grouping = groupInstallments && !selectMode
  const showAccounts = accounts.length > 0
  const allCategories = [...expenseCategories, ...incomeCategories]
  // Always-present columns: Tipo, Título, Valor, Categoria, Pagamento,
  // ★(essencial), Data, Recorrência, ações = 9; plus Conta/seleção if shown.
  const colSpanEmpty = 9 + (showAccounts ? 1 : 0) + (selectMode ? 1 : 0)

  return (
    <div className="thin-scroll h-full overflow-auto">
      <table className="w-full border-collapse text-[12px]">
        <thead ref={theadRef} className="glass sticky top-0 z-[2]">
          <tr className="border-b border-border text-left text-[11px] text-text-muted">
            {selectMode && <th className="w-8 px-2 py-2" />}
            <th className="px-2 py-2">
              <HeaderCell
                label="Tipo"
                filterDim="types"
                filterOptions={TYPE_OPTIONS}
                filters={filters}
                onToggleFilter={onToggleFilter}
              />
            </th>
            <th className="px-2 py-2">
              <HeaderCell label="Título" sortField="title" sortChain={sortChain} onToggleSort={onToggleSort} />
            </th>
            <th className="px-2 py-2 text-right">
              <HeaderCell
                label="Valor"
                sortField="amount"
                sortChain={sortChain}
                onToggleSort={onToggleSort}
                align="right"
              />
            </th>
            <th className="px-2 py-2">
              <HeaderCell
                label="Categoria"
                sortField="category"
                sortChain={sortChain}
                onToggleSort={onToggleSort}
                filterDim="categoryIds"
                filterOptions={allCategories}
                filters={filters}
                onToggleFilter={onToggleFilter}
              />
            </th>
            <th className="px-2 py-2">
              <HeaderCell
                label="Pagamento"
                filterDim="paymentMethodIds"
                filterOptions={paymentMethods}
                filters={filters}
                onToggleFilter={onToggleFilter}
                colorless
              />
            </th>
            {showAccounts && (
              <th className="px-2 py-2">
                <HeaderCell
                  label="Conta"
                  filterDim="accountIds"
                  filterOptions={accounts}
                  filters={filters}
                  onToggleFilter={onToggleFilter}
                />
              </th>
            )}
            <th className="px-2 py-2 text-center" title="Essencial">
              <Star size={12} className="mx-auto text-text-muted" />
            </th>
            <th className="px-2 py-2">
              <HeaderCell label="Data" sortField="date" sortChain={sortChain} onToggleSort={onToggleSort} />
            </th>
            <th className="px-2 py-2">
              <HeaderCell label="Recorrência" />
            </th>
            <th className="w-16 px-2 py-2" />
          </tr>
        </thead>
        <tbody>
          {onQuickAdd && (
            <QuickAddRow
              expenseCategories={expenseCategories}
              incomeCategories={incomeCategories}
              paymentMethods={paymentMethods}
              accounts={accounts}
              showAccounts={showAccounts}
              onQuickAdd={onQuickAdd}
              selectMode={selectMode}
              creditCardConfig={creditCardConfig}
              stickyTop={headerHeight}
            />
          )}
          {entries.length === 0 && !onQuickAdd && (
            <tr>
              <td colSpan={colSpanEmpty} className="px-4 py-8 text-center text-sm text-text-muted">
                Nenhum lançamento neste período.
              </td>
            </tr>
          )}
          {(grouping ? buildRenderUnits(entries) : entries.map((e) => ({ kind: 'single', key: e.id, entry: e }))).map(
            (unit) => {
              if (unit.kind === 'group') {
                const expanded = expandedGroups.has(unit.groupId)
                return (
                  <Fragment key={unit.key}>
                    <InstallmentGroupRow
                      items={unit.items}
                      colSpan={colSpanEmpty}
                      expanded={expanded}
                      onToggle={() => toggleGroup(unit.groupId)}
                      today={today}
                    />
                    {expanded &&
                      unit.items.map((entry) => (
                        <EntryRow
                          key={entry.id}
                          entry={entry}
                          nested
                          expenseCategories={expenseCategories}
                          incomeCategories={incomeCategories}
                          paymentMethods={paymentMethods}
                          accounts={accounts}
                          showAccounts={showAccounts}
                          onUpdateEntry={onUpdateEntry}
                          onDeleteClick={() => onDeleteClick(entry.id)}
                          onDuplicate={() => onDuplicate(entry.id)}
                          selectMode={selectMode}
                          selected={selectedIds?.has(entry.id)}
                          onToggleSelect={() => onToggleSelect(entry.id)}
                          today={today}
                          creditCardConfig={creditCardConfig}
                        />
                      ))}
                  </Fragment>
                )
              }
              const entry = unit.entry
              return (
                <EntryRow
                  key={unit.key}
                  entry={entry}
                  expenseCategories={expenseCategories}
                  incomeCategories={incomeCategories}
                  paymentMethods={paymentMethods}
                  accounts={accounts}
                  showAccounts={showAccounts}
                  onUpdateEntry={onUpdateEntry}
                  onDeleteClick={() => onDeleteClick(entry.id)}
                  onDuplicate={() => onDuplicate(entry.id)}
                  selectMode={selectMode}
                  selected={selectedIds?.has(entry.id)}
                  onToggleSelect={() => onToggleSelect(entry.id)}
                  today={today}
                  creditCardConfig={creditCardConfig}
                />
              )
            }
          )}
        </tbody>
      </table>
    </div>
  )
}
