import { useEffect } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage.js'

export default function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage('theme', 'light')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  return (
    <button className="theme-toggle" aria-label="Toggle dark mode"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
