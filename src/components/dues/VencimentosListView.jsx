import { useEffect, useState } from 'react'
import { Circle, CircleCheck, Plus, Trash2 } from 'lucide-react'
import DescriptionPopover from '../common/DescriptionPopover'
import AmountInput from '../common/AmountInput'
import ChipSelect from '../common/ChipSelect'
import InlineDate from '../common/InlineDate'
import { RECURRENCE_OPTIONS } from '../../lib/billRecurrence'
import { isBillOverdue } from '../../lib/billFormat'

const RECURRENCE_CHIP_OPTIONS = RECURRENCE_OPTIONS.map((r) => ({ id: r.value, label: r.label }))

// Flat, always grouped-by-due-date list, every field editable directly in
// the row — same inline-first philosophy as Compras. A quick-add row at
// the bottom creates new bills without any extra step (the "Nova conta"
// modal in the toolbar is just a more visual alternate entry point).
export default function VencimentosListView({
  groups,
  categories,
  onTogglePaid,
  onUpdateBill,
  onDeleteClick,
  selectMode,
  selectedIds,
  onToggleSelect,
  onQuickAdd,
}) {
  const isEmpty = groups.every((g) => g.bills.length === 0)

  return (
    <div className="flex h-full flex-col">
      {/* Outside the scroll area, directly under the module's pendente/pago
          bar — so adding a conta never means scrolling to the end first. */}
      <QuickAddRow categories={categories} onQuickAdd={onQuickAdd} />

      <div className="thin-scroll flex-1 overflow-auto">
      {isEmpty ? (
        <p className="px-5 py-8 text-center text-sm text-text-muted">
          Nenhuma conta por aqui. Use a linha abaixo para adicionar a primeira.
        </p>
      ) : (
        <div className="flex flex-col">
          {groups.map((group) => (
            <div key={group.key}>
              <div className="glass sticky top-0 z-[1] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                {group.label} <span className="font-normal normal-case">({group.bills.length})</span>
              </div>
              {group.bills.map((bill) => (
                <BillRow
                  key={bill.id}
                  bill={bill}
                  categories={categories}
                  onTogglePaid={() => onTogglePaid(bill.id, !bill.paid)}
                  onUpdateBill={onUpdateBill}
                  onDeleteClick={() => onDeleteClick(bill.id)}
                  selectMode={selectMode}
                  selected={selectedIds?.has(bill.id)}
                  onToggleSelect={() => onToggleSelect(bill.id)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}

function BillRow({
  bill,
  categories,
  onTogglePaid,
  onUpdateBill,
  onDeleteClick,
  selectMode,
  selected,
  onToggleSelect,
}) {
  const overdue = isBillOverdue(bill)
  const [title, setTitle] = useState(bill.title)

  // Resyncs if the title ever changes from outside this input.
  useEffect(() => {
    setTitle(bill.title)
  }, [bill.title])

  const commitTitle = () => {
    const t = title.trim()
    if (t && t !== bill.title) onUpdateBill({ ...bill, title: t })
    else setTitle(bill.title)
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
        onClick={onTogglePaid}
        aria-label={bill.paid ? 'Marcar como pendente' : 'Marcar como paga'}
        className="flex h-6 w-6 shrink-0 items-center justify-center text-text-muted hover:text-primary"
      >
        {bill.paid ? (
          <CircleCheck size={18} className="text-primary" fill="currentColor" fillOpacity={0.15} />
        ) : (
          <Circle size={18} />
        )}
      </button>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commitTitle}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className={[
          'min-w-0 flex-1 bg-transparent text-[13px] outline-none',
          bill.paid ? 'text-text-muted line-through' : 'text-text',
        ].join(' ')}
      />

      <DescriptionPopover item={bill} onUpdateItem={onUpdateBill} />

      <div className="flex shrink-0 items-center gap-0.5">
        <span className="text-[11px] text-text-muted">R$</span>
        <AmountInput
          value={bill.amount ?? null}
          onCommit={(n) => onUpdateBill({ ...bill, amount: n })}
          className={[
            'w-[90px] rounded-md border border-transparent bg-transparent px-1 py-0.5 text-right text-[12px] font-medium tabular-nums outline-none hover:border-border focus:border-primary',
            bill.paid ? 'text-text-muted' : 'text-text',
          ].join(' ')}
        />
      </div>

      <ChipSelect
        value={bill.categoryId || null}
        options={categories}
        onChange={(id) => onUpdateBill({ ...bill, categoryId: id })}
        nullLabel="Sem classificação"
        clearLabel="Sem classificação"
      />

      <InlineDate
        value={bill.dueDate || null}
        onChange={(v) => onUpdateBill({ ...bill, dueDate: v })}
        overdue={overdue}
        muted
        placeholder="Sem vencimento"
      />

      <ChipSelect
        value={bill.recurrence || 'none'}
        options={RECURRENCE_CHIP_OPTIONS}
        onChange={(id) => onUpdateBill({ ...bill, recurrence: id || 'none' })}
        allowNull={false}
        colorless
      />

      <button
        type="button"
        onClick={onDeleteClick}
        aria-label={`Excluir ${bill.title}`}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-danger/15 hover:text-danger"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

function QuickAddRow({ categories, onQuickAdd }) {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState(null)
  const [dueDate, setDueDate] = useState('')
  const [categoryId, setCategoryId] = useState('')

  const canAdd = title.trim() && dueDate

  // `amountOverride` lets Enter inside the masked value field commit the row
  // with what was just typed, without waiting for that state to land.
  const commit = (amountOverride) => {
    if (!canAdd) return
    onQuickAdd({
      title: title.trim(),
      amount: (amountOverride !== undefined ? amountOverride : amount) ?? 0,
      dueDate,
      categoryId: categoryId || null,
    })
    setTitle('')
    setAmount(null)
    setDueDate('')
    setCategoryId('')
  }

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-border bg-accent-soft/30 px-4 py-2">
      <Plus size={14} className="shrink-0 text-text-muted" />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        placeholder="Novo vencimento…"
        className="flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-text-muted"
      />
      <div className="flex shrink-0 items-center gap-0.5">
        <span className="text-[11px] text-text-muted">R$</span>
        <AmountInput
          value={amount}
          onCommit={setAmount}
          onEnter={(n) => commit(n)}
          className="w-[90px] rounded-md border border-border-strong bg-surface px-1.5 py-1 text-right text-[11px] tabular-nums text-text outline-none focus:border-primary"
        />
      </div>
      <ChipSelect
        value={categoryId || null}
        options={categories}
        onChange={(id) => setCategoryId(id || '')}
        nullLabel="Classificação"
        clearLabel="Sem classificação"
      />
      <InlineDate
        value={dueDate || null}
        onChange={(v) => setDueDate(v || '')}
        placeholder="Vencimento"
      />
      <button
        type="button"
        onClick={() => commit()}
        disabled={!canAdd}
        className="rounded-md bg-primary px-3 py-1 text-[11px] font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        Adicionar
      </button>
    </div>
  )
}
