import { useTheme } from './ThemeProvider.jsx'

const LABELS = { system: 'Theme: following device', light: 'Theme: light', dark: 'Theme: dark' }

export default function ThemeToggle() {
  const { theme, cycle } = useTheme()
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
