import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router'
import { motion } from 'framer-motion'
import { Home, RotateCw, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LogoMark } from '@/components/ui/Logo'

export function RouteError() {
  const error = useRouteError()
  const navigate = useNavigate()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Something went wrong while rendering this page.'
  const chunkError = /dynamically imported module|Loading chunk|Failed to fetch/i.test(message)
  return (
    <div className="grid min-h-[70vh] place-items-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong w-full max-w-lg rounded-[var(--radius-panel)] p-8 text-center"
      >
        <div className="mx-auto mb-4 flex w-fit items-center gap-3">
          <LogoMark size={40} animate={false} />
          <span className="bg-error/10 text-error grid size-10 place-items-center rounded-2xl">
            <TriangleAlert className="size-5" aria-hidden />
          </span>
        </div>
        <h1 className="font-display text-2xl font-bold">This view hit a snag</h1>
        <p className="text-ink-muted mt-2 text-sm">
          {chunkError
            ? 'A new version of Veriloom may have been deployed. Reload to fetch the latest files.'
            : message}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={() => window.location.reload()}>
            <RotateCw className="size-4" aria-hidden />
            Retry
          </Button>
          <Button variant="secondary" onClick={() => navigate('/veriloom/chat/ai-assistant')}>
            <Home className="size-4" aria-hidden />
            Assistant
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
