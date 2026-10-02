import type { JsonRecord } from '@/types/api'

export interface WebResult {
  title: string
  url: string
  score: number | null
  snippet: string
}

export interface DocumentHit {
  rank: number
  documentName: string
  documentId: string | null
  page: string
  chunkId: number | null
  score: number | null
  lowRelevance: boolean
  text: string
}

export interface PythonOutput {
  status: string | null
  exitCode: number | null
  durationMs: number | null
  exception: string | null
  timedOut: boolean
  stdout: string
  stderr: string
}

const toNumber = (value: string | undefined) => {
  if (value == null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function parseWebResults(
  output: string,
  metadata?: JsonRecord,
): { summary: string | null; results: WebResult[] } {
  const summary = /Search summary:\s*([\s\S]*?)(?:\n\n\[|\n\[1\]|$)/.exec(output)?.[1]?.trim() ?? null
  const blocks = output.split(/\n\[\d+\]\s/).slice(1)
  const parsed = blocks.map((block) => {
    const [titleLine, ...rest] = block.split('\n')
    const url =
      rest
        .find((line) => line.startsWith('URL:'))
        ?.slice(4)
        .trim() ?? ''
    const scoreLine = rest.find((line) => line.startsWith('Relevance:'))
    const snippet = rest
      .filter((line) => !line.startsWith('URL:') && !line.startsWith('Relevance:'))
      .join('\n')
      .trim()
    return { title: titleLine.trim(), url, score: toNumber(scoreLine?.slice(10).trim()), snippet }
  })
  const sources = (metadata?.sources as { title?: string; url?: string; score?: number }[] | undefined) ?? []
  if (sources.length > parsed.length) {
    return {
      summary,
      results: sources.map((source, index) => ({
        title: source.title ?? 'Untitled',
        url: source.url ?? '',
        score: source.score ?? null,
        snippet: parsed[index]?.snippet ?? '',
      })),
    }
  }
  return { summary, results: parsed }
}

export function parseDocumentHits(output: string, metadata?: JsonRecord): DocumentHit[] {
  const pattern =
    /\[(\d+)\] Document: (.+?) \(id=([^)]+)\) \| page ([\d-]+) \| chunk (\d+) \| similarity ([\d.-]+)( \(low relevance\))?\n?/g
  const hits: DocumentHit[] = []
  const matches = [...output.matchAll(pattern)]
  matches.forEach((match, index) => {
    const start = (match.index ?? 0) + match[0].length
    const end = index + 1 < matches.length ? (matches[index + 1].index ?? output.length) : output.length
    const text = output
      .slice(start, end)
      .replace(/\nNote: no chunk exceeded[\s\S]*$/, '')
      .trim()
    hits.push({
      rank: Number(match[1]),
      documentName: match[2],
      documentId: match[3],
      page: match[4],
      chunkId: toNumber(match[5]),
      score: toNumber(match[6]),
      lowRelevance: Boolean(match[7]),
      text,
    })
  })
  if (hits.length) return hits
  const sources =
    (metadata?.sources as
      | { title?: string; document_id?: string; chunk_id?: number; page?: number; score?: number }[]
      | undefined) ?? []
  return sources.map((source, index) => ({
    rank: index + 1,
    documentName: source.title ?? 'Document',
    documentId: source.document_id ?? null,
    page: String(source.page ?? '-'),
    chunkId: source.chunk_id ?? null,
    score: source.score ?? null,
    lowRelevance: false,
    text: '',
  }))
}

export function parsePythonOutput(output: string, metadata?: JsonRecord): PythonOutput {
  const status =
    /Execution status:\s*(\S+)/.exec(output)?.[1] ??
    (metadata?.execution_status as string | undefined) ??
    null
  const exit = /Exit code:\s*(-?\d+|None)/.exec(output)?.[1]
  const time = /Execution time:\s*([\d.]+)\s*ms/.exec(output)?.[1]
  const exception = /Exception:\s*(.+)/.exec(output)?.[1] ?? null
  const stdout = /STDOUT:\n([\s\S]*?)(?:\nSTDERR:\n|$)/.exec(output)?.[1] ?? ''
  const stderr = /STDERR:\n([\s\S]*)$/.exec(output)?.[1] ?? ''
  const clean = (value: string) => (value.trim() === '<empty>' ? '' : value.replace(/\n$/, ''))
  return {
    status,
    exitCode:
      exit && exit !== 'None' ? Number(exit) : ((metadata?.exit_code as number | null | undefined) ?? null),
    durationMs: toNumber(time) ?? (metadata?.duration_ms as number | undefined) ?? null,
    exception,
    timedOut: Boolean(metadata?.timed_out) || /exceeded the .* time limit/.test(output),
    stdout: clean(stdout),
    stderr: clean(stderr),
  }
}

export function parseCalculator(output: string, args?: JsonRecord, metadata?: JsonRecord) {
  const expression = (metadata?.expression as string) ?? (args?.expression as string) ?? ''
  const result =
    (metadata?.result as string) ??
    (output.includes(' = ') ? output.slice(output.lastIndexOf(' = ') + 3).trim() : '')
  return { expression, result }
}
