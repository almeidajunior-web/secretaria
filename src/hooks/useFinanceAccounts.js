import { useEditableList } from '../storage/useEditableList'
import { financeAccountsStore } from '../storage/stores'

// Bank accounts for Finanças. No seed — there's no guessing someone's real
// banks. Each may carry `initialBalance` and `isReserve`.
export function useFinanceAccounts() {
  const { items, add, update, remove, reorder } = useEditableList(financeAccountsStore, 'finacc')
  return {
    accounts: items,
    addAccount: add,
    updateAccount: update,
    deleteAccount: remove,
    reorderAccounts: reorder,
  }
}
