import type { ReactNode } from 'react'
import { Tooltip as RT } from 'radix-ui'
import { cn } from '@/lib/utils'

export const TooltipProvider = RT.Provider

export function Tooltip({
  content,
  children,
  side = 'top',
  className,
  delay,
}: {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  delay?: number
}) {
  if (!content) return <>{children}</>
  return (
    <RT.Root delayDuration={delay}>
      <RT.Trigger asChild>{children}</RT.Trigger>
      <RT.Portal>
        <RT.Content
          side={side}
          sideOffset={6}
          collisionPadding={12}
          className={cn(
            'bg-charcoal-900 text-cream z-[90] max-w-xs origin-[var(--radix-tooltip-content-transform-origin)] rounded-xl px-3 py-2 text-xs leading-relaxed shadow-lg',
            'dark:bg-cream dark:text-charcoal-900 data-[state=delayed-open]:animate-[tip-in_160ms_cubic-bezier(.16,1,.3,1)]',
            className,
          )}
        >
          {content}
          <RT.Arrow className="fill-charcoal-900 dark:fill-cream" />
        </RT.Content>
      </RT.Portal>
    </RT.Root>
  )
}
