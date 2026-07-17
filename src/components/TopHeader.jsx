import Logo from './Logo'
import ThemeToggle from './ThemeToggle'

export default function TopHeader({ title = null, right = null }) {
  return (
    <div
      className="glass-strong sticky top-0 z-40 flex items-center justify-between px-4 py-3"
      style={{ borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}
    >
      {title ? (
        <h1 className="font-display text-lg font-semibold">{title}</h1>
      ) : (
        <Logo />
      )}
      <div className="flex items-center gap-2">
        {right}
        <ThemeToggle />
      </div>
    </div>
  )
}
