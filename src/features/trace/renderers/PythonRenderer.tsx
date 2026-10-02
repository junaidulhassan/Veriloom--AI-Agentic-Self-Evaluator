import { memo, useMemo } from 'react'
import { CheckCircle2, Clock, TimerOff, XCircle } from 'lucide-react'
import { CodeBlock } from '@/components/ui/CodeBlock'
import { formatDuration } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { CodeExecutionOut } from '@/types/api'
import type { TraceStep } from '../types'
import { parsePythonOutput } from '../parsers'

export function TerminalPanel({
  code,
  stdout,
  stderr,
  status,
  exitCode,
  durationMs,
  exception,
  timedOut,
}: {
  code?: string
  stdout: string
  stderr: string
  status: string | null
  exitCode: number | null
  durationMs: number | null
  exception?: string | null
  timedOut?: boolean
}) {
  const ok = status === 'success' && (exitCode == null || exitCode === 0)
  return (
    <div className="space-y-2">
      {code ? <CodeBlock code={code} language="python" title="python" maxHeight={260} /> : null}
      <div className="bg-terminal text-terminal-ink overflow-hidden rounded-2xl font-mono text-[12px] ring-1 ring-black/20">
        <div className="flex flex-wrap items-center gap-3 border-b border-white/10 px-3 py-2 text-[11px]">
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 font-semibold',
              ok ? 'text-[#5fd3a0]' : 'text-[#ff8a80]',
            )}
          >
            {timedOut ? (
              <TimerOff className="size-3.5" aria-hidden />
            ) : ok ? (
              <CheckCircle2 className="size-3.5" aria-hidden />
            ) : (
              <XCircle className="size-3.5" aria-hidden />
            )}
            {timedOut ? 'timed out' : (status ?? 'unknown')}
          </span>
          <span className="text-terminal-ink/60">exit {exitCode ?? '-'}</span>
          <span className="text-terminal-ink/60 ml-auto inline-flex items-center gap-1">
            <Clock className="size-3" aria-hidden />
            {formatDuration(durationMs)}
          </span>
        </div>
        <div className="max-h-64 overflow-auto px-3 py-2.5 leading-relaxed">
          <div className="text-terminal-ink/40 mb-1 text-[10px] tracking-widest uppercase">stdout</div>
          <pre className="break-words whitespace-pre-wrap">
            {stdout || <span className="text-terminal-ink/40">(empty)</span>}
          </pre>
          {stderr || exception ? (
            <>
              <div className="mt-3 mb-1 text-[10px] tracking-widest text-[#ff8a80]/70 uppercase">stderr</div>
              <pre className="break-words whitespace-pre-wrap text-[#ffb3ad]">{stderr || exception}</pre>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function codeExecutionProps(execution: CodeExecutionOut) {
  return {
    code: execution.code,
    stdout: execution.stdout,
    stderr: execution.stderr,
    status: execution.status,
    exitCode: execution.exit_code,
    durationMs: execution.duration_ms,
    exception: execution.exception_type
      ? `${execution.exception_type}: ${execution.exception_message ?? ''}`
      : null,
    timedOut: execution.timed_out,
  }
}

export const PythonRenderer = memo(function PythonRenderer({ step }: { step: TraceStep }) {
  const parsed = useMemo(
    () => parsePythonOutput(step.output ?? '', step.metadata),
    [step.output, step.metadata],
  )
  if (step.codeExecution) return <TerminalPanel {...codeExecutionProps(step.codeExecution)} />
  return (
    <TerminalPanel
      code={typeof step.args?.code === 'string' ? step.args.code : undefined}
      stdout={parsed.stdout}
      stderr={parsed.stderr || (step.error ?? '')}
      status={step.error && !parsed.status ? 'error' : parsed.status}
      exitCode={parsed.exitCode}
      durationMs={parsed.durationMs ?? step.durationMs ?? null}
      exception={parsed.exception}
      timedOut={parsed.timedOut}
    />
  )
})
