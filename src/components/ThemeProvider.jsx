/**
 * ThemeProvider.jsx — single source of truth for the app theme.
 *
 * Owns the 'theme' preference ('system' | 'light' | 'dark'), persists it to
 * localStorage (JSON-encoded via useLocalStorage), applies the resolved value
 * to document.documentElement[data-theme], and tracks the OS preference while
 * in 'system' mode. Both ThemeToggle and Settings consume this context so their
 * views stay in sync (previously they used two independent stores that never
 * synchronised).
 */

import { createContext, useContext, useEffect } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage.js'

const ThemeContext = createContext(null)

// Resolve 'system'|'light'|'dark' → 'light'|'dark'
function resolve(theme) {
  if (theme !== 'system') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const CYCLE = { system: 'light', light: 'dark', dark: 'system' }

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useLocalStorage('theme', 'system')

  // Apply the resolved theme to the document root; follow the OS in system mode.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolve(theme))
    if (theme !== 'system') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) =>
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light')
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [theme])

  const cycle = () => setTheme((t) => CYCLE[t] || 'system')

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
