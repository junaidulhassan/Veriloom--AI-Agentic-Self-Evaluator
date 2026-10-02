import { useId } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { snappy } from '@/lib/motion'

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  size = 'md',
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  label: string
  size?: 'sm' | 'md'
  className?: string
}) {
  const id = useId()
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        'border-line bg-surface-strong inline-flex items-center gap-0.5 rounded-full border p-0.5',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative rounded-full font-semibold transition-colors',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3.5 text-[13px]',
              active ? 'text-btn-ink' : 'text-ink-muted hover:text-ink',
            )}
          >
            {active ? (
              <motion.span
                layoutId={`seg-${id}`}
                transition={snappy}
                className="bg-btn absolute inset-0 rounded-full"
              />
            ) : null}
            <span className="relative z-[1]">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
