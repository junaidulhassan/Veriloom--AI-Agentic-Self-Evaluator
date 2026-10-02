import { memo, useId, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export const Sparkline = memo(function Sparkline({
  values,
  color = 'var(--charcoal-900)',
  height = 36,
  width = 120,
  fill = true,
  label,
}: {
  values: number[]
  color?: string
  height?: number
  width?: number
  fill?: boolean
  label?: string
}) {
  const id = useId()
  const reduced = useReducedMotion()
  const { line, area } = useMemo(() => {
    const data = values.length === 1 ? [values[0], values[0]] : values
    if (!data.length) return { line: '', area: '' }
    const max = Math.max(...data)
    const min = Math.min(...data)
    const span = max - min || 1
    const step = width / Math.max(1, data.length - 1)
    const points = data.map(
      (value, index) => [index * step, height - 3 - ((value - min) / span) * (height - 6)] as const,
    )
    const path = points
      .map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`)
      .join(' ')
    return { line: path, area: `${path} L${width},${height} L0,${height} Z` }
  }, [values, width, height])
  if (!line) return <div style={{ height, width }} aria-hidden />
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      role="img"
      aria-label={label ?? 'Trend sparkline'}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={`sg-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {fill ? (
        <motion.path
          d={area}
          fill={`url(#sg-${id})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduced ? 0 : 0.8, delay: reduced ? 0 : 0.4 }}
        />
      ) : null}
      <motion.path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: reduced ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: reduced ? 0 : 1.1, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  )
})
