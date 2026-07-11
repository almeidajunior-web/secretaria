import { useEffect, useState } from 'react'
import { loadFinanceValuesHidden, saveFinanceValuesHidden } from '../lib/storage'

// Finanças' own "hide balance" toggle (bank-app style), mirroring
// useBillValuesHidden — independent from and more granular than the global
// privacy mode: masks just the Overview's currency figures.
export function useFinanceValuesHidden() {
  const [hidden, setHidden] = useState(() => loadFinanceValuesHidden())

  useEffect(() => {
    saveFinanceValuesHidden(hidden)
  }, [hidden])

  const toggleValuesHidden = () => setHidden((h) => !h)

  return { hidden, toggleValuesHidden }
}
