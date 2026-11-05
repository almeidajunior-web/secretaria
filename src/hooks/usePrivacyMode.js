import { useStoredState } from '../storage/useStoredState'
import { privacyModeStore } from '../storage/stores'

// App-wide "privacy screen": blurs and disables interaction with everything
// below the Topbar (see PrivacyOverlay) without touching any data. Persists
// across reloads — the whole point is not resetting the moment you reopen
// the laptop in public.
export function usePrivacyMode() {
  const [hidden, setHidden] = useStoredState(privacyModeStore)
  const togglePrivacyMode = () => setHidden((h) => !h)
  return { hidden, togglePrivacyMode }
}
