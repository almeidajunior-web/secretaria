import { useEffect, useState } from 'react'
import { loadBillValuesHidden, saveBillValuesHidden } from '../lib/storage'

// Vencimentos' own "hide balance" toggle (bank-app style) — independent
// from and more granular than the global privacy mode: masks just the
// summary bar's currency figures, usable even when the rest of the app is
// fully visible.
export function useBillValuesHidden() {
  const [hidden, setHidden] = useState(() => loadBillValuesHidden())

  useEffect(() => {
    saveBillValuesHidden(hidden)
  }, [hidden])

  const toggleValuesHidden = () => setHidden((h) => !h)

  return { hidden, toggleValuesHidden }
}
