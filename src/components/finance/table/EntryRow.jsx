import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Copy, Trash2, Star, Clock, CreditCard } from 'lucide-react'
import { fmt, fromDateInput } from '../../../lib/date'
import AmountInput from '../../common/AmountInput'
import DescriptionPopover from '../../common/DescriptionPopover'
import ChipSelect from '../../common/ChipSelect'
import InlineDate from '../../common/InlineDate'
import RecurrenceChipField from '../../common/RecurrenceChipField'
import { invoiceDueDate } from './rows'

// One lançamento in the table, every field editable in place. A future-dated
// entry (a coming recurring instance or installment) is dimmed as "previsto".
export default function EntryRow({
  entry,
  nested = false,
  expenseCategories,
  incomeCategories,
  paymentMethods,
  accounts,
  showAccounts,
  onUpdateEntry,
  onDeleteClick,
  onDuplicate,
  selectMode,
  selected,
  onToggleSelect,
  today,
  creditCardConfig,
}) {
  const [title, setTitle] = useState(entry.title)
  const isIncome = entry.type === 'income'
  const categories = isIncome ? incomeCategories : expenseCategories
  // Competência: an entry is "previsto" only when it hasn't happened yet — its
  // purchase date is still in the future (a coming recurring instance or a
  // not-yet-reached installment). A card purchase already made is realizado.
  const previsto = entry.date && today && entry.date > today
  const dueDate = invoiceDueDate(entry, creditCardConfig)

  useEffect(() => {
    setTitle(entry.title)
  }, [entry.title])

  const commitTitle = () => {
    const t = title.trim()
    if (t && t !== entry.title) onUpdateEntry({ ...entry, title: t })
    else setTitle(entry.title)
  }

  const cell = 'px-2 py-1.5 align-middle'

  return (
    <tr
      className={[
        'border-b border-border hover:bg-accent-soft/30',
        previsto ? 'opacity-60' : '',
        nested ? 'bg-accent-soft/10' : '',
      ].join(' ')}
    >
      {selectMode && (
        <td className={cell}>
          <input type="checkbox" checked={!!selected} onChange={onToggleSelect} className="h-3.5 w-3.5" />
        </td>
      )}
      <td className={[cell, nested ? 'pl-5' : ''].join(' ')}>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onUpdateEntry({ ...entry, type: isIncome ? 'expense' : 'income', categoryId: null })}
            aria-label={isIncome ? 'Marcar como despesa' : 'Marcar como receita'}
            className={isIncome ? 'text-success' : 'text-danger'}
          >
            {isIncome ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          </button>
          {previsto && (
            <Clock
              size={12}
              className="text-text-muted"
              title={`Previsto para ${fmt(fromDateInput(entry.date), 'dd/MM')}`}
            />
          )}
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
          {entry.installment && (
            <span
              className="shrink-0 rounded bg-accent-soft px-1 py-0.5 text-[10px] font-medium text-text-secondary"
              title="Compra parcelada"
            >
              {entry.installment.current}/{entry.installment.total}
            </span>
          )}
          <DescriptionPopover item={entry} onUpdateItem={onUpdateEntry} />
        </div>
      </td>
      <td className={`${cell} text-right`}>
        <div className="flex items-center justify-end gap-0.5">
          <span className={['text-[11px]', isIncome ? 'text-success' : 'text-danger'].join(' ')}>R$</span>
          <AmountInput
            value={entry.amount ?? null}
            onCommit={(n) => onUpdateEntry({ ...entry, amount: n })}
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
        {dueDate && (
          <p
            className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] text-text-muted"
            title={`Entra na fatura que vence em ${fmt(fromDateInput(dueDate), 'dd/MM/yyyy')}`}
          >
            <CreditCard size={9} />
            fatura {fmt(fromDateInput(dueDate), 'dd/MM')}
          </p>
        )}
      </td>
      <td className={cell}>
        <RecurrenceChipField
          recurrence={entry.recurrence}
          recurrenceEnd={entry.recurrenceEnd}
          onChange={(patch) => onUpdateEntry({ ...entry, ...patch })}
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
