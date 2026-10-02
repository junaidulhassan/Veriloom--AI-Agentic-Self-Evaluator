import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('skeleton rounded-xl', className)} />
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className={cn('h-3', index === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  )
}

const bars = [42, 58, 50, 71, 64, 80, 62, 88, 74, 66, 92, 70, 84, 60]

export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="flex items-end gap-2 px-1" style={{ height }} role="status" aria-label="Loading chart">
      {bars.map((value, index) => (
        <div key={index} className="skeleton flex-1 rounded-md" style={{ height: `${value}%` }} />
      ))}
    </div>
  )
}
