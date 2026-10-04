import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { Background } from '@/app/layouts/Background'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/ui/Logo'
import { fadeUp } from '@/lib/motion'
import { cn } from '@/lib/utils'

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="text-on-page relative grid min-h-dvh place-items-center px-4 py-10">
      <Background />
      <motion.main
        id="main"
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="glass-strong w-full max-w-md rounded-[var(--radius-panel)] p-6 sm:p-8"
      >
        <Logo className="mb-6" />
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        <p className="text-ink-muted mt-1 text-sm">{subtitle}</p>
        <div className="mt-6">{children}</div>
        <div className="text-ink-muted mt-6 text-center text-sm">{footer}</div>
      </motion.main>
    </div>
  )
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, hint, id, className, type, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false)
  const fieldId = id ?? props.name
  const password = type === 'password'
  return (
    <div className={className}>
      <label htmlFor={fieldId} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <div className="relative">
        <Input
          ref={ref}
          id={fieldId}
          type={password && visible ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          className={cn(password && 'pr-10', error && 'border-error/60')}
          {...props}
        />
        {password ? (
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="text-ink-muted hover:text-ink absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={`${fieldId}-error`} className="text-error mt-1 text-xs dark:text-[#ffb3ad]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="text-ink-muted mt-1 text-xs">
          {hint}
        </p>
      ) : null}
    </div>
  )
})

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="border-error/25 bg-error/[0.06] dark:bg-error/20 text-ink-soft rounded-2xl border px-3.5 py-2.5 text-sm"
    >
      {message}
    </div>
  )
}
