import { useEffect, useRef, useState } from 'react'
import { TrendingUp, TrendingDown, Copy, Trash2, Star, ArrowUp, ArrowDown, ListFilter, Clock } from 'lucide-react'
import { fmt, fromDateInput } from '../../lib/date'
import { creditCardEffectiveDate } from '../../lib/creditCard'
import { RECURRENCE_OPTIONS } from '../../lib/billRecurrence'
import DescriptionPopover from '../common/DescriptionPopover'
import ChipSelect from '../common/ChipSelect'
import InlineDate from '../common/InlineDate'
import TagPickerPopover from '../common/TagPickerPopover'

const TYPE_OPTIONS = [
  { id: 'income', label: 'Receita' },
  { id: 'expense', label: 'Despesa' },
]

const RECURRENCE_CHIP_OPTIONS = RECURRENCE_OPTIONS.map((r) => ({ id: r.value, label: r.label }))

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
  tags,
  sortChain,
  onToggleSort,
  filters,
  onToggleFilter,
  onUpdateEntry,
  onDeleteClick,
  onDuplicate,
  onCreateTag,
  selectMode,
  selectedIds,
  onToggleSelect,
  onQuickAdd,
  today,
  creditCardConfig,
}) {
  const showAccounts = accounts.length > 0
  const allCategories = [...expenseCategories, ...incomeCategories]
  const colSpanEmpty = 9 + (showAccounts ? 1 : 0) + (selectMode ? 1 : 0)

  return (
    <div className="thin-scroll h-full overflow-auto">
      <table className="w-full border-collapse text-[12px]">
        <thead className="sticky top-0 z-[2] bg-app-bg">
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
            <th className="px-2 py-2">
              <HeaderCell
                label="Tags"
                filterDim="tagIds"
                filterOptions={tags}
                filters={filters}
                onToggleFilter={onToggleFilter}
              />
            </th>
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
          {entries.length === 0 && !onQuickAdd && (
            <tr>
              <td colSpan={colSpanEmpty} className="px-4 py-8 text-center text-sm text-text-muted">
                Nenhum lançamento neste período.
              </td>
            </tr>
          )}
          {entries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              expenseCategories={expenseCategories}
              incomeCategories={incomeCategories}
              paymentMethods={paymentMethods}
              accounts={accounts}
              tags={tags}
              showAccounts={showAccounts}
              onUpdateEntry={onUpdateEntry}
              onDeleteClick={() => onDeleteClick(entry.id)}
              onDuplicate={() => onDuplicate(entry.id)}
              onCreateTag={onCreateTag}
              selectMode={selectMode}
              selected={selectedIds?.has(entry.id)}
              onToggleSelect={() => onToggleSelect(entry.id)}
              today={today}
              creditCardConfig={creditCardConfig}
            />
          ))}
          {onQuickAdd && (
            <QuickAddRow
              expenseCategories={expenseCategories}
              incomeCategories={incomeCategories}
              paymentMethods={paymentMethods}
              accounts={accounts}
              tags={tags}
              showAccounts={showAccounts}
              onCreateTag={onCreateTag}
              onQuickAdd={onQuickAdd}
              selectMode={selectMode}
              creditCardConfig={creditCardConfig}
            />
          )}
        </tbody>
      </table>
    </div>
  )
}

function HeaderCell({
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
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: o.color }} />
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

function EntryRow({
  entry,
  expenseCategories,
  incomeCategories,
  paymentMethods,
  accounts,
  tags,
  showAccounts,
  onUpdateEntry,
  onDeleteClick,
  onDuplicate,
  onCreateTag,
  selectMode,
  selected,
  onToggleSelect,
  today,
  creditCardConfig,
}) {
  const [title, setTitle] = useState(entry.title)
  const isIncome = entry.type === 'income'
  const categories = isIncome ? incomeCategories : expenseCategories
  const effective = entry.effectiveDate || entry.date
  const previsto = effective && today && effective > today
  const isCredit = entry.paymentMethodId === 'credito'
  const showsInvoiceHint = isCredit && effective && effective !== entry.date
  const tagIds = entry.tagIds || []

  useEffect(() => {
    setTitle(entry.title)
  }, [entry.title])

  const commitTitle = () => {
    const t = title.trim()
    if (t && t !== entry.title) onUpdateEntry({ ...entry, title: t })
    else setTitle(entry.title)
  }

  const toggleTag = (tagId) => {
    const next = tagIds.includes(tagId) ? tagIds.filter((x) => x !== tagId) : [...tagIds, tagId]
    onUpdateEntry({ ...entry, tagIds: next })
  }

  const cell = 'px-2 py-1.5 align-middle'

  return (
    <tr className={['border-b border-border hover:bg-accent-soft/30', previsto ? 'opacity-60' : ''].join(' ')}>
      {selectMode && (
        <td className={cell}>
          <input type="checkbox" checked={!!selected} onChange={onToggleSelect} className="h-3.5 w-3.5" />
        </td>
      )}
      <td className={cell}>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onUpdateEntry({ ...entry, type: isIncome ? 'expense' : 'income', categoryId: null })}
            aria-label={isIncome ? 'Marcar como despesa' : 'Marcar como receita'}
            className={isIncome ? 'text-success' : 'text-danger'}
          >
            {isIncome ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          </button>
          {previsto && <Clock size={12} className="text-text-muted" title={`Previsto para ${fmt(fromDateInput(effective), 'dd/MM')}`} />}
        </div>
      </td>
      <td className={cell}>
        <div className="flex items-center gap-1.5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            className="w-full min-w-[120px] bg-transparent text-[13px] text-text outline-none"
          />
          <DescriptionPopover item={entry} onUpdateItem={onUpdateEntry} />
        </div>
      </td>
      <td className={`${cell} text-right`}>
        <div className="flex items-center justify-end gap-0.5">
          <span className={['text-[11px]', isIncome ? 'text-success' : 'text-danger'].join(' ')}>R$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={entry.amount ?? ''}
            onChange={(e) => onUpdateEntry({ ...entry, amount: e.target.value === '' ? 0 : Number(e.target.value) })}
            className={[
              'w-[82px] rounded-md border border-transparent bg-transparent px-1 py-0.5 text-right text-[12px] font-medium tabular-nums outline-none hover:border-border focus:border-primary',
              isIncome ? 'text-success' : 'text-danger',
            ].join(' ')}
          />
        </div>
      </td>
      <td className={cell}>
        <ChipSelect
          value={entry.categoryId || null}
          options={categories}
          onChange={(id) => onUpdateEntry({ ...entry, categoryId: id })}
          nullLabel="Sem categoria"
          clearLabel="Sem categoria"
        />
      </td>
      <td className={cell}>
        <ChipSelect
          value={entry.paymentMethodId || null}
          options={paymentMethods}
          onChange={(id) => onUpdateEntry({ ...entry, paymentMethodId: id })}
          nullLabel="Pagamento"
          clearLabel="Sem forma"
          colorless
        />
      </td>
      {showAccounts && (
        <td className={cell}>
          <ChipSelect
            value={entry.accountId || null}
            options={accounts}
            onChange={(id) => onUpdateEntry({ ...entry, accountId: id })}
            nullLabel="Conta"
            clearLabel="Sem conta"
          />
        </td>
      )}
      <td className={cell}>
        <TagPickerPopover
          tags={tags}
          selectedIds={tagIds}
          onToggle={toggleTag}
          onCreate={onCreateTag}
          triggerClassName="flex flex-wrap items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-text-secondary hover:bg-accent-soft/50"
        />
      </td>
      <td className={`${cell} text-center`}>
        {isIncome ? (
          <span className="text-text-muted/30">—</span>
        ) : (
          <button
            type="button"
            onClick={() => onUpdateEntry({ ...entry, essential: !entry.essential })}
            aria-label={entry.essential ? 'Desmarcar essencial' : 'Marcar como essencial'}
            className={entry.essential ? 'text-amber-500' : 'text-text-muted/40 hover:text-text-muted'}
          >
            <Star size={14} fill={entry.essential ? 'currentColor' : 'none'} />
          </button>
        )}
      </td>
      <td className={cell}>
        <InlineDate
          value={entry.date || null}
          onChange={(v) => onUpdateEntry({ ...entry, date: v })}
          muted
          placeholder="Data"
        />
        {showsInvoiceHint && (
          <p className="mt-0.5 text-[10px] text-text-muted">
            desconta {fmt(fromDateInput(effective), 'dd/MM')}
          </p>
        )}
      </td>
      <td className={cell}>
        <ChipSelect
          value={entry.recurrence || 'none'}
          options={RECURRENCE_CHIP_OPTIONS}
          onChange={(id) => onUpdateEntry({ ...entry, recurrence: id || 'none' })}
          allowNull={false}
          colorless
        />
      </td>
      <td className={`${cell} text-right`}>
        <div className="flex items-center justify-end gap-0.5">
          <button
            type="button"
            onClick={onDuplicate}
            aria-label={`Duplicar ${entry.title}`}
            className="flex h-6 w-6 items-center justify-center rounded-full text-text-muted hover:bg-accent-soft/60 hover:text-primary"
          >
            <Copy size={13} />
          </button>
          <button
            type="button"
            onClick={onDeleteClick}
            aria-label={`Excluir ${entry.title}`}
            className="flex h-6 w-6 items-center justify-center rounded-full text-text-muted hover:bg-danger/15 hover:text-danger"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  )
}

function QuickAddRow({
  expenseCategories,
  incomeCategories,
  paymentMethods,
  accounts,
  tags,
  showAccounts,
  onCreateTag,
  onQuickAdd,
  selectMode,
  creditCardConfig,
}) {
  const [type, setType] = useState('expense')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [tagIds, setTagIds] = useState([])
  const [essential, setEssential] = useState(false)
  const [recurrence, setRecurrence] = useState('none')

  const isIncome = type === 'income'
  const categories = isIncome ? incomeCategories : expenseCategories
  const canAdd = title.trim() && date
  const effectivePreview =
    paymentMethodId === 'credito' && date && creditCardConfig?.closingDay && creditCardConfig?.dueDay
      ? creditCardEffectiveDate(date, creditCardConfig.closingDay, creditCardConfig.dueDay)
      : null

  const commit = () => {
    if (!canAdd) return
    onQuickAdd({
      type,
      title: title.trim(),
      amount: amount === '' ? 0 : Number(amount),
      date,
      categoryId: categoryId || null,
      paymentMethodId: paymentMethodId || null,
      accountId: accountId || null,
      tagIds,
      essential: isIncome ? false : essential,
      recurrence,
    })
    setTitle('')
    setAmount('')
    setDate('')
    setCategoryId('')
    setPaymentMethodId('')
    setAccountId('')
    setTagIds([])
    setEssential(false)
    setRecurrence('none')
  }

  const cell = 'px-2 py-1.5 align-middle'

  return (
    <tr className="border-t border-border bg-accent-soft/20">
      {selectMode && <td className={cell} />}
      <td className={cell}>
        <button
          type="button"
          onClick={() => {
            setType((t) => (t === 'income' ? 'expense' : 'income'))
            setCategoryId('')
          }}
          aria-label={isIncome ? 'Nova receita — clique para despesa' : 'Nova despesa — clique para receita'}
          className={isIncome ? 'text-success' : 'text-danger'}
        >
          {isIncome ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        </button>
      </td>
      <td className={cell}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          placeholder="Novo lançamento…"
          className="w-full min-w-[120px] bg-transparent text-[13px] text-text outline-none placeholder:text-text-muted"
        />
      </td>
      <td className={`${cell} text-right`}>
        <div className="flex items-center justify-end gap-0.5">
          <span className="text-[11px] text-text-muted">R$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && commit()}
            placeholder="0,00"
            className="w-[82px] rounded-md border border-border-strong bg-surface px-1 py-0.5 text-right text-[12px] text-text outline-none focus:border-primary"
          />
        </div>
      </td>
      <td className={cell}>
        <ChipSelect
          value={categoryId || null}
          options={categories}
          onChange={(id) => setCategoryId(id || '')}
          nullLabel="Categoria"
          clearLabel="Sem categoria"
        />
      </td>
      <td className={cell}>
        <ChipSelect
          value={paymentMethodId || null}
          options={paymentMethods}
          onChange={(id) => setPaymentMethodId(id || '')}
          nullLabel="Pagamento"
          clearLabel="Sem forma"
          colorless
        />
      </td>
      {showAccounts && (
        <td className={cell}>
          <ChipSelect
            value={accountId || null}
            options={accounts}
            onChange={(id) => setAccountId(id || '')}
            nullLabel="Conta"
            clearLabel="Sem conta"
          />
        </td>
      )}
      <td className={cell}>
        <TagPickerPopover
          tags={tags}
          selectedIds={tagIds}
          onToggle={(id) => setTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))}
          onCreate={onCreateTag}
          triggerClassName="flex flex-wrap items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-text-secondary hover:bg-accent-soft/50"
        />
      </td>
      <td className={`${cell} text-center`}>
        {isIncome ? (
          <span className="text-text-muted/30">—</span>
        ) : (
          <button
            type="button"
            onClick={() => setEssential((v) => !v)}
            aria-label={essential ? 'Desmarcar essencial' : 'Marcar como essencial'}
            className={essential ? 'text-amber-500' : 'text-text-muted/40 hover:text-text-muted'}
          >
            <Star size={14} fill={essential ? 'currentColor' : 'none'} />
          </button>
        )}
      </td>
      <td className={cell}>
        <InlineDate value={date || null} onChange={(v) => setDate(v || '')} placeholder="Data" />
        {effectivePreview && (
          <p className="mt-0.5 text-[10px] text-text-muted">
            desconta {fmt(fromDateInput(effectivePreview), 'dd/MM')}
          </p>
        )}
      </td>
      <td className={cell}>
        <ChipSelect
          value={recurrence}
          options={RECURRENCE_CHIP_OPTIONS}
          onChange={(id) => setRecurrence(id || 'none')}
          allowNull={false}
          colorless
        />
      </td>
      <td className={`${cell} text-right`}>
        <button
          type="button"
          onClick={commit}
          disabled={!canAdd}
          className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add
        </button>
      </td>
    </tr>
  )
}
