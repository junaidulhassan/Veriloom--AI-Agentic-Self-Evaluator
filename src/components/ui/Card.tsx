import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const Card = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { strong?: boolean; interactive?: boolean }
>(function Card({ className, strong, interactive, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        strong ? 'glass-strong' : 'glass',
        'text-ink rounded-[var(--radius-card)]',
        interactive &&
          'transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)]',
        className,
      )}
      {...props}
    />
  )
})

export function CardHeader({
  title,
  description,
  icon,
  actions,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <div className="bg-charcoal-900 text-cream dark:bg-coral-500 dark:text-charcoal-900 grid size-9 shrink-0 place-items-center rounded-xl">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <h3 className="font-display truncate text-[15px] font-bold">{title}</h3>
          {description ? <p className="text-ink-muted mt-0.5 text-xs">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
    </div>
  )
}
