import { TrendingDown, TrendingUp, Wallet, Landmark } from 'lucide-react'
import EditableListSection from '../common/EditableListSection'
import SettingsShell from '../common/SettingsShell'

// Manage Finanças' customizable lists — expense/income categories, payment
// methods and accounts — each on its own tab in the shared settings sidebar.
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
  accounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onReorderAccounts,
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
  ]

  return <SettingsShell sections={sections} onClose={onClose} />
}
