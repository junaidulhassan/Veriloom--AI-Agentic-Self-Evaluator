import { lazy, Suspense, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'framer-motion'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/Tooltip'
import { env } from '@/lib/env'
import { useSettingsStore } from '@/store/settings'
import { queryClient } from './queryClient'

const Devtools = lazy(() =>
  import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools })),
)

export function Providers({ children }: { children: ReactNode }) {
  const theme = useSettingsStore((s) => s.theme)
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <TooltipProvider delayDuration={250}>
          {children}
          <Toaster
            position="bottom-right"
            theme={theme === 'charcoal' ? 'dark' : 'light'}
            toastOptions={{
              classNames: {
                toast:
                  '!glass-strong !rounded-2xl !border-[var(--glass-border)] !bg-[var(--surface-strong)] !text-[var(--ink)] !font-sans',
                description: '!text-[var(--ink-muted)]',
                actionButton: '!bg-[var(--btn)] !text-[var(--btn-ink)] !rounded-full',
              },
            }}
          />
        </TooltipProvider>
      </MotionConfig>
      {env.queryDevtools ? (
        <Suspense fallback={null}>
          <Devtools buttonPosition="bottom-left" />
        </Suspense>
      ) : null}
    </QueryClientProvider>
  )
}
