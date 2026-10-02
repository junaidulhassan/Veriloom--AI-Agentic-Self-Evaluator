import type { HTMLAttributes, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { AlertTriangle, CheckCircle2, CircleDashed, Loader2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex max-w-full items-center gap-1 whitespace-nowrap rounded-full font-semibold leading-none',
  {
    variants: {
      tone: {
        neutral: 'bg-charcoal-900/[0.07] text-ink-soft dark:bg-cream/10',
        dark: 'bg-charcoal-900 text-cream dark:bg-cream dark:text-charcoal-900',
        coral: 'bg-coral-100 text-coral-700 dark:bg-coral-500/15 dark:text-coral-300',
        success: 'bg-success/12 text-[#1f7a51] dark:text-[#5fd3a0]',
        warning: 'bg-warning/18 text-[#8a5a0c] dark:text-[#f6c36f]',
        error: 'bg-error/10 text-error dark:bg-error/30 dark:text-[#ffb3ad]',
        info: 'bg-info/12 text-info dark:text-[#9cc0ec]',
        outline: 'border border-line-strong text-ink-soft',
      },
      size: {
        xs: 'h-5 px-2 text-[10.5px]',
        sm: 'h-6 px-2.5 text-[11.5px]',
        md: 'h-7 px-3 text-xs',
      },
    },
    defaultVariants: { tone: 'neutral', size: 'sm' },
  },
)

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  icon?: ReactNode
}

export function Badge({ className, tone, size, icon, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, size }), className)} {...props}>
      {icon}
      <span className="truncate">{children}</span>
    </span>
  )
}

const statusMap: Record<string, { tone: BadgeProps['tone']; icon: ReactNode; label?: string }> = {
  success: { tone: 'success', icon: <CheckCircle2 className="size-3" aria-hidden /> },
  completed: { tone: 'success', icon: <CheckCircle2 className="size-3" aria-hidden /> },
  ready: { tone: 'success', icon: <CheckCircle2 className="size-3" aria-hidden /> },
  error: { tone: 'error', icon: <XCircle className="size-3" aria-hidden /> },
  failed: { tone: 'error', icon: <XCircle className="size-3" aria-hidden /> },
  sandbox_error: { tone: 'error', icon: <XCircle className="size-3" aria-hidden /> },
  timeout: { tone: 'warning', icon: <AlertTriangle className="size-3" aria-hidden /> },
  cancelled: { tone: 'neutral', icon: <CircleDashed className="size-3" aria-hidden /> },
  running: { tone: 'info', icon: <Loader2 className="size-3 animate-spin" aria-hidden /> },
  processing: { tone: 'info', icon: <Loader2 className="size-3 animate-spin" aria-hidden /> },
}

export function StatusBadge({
  status,
  size = 'xs',
}: {
  status: string | null | undefined
  size?: BadgeProps['size']
}) {
  const key = (status ?? 'unknown').toLowerCase()
  const config = statusMap[key] ?? {
    tone: 'neutral' as const,
    icon: <CircleDashed className="size-3" aria-hidden />,
  }
  return (
    <Badge tone={config.tone} size={size} icon={config.icon}>
      {key.replace(/_/g, ' ')}
    </Badge>
  )
}

export function BoolBadge({
  value,
  trueLabel = 'Yes',
  falseLabel = 'No',
  invert = false,
}: {
  value: boolean | null | undefined
  trueLabel?: string
  falseLabel?: string
  invert?: boolean
}) {
  if (value == null) return <Badge size="xs">n/a</Badge>
  const good = invert ? !value : value
  return (
    <Badge
      size="xs"
      tone={good ? 'success' : 'error'}
      icon={
        good ? <CheckCircle2 className="size-3" aria-hidden /> : <XCircle className="size-3" aria-hidden />
      }
    >
      {value ? trueLabel : falseLabel}
    </Badge>
  )
}
