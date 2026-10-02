import type { ChatResponse, ExecutionTrace, Source } from '@/types/api'
import { sourcesFromTrace } from './hooks/useAgentTrace'

export type Verdict = 'verified' | 'self-corrected' | 'low-confidence' | 'flagged' | 'unverified'

export interface MessageMeta {
  latencyMs: number | null
  totalTokens: number
  inputTokens: number
  outputTokens: number
  tools: string[]
  toolCount: number
  retries: number
  attempts: number
  selfCorrected: boolean
  confidence: number | null
  verdict: Verdict
  failed: boolean
  sources: Source[]
  reason: string | null
}

function verdictOf(input: {
  failed: boolean
  isHallucination: boolean | null | undefined
  isCorrect: boolean | null | undefined
  confidence: number | null | undefined
  selfCorrected: boolean
}): Verdict {
  if (input.failed || input.isHallucination) return 'flagged'
  if (input.isCorrect == null && input.confidence == null) return 'unverified'
  if (input.selfCorrected && input.isCorrect) return 'self-corrected'
  if (input.isCorrect === false || (input.confidence ?? 1) < 0.6) return 'low-confidence'
  return 'verified'
}

export function metaFromResponse(response: ChatResponse): MessageMeta {
  const evaluation = response.evaluation
  const failed = response.status === 'failed'
  return {
    latencyMs: response.latency_ms,
    totalTokens: response.token_usage.total_tokens,
    inputTokens: response.token_usage.input_tokens,
    outputTokens: response.token_usage.output_tokens,
    tools: [...new Set(response.tool_calls.map((call) => call.tool_name))],
    toolCount: response.tool_calls.length,
    retries: response.retries,
    attempts: response.attempts,
    selfCorrected: response.self_corrected,
    confidence: evaluation?.confidence ?? null,
    verdict: verdictOf({
      failed,
      isHallucination: evaluation?.is_hallucination,
      isCorrect: evaluation?.is_correct,
      confidence: evaluation?.confidence,
      selfCorrected: response.self_corrected,
    }),
    failed,
    sources: response.sources,
    reason: evaluation?.reason ?? response.error?.message ?? null,
  }
}

export function metaFromTrace(trace: ExecutionTrace): MessageMeta {
  const request = trace.request
  const failed = request.status === 'failed'
  const finalEval = trace.evaluations.find((item) => item.is_final) ?? trace.evaluations.at(-1)
  return {
    latencyMs: request.latency_ms,
    totalTokens: request.total_tokens,
    inputTokens: request.input_tokens,
    outputTokens: request.output_tokens,
    tools: [...new Set(trace.tool_executions.map((item) => item.tool_name))],
    toolCount: trace.tool_executions.length,
    retries: request.retries,
    attempts: request.attempts,
    selfCorrected: request.self_corrected,
    confidence: request.confidence,
    verdict: verdictOf({
      failed,
      isHallucination: request.is_hallucination,
      isCorrect: request.is_correct,
      confidence: request.confidence,
      selfCorrected: request.self_corrected,
    }),
    failed,
    sources: sourcesFromTrace(trace),
    reason: finalEval?.reason ?? request.error_message,
  }
}
