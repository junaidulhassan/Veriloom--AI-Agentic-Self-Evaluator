import type { StreamEvent } from '@/types/api'
import { getToolConfig } from '@/features/tools/registry'
import type { TraceState, TraceStep } from './types'

let counter = 0
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`

export function initialTraceState(maxAttempts = 3, now = Date.now()): TraceState {
  return { status: 'idle', steps: [], attempt: 1, maxAttempts, startedAt: now }
}

function thinking(attempt: number, now: number, followUp: boolean): TraceStep {
  return {
    id: uid('think'),
    kind: 'thinking',
    status: 'running',
    attempt,
    startedAt: now,
    title: followUp ? 'Reasoning over results' : 'Thinking',
  }
}

function finish(step: TraceStep, now: number, status: TraceStep['status']): TraceStep {
  return { ...step, status, durationMs: step.durationMs ?? Math.max(0, now - step.startedAt) }
}

function lastIndex(steps: TraceStep[], predicate: (step: TraceStep) => boolean) {
  for (let index = steps.length - 1; index >= 0; index -= 1) {
    if (predicate(steps[index])) return index
  }
  return -1
}

export function reduceTrace(state: TraceState, event: StreamEvent, now = Date.now()): TraceState {
  switch (event.type) {
    case 'start':
      return {
        ...state,
        status: 'running',
        startedAt: state.steps.length ? state.startedAt : now,
        requestId: event.request_id,
        conversationId: event.conversation_id,
        steps: state.steps.length ? state.steps : [thinking(1, now, false)],
      }
    case 'agent_step': {
      const steps = [...state.steps]
      const attempt = event.attempt ?? state.attempt
      const index = lastIndex(steps, (step) => step.kind === 'thinking' && step.status === 'running')
      const hasTools = event.tool_calls.length > 0
      const content = event.content?.trim() || undefined
      const title = hasTools
        ? `Selected ${event.tool_calls.length === 1 ? getToolConfig(event.tool_calls[0].name).label : `${event.tool_calls.length} tools`}`
        : 'Drafted answer'
      if (index >= 0) {
        steps[index] = { ...finish(steps[index], now, 'success'), title, content }
      } else {
        steps.push({ ...thinking(attempt, now, false), status: 'success', durationMs: 0, title, content })
      }
      if (hasTools) {
        event.tool_calls.forEach((call) => {
          steps.push({
            id: uid('tool'),
            kind: 'tool',
            status: 'running',
            attempt,
            startedAt: now,
            title: getToolConfig(call.name).label,
            toolName: call.name,
            toolCallId: call.id ?? undefined,
            args: call.args ?? {},
          })
        })
      } else {
        steps.push({
          id: uid('eval'),
          kind: 'evaluation',
          status: 'running',
          attempt,
          startedAt: now,
          title: 'Self-evaluation',
        })
      }
      return { ...state, status: 'running', attempt, steps }
    }
    case 'tool_result': {
      const steps = [...state.steps]
      let index = lastIndex(
        steps,
        (step) =>
          step.kind === 'tool' && Boolean(event.tool_call_id) && step.toolCallId === event.tool_call_id,
      )
      if (index < 0)
        index = lastIndex(
          steps,
          (step) => step.kind === 'tool' && step.status === 'running' && step.toolName === event.tool_name,
        )
      const patch: Partial<TraceStep> = {
        status: event.status === 'success' ? 'success' : 'failed',
        durationMs: event.duration_ms,
        output: event.output_preview,
        error: event.error ?? null,
        errorType: event.error_type ?? null,
        args: event.arguments,
      }
      if (index >= 0) steps[index] = { ...steps[index], ...patch }
      else
        steps.push({
          id: uid('tool'),
          kind: 'tool',
          attempt: event.attempt,
          startedAt: now - event.duration_ms,
          title: getToolConfig(event.tool_name).label,
          toolName: event.tool_name,
          toolCallId: event.tool_call_id,
          ...patch,
        } as TraceStep)
      const pending = steps.some((step) => step.kind === 'tool' && step.status === 'running')
      if (!pending) steps.push(thinking(event.attempt ?? state.attempt, now, true))
      return { ...state, steps }
    }
    case 'evaluation': {
      const steps = [...state.steps]
      const { type: _type, ...evaluation } = event
      const index = lastIndex(steps, (step) => step.kind === 'evaluation' && step.status === 'running')
      const failed = evaluation.needs_retry || evaluation.passed === false || Boolean(evaluation.error)
      const patch: Partial<TraceStep> = {
        status: failed ? 'failed' : 'success',
        evaluation,
        durationMs: evaluation.duration_ms ?? undefined,
        title: evaluation.error
          ? 'Self-evaluation unavailable'
          : failed
            ? 'Answer rejected by evaluator'
            : 'Answer verified',
      }
      if (index >= 0) steps[index] = { ...steps[index], ...patch }
      else
        steps.push({
          id: uid('eval'),
          kind: 'evaluation',
          attempt: evaluation.attempt,
          startedAt: now,
          ...patch,
        } as TraceStep)
      return { ...state, steps }
    }
    case 'retry': {
      const steps = [...state.steps]
      const lastEval = [...steps].reverse().find((step) => step.kind === 'evaluation')?.evaluation
      steps.push({
        id: uid('retry'),
        kind: 'retry',
        status: 'success',
        attempt: Math.max(1, event.attempt - 1),
        nextAttempt: event.attempt,
        startedAt: now,
        durationMs: 0,
        title: 'Self-correcting',
        retryReason: lastEval?.reason ?? null,
        content: lastEval?.suggested_fix ?? undefined,
      })
      steps.push(thinking(event.attempt, now, false))
      return {
        ...state,
        attempt: event.attempt,
        maxAttempts: Math.max(state.maxAttempts, event.attempt),
        steps,
      }
    }
    case 'error': {
      const steps = state.steps.map((step) =>
        step.status === 'running' ? finish(step, now, 'failed') : step,
      )
      steps.push({
        id: uid('error'),
        kind: 'error',
        status: 'failed',
        attempt: state.attempt,
        startedAt: now,
        durationMs: 0,
        title: 'Request failed',
        error: event.error?.message ?? 'The agent stopped unexpectedly',
        errorType: event.error?.code ?? null,
      })
      return { ...state, error: event.error, steps }
    }
    case 'final': {
      const response = event.response
      const failed = response.status === 'failed'
      const steps = state.steps.map((step) => {
        if (step.status !== 'running') return step
        if (step.kind === 'evaluation')
          return finish(
            step,
            now,
            response.evaluation || response.evaluation_history.length ? 'success' : 'skipped',
          )
        if (step.kind === 'thinking')
          return {
            ...finish(step, now, failed ? 'failed' : 'success'),
            title: failed ? step.title : 'Composed answer',
          }
        return finish(step, now, failed ? 'failed' : 'success')
      })
      if (!steps.some((step) => step.kind === 'final')) {
        steps.push({
          id: uid('final'),
          kind: 'final',
          status: failed ? 'failed' : 'success',
          attempt: response.selected_attempt,
          startedAt: now,
          durationMs: response.latency_ms,
          title: failed ? 'Finished with an error' : 'Final answer ready',
          tokens: response.token_usage.total_tokens,
          content: response.answer,
          error: response.error?.message ?? null,
        })
      }
      return {
        ...state,
        status: failed ? 'failed' : 'done',
        endedAt: now,
        steps,
        response,
        requestId: response.request_id,
        conversationId: response.conversation_id,
        attempt: response.attempts,
        maxAttempts: Math.max(state.maxAttempts, response.attempts),
        error: response.error ?? state.error,
      }
    }
    default:
      return state
  }
}
