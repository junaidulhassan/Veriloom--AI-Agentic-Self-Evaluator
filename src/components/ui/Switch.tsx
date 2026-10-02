import { Switch as RSwitch } from 'radix-ui'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { snappy } from '@/lib/motion'

export function Switch({
  checked,
  onCheckedChange,
  label,
  className,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
  className?: string
}) {
  return (
    <RSwitch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={label}
      className={cn(
        'border-line relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border px-0.5 transition-colors',
        checked ? 'bg-charcoal-900 dark:bg-coral-500' : 'bg-charcoal-900/15 dark:bg-cream/15',
        className,
      )}
    >
      <RSwitch.Thumb asChild>
        <motion.span
          layout
          transition={snappy}
          className={cn(
            'block size-[18px] rounded-full shadow-sm',
            checked ? 'bg-coral-400 dark:bg-charcoal-900 ml-auto' : 'bg-cream',
          )}
        />
      </RSwitch.Thumb>
    </RSwitch.Root>
  )
}
