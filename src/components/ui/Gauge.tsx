import { memo } from 'react'
import { motion } from 'framer-motion'
import { clamp } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { CountUp } from './CountUp'

export const Gauge = memo(function Gauge({
  value,
  label,
  caption,
  color = 'var(--series-1)',
  size = 168,
}: {
  value: number
  label: string
  caption?: string
  color?: string
  size?: number
}) {
  const reduced = useReducedMotion()
  const stroke = 14
  const radius = (size - stroke) / 2
  const pct = clamp(value, 0, 100) / 100
  const cx = size / 2
  const cy = size / 2
  const arc = `M ${stroke / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${cy}`
  const angle = Math.PI * (1 - pct)
  const needleX = cx + (radius - 22) * Math.cos(angle)
  const needleY = cy - (radius - 22) * Math.sin(angle)
  return (
    <figure
      className="flex flex-col items-center"
      role="img"
      aria-label={`${label}: ${value.toFixed(1)} percent`}
    >
      <svg width="100%" viewBox={`0 0 ${size} ${size / 2 + 12}`} style={{ maxWidth: size }}>
        <path d={arc} fill="none" stroke="var(--chart-grid)" strokeWidth={stroke} strokeLinecap="round" />
        {[0.25, 0.5, 0.75].map((tick) => {
          const a = Math.PI * (1 - tick)
          return (
            <line
              key={tick}
              x1={cx + (radius - 12) * Math.cos(a)}
              y1={cy - (radius - 12) * Math.sin(a)}
              x2={cx + (radius - 17) * Math.cos(a)}
              y2={cy - (radius - 17) * Math.sin(a)}
              stroke="var(--chart-axis)"
              strokeOpacity={0.5}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          )
        })}
        <motion.path
          d={arc}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ pathLength: reduced ? pct : 0 }}
          animate={{ pathLength: Math.max(pct, 0.001) }}
          transition={{ duration: reduced ? 0 : 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.line
          x1={cx}
          y1={cy}
          initial={{ x2: reduced ? needleX : stroke, y2: reduced ? needleY : cy }}
          animate={{ x2: needleX, y2: needleY }}
          transition={{ duration: reduced ? 0 : 1.4, ease: [0.16, 1, 0.3, 1] }}
          stroke="var(--chart-ink)"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={5} fill="var(--chart-ink)" />
      </svg>
      <figcaption className="-mt-1 text-center">
        <CountUp
          value={value}
          format={(v) => `${v.toFixed(1)}%`}
          className="font-sans text-2xl font-extrabold tabular-nums"
        />
        <div className="text-ink-soft text-xs font-semibold">{label}</div>
        {caption ? <div className="text-ink-muted text-[11px]">{caption}</div> : null}
      </figcaption>
    </figure>
  )
})
