export default function WaveBars({ size = 'md', active = false, className = '' }) {
  const heights =
    size === 'lg'
      ? [18, 34, 52, 70, 88, 70, 52, 34, 18]
      : size === 'sm'
      ? [6, 10, 14, 18, 14, 10, 6]
      : [10, 18, 26, 34, 26, 18, 10]

  return (
    <div className={`flex items-end gap-[3px] ${className}`} style={{ height: Math.max(...heights) }}>
      {heights.map((h, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full bg-current ${active ? 'animate-pulse' : ''}`}
          style={{
            height: h,
            opacity: 0.35 + (h / Math.max(...heights)) * 0.65,
            animationDelay: `${i * 80}ms`,
          }}
        />
      ))}
    </div>
  )
}
