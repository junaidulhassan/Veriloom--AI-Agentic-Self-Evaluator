import { sanitizeDisplayText } from '@/lib/format'
import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn, clamp } from '@/lib/utils'

export function ScoreBar({ score, label = 'Similarity' }: { score: number | null; label?: string }) {
  if (score == null) return null
  const pct = clamp(score * 100, 0, 100)
  return (
    <div className="flex items-center gap-2" aria-label={`${label} ${score.toFixed(3)}`}>
      <div className="bg-charcoal-900/10 dark:bg-cream/10 h-1.5 w-20 overflow-hidden rounded-full">
        <motion.div
          className="h-full rounded-full"
          style={{
            background:
              score >= 0.6 ? 'var(--success)' : score >= 0.35 ? 'var(--warning)' : 'var(--series-neutral)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="text-ink-muted font-mono text-[11px] tabular-nums">{score.toFixed(3)}</span>
    </div>
  )
}

export function Collapsible({
  label,
  children,
  defaultOpen = false,
  className,
  right,
}: {
  label: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  className?: string
  right?: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={cn('border-line rounded-xl border', className)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="text-ink-soft hover:text-ink flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-semibold"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <ChevronDown
            className={cn('size-3.5 shrink-0 transition-transform', !open && '-rotate-90')}
            aria-hidden
          />
          <span className="truncate">{label}</span>
        </span>
        {right}
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export function MonoBlock({
  children,
  className,
  maxHeight = 280,
}: {
  children: ReactNode
  className?: string
  maxHeight?: number
}) {
  return (
    <pre
      className={cn(
        'bg-terminal text-terminal-ink overflow-auto rounded-xl px-3 py-2.5 font-mono text-[12px] leading-relaxed break-words whitespace-pre-wrap',
        className,
      )}
      style={{ maxHeight }}
    >
      {typeof children === 'string' ? sanitizeDisplayText(children) : children}
    </pre>
  )
}
