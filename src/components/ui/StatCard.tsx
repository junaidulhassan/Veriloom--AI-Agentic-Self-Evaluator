import { memo, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fadeUp } from '@/lib/motion'
import { CountUp } from './CountUp'
import { InfoTip } from './InfoTip'
import { Skeleton } from './Skeleton'
import { Sparkline } from './Sparkline'

export interface StatCardProps {
  label: string
  value: number | null | undefined
  format?: (value: number) => string
  icon?: ReactNode
  info?: string
  delta?: number | null
  goodDirection?: 'up' | 'down'
  spark?: number[]
  sparkColor?: string
  hint?: ReactNode
  loading?: boolean
  className?: string
}

export const StatCard = memo(function StatCard({
  label,
  value,
  format,
  icon,
  info,
  delta,
  goodDirection = 'up',
  spark,
  sparkColor = 'var(--series-1)',
  hint,
  loading,
  className,
}: StatCardProps) {
  const hasDelta = delta != null && Number.isFinite(delta)
  const flat = hasDelta && Math.abs(delta) < 0.05
  const good = hasDelta && !flat && (goodDirection === 'up' ? delta > 0 : delta < 0)
  return (
    <motion.div
      variants={fadeUp}
      className={cn(
        'glass group relative flex min-h-[148px] flex-col justify-between overflow-hidden rounded-[var(--radius-card)] p-4 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {icon ? (
            <span className="bg-charcoal-900 text-cream dark:bg-coral-500 dark:text-charcoal-900 grid size-8 shrink-0 place-items-center rounded-xl">
              {icon}
            </span>
          ) : null}
          <span className="text-ink-soft truncate text-[12.5px] font-semibold">{label}</span>
        </div>
        {info ? <InfoTip content={info} label={`About ${label}`} /> : null}
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : value == null ? (
            <span className="text-ink-muted font-sans text-[30px] leading-none font-extrabold">-</span>
          ) : (
            <CountUp
              value={value}
              format={format}
              className="font-sans text-[30px] leading-none font-extrabold tracking-tight tabular-nums"
            />
          )}
          <div className="mt-2 flex min-h-5 items-center gap-1.5 text-[11.5px]">
            {hasDelta && !loading ? (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-bold',
                  flat
                    ? 'bg-charcoal-900/[0.07] text-ink-soft'
                    : good
                      ? 'bg-success/12 text-[#1f7a51] dark:text-[#5fd3a0]'
                      : 'bg-error/10 text-error dark:text-[#ffb3ad]',
                )}
              >
                {flat ? (
                  <Minus className="size-3" aria-hidden />
                ) : delta > 0 ? (
                  <ArrowUpRight className="size-3" aria-hidden />
                ) : (
                  <ArrowDownRight className="size-3" aria-hidden />
                )}
                {Math.abs(delta).toFixed(1)}%
              </span>
            ) : null}
            {hint ? <span className="text-ink-muted truncate">{hint}</span> : null}
          </div>
        </div>
        {spark && spark.length > 1 ? (
          <div className="w-24 shrink-0">
            <Sparkline values={spark} color={sparkColor} label={`${label} trend`} />
          </div>
        ) : null}
      </div>
    </motion.div>
  )
})
