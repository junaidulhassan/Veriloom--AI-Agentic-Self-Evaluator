import { lazy, Suspense, useEffect, type ComponentType } from 'react'
import { motion } from 'framer-motion'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { Skeleton } from '@/components/ui/Skeleton'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDateTime } from '@/lib/format'
import { fadeUp } from '@/lib/motion'
import { FilterBar } from './components/FilterBar'
import { MobileSectionNav, SectionNav, jumpTo } from './components/SectionNav'
import { useDashboardFilters } from './useDashboardFilters'
import { useOverview } from './hooks'
import { TraceViewerProvider } from './history/TraceViewerContext'
import { dashboardSections } from './sections'

const modules: Record<string, ComponentType> = {
  overview: lazy(() => import('./sections/OverviewSection')),
  quality: lazy(() => import('./sections/QualitySection')),
  performance: lazy(() => import('./sections/PerformanceSection')),
  tools: lazy(() => import('./sections/ToolsSection')),
  tokens: lazy(() => import('./sections/TokensSection')),
  latency: lazy(() => import('./sections/LatencySection')),
  errors: lazy(() => import('./sections/ErrorsSection')),
  rag: lazy(() => import('./sections/RagSection')),
  explorer: lazy(() => import('./sections/ExplorerSection')),
  history: lazy(() => import('./sections/HistorySection')),
  admin: lazy(() => import('./sections/AdminSection')),
}

function SectionFallback({ id }: { id: string }) {
  return (
    <div
      id={id}
      data-section={id}
      className="scroll-mt-40 space-y-4"
      role="status"
      aria-label="Loading section"
    >
      <Skeleton className="h-12 w-72 rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton className="h-64 rounded-[var(--radius-card)]" />
        <Skeleton className="h-64 rounded-[var(--radius-card)]" />
      </div>
    </div>
  )
}

function Header() {
  const { data } = useOverview()
  const { filters } = useDashboardFilters()
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="flex flex-wrap items-end justify-between gap-3 px-1"
    >
      <div>
        <div className="text-on-page/70 font-mono text-xs font-semibold">Veriloom · Agent evaluation</div>
        <h1 className="font-display text-on-page text-[clamp(30px,4.4vw,52px)] leading-[1.15] font-bold">
          Evaluation dashboard
        </h1>
      </div>
      <p className="text-on-page/75 text-xs font-medium">
        {filters.range === 'all'
          ? 'All time'
          : filters.range === 'custom'
            ? 'Custom range'
            : `Last ${filters.range}`}
        {data ? ` · updated ${formatDateTime(data.generated_at, 'HH:mm:ss')}` : ''}
      </p>
    </motion.div>
  )
}

export default function DashboardPage() {
  useDocumentTitle('Evaluation Dashboard')
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (!id) return
    let userScrolled = false
    const stop = () => {
      userScrolled = true
    }
    window.addEventListener('wheel', stop, { passive: true })
    window.addEventListener('touchmove', stop, { passive: true })
    const timers = [150, 600, 1200, 2000, 3000, 4200].map((ms) =>
      setTimeout(() => !userScrolled && jumpTo(id), ms),
    )
    return () => {
      timers.forEach(clearTimeout)
      window.removeEventListener('wheel', stop)
      window.removeEventListener('touchmove', stop)
    }
  }, [])
  return (
    <TraceViewerProvider>
      <div className="mx-auto flex w-full max-w-[1680px] gap-6 px-3 pb-16 sm:px-4">
        <SectionNav />
        <div className="min-w-0 flex-1 space-y-5">
          <Header />
          <MobileSectionNav />
          <FilterBar />
          <div className="space-y-14 pt-2">
            {dashboardSections.map((section) => {
              const Module = modules[section.id]
              return (
                <ErrorBoundary key={section.id} label={section.label}>
                  <Suspense fallback={<SectionFallback id={section.id} />}>
                    <Module />
                  </Suspense>
                </ErrorBoundary>
              )
            })}
          </div>
        </div>
      </div>
    </TraceViewerProvider>
  )
}
