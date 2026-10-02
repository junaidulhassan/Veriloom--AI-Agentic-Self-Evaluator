import { memo } from 'react'
import { useCountUp } from '@/hooks/useCountUp'

export const CountUp = memo(function CountUp({
  value,
  format = (v) => Math.round(v).toLocaleString('en'),
  className,
}: {
  value: number
  format?: (value: number) => string
  className?: string
}) {
  const current = useCountUp(value)
  return (
    <span className={className} aria-label={format(value)}>
      <span aria-hidden>{format(current)}</span>
    </span>
  )
})
