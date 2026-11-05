import { useStoredState } from '../storage/useStoredState'
import { financeValuesHiddenStore } from '../storage/stores'

// Finanças' "ocultar valores" eye: masks money on screen, bank-app style,
// without touching the data.
export function useFinanceValuesHidden() {
  const [hidden, setHidden] = useStoredState(financeValuesHiddenStore)
  const toggleValuesHidden = () => setHidden((h) => !h)
  return { hidden, toggleValuesHidden }
}
