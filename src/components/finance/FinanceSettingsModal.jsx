import { X } from 'lucide-react'
import EditableListSection from '../common/EditableListSection'

// Manage Finanças' four customizable lists — Categorias de despesa,
// Categorias de receita, Formas de pagamento and Contas — same
// add/edit-color/delete/drag-to-reorder pattern shared by every other
// module's settings modal via EditableListSection.
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
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="thin-scroll max-h-[85vh] w-[440px] overflow-auto rounded-xl border border-border bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text">Configurações</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-text-muted hover:text-text"
          >
            <X size={18} />
          </button>
        </div>

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
      </div>
    </div>
  )
}
