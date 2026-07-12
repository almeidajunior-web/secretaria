import { useEffect, useState } from 'react'
import { loadFinanceCreditCard, saveFinanceCreditCard } from '../lib/storage'

const DEFAULT_CREDIT_CARD = { closingDay: 25, dueDay: 5 }

// Single global config for the fixed "Cartão de Crédito" payment method —
// not per-card, not per-transaction. Mirrors useFinanceValuesHidden's shape.
export function useFinanceCreditCard() {
  const [config, setConfig] = useState(() => loadFinanceCreditCard() ?? DEFAULT_CREDIT_CARD)

  useEffect(() => {
    saveFinanceCreditCard(config)
  }, [config])

  const updateConfig = (patch) => setConfig((prev) => ({ ...prev, ...patch }))

  return { config, updateConfig }
}
