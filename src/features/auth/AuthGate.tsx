import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { Loader2, RotateCw, ServerCrash } from 'lucide-react'
import { describeError } from '@/api/errors'
import { Button } from '@/components/ui/Button'
import { LogoMark } from '@/components/ui/Logo'
import { Background } from '@/app/layouts/Background'
import { useCurrentUser, useSessionWatcher } from './useAuth'

const HOME = '/veriloom/chat/ai-assistant'

function FullScreen({ children }: { children: ReactNode }) {
  return (
    <div className="text-on-page relative grid min-h-dvh place-items-center p-6">
      <Background />
      {children}
    </div>
  )
}

function Checking() {
  return (
    <FullScreen>
      <div className="flex flex-col items-center gap-3" role="status" aria-label="Checking your session">
        <LogoMark size={44} />
        <Loader2 className="text-ink-muted size-5 animate-spin" aria-hidden />
      </div>
    </FullScreen>
  )
}

function Unreachable({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <FullScreen>
      <div className="glass-strong w-full max-w-md rounded-[var(--radius-panel)] p-8 text-center">
        <span className="bg-error/10 text-error mx-auto mb-4 grid size-11 place-items-center rounded-2xl">
          <ServerCrash className="size-5" aria-hidden />
        </span>
        <h1 className="font-display text-xl font-bold">Can't reach Veriloom</h1>
        <p className="text-ink-muted mt-2 text-sm">{describeError(error)}</p>
        <Button className="mt-5" onClick={onRetry}>
          <RotateCw className="size-4" aria-hidden />
          Try again
        </Button>
      </div>
    </FullScreen>
  )
}

export function RequireAuth({ children }: { children: ReactNode }) {
  useSessionWatcher()
  const location = useLocation()
  const { data: user, isPending, error, refetch } = useCurrentUser()
  if (isPending) return <Checking />
  if (error && user === undefined) return <Unreachable error={error} onRetry={() => refetch()} />
  if (!user)
    return <Navigate to="/veriloom/login" replace state={{ from: location.pathname + location.search }} />
  return <>{children}</>
}

export function PublicOnly({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { data: user, isPending } = useCurrentUser()
  if (isPending) return <Checking />
  if (user) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from && from.startsWith('/veriloom/') ? from : HOME} replace />
  }
  return <>{children}</>
}
