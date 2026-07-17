export default function Button({
  children,
  variant = 'primary', // primary | outline | glass | ghost
  className = '',
  ...props
}) {
  const base = 'rounded-2xl py-3.5 px-5 text-sm font-semibold transition-transform active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100 flex items-center justify-center gap-2'

  const variants = {
    primary: 'bg-[var(--invert-bg)] text-[var(--invert-fg)]',
    outline: 'border border-[var(--border)] text-[var(--fg)]',
    glass: 'glass text-[var(--fg)]',
    ghost: 'text-[var(--fg-muted)]',
  }

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
