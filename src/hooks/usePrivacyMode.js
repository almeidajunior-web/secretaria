import { useEffect, useState } from 'react'
import { loadPrivacyMode, savePrivacyMode } from '../lib/storage'

// App-wide "privacy screen": blurs and disables interaction with everything
// below the Topbar (see PrivacyOverlay) without touching or clearing any
// data — purely a display-layer toggle, same persistence pattern as
// useTheme so it survives a reload (the whole point is not resetting the
// moment you reopen the laptop in public).
export function usePrivacyMode() {
  const [hidden, setHidden] = useState(() => loadPrivacyMode())

  useEffect(() => {
    savePrivacyMode(hidden)
  }, [hidden])

  const togglePrivacyMode = () => setHidden((h) => !h)

  return { hidden, togglePrivacyMode }
}
