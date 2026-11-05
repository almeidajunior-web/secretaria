import { useStoredState } from '../storage/useStoredState'
import { financeCreditCardStore } from '../storage/stores'

// Single global config for the fixed "Cartão de Crédito" payment method —
// closing and due day of the invoice (defaults: closes on the 25th, due on
// the 5th).
export function useFinanceCreditCard() {
  const [config, setConfig] = useStoredState(financeCreditCardStore)
  const updateConfig = (patch) => setConfig((prev) => ({ ...prev, ...patch }))
  return { config, updateConfig }
}
