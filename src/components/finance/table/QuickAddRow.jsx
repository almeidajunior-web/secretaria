import { useState } from 'react'
import { TrendingUp, TrendingDown, Star, CreditCard } from 'lucide-react'
import { fmt, fromDateInput } from '../../../lib/date'
import { vencimentoDaCompra } from '../../../lib/creditCard'
import AmountInput from '../../common/AmountInput'
import DescriptionPopover from '../../common/DescriptionPopover'
import ChipSelect from '../../common/ChipSelect'
import InlineDate from '../../common/InlineDate'
import RecurrenceChipField from '../../common/RecurrenceChipField'

// The "Novo lançamento" row, pinned under the header in the Lançamentos table.
export default function QuickAddRow({
  expenseCategories,
  incomeCategories,
  paymentMethods,
  accounts,
  showAccounts,
  onQuickAdd,
  selectMode,
  creditCardConfig,
  stickyTop = 0,
}) {
  const [type, setType] = useState('expense')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState(null)
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [accountId, setAccountId] = useState('')
  // Defaults to essential; the user unchecks it for the exceptions.
  const [essential, setEssential] = useState(true)
  const [recurrence, setRecurrence] = useState('none')
  const [recurrenceEnd, setRecurrenceEnd] = useState(null)
  // Remounts the description popover after each add, so it doesn't keep the
  // previous entry's draft in its own internal state.
  const [formKey, setFormKey] = useState(0)

  const isIncome = type === 'income'
  const categories = isIncome ? incomeCategories : expenseCategories
  const canAdd = title.trim() && date
  const dueDatePreview =
    paymentMethodId === 'credito' && date && creditCardConfig?.closingDay && creditCardConfig?.dueDay
      ? vencimentoDaCompra(date, creditCardConfig.closingDay, creditCardConfig.dueDay)
      : null

  const commit = (amountOverride) => {
    if (!canAdd) return
    onQuickAdd({
      type,
      title: title.trim(),
      amount: (amountOverride !== undefined ? amountOverride : amount) ?? 0,
      description: description.trim(),
      date,
      categoryId: categoryId || null,
      paymentMethodId: paymentMethodId || null,
      accountId: accountId || null,
      essential: isIncome ? false : essential,
      recurrence,
      recurrenceEnd,
    })
    setTitle('')
    setAmount(null)
    setDescription('')
    setDate('')
    setCategoryId('')
    setPaymentMethodId('')
    setAccountId('')
    setEssential(true)
    setRecurrence('none')
    setRecurrenceEnd(null)
    setFormKey((k) => k + 1)
  }

  // Pinned directly under the column header, so it stays reachable however
  // far down the list you are. The background has to be opaque (not a
  // translucent tint) now that rows scroll underneath it, and it sits one
  // layer below the header it tucks against.
  const cell =
    'sticky z-[1] border-b border-border-strong bg-accent-soft px-2 py-1.5 align-middle'
  const cellStyle = { top: stickyTop }

  return (
    <tr>
      {selectMode && <td className={cell} />}
      <td className={cell} style={cellStyle}>
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
      <td className={cell} style={cellStyle}>
        <div className="flex items-center gap-1">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && commit()}
            placeholder="Novo lançamento…"
            className="w-full min-w-[120px] bg-transparent text-[13px] text-text outline-none placeholder:text-text-muted"
          />
          <DescriptionPopover
            key={formKey}
            item={{ description }}
            onUpdateItem={(next) => setDescription(next.description)}
          />
        </div>
      </td>
      <td className={`${cell} text-right`} style={cellStyle}>
        <div className="flex items-center justify-end gap-0.5">
          <span className="text-[11px] text-text-muted">R$</span>
          <AmountInput
            value={amount}
            onCommit={setAmount}
            onEnter={(n) => commit(n)}
            className="w-[82px] rounded-md border border-border-strong bg-surface px-1 py-0.5 text-right text-[12px] tabular-nums text-text outline-none focus:border-primary"
          />
        </div>
      </td>
      <td className={cell} style={cellStyle}>
        <ChipSelect
          value={categoryId || null}
          options={categories}
          onChange={(id) => setCategoryId(id || '')}
          nullLabel="Categoria"
          clearLabel="Sem categoria"
        />
      </td>
      <td className={cell} style={cellStyle}>
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
        <td className={cell} style={cellStyle}>
          <ChipSelect
            value={accountId || null}
            options={accounts}
            onChange={(id) => setAccountId(id || '')}
            nullLabel="Conta"
            clearLabel="Sem conta"
          />
        </td>
      )}
      <td className={`${cell} text-center`} style={cellStyle}>
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
      <td className={cell} style={cellStyle}>
        <InlineDate value={date || null} onChange={(v) => setDate(v || '')} placeholder="Data" />
        {dueDatePreview && (
          <p className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] text-text-muted">
            <CreditCard size={9} />
            fatura {fmt(fromDateInput(dueDatePreview), 'dd/MM')}
          </p>
        )}
      </td>
      <td className={cell} style={cellStyle}>
        <RecurrenceChipField
          recurrence={recurrence}
          recurrenceEnd={recurrenceEnd}
          onChange={(patch) => {
            setRecurrence(patch.recurrence)
            setRecurrenceEnd(patch.recurrenceEnd)
          }}
        />
      </td>
      <td className={`${cell} text-right`} style={cellStyle}>
        <button
          type="button"
          onClick={() => commit()}
          disabled={!canAdd}
          className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add
        </button>
      </td>
    </tr>
  )
}
