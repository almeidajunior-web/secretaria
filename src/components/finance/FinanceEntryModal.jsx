import { useState } from 'react'
import TagPickerPopover from '../common/TagPickerPopover'
import { vencimentoDaCompra } from '../../lib/creditCard'
import { fmt, fromDateInput } from '../../lib/date'
import { formatCurrency } from '../../lib/currency'
import { RECURRENCE_OPTIONS } from '../../lib/billRecurrence'

const inputClass =
  'w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-[13px] text-text outline-none focus:border-primary'

// More visual entry point for creating a new entry — the quick-add row in
// the table stays as the fast path. Create-only, no dirty/discard
// confirmation, same low-friction spirit as Compras/Vencimentos. The
// category list swaps between expense and income options as the type
// toggle changes, since the two are separate domains.
export default function FinanceEntryModal({
  expenseCategories,
  incomeCategories,
  paymentMethods,
  accounts,
  tags,
  creditCardConfig,
  onCreateTag,
  onSave,
  onClose,
}) {
  const [type, setType] = useState('expense')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [tagIds, setTagIds] = useState([])
  // Defaults to essential; the user unchecks it for the exceptions.
  const [essential, setEssential] = useState(true)
  const [recurrence, setRecurrence] = useState('none')
  const [description, setDescription] = useState('')
  const [installmentEnabled, setInstallmentEnabled] = useState(false)
  const [installmentCount, setInstallmentCount] = useState(2)

  const isExpense = type === 'expense'
  const categories = isExpense ? expenseCategories : incomeCategories
  const canSave = title.trim().length > 0 && date
  const isCredit = paymentMethodId === 'credito'
  const showInstallmentOption = isCredit && isExpense
  const dueDatePreview =
    isCredit && date && creditCardConfig?.closingDay && creditCardConfig?.dueDay
      ? vencimentoDaCompra(date, creditCardConfig.closingDay, creditCardConfig.dueDay)
      : null

  const handleTypeChange = (next) => {
    setType(next)
    setCategoryId('') // categories are type-scoped, so a stale pick would point at the wrong list
  }

  const handleSave = () => {
    if (!canSave) return
    onSave({
      type,
      title: title.trim(),
      amount: amount === '' ? 0 : Number(amount),
      date,
      categoryId: categoryId || null,
      paymentMethodId: paymentMethodId || null,
      accountId: accountId || null,
      tagIds,
      essential: isExpense ? essential : false,
      recurrence,
      description: description.trim(),
      installmentCount: showInstallmentOption && installmentEnabled ? installmentCount : null,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary-deep/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-[440px] rounded-xl border border-border bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-semibold text-text">Novo lançamento</h2>

        <div className="flex flex-col gap-4">
          <div className="flex items-center rounded-lg border border-border bg-inset p-0.5">
            {[
              { value: 'expense', label: 'Despesa' },
              { value: 'income', label: 'Receita' },
            ].map((t) => {
              const active = t.value === type
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => handleTypeChange(t.value)}
                  className={[
                    'flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    active
                      ? t.value === 'income'
                        ? 'bg-success text-white'
                        : 'bg-danger text-white'
                      : 'text-text-secondary hover:text-text',
                  ].join(' ')}
                >
                  {t.label}
                </button>
              )
            })}
          </div>

          <Field label="Título">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="Ex.: Supermercado, Salário, Uber…"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] text-text-muted">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className={inputClass}
                />
              </div>
            </Field>
            <Field label="Data">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria">
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
                <option value="">Sem categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Forma de pagamento">
              <select
                value={paymentMethodId}
                onChange={(e) => setPaymentMethodId(e.target.value)}
                className={inputClass}
              >
                <option value="">Não informado</option>
                {paymentMethods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {dueDatePreview && (
            <p className="-mt-2 text-[11px] text-text-muted">
              Entra na fatura que vence em{' '}
              <span className="font-medium text-text">{fmt(fromDateInput(dueDatePreview), 'dd/MM/yyyy')}</span>
            </p>
          )}

          {showInstallmentOption && (
            <div className="-mt-1 flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-[13px] text-text-secondary">
                <input
                  type="checkbox"
                  checked={installmentEnabled}
                  onChange={(e) => setInstallmentEnabled(e.target.checked)}
                />
                Parcelado?
              </label>
              {installmentEnabled && (
                <label className="flex items-center gap-1.5 text-[13px] text-text-secondary">
                  Parcelas
                  <input
                    type="number"
                    min="2"
                    max="48"
                    value={installmentCount}
                    onChange={(e) => setInstallmentCount(Math.min(48, Math.max(2, Number(e.target.value) || 2)))}
                    className="w-14 rounded-md border border-border-strong bg-surface px-1.5 py-1 text-[13px] text-text outline-none focus:border-primary"
                  />
                </label>
              )}
            </div>
          )}
          {showInstallmentOption && installmentEnabled && amount !== '' && (
            <p className="-mt-2 text-[11px] text-text-muted">
              Valor total de {formatCurrency(Number(amount))} em {installmentCount}x de{' '}
              <span className="font-medium text-text">
                {formatCurrency(Number(amount) / installmentCount)}
              </span>
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            {accounts.length > 0 && (
              <Field label="Conta (opcional)">
                <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputClass}>
                  <option value="">Não informado</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Recorrência">
              <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)} className={inputClass}>
                {RECURRENCE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Field label="Tags (opcional)">
              <TagPickerPopover
                tags={tags}
                selectedIds={tagIds}
                onToggle={(id) =>
                  setTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
                }
                onCreate={onCreateTag}
              />
            </Field>
            {isExpense && (
              <label className="flex cursor-pointer items-center gap-2 self-end pb-1.5 text-[13px] text-text-secondary">
                <input
                  type="checkbox"
                  checked={essential}
                  onChange={(e) => setEssential(e.target.checked)}
                />
                Essencial?
              </label>
            )}
          </div>

          <Field label="Descrição (opcional)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição breve…"
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </Field>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-xs font-medium text-text-secondary hover:bg-accent-soft/50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium text-text-secondary">{label}</span>
      {children}
    </label>
  )
}
