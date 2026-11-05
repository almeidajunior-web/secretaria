import { useEffect } from 'react'
import { useStoredState } from '../storage/useStoredState'
import { themeStore } from '../storage/stores'

const systemTheme = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

// Light/dark theme with persistence; the first visit follows the system
// setting. Toggles the `dark` class on <html> so the CSS variables in
// index.css swap palettes.
export function useTheme() {
  const [theme, setTheme] = useStoredState(themeStore, { seed: systemTheme })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggleTheme }
}
