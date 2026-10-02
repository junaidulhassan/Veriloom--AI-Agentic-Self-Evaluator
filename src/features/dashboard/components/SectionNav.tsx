import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { snappy } from '@/lib/motion'
import { dashboardSections } from '../sections'

function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const visible = new Map<string, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = (entry.target as HTMLElement).dataset.section ?? ''
          if (entry.isIntersecting) visible.set(id, entry.boundingClientRect.top)
          else visible.delete(id)
        })
        const first = ids.find((id) => visible.has(id))
        if (first) setActive(first)
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
    )
    const nodes = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[]
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [ids])
  return [active, setActive] as const
}

const ids = dashboardSections.map((section) => section.id)

export function jumpTo(id: string) {
  const node = document.getElementById(id)
  if (!node) return
  node.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  })
  history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${id}`)
}

export function SectionNav() {
  const [active, setActive] = useScrollSpy(ids)
  return (
    <nav
      aria-label="Dashboard sections"
      className="sticky top-[84px] hidden max-h-[calc(100dvh-100px)] w-56 shrink-0 self-start overflow-y-auto lg:block"
    >
      <div className="glass rounded-[var(--radius-panel)] p-2">
        <ul className="space-y-0.5">
          {dashboardSections.map((section) => {
            const Icon = section.icon
            const isActive = active === section.id
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  onClick={(event) => {
                    event.preventDefault()
                    setActive(section.id)
                    jumpTo(section.id)
                  }}
                  aria-current={isActive ? 'location' : undefined}
                  className={cn(
                    'relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors',
                    isActive ? 'text-btn-ink' : 'text-ink-soft hover:text-ink',
                  )}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="section-indicator"
                      transition={snappy}
                      className="bg-btn absolute inset-0 rounded-xl"
                    />
                  ) : null}
                  <span className="relative font-mono text-[10.5px] opacity-60">{section.letter}</span>
                  <Icon className="relative size-4" aria-hidden />
                  <span className="relative truncate">{section.label}</span>
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

export function MobileSectionNav() {
  const [active, setActive] = useScrollSpy(ids)
  return (
    <nav
      aria-label="Dashboard sections"
      className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:hidden"
    >
      {dashboardSections.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => {
            setActive(section.id)
            jumpTo(section.id)
          }}
          className={cn(
            'h-8 shrink-0 rounded-full px-3 text-xs font-bold transition-colors',
            active === section.id ? 'bg-btn text-btn-ink' : 'glass text-ink-soft',
          )}
        >
          {section.letter} · {section.label}
        </button>
      ))}
    </nav>
  )
}
