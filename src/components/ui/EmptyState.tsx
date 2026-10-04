import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Inbox, LogIn, RotateCw, ServerCrash, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import { describeError, toApiError } from '@/api/errors'
import { Button, buttonVariants } from './Button'

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
  compact?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-2 py-6' : 'gap-3 py-12',
        className,
      )}
    >
      <div
        className={cn(
          'bg-charcoal-900/[0.07] text-ink-soft dark:bg-cream/[0.08] grid place-items-center rounded-2xl',
          compact ? 'size-10' : 'size-14',
        )}
      >
        {icon ?? <Inbox className={compact ? 'size-5' : 'size-6'} aria-hidden />}
      </div>
      <div>
        <p className={cn('font-display font-bold', compact ? 'text-sm' : 'text-base')}>{title}</p>
        {description ? (
          <p className="text-ink-muted mx-auto mt-1 max-w-sm text-xs leading-relaxed">{description}</p>
        ) : null}
      </div>
      {action}
    </motion.div>
  )
}

export function ErrorState({
  error,
  onRetry,
  compact,
  className,
}: {
  error: unknown
  onRetry?: () => void
  compact?: boolean
  className?: string
}) {
  const err = toApiError(error)
  if (err.isUnauthorized) {
    return (
      <EmptyState
        compact={compact}
        className={className}
        icon={<ShieldAlert className="size-5" aria-hidden />}
        title="Sign in required"
        description="Your session has ended. Sign in again to see your data."
        action={
          <Link to="/veriloom/login" className={buttonVariants({ size: 'sm' })}>
            <LogIn className="size-3.5" aria-hidden />
            Sign in
          </Link>
        }
      />
    )
  }
  return (
    <EmptyState
      compact={compact}
      className={className}
      icon={<ServerCrash className="text-error size-5 dark:text-[#ffb3ad]" aria-hidden />}
      title="Could not load this data"
      description={describeError(err)}
      action={
        onRetry ? (
          <Button size="sm" onClick={onRetry}>
            <RotateCw className="size-3.5" aria-hidden />
            Retry
          </Button>
        ) : undefined
      }
    />
  )
}
