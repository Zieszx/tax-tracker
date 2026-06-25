import { useEffect, useCallback } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage.js'

// Resolve 'system'|'light'|'dark' → 'light'|'dark'
function resolve(theme) {
  if (theme !== 'system') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const CYCLE = { system: 'light', light: 'dark', dark: 'system' }

const LABELS = { system: 'Theme: following device', light: 'Theme: light', dark: 'Theme: dark' }

export default function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage('theme', 'system')

  // Apply resolved theme to the document root
  useEffect(() => {
    const resolved = resolve(theme)
    document.documentElement.setAttribute('data-theme', resolved)

    if (theme !== 'system') return

    // Subscribe to OS preference changes while in system mode
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light')
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [theme])

  const cycle = useCallback(() => setTheme((t) => CYCLE[t] || 'system'), [setTheme])

  const icon = theme === 'dark' ? '☀️' : theme === 'light' ? '🌙' : '🖥'

  return (
    <button
      className="theme-toggle"
      aria-label={LABELS[theme] || 'Toggle theme'}
      onClick={cycle}
    >
      {icon}
    </button>
  )
}
