import { useEditableList } from '../storage/useEditableList'
import { financePaymentMethodsStore } from '../storage/stores'

// Payment methods for Finanças. "Cartão de Crédito" (id `credito`) is fixed —
// FinanceSettingsModal locks its label and blocks deleting it.
export function useFinancePaymentMethods() {
  const { items, add, update, remove, reorder } = useEditableList(financePaymentMethodsStore, 'finpm')
  return {
    methods: items,
    addMethod: add,
    updateMethod: update,
    deleteMethod: remove,
    reorderMethods: reorder,
  }
}
