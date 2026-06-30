import { useEffect, useState } from 'react'
import { loadTheme, saveTheme } from '../lib/storage'

// Light/dark theme with persistence. Toggles the `dark` class on <html> so the
// CSS variables in index.css swap palettes.
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const stored = loadTheme()
    if (stored) return stored
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    saveTheme(theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggleTheme }
}
