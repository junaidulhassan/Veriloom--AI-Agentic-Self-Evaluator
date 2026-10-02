import { useId, type ReactNode } from 'react'
import { Tabs as RT } from 'radix-ui'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { snappy } from '@/lib/motion'

export function Tabs({
  value,
  onValueChange,
  tabs,
  children,
  className,
  label,
}: {
  value: string
  onValueChange: (value: string) => void
  tabs: { value: string; label: string; icon?: ReactNode; count?: number }[]
  children: ReactNode
  className?: string
  label: string
}) {
  const id = useId()
  return (
    <RT.Root value={value} onValueChange={onValueChange} className={className}>
      <RT.List
        aria-label={label}
        className="no-scrollbar border-line flex gap-1 overflow-x-auto border-b pb-px"
      >
        {tabs.map((tab) => (
          <RT.Trigger
            key={tab.value}
            value={tab.value}
            className="text-ink-muted hover:text-ink data-[state=active]:text-ink relative inline-flex h-10 shrink-0 items-center gap-1.5 rounded-t-xl px-3.5 text-[13px] font-semibold transition-colors"
          >
            {tab.icon}
            {tab.label}
            {tab.count != null ? (
              <span className="bg-charcoal-900/[0.08] dark:bg-cream/10 rounded-full px-1.5 py-0.5 text-[10.5px] leading-none">
                {tab.count}
              </span>
            ) : null}
            {tab.value === value ? (
              <motion.span
                layoutId={`tab-${id}`}
                transition={snappy}
                className="bg-charcoal-900 dark:bg-coral-400 absolute inset-x-2 -bottom-px h-[3px] rounded-full"
              />
            ) : null}
          </RT.Trigger>
        ))}
      </RT.List>
      {children}
    </RT.Root>
  )
}

export const TabPanel = ({
  value,
  children,
  className,
}: {
  value: string
  children: ReactNode
  className?: string
}) => (
  <RT.Content value={value} className={cn('pt-4 focus-visible:outline-none', className)}>
    {children}
  </RT.Content>
)
