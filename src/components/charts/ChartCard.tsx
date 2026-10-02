import { memo, useRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Download, ImageDown } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { fadeUp } from '@/lib/motion'
import { downloadCsv, downloadElementPng } from '@/lib/download'
import { useInView } from '@/hooks/useInView'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { InfoTip } from '@/components/ui/InfoTip'
import { ChartSkeleton } from '@/components/ui/Skeleton'
import { Tooltip } from '@/components/ui/Tooltip'

export interface ChartCardProps {
  title: string
  info?: string
  subtitle?: ReactNode
  loading?: boolean
  error?: unknown
  onRetry?: () => void
  empty?: boolean
  emptyTitle?: string
  emptyDescription?: string
  csv?: () => Record<string, unknown>[]
  png?: boolean
  actions?: ReactNode
  height?: number
  className?: string
  bodyClassName?: string
  children: ReactNode | ((visible: boolean) => ReactNode)
}

export const ChartCard = memo(function ChartCard({
  title,
  info,
  subtitle,
  loading,
  error,
  onRetry,
  empty,
  emptyTitle = 'No data for this period',
  emptyDescription = 'Ask the assistant a few questions or widen the date range to populate this chart.',
  csv,
  png = true,
  actions,
  height = 260,
  className,
  bodyClassName,
  children,
}: ChartCardProps) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const { ref, inView } = useInView<HTMLDivElement>()
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const ready = !loading && !error && !empty
  return (
    <motion.section
      ref={ref}
      variants={fadeUp}
      aria-label={title}
      className={cn('glass flex min-w-0 flex-col rounded-[var(--radius-card)] p-4 sm:p-5', className)}
    >
      <header className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <h3 className="font-display truncate text-[15px] font-bold">{title}</h3>
            {info ? <InfoTip content={info} label={`About ${title}`} /> : null}
          </div>
          {subtitle ? <p className="text-ink-muted mt-0.5 text-xs">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {actions}
          {csv ? (
            <Tooltip content="Download CSV">
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Download ${title} as CSV`}
                disabled={!ready}
                onClick={() => {
                  const rows = csv()
                  if (!rows.length) {
                    toast.message('Nothing to export yet')
                    return
                  }
                  downloadCsv(rows, slug)
                }}
              >
                <Download className="size-3.5" />
              </Button>
            </Tooltip>
          ) : null}
          {png ? (
            <Tooltip content="Download PNG">
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Download ${title} as PNG`}
                disabled={!ready}
                onClick={() =>
                  bodyRef.current &&
                  downloadElementPng(bodyRef.current, slug).catch(() => toast.error('PNG export failed'))
                }
              >
                <ImageDown className="size-3.5" />
              </Button>
            </Tooltip>
          ) : null}
        </div>
      </header>
      <div
        ref={bodyRef}
        className={cn('relative min-h-0 flex-1', bodyClassName)}
        style={{ minHeight: height }}
      >
        {loading ? <ChartSkeleton height={height} /> : null}
        {!loading && error ? <ErrorState error={error} onRetry={onRetry} compact /> : null}
        {!loading && !error && empty ? (
          <EmptyState
            compact
            icon={<BarChart3 className="size-5" aria-hidden />}
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : null}
        {ready ? (
          typeof children === 'function' ? (
            children(inView)
          ) : inView ? (
            children
          ) : (
            <div style={{ height }} />
          )
        ) : null}
      </div>
    </motion.section>
  )
})
