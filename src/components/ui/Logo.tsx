import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function LogoMark({
  size = 36,
  animate = true,
  className,
}: {
  size?: number
  animate?: boolean
  className?: string
}) {
  const reduced = useReducedMotion()
  const draw = animate && !reduced
  const ease = [0.65, 0, 0.35, 1] as const
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Veriloom logo"
      className={cn('shrink-0', className)}
      initial={draw ? { rotate: -8, scale: 0.85, opacity: 0 } : false}
      animate={{ rotate: 0, scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
    >
      <rect width="64" height="64" rx="18" fill="var(--coral-500)" />
      <rect
        x="0.75"
        y="0.75"
        width="62.5"
        height="62.5"
        rx="17.25"
        fill="none"
        stroke="rgb(28 28 31 / 0.12)"
        strokeWidth="1.5"
      />
      <motion.path
        d="M13 17c6 0 9 4 12 11l7 19 7-19c3-7 6-11 12-11"
        fill="none"
        stroke="var(--charcoal-900)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={draw ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease, delay: 0.15 }}
      />
      <motion.path
        d="M20 15c4 9 6 17 12 32M44 15c-4 9-6 17-12 32"
        fill="none"
        stroke="var(--charcoal-900)"
        strokeOpacity="0.5"
        strokeWidth="2.4"
        strokeLinecap="round"
        initial={draw ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease, delay: 0.45 }}
      />
      <motion.path
        d="M18 27c9 3 19 3 28 0"
        fill="none"
        stroke="var(--charcoal-900)"
        strokeOpacity="0.35"
        strokeWidth="2"
        strokeLinecap="round"
        initial={draw ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease, delay: 0.75 }}
      />
      <motion.circle
        cx="32"
        cy="47"
        r="3.6"
        fill="var(--cream)"
        initial={draw ? { scale: 0 } : false}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 14, delay: 1.1 }}
      />
    </motion.svg>
  )
}

export function Wordmark({ className, animate = true }: { className?: string; animate?: boolean }) {
  const reduced = useReducedMotion()
  const letters = 'Veriloom'.split('')
  return (
    <span
      className={cn('font-brand inline-flex font-bold tracking-[-0.01em] whitespace-nowrap', className)}
      aria-label="Veriloom"
    >
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          aria-hidden
          initial={animate && !reduced ? { y: '0.5em', opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.25 + index * 0.04 }}
          className="inline-block"
        >
          {letter}
        </motion.span>
      ))}
    </span>
  )
}

export function Logo({ compact, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={compact ? 30 : 36} />
      {compact ? null : <Wordmark className="text-[22px] leading-none" />}
    </span>
  )
}
