import { memo, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { clamp } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export const ProgressRing = memo(function ProgressRing({
  value,
  size = 44,
  stroke = 5,
  color = 'var(--charcoal-900)',
  track = 'rgb(28 28 31 / 0.1)',
  label,
  children,
}: {
  value: number
  size?: number
  stroke?: number
  color?: string
  track?: string
  label?: string
  children?: ReactNode
}) {
  const reduced = useReducedMotion()
  const radius = (size - stroke) / 2
  const pct = clamp(value, 0, 100) / 100
  return (
    <div
      className="relative inline-grid place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `${Math.round(value)}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ pathLength: reduced ? pct : 0 }}
          animate={{ pathLength: pct }}
          transition={{ duration: reduced ? 0 : 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      {children ? <div className="absolute inset-0 grid place-items-center">{children}</div> : null}
    </div>
  )
})
