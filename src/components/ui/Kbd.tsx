import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'border-line-strong bg-surface-strong text-ink-soft inline-flex h-5 min-w-5 items-center justify-center rounded-md border px-1 font-mono text-[10.5px] font-medium',
        className,
      )}
    >
      {children}
    </kbd>
  )
}
