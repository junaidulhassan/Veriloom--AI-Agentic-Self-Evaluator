import type { ComponentType } from 'react'
import {
  Calculator,
  DatabaseSearch,
  Globe,
  Library,
  ShieldCheck,
  SquareTerminal,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { JsonRecord } from '@/types/api'
import type { TraceStep } from '@/features/trace/types'
import { CalculatorRenderer } from '@/features/trace/renderers/CalculatorRenderer'
import { DocumentSearchRenderer } from '@/features/trace/renderers/DocumentSearchRenderer'
import { GenericRenderer, ListDocumentsRenderer } from '@/features/trace/renderers/GenericRenderer'
import { PythonRenderer } from '@/features/trace/renderers/PythonRenderer'
import { WebSearchRenderer } from '@/features/trace/renderers/WebSearchRenderer'
import { titleCase } from '@/lib/format'

export interface ToolConfig {
  name: string
  label: string
  shortLabel: string
  icon: LucideIcon
  color: string
  description: string
  renderer: ComponentType<{ step: TraceStep }>
  summarize: (args: JsonRecord) => string
}

const text = (value: unknown) =>
  typeof value === 'string' ? value : value == null ? '' : JSON.stringify(value)

const registry = new Map<string, ToolConfig>()

export function registerTool(config: ToolConfig) {
  registry.set(config.name, config)
}

registerTool({
  name: 'web_search',
  label: 'Web Search',
  shortLabel: 'Web search',
  icon: Globe,
  color: 'var(--series-2)',
  description: 'Live internet search for current facts and news.',
  renderer: WebSearchRenderer,
  summarize: (args) => text(args.query),
})

registerTool({
  name: 'document_search',
  label: 'Document Search',
  shortLabel: 'Doc search',
  icon: DatabaseSearch,
  color: 'var(--series-3)',
  description: 'Semantic retrieval over uploaded PDFs from the vector database.',
  renderer: DocumentSearchRenderer,
  summarize: (args) => text(args.query),
})

registerTool({
  name: 'calculator',
  label: 'Calculator',
  shortLabel: 'Calculator',
  icon: Calculator,
  color: 'var(--series-5)',
  description: 'Exact, safe evaluation of arithmetic and statistics expressions.',
  renderer: CalculatorRenderer,
  summarize: (args) => text(args.expression),
})

registerTool({
  name: 'python_executor',
  label: 'Python Execution',
  shortLabel: 'Python',
  icon: SquareTerminal,
  color: 'var(--series-4)',
  description: 'Runs Python 3 in an isolated sandbox with time and memory limits.',
  renderer: PythonRenderer,
  summarize: (args) => text(args.code).split('\n')[0] ?? '',
})

registerTool({
  name: 'list_documents',
  label: 'List Documents',
  shortLabel: 'List docs',
  icon: Library,
  color: 'var(--series-6)',
  description: 'Lists uploaded PDFs with page and chunk counts.',
  renderer: ListDocumentsRenderer,
  summarize: (args) => text(args.name_contains) || 'all documents',
})

export const evaluatorConfig = {
  name: 'self_evaluation',
  label: 'Self-Evaluation',
  icon: ShieldCheck,
  color: 'var(--series-1)',
}

export function getToolConfig(name: string | null | undefined): ToolConfig {
  const key = name ?? 'tool'
  const found = registry.get(key)
  if (found) return found
  return {
    name: key,
    label: titleCase(key),
    shortLabel: titleCase(key),
    icon: Wrench,
    color: 'var(--series-neutral)',
    description: 'Tool discovered from the API.',
    renderer: GenericRenderer,
    summarize: (args) => text(Object.values(args)[0]),
  }
}

export function registeredTools() {
  return [...registry.values()]
}
