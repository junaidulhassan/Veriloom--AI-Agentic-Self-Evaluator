import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { stagger } from '@/lib/motion'
import { dashboardSections } from '../sections'

export function Section({
  id,
  description,
  actions,
  children,
}: {
  id: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}) {
  const def = dashboardSections.find((section) => section.id === id)
  const Icon = def?.icon
  return (
    <section id={id} data-section={id} aria-labelledby={`${id}-title`} className="scroll-mt-40">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="bg-charcoal-900 text-cream dark:bg-coral-500 dark:text-charcoal-900 grid size-11 place-items-center rounded-2xl shadow-[0_10px_24px_-12px_rgb(28_28_31/0.8)]">
            {Icon ? <Icon className="size-5" aria-hidden /> : null}
          </span>
          <div>
            <div className="text-on-page/70 text-xs font-semibold">Section {def?.letter}</div>
            <h2 id={`${id}-title`} className="font-display text-on-page text-[26px] leading-[1.15] font-bold">
              {def?.label}
            </h2>
            {description ? (
              <p className="text-on-page/75 mt-0.5 max-w-2xl text-[13px] font-medium">{description}</p>
            ) : null}
          </div>
        </div>
        {actions}
      </div>
      <motion.div
        variants={stagger(0.06)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        className="space-y-4"
      >
        {children}
      </motion.div>
    </section>
  )
}
