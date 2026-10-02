import { Component, type ErrorInfo, type ReactNode } from 'react'
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { RotateCw, TriangleAlert } from 'lucide-react'
import { Button } from './Button'

interface Props {
  children: ReactNode
  label?: string
  onReset?: () => void
}

interface State {
  error: Error | null
}

class Boundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  reset = () => {
    this.props.onReset?.()
    this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div
        role="alert"
        className="glass flex flex-col items-center gap-3 rounded-[var(--radius-card)] px-6 py-10 text-center"
      >
        <span className="bg-error/10 text-error grid size-12 place-items-center rounded-2xl">
          <TriangleAlert className="size-5" aria-hidden />
        </span>
        <div>
          <p className="font-display font-bold">{this.props.label ?? 'This section'} failed to render</p>
          <p className="text-ink-muted mx-auto mt-1 max-w-md text-xs">{this.state.error.message}</p>
        </div>
        <Button size="sm" onClick={this.reset}>
          <RotateCw className="size-3.5" />
          Retry
        </Button>
      </div>
    )
  }
}

export function ErrorBoundary({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <Boundary label={label} onReset={reset}>
          {children}
        </Boundary>
      )}
    </QueryErrorResetBoundary>
  )
}
