import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const blobs = [
  {
    className: 'left-[-10%] top-[-12%] size-[46vw] bg-[var(--blob-a)]',
    x: [0, 60, -20, 0],
    y: [0, 40, 80, 0],
    duration: 28,
  },
  {
    className: 'right-[-14%] top-[18%] size-[40vw] bg-[var(--blob-b)]',
    x: [0, -50, 30, 0],
    y: [0, 60, -30, 0],
    duration: 34,
  },
  {
    className: 'bottom-[-18%] left-[22%] size-[38vw] bg-[var(--blob-c)]',
    x: [0, 40, -40, 0],
    y: [0, -50, 10, 0],
    duration: 30,
  },
]

export function Background() {
  const reduced = useReducedMotion()
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: 'var(--page-gradient)' }}
    >
      {blobs.map((blob, index) => (
        <motion.div
          key={index}
          className={`absolute rounded-full blur-[90px] ${blob.className}`}
          animate={reduced ? undefined : { x: blob.x, y: blob.y }}
          transition={{ duration: blob.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      <div className="grain absolute inset-0 mix-blend-overlay" style={{ opacity: 'var(--grain-opacity)' }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_40%,rgb(28_28_31/0.12)_100%)]" />
    </div>
  )
}
