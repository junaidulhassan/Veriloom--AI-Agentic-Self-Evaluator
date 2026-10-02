import { lazy, Suspense, type ComponentProps } from 'react'
import { ChartSkeleton } from '@/components/ui/Skeleton'

const EChart = lazy(() => import('./EChart'))

export function LazyEChart(props: ComponentProps<typeof EChart>) {
  return (
    <Suspense fallback={<ChartSkeleton height={props.height ?? 280} />}>
      <EChart {...props} />
    </Suspense>
  )
}

export type { ThemedOption } from './EChart'
