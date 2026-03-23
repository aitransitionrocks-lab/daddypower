// DaddyPower Logo — Brand Guide v1.0
// Blitz-Kreis-Symbol + Wordmark

interface LogoProps {
  variant?: 'full' | 'icon' | 'wordmark'
  theme?: 'light' | 'dark'
  className?: string
  size?: number
}

export default function Logo({ variant = 'full', theme = 'light', className = '', size = 40 }: LogoProps) {
  const amber = '#BA7517'
  const charcoal = '#1B1B19'
  const offwhite = '#F5F3ED'

  const textColor = theme === 'light' ? charcoal : offwhite
  const circleStyle = theme === 'light'
    ? { fill: charcoal, stroke: 'none' }
    : { fill: 'none', stroke: amber, strokeWidth: 2 }

  // Blitz-Symbol im Kreis
  const icon = (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="22" {...circleStyle} />
      <path
        d="M27 8L15 26h8l-3 14L32 22h-8l3-14z"
        fill={amber}
      />
    </svg>
  )

  // Wordmark: DADDY / POWER
  const wordmark = (
    <div className="flex flex-col leading-none" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      <span
        className="font-bold tracking-[0.15em] uppercase"
        style={{ color: textColor, fontSize: size * 0.45 }}
      >
        DADDY
      </span>
      <div style={{ height: 2, backgroundColor: amber, marginTop: 2, marginBottom: 2 }} />
      <span
        className="font-bold tracking-[0.15em] uppercase"
        style={{ color: amber, fontSize: size * 0.45 }}
      >
        POWER
      </span>
    </div>
  )

  if (variant === 'icon') return <span className={className}>{icon}</span>
  if (variant === 'wordmark') return <span className={className}>{wordmark}</span>

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      {icon}
      {wordmark}
    </span>
  )
}
