import { forwardRef, type ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { snappy } from '@/lib/motion'

const buttonVariants = cva(
  'relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[background-color,box-shadow,color,border-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-700 focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-coral-400 dark:focus-visible:ring-offset-charcoal-900',
  {
    variants: {
      variant: {
        primary: 'shine bg-btn text-btn-ink shadow-[0_8px_20px_-10px_rgb(28_28_31/0.6)] hover:bg-btn-hover',
        secondary:
          'border-[1.5px] border-charcoal-900 bg-transparent text-charcoal-900 hover:bg-charcoal-900/[0.06] dark:border-coral-400 dark:text-coral-300 dark:hover:bg-coral-400/10',
        ghost: 'bg-transparent text-ink hover:bg-charcoal-900/[0.07] dark:hover:bg-cream/[0.08]',
        danger:
          'bg-charcoal-900 text-cream ring-1 ring-inset ring-error/50 hover:bg-charcoal-800 dark:bg-charcoal-700 dark:hover:bg-charcoal-600',
        soft: 'bg-charcoal-900/[0.08] text-ink hover:bg-charcoal-900/[0.14] dark:bg-cream/[0.08] dark:hover:bg-cream/[0.14]',
      },
      size: {
        xs: 'h-7 rounded-full px-2.5 text-xs',
        sm: 'h-8 rounded-full px-3.5 text-[13px]',
        md: 'h-10 rounded-full px-5 text-sm',
        lg: 'h-12 rounded-full px-6 text-[15px]',
        icon: 'size-9 rounded-full',
        'icon-sm': 'size-8 rounded-full',
        'icon-xs': 'size-7 rounded-full',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'>, VariantProps<typeof buttonVariants> {
  loading?: boolean
  children?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, loading, disabled, children, type = 'button', ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={snappy}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      <span className="relative z-[2] inline-flex items-center gap-2">{children}</span>
    </motion.button>
  )
})

export { buttonVariants }
