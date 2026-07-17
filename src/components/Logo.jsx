export default function Logo({ size = 36, showText = true }) {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/icons/icon-192.png"
        alt="Influo"
        width={size}
        height={size}
        style={{ borderRadius: size * 0.3 }}
      />
      {showText && (
        <span className="font-display text-[17px] font-semibold tracking-tight">Influo</span>
      )}
    </div>
  )
}
