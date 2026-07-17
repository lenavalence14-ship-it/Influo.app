export default function Card({ children, glass = false, className = '', ...props }) {
  const base = 'rounded-3xl'
  const style = glass
    ? 'glass'
    : 'border'
  return (
    <div
      className={`${base} ${style} ${className}`}
      style={!glass ? { borderColor: 'var(--border)', background: 'var(--bg-elevated)' } : {}}
      {...props}
    >
      {children}
    </div>
  )
}
