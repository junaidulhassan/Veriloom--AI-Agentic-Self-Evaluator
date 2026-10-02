import { Skeleton } from '@/components/ui/Skeleton'

export function ChatPageSkeleton() {
  return (
    <div className="flex h-[calc(100dvh-72px)] gap-4 px-4 pb-4" role="status" aria-label="Loading assistant">
      <Skeleton className="hidden w-72 shrink-0 rounded-[var(--radius-panel)] md:block" />
      <div className="flex flex-1 flex-col gap-4">
        <Skeleton className="h-14 rounded-[var(--radius-panel)]" />
        <div className="flex-1 space-y-4 p-4">
          <Skeleton className="ml-auto h-12 w-1/3 rounded-3xl" />
          <Skeleton className="h-40 w-3/4 rounded-3xl" />
          <Skeleton className="ml-auto h-12 w-1/4 rounded-3xl" />
        </div>
        <Skeleton className="h-28 rounded-[var(--radius-panel)]" />
      </div>
    </div>
  )
}

export function DashboardPageSkeleton() {
  return (
    <div
      className="mx-auto flex max-w-[1600px] gap-6 px-4 pb-10"
      role="status"
      aria-label="Loading dashboard"
    >
      <Skeleton className="hidden h-[70vh] w-52 shrink-0 rounded-[var(--radius-panel)] lg:block" />
      <div className="flex-1 space-y-4">
        <Skeleton className="h-16 rounded-[var(--radius-panel)]" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-[var(--radius-card)]" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-[var(--radius-card)]" />
      </div>
    </div>
  )
}
