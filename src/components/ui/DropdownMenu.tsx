import type { ReactNode } from 'react'
import { DropdownMenu as RM } from 'radix-ui'
import { cn } from '@/lib/utils'

export interface MenuItem {
  label: string
  icon?: ReactNode
  onSelect: () => void
  destructive?: boolean
  disabled?: boolean
}

export function DropdownMenu({
  trigger,
  items,
  align = 'end',
}: {
  trigger: ReactNode
  items: MenuItem[]
  align?: 'start' | 'end'
}) {
  return (
    <RM.Root modal={false}>
      <RM.Trigger asChild>{trigger}</RM.Trigger>
      <RM.Portal>
        <RM.Content
          align={align}
          sideOffset={6}
          className="glass-strong text-ink z-[90] min-w-44 rounded-2xl p-1 data-[state=open]:animate-[tip-in_140ms_ease-out]"
        >
          {items.map((item) => (
            <RM.Item
              key={item.label}
              disabled={item.disabled}
              onSelect={item.onSelect}
              className={cn(
                'data-[highlighted]:bg-charcoal-900 data-[highlighted]:text-cream dark:data-[highlighted]:bg-coral-500 dark:data-[highlighted]:text-charcoal-900 flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm outline-none select-none data-[disabled]:opacity-50',
                item.destructive && 'text-error dark:text-[#ffb3ad]',
              )}
            >
              {item.icon}
              {item.label}
            </RM.Item>
          ))}
        </RM.Content>
      </RM.Portal>
    </RM.Root>
  )
}
