import type { ReactNode } from 'react'
import { Dialog as RD } from 'radix-ui'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { spring } from '@/lib/motion'
import { Button } from './Button'

export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  actions,
  width = 'max-w-3xl',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  actions?: ReactNode
  width?: string
}) {
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <RD.Portal forceMount>
            <RD.Overlay asChild forceMount>
              <motion.div
                className="bg-charcoal-900/35 fixed inset-0 z-[70] backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </RD.Overlay>
            <RD.Content asChild forceMount>
              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={spring}
                className={cn(
                  'glass-strong text-ink fixed inset-y-0 right-0 z-[71] flex w-full flex-col rounded-l-[var(--radius-panel)]',
                  width,
                )}
              >
                <header className="border-line flex items-start justify-between gap-3 border-b px-6 pt-5 pb-4">
                  <div className="min-w-0">
                    <RD.Title className="font-display truncate text-lg font-bold">{title}</RD.Title>
                    <RD.Description className={cn('text-ink-muted mt-1 text-xs', !description && 'sr-only')}>
                      {description ?? 'Details panel'}
                    </RD.Description>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {actions}
                    <RD.Close asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="Close panel">
                        <X className="size-4" />
                      </Button>
                    </RD.Close>
                  </div>
                </header>
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
              </motion.aside>
            </RD.Content>
          </RD.Portal>
        ) : null}
      </AnimatePresence>
    </RD.Root>
  )
}
