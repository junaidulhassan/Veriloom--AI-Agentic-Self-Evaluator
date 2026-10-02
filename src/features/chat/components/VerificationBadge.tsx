import { memo } from 'react'
import { AlertTriangle, BadgeCheck, CircleHelp, Flag, RefreshCcw } from 'lucide-react'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { Tooltip } from '@/components/ui/Tooltip'
import { cn } from '@/lib/utils'
import type { Verdict } from '../meta'

const config: Record<Verdict, { label: string; className: string; ring: string; icon: typeof BadgeCheck }> = {
  verified: {
    label: 'Verified',
    className: 'bg-success/12 text-[#1f7a51] dark:text-[#5fd3a0]',
    ring: 'var(--success)',
    icon: BadgeCheck,
  },
  'self-corrected': {
    label: 'Self-corrected',
    className: 'bg-info/12 text-info dark:text-[#9cc0ec]',
    ring: 'var(--info)',
    icon: RefreshCcw,
  },
  'low-confidence': {
    label: 'Low confidence',
    className: 'bg-warning/20 text-[#8a5a0c] dark:text-[#f6c36f]',
    ring: 'var(--warning)',
    icon: AlertTriangle,
  },
  flagged: {
    label: 'Flagged',
    className: 'bg-error/10 text-error dark:text-[#ffb3ad]',
    ring: 'var(--error)',
    icon: Flag,
  },
  unverified: {
    label: 'Not evaluated',
    className: 'bg-charcoal-900/[0.07] text-ink-soft dark:bg-cream/10',
    ring: 'var(--series-neutral)',
    icon: CircleHelp,
  },
}

export const VerificationBadge = memo(function VerificationBadge({
  verdict,
  confidence,
  reason,
}: {
  verdict: Verdict
  confidence: number | null
  reason?: string | null
}) {
  const item = config[verdict]
  const Icon = item.icon
  return (
    <Tooltip content={reason ? <span className="block max-w-xs">{reason}</span> : item.label}>
      <span
        className={cn(
          'inline-flex h-7 items-center gap-1.5 rounded-full pr-2.5 pl-1 text-[11.5px] font-bold',
          item.className,
        )}
        tabIndex={0}
      >
        {confidence != null ? (
          <ProgressRing
            value={confidence * 100}
            size={20}
            stroke={2.5}
            color={item.ring}
            track="rgb(28 28 31 / 0.12)"
            label={`Confidence ${Math.round(confidence * 100)}%`}
          >
            <Icon className="size-2.5" aria-hidden />
          </ProgressRing>
        ) : (
          <span className="grid size-5 place-items-center">
            <Icon className="size-3.5" aria-hidden />
          </span>
        )}
        {item.label}
        {confidence != null ? (
          <span className="font-mono font-semibold opacity-80">{Math.round(confidence * 100)}%</span>
        ) : null}
      </span>
    </Tooltip>
  )
})
