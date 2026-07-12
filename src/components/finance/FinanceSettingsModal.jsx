import { TrendingDown, TrendingUp, Wallet, Landmark, Tag } from 'lucide-react'
import EditableListSection from '../common/EditableListSection'
import SettingsShell from '../common/SettingsShell'

// Manage Finanças' customizable lists — expense/income categories, payment
// methods and accounts — each on its own tab in the shared settings sidebar.
const clampDay = (v) => {
  const n = Number(v)
  if (!Number.isFinite(n)) return 1
  return Math.min(31, Math.max(1, Math.round(n)))
}

const dayInputClass =
  'w-14 rounded-md border border-border-strong bg-surface px-1.5 py-1 text-[11px] text-text outline-none focus:border-primary'

// "Cartão de Crédito" (id `credito`) is a fixed, non-deletable/non-renamable
// payment method — its closing/due days are configured here, inline via
// renderExtra, instead of a separate settings tab.
function CreditCardDaysFields({ config, onUpdateConfig }) {
  return (
    <div className="flex items-center gap-3 text-[11px] text-text-secondary">
      <label className="flex items-center gap-1.5">
        Fechamento
        <input
          type="number"
          min="1"
          max="31"
          value={config.closingDay}
          onChange={(e) => onUpdateConfig({ closingDay: clampDay(e.target.value) })}
          className={dayInputClass}
        />
      </label>
      <label className="flex items-center gap-1.5">
        Vencimento
        <input
          type="number"
          min="1"
          max="31"
          value={config.dueDay}
          onChange={(e) => onUpdateConfig({ dueDay: clampDay(e.target.value) })}
          className={dayInputClass}
        />
      </label>
    </div>
  )
}

export default function FinanceSettingsModal({
  expenseCategories,
  onAddExpenseCategory,
  onUpdateExpenseCategory,
  onDeleteExpenseCategory,
  onReorderExpenseCategories,
  incomeCategories,
  onAddIncomeCategory,
  onUpdateIncomeCategory,
  onDeleteIncomeCategory,
  onReorderIncomeCategories,
  paymentMethods,
  onAddPaymentMethod,
  onUpdatePaymentMethod,
  onDeletePaymentMethod,
  onReorderPaymentMethods,
  creditCardConfig,
  onUpdateCreditCardConfig,
  accounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onReorderAccounts,
  tags,
  onAddTag,
  onUpdateTag,
  onDeleteTag,
  onReorderTags,
  onClose,
}) {
  const sections = [
    {
      id: 'expense',
      label: 'Categorias de despesa',
      icon: TrendingDown,
      render: () => (
        <EditableListSection
          title="Categorias de despesa"
          hint="arraste para reordenar"
          items={expenseCategories}
          onAdd={onAddExpenseCategory}
          onUpdate={onUpdateExpenseCategory}
          onDelete={onDeleteExpenseCategory}
          onReorder={onReorderExpenseCategories}
          addLabel="Nova categoria de despesa"
          deleteWarning={(item) => `Os lançamentos com "${item.label}" ficam sem categoria.`}
        />
      ),
    },
    {
      id: 'income',
      label: 'Categorias de receita',
      icon: TrendingUp,
      render: () => (
        <EditableListSection
          title="Categorias de receita"
          hint="arraste para reordenar"
          items={incomeCategories}
          onAdd={onAddIncomeCategory}
          onUpdate={onUpdateIncomeCategory}
          onDelete={onDeleteIncomeCategory}
          onReorder={onReorderIncomeCategories}
          addLabel="Nova categoria de receita"
          deleteWarning={(item) => `Os lançamentos com "${item.label}" ficam sem categoria.`}
        />
      ),
    },
    {
      id: 'methods',
      label: 'Formas de pagamento',
      icon: Wallet,
      render: () => (
        <EditableListSection
          title="Formas de pagamento"
          hint="arraste para reordenar"
          items={paymentMethods}
          onAdd={onAddPaymentMethod}
          onUpdate={onUpdatePaymentMethod}
          onDelete={onDeletePaymentMethod}
          onReorder={onReorderPaymentMethods}
          addLabel="Nova forma de pagamento"
          deleteWarning={(item) => `Os lançamentos com "${item.label}" ficam sem forma de pagamento.`}
          hideColor
          isItemDeletable={(item) => item.id !== 'credito'}
          isItemLabelLocked={(item) => item.id === 'credito'}
          renderExtra={(item) =>
            item.id === 'credito' ? (
              <CreditCardDaysFields config={creditCardConfig} onUpdateConfig={onUpdateCreditCardConfig} />
            ) : null
          }
        />
      ),
    },
    {
      id: 'accounts',
      label: 'Contas',
      icon: Landmark,
      render: () => (
        <EditableListSection
          title="Contas"
          hint="arraste para reordenar"
          items={accounts}
          onAdd={onAddAccount}
          onUpdate={onUpdateAccount}
          onDelete={onDeleteAccount}
          onReorder={onReorderAccounts}
          addLabel="Nova conta"
          deleteWarning={(item) => `Os lançamentos com "${item.label}" ficam sem conta.`}
        />
      ),
    },
    {
      id: 'tags',
      label: 'Tags',
      icon: Tag,
      render: () => (
        <EditableListSection
          title="Tags"
          hint="arraste para reordenar"
          items={tags}
          onAdd={onAddTag}
          onUpdate={onUpdateTag}
          onDelete={onDeleteTag}
          onReorder={onReorderTags}
          addLabel="Nova tag"
          deleteWarning={(item) => `A tag "${item.label}" será removida de todos os lançamentos.`}
        />
      ),
    },
  ]

  return <SettingsShell sections={sections} onClose={onClose} />
}
