import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Copy, Trash2 } from 'lucide-react'
import DescriptionPopover from '../common/DescriptionPopover'

// Flat, always-editable-inline table — same philosophy as Compras/
// Vencimentos. A quick-add row at the bottom creates entries without any
// extra step (the "Novo lançamento" modal in the toolbar is just a more
// visual alternate entry point).
export default function FinanceTableView({
  entries,
  expenseCategories,
  incomeCategories,
  paymentMethods,
  accounts,
  onUpdateEntry,
  onDeleteClick,
  onDuplicate,
  selectMode,
  selectedIds,
  onToggleSelect,
  onQuickAdd,
}) {
  const expenseCategoryById = Object.fromEntries(expenseCategories.map((c) => [c.id, c]))
  const incomeCategoryById = Object.fromEntries(incomeCategories.map((c) => [c.id, c]))

  return (
    <div className="thin-scroll flex h-full flex-col overflow-auto">
      {entries.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-text-muted">
          Nenhum lançamento neste período. Use a linha abaixo para adicionar o primeiro.
        </p>
      ) : (
        <div className="flex flex-col">
          {entries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              category={(entry.type === 'income' ? incomeCategoryById : expenseCategoryById)[entry.categoryId]}
              categories={entry.type === 'income' ? incomeCategories : expenseCategories}
              paymentMethods={paymentMethods}
              accounts={accounts}
              onUpdateEntry={onUpdateEntry}
              onDeleteClick={() => onDeleteClick(entry.id)}
              onDuplicate={() => onDuplicate(entry.id)}
              selectMode={selectMode}
              selected={selectedIds?.has(entry.id)}
              onToggleSelect={() => onToggleSelect(entry.id)}
            />
          ))}
        </div>
      )}

      <QuickAddRow
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        paymentMethods={paymentMethods}
        accounts={accounts}
        onQuickAdd={onQuickAdd}
      />
    </div>
  )
}

function EntryRow({
  entry,
  category,
  categories,
  paymentMethods,
  accounts,
  onUpdateEntry,
  onDeleteClick,
  onDuplicate,
  selectMode,
  selected,
  onToggleSelect,
}) {
  const [title, setTitle] = useState(entry.title)
  const isIncome = entry.type === 'income'

  useEffect(() => {
    setTitle(entry.title)
  }, [entry.title])

  const commitTitle = () => {
    const t = title.trim()
    if (t && t !== entry.title) onUpdateEntry({ ...entry, title: t })
    else setTitle(entry.title)
  }

  const toggleType = () => {
    // Categories are type-scoped, so a stale categoryId would point at the
    // wrong list once the type flips.
    onUpdateEntry({ ...entry, type: isIncome ? 'expense' : 'income', categoryId: null })
  }

  return (
    <div className="flex items-center gap-2 border-b border-border px-4 py-2 hover:bg-accent-soft/30">
      {selectMode && (
        <input
          type="checkbox"
          checked={!!selected}
          onChange={onToggleSelect}
          className="h-3.5 w-3.5 shrink-0"
        />
      )}

      <button
        type="button"
        onClick={toggleType}
        aria-label={isIncome ? 'Marcar como despesa' : 'Marcar como receita'}
        className={[
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
          isIncome ? 'text-success' : 'text-danger',
        ].join(' ')}
      >
        {isIncome ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
      </button>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commitTitle}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className="min-w-0 flex-1 bg-transparent text-[13px] text-text outline-none"
      />

      <DescriptionPopover item={entry} onUpdateItem={onUpdateEntry} />

      <div className="flex shrink-0 items-center gap-0.5">
        <span className={['text-[11px]', isIncome ? 'text-success' : 'text-danger'].join(' ')}>R$</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={entry.amount ?? ''}
          onChange={(e) =>
            onUpdateEntry({ ...entry, amount: e.target.value === '' ? 0 : Number(e.target.value) })
          }
          className={[
            'w-[90px] rounded-md border border-border bg-transparent px-1.5 py-1 text-[11px] font-medium outline-none',
            isIncome ? 'text-success' : 'text-danger',
          ].join(' ')}
        />
      </div>

      <select
        value={entry.categoryId || ''}
        onChange={(e) => onUpdateEntry({ ...entry, categoryId: e.target.value || null })}
        style={{ color: category?.color }}
        className="w-[128px] shrink-0 rounded-md border border-border bg-transparent px-1.5 py-1 text-[11px] font-medium outline-none"
      >
        <option value="">Sem categoria</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>

      <select
        value={entry.paymentMethodId || ''}
        onChange={(e) => onUpdateEntry({ ...entry, paymentMethodId: e.target.value || null })}
        className="w-[116px] shrink-0 rounded-md border border-border bg-transparent px-1.5 py-1 text-[11px] outline-none"
      >
        <option value="">Sem forma</option>
        {paymentMethods.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>

      {accounts.length > 0 && (
        <select
          value={entry.accountId || ''}
          onChange={(e) => onUpdateEntry({ ...entry, accountId: e.target.value || null })}
          className="w-[104px] shrink-0 rounded-md border border-border bg-transparent px-1.5 py-1 text-[11px] outline-none"
        >
          <option value="">Sem conta</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      )}

      <input
        type="date"
        value={entry.date || ''}
        onChange={(e) => onUpdateEntry({ ...entry, date: e.target.value || null })}
        className="w-[130px] shrink-0 rounded-md border border-border bg-transparent px-1.5 py-1 text-[11px] text-text-secondary outline-none"
      />

      <button
        type="button"
        onClick={onDuplicate}
        aria-label={`Duplicar ${entry.title}`}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-accent-soft/60 hover:text-primary"
      >
        <Copy size={13} />
      </button>

      <button
        type="button"
        onClick={onDeleteClick}
        aria-label={`Excluir ${entry.title}`}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-danger/15 hover:text-danger"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

function QuickAddRow({ expenseCategories, incomeCategories, paymentMethods, accounts, onQuickAdd }) {
  const [type, setType] = useState('expense')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [categoryId, setCategoryId] = useState('')

  const isIncome = type === 'income'
  const categories = isIncome ? incomeCategories : expenseCategories
  const canAdd = title.trim() && date

  const toggleType = () => {
    setType((t) => (t === 'income' ? 'expense' : 'income'))
    setCategoryId('')
  }

  const commit = () => {
    if (!canAdd) return
    onQuickAdd({
      type,
      title: title.trim(),
      amount: amount === '' ? 0 : Number(amount),
      date,
      categoryId: categoryId || null,
    })
    setTitle('')
    setAmount('')
    setDate('')
    setCategoryId('')
  }

  return (
    <div className="mt-auto flex items-center gap-2 border-t border-border px-4 py-2">
      <button
        type="button"
        onClick={toggleType}
        aria-label={isIncome ? 'Nova receita — clique para despesa' : 'Nova despesa — clique para receita'}
        className={['flex h-6 w-6 shrink-0 items-center justify-center rounded-full', isIncome ? 'text-success' : 'text-danger'].join(
          ' '
        )}
      >
        {isIncome ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
      </button>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        placeholder="Novo lançamento…"
        className="flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-text-muted"
      />
      <div className="flex shrink-0 items-center gap-0.5">
        <span className="text-[11px] text-text-muted">R$</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          placeholder="0,00"
          className="w-[90px] rounded-md border border-border-strong bg-surface px-1.5 py-1 text-[11px] text-text outline-none focus:border-primary"
        />
      </div>
      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        className="w-32 shrink-0 rounded-md border border-border-strong bg-surface px-1.5 py-1 text-[11px] text-text outline-none focus:border-primary"
      >
        <option value="">Categoria</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        className="w-32 shrink-0 rounded-md border border-border-strong bg-surface px-1.5 py-1 text-[11px] text-text outline-none focus:border-primary"
      />
      <button
        type="button"
        onClick={commit}
        disabled={!canAdd}
        className="rounded-md bg-primary px-3 py-1 text-[11px] font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        Adicionar
      </button>
    </div>
  )
}
