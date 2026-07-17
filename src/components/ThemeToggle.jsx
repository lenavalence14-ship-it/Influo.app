import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      className="glass flex h-9 w-9 items-center justify-center rounded-full"
      style={{ color: 'var(--fg)' }}
      aria-label="Changer de thème"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
