import { Select as RS } from 'radix-ui'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = 'Select',
  className,
  label,
  size = 'md',
}: {
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  label: string
  size?: 'sm' | 'md'
}) {
  return (
    <RS.Root value={value} onValueChange={onValueChange}>
      <RS.Trigger
        aria-label={label}
        className={cn(
          'border-line bg-surface-strong text-ink hover:border-line-strong focus-visible:ring-charcoal-900/30 inline-flex min-w-0 items-center justify-between gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2',
          size === 'sm' ? 'h-8 text-[13px]' : 'h-9',
          className,
        )}
      >
        <span className="truncate">
          <RS.Value placeholder={placeholder} />
        </span>
        <RS.Icon>
          <ChevronDown className="text-ink-muted size-4" />
        </RS.Icon>
      </RS.Trigger>
      <RS.Portal>
        <RS.Content
          position="popper"
          sideOffset={6}
          className="glass-strong text-ink z-[90] max-h-80 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl p-1"
        >
          <RS.Viewport>
            {options.map((option) => (
              <RS.Item
                key={option.value}
                value={option.value}
                className="data-[highlighted]:bg-charcoal-900 data-[highlighted]:text-cream dark:data-[highlighted]:bg-coral-500 dark:data-[highlighted]:text-charcoal-900 relative flex cursor-pointer items-center gap-2 rounded-xl py-2 pr-3 pl-8 text-sm outline-none select-none"
              >
                <RS.ItemIndicator className="absolute left-2.5">
                  <Check className="size-3.5" />
                </RS.ItemIndicator>
                <RS.ItemText>{option.label}</RS.ItemText>
              </RS.Item>
            ))}
          </RS.Viewport>
        </RS.Content>
      </RS.Portal>
    </RS.Root>
  )
}
