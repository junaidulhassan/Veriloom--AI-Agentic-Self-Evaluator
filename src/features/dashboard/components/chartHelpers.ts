import { useReducedMotion } from '@/hooks/useReducedMotion'
import { formatDayLabel } from '@/lib/format'

export function useChartAnimation(duration = 1100) {
  const reduced = useReducedMotion()
  return { isAnimationActive: !reduced, animationDuration: duration, animationEasing: 'ease-out' as const }
}

export const dayTick = (value: string) => formatDayLabel(String(value))

export const pct = (value: number) => `${value.toFixed(1)}%`

export function rate(numerator: number, denominator: number) {
  return denominator ? (numerator / denominator) * 100 : 0
}
