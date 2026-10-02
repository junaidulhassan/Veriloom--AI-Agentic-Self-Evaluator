import { useState, type ReactNode } from 'react'
import { Dialog as RD } from 'radix-ui'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { scaleFade } from '@/lib/motion'
import { Button } from './Button'
import { Input } from './Input'

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  size = 'md',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const width = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size]
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <RD.Portal forceMount>
            <RD.Overlay asChild forceMount>
              <motion.div
                className="bg-charcoal-900/40 fixed inset-0 z-[80] backdrop-blur-[3px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </RD.Overlay>
            <div className="fixed inset-0 z-[81] grid place-items-center overflow-y-auto p-4">
              <RD.Content asChild forceMount>
                <motion.div
                  variants={scaleFade}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className={cn(
                    'glass-strong text-ink relative w-full rounded-[var(--radius-panel)] p-6',
                    width,
                    className,
                  )}
                >
                  <div className="mb-4 pr-8">
                    <RD.Title className="font-display text-lg font-bold">{title}</RD.Title>
                    {description ? (
                      <RD.Description className="text-ink-muted mt-1 text-sm">{description}</RD.Description>
                    ) : (
                      <RD.Description className="sr-only">
                        {typeof title === 'string' ? title : 'Dialog'}
                      </RD.Description>
                    )}
                  </div>
                  {children}
                  {footer ? <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div> : null}
                  <RD.Close asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="absolute top-4 right-4"
                      aria-label="Close dialog"
                    >
                      <X className="size-4" />
                    </Button>
                  </RD.Close>
                </motion.div>
              </RD.Content>
            </div>
          </RD.Portal>
        ) : null}
      </AnimatePresence>
    </RD.Root>
  )
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmWord,
  onConfirm,
  loading,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  confirmLabel?: string
  confirmWord?: string
  onConfirm: () => void | Promise<void>
  loading?: boolean
  children?: ReactNode
}) {
  const [typed, setTyped] = useState('')
  const blocked = Boolean(confirmWord) && typed.trim() !== confirmWord
  const close = (next: boolean) => {
    if (!next) setTyped('')
    onOpenChange(next)
  }
  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={loading}
            disabled={blocked}
            onClick={async () => {
              await onConfirm()
              setTyped('')
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="border-error/25 bg-error/[0.06] dark:bg-error/20 flex gap-3 rounded-2xl border p-3.5 text-sm">
        <AlertTriangle className="text-error mt-0.5 size-4 shrink-0 dark:text-[#ffb3ad]" aria-hidden />
        <div className="text-ink-soft">{description}</div>
      </div>
      {children}
      {confirmWord ? (
        <label className="mt-4 block text-sm">
          <span className="text-ink-muted">
            Type{' '}
            <code className="bg-charcoal-900 text-cream rounded px-1.5 py-0.5 font-mono text-xs">
              {confirmWord}
            </code>{' '}
            to confirm
          </span>
          <Input
            className="mt-2"
            value={typed}
            autoFocus
            onChange={(event) => setTyped(event.target.value)}
            aria-label={`Type ${confirmWord} to confirm`}
          />
        </label>
      ) : null}
    </Dialog>
  )
}
