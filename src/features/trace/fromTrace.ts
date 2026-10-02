import type { EvaluationSummary, ExecutionTrace, JsonRecord, StreamEvent } from '@/types/api'
import { parseApiDate } from '@/lib/format'
import { initialTraceState, reduceTrace } from './reducer'
import type { TraceState } from './types'

const num = (value: unknown, fallback = 0) => (typeof value === 'number' ? value : fallback)

export function traceToState(trace: ExecutionTrace, maxAttempts = 3): TraceState {
  const request = trace.request
  const startedAt = parseApiDate(request.created_at)?.getTime() ?? Date.now()
  let state = initialTraceState(Math.max(maxAttempts, request.attempts), startedAt)
  state = reduceTrace(
    state,
    {
      type: 'start',
      request_id: request.id,
      conversation_id: request.conversation_id ?? '',
    },
    startedAt,
  )
  for (const event of trace.timeline) {
    const at = parseApiDate(event.created_at)?.getTime() ?? startedAt
    const payload = event.payload as JsonRecord
    let mapped: StreamEvent | null = null
    if (event.event_type === 'llm_call') {
      const calls =
        (payload.tool_calls as { id: string | null; name: string; args: JsonRecord }[] | undefined) ?? []
      mapped = {
        type: 'agent_step',
        attempt: event.attempt,
        iteration: num(payload.iteration, 1),
        content: String(payload.content ?? ''),
        tool_calls: calls,
      }
      const duration = num(payload.duration_ms)
      state = reduceTrace(state, mapped, at)
      const thinkingIndex = state.steps.findLastIndex(
        (step) => step.kind === 'thinking' && step.status === 'success',
      )
      if (thinkingIndex >= 0) {
        const usage = payload.usage as { total?: number } | undefined
        state.steps[thinkingIndex] = {
          ...state.steps[thinkingIndex],
          durationMs: duration,
          tokens: usage?.total,
        }
      }
      continue
    }
    if (event.event_type === 'tool_result') {
      mapped = {
        type: 'tool_result',
        id: (payload.record_id as string) ?? null,
        tool_call_id: String(payload.tool_call_id ?? ''),
        tool_name: String(payload.tool_name ?? 'tool'),
        arguments: (payload.arguments as JsonRecord) ?? {},
        status: String(payload.status ?? 'success'),
        attempt: event.attempt,
        duration_ms: num(payload.duration_ms),
        output_preview: String(payload.output ?? ''),
        error: (payload.error as string) ?? null,
      }
    } else if (event.event_type === 'evaluation') {
      mapped = { type: 'evaluation', ...(payload as unknown as EvaluationSummary), attempt: event.attempt }
    } else if (event.event_type === 'retry') {
      mapped = { type: 'retry', attempt: num(payload.next_attempt, event.attempt + 1) }
    } else if (event.event_type === 'error') {
      mapped = {
        type: 'error',
        request_id: request.id,
        error: {
          code: String(payload.code ?? 'error'),
          message: String(payload.message ?? 'Request failed'),
        },
      }
    }
    if (mapped) state = reduceTrace(state, mapped, at)
  }

  const executions = new Map(trace.tool_executions.map((item) => [item.id, item]))
  const byCallId = new Map(
    trace.tool_executions
      .filter((item) => item.tool_call_id)
      .map((item) => [item.tool_call_id as string, item]),
  )
  const codeById = new Map(trace.code_executions.map((item) => [item.id, item]))
  const usedExecutions = new Set<string>()
  state.steps = state.steps.map((step) => {
    if (step.kind !== 'tool') return step
    const execution =
      (step.toolCallId && byCallId.get(step.toolCallId)) ||
      [...executions.values()].find(
        (item) => item.tool_name === step.toolName && !usedExecutions.has(item.id),
      )
    if (!execution) return step
    usedExecutions.add(execution.id)
    const executionId = execution.output_metadata?.execution_id as string | undefined
    return {
      ...step,
      output: execution.output ?? step.output,
      metadata: execution.output_metadata,
      error: execution.error_message ?? step.error,
      errorType: execution.error_type ?? step.errorType,
      durationMs: execution.duration_ms,
      codeExecution: executionId ? codeById.get(executionId) : undefined,
      assessment: {
        selectionCorrect: execution.selection_correct,
        outputReliable: execution.output_reliable,
        causedFalseInformation: execution.caused_false_information,
        note: execution.assessment_note,
      },
    }
  })

  const endedAt = parseApiDate(request.completed_at)?.getTime() ?? startedAt + num(request.latency_ms)
  const failed = request.status === 'failed'
  state.steps = state.steps.map((step) =>
    step.status === 'running'
      ? {
          ...step,
          status:
            step.kind === 'evaluation' && !trace.evaluations.length
              ? 'skipped'
              : failed
                ? 'failed'
                : 'success',
          durationMs: step.durationMs ?? Math.max(0, endedAt - step.startedAt),
        }
      : step,
  )
  if (request.status !== 'running') {
    state.steps.push({
      id: `final-${request.id}`,
      kind: 'final',
      status: failed ? 'failed' : 'success',
      attempt: request.attempts,
      startedAt: endedAt,
      durationMs: request.latency_ms ?? undefined,
      title: failed
        ? 'Finished with an error'
        : request.status === 'cancelled'
          ? 'Cancelled'
          : 'Final answer ready',
      tokens: request.total_tokens,
      content: request.final_answer ?? undefined,
      error: request.error_message,
    })
  }
  return { ...state, status: request.status === 'running' ? 'running' : failed ? 'failed' : 'done', endedAt }
}
