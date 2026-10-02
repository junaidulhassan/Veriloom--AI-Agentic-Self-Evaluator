import type { ReactNode } from 'react'
import { Popover as RP } from 'radix-ui'
import { cn } from '@/lib/utils'

export function Popover({
  trigger,
  children,
  className,
  align = 'start',
  open,
  onOpenChange,
}: {
  trigger: ReactNode
  children: ReactNode
  className?: string
  align?: 'start' | 'center' | 'end'
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <RP.Root open={open} onOpenChange={onOpenChange}>
      <RP.Trigger asChild>{trigger}</RP.Trigger>
      <RP.Portal>
        <RP.Content
          align={align}
          sideOffset={8}
          collisionPadding={12}
          className={cn(
            'glass-strong text-ink z-[90] rounded-2xl p-4 data-[state=open]:animate-[tip-in_160ms_cubic-bezier(.16,1,.3,1)]',
            className,
          )}
        >
          {children}
        </RP.Content>
      </RP.Portal>
    </RP.Root>
  )
}
