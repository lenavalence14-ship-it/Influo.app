export default function Input({ label, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--fg-muted)' }}>
          {label}
        </label>
      )}
      <input
        className={`w-full rounded-xl border px-4 py-3.5 text-sm outline-none transition-colors ${className}`}
        style={{
          borderColor: 'var(--border)',
          background: 'var(--bg-elevated)',
          color: 'var(--fg)',
        }}
        {...props}
      />
    </div>
  )
}
