import type { Transition, Variants } from 'framer-motion'

export const spring: Transition = { type: 'spring', stiffness: 260, damping: 24 }
export const softSpring: Transition = { type: 'spring', stiffness: 200, damping: 26 }
export const snappy: Transition = { type: 'spring', stiffness: 420, damping: 30 }

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: spring },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

export const scaleFade: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: snappy },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.12 } },
}

export const stagger = (step = 0.06, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: step, delayChildren: delay } },
})

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { ...spring, opacity: { duration: 0.3 } } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
}
