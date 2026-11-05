import { useStoredState } from '../storage/useStoredState'
import { billValuesHiddenStore } from '../storage/stores'

// Vencimentos' "ocultar valores" eye: masks the totals on screen without
// touching the data.
export function useBillValuesHidden() {
  const [hidden, setHidden] = useStoredState(billValuesHiddenStore)
  const toggleValuesHidden = () => setHidden((h) => !h)
  return { hidden, toggleValuesHidden }
}
