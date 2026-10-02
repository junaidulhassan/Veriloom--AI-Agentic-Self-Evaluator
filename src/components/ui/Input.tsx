import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const field =
  'w-full rounded-2xl border border-line bg-surface-strong text-sm text-ink placeholder:text-ink-muted/80 transition-[border-color,box-shadow] focus:border-charcoal-900/40 focus:outline-none focus:ring-2 focus:ring-charcoal-900/15 disabled:opacity-60 dark:focus:border-coral-400/60 dark:focus:ring-coral-400/20'

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode }
>(function Input({ className, icon, ...props }, ref) {
  if (!icon) return <input ref={ref} className={cn(field, 'h-10 px-3.5', className)} {...props} />
  return (
    <div className={cn('relative', className)}>
      <span className="text-ink-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
        {icon}
      </span>
      <input ref={ref} className={cn(field, 'h-10 pr-3.5 pl-9')} {...props} />
    </div>
  )
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(field, 'min-h-24 px-3.5 py-2.5', className)} {...props} />
  },
)

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search',
  className,
  pending,
  label,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  pending?: boolean
  label?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <Search
        className={cn(
          'text-ink-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2',
          pending && 'animate-pulse',
        )}
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        className={cn(field, 'h-9 pr-8 pl-9 [&::-webkit-search-cancel-button]:hidden')}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="text-ink-muted hover:bg-charcoal-900/10 hover:text-ink absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-full"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  )
}
