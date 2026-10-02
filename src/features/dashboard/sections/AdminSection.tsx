import { useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  AlertTriangle,
  Bug,
  Database,
  FileX2,
  Layers,
  MessageSquareX,
  RefreshCcw,
  RotateCcw,
  Server,
  ShieldX,
  SquareTerminal,
  Trash2,
} from 'lucide-react'
import { adminApi } from '@/api/admin'
import { describeError } from '@/api/errors'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { ErrorState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Skeleton } from '@/components/ui/Skeleton'
import { Switch } from '@/components/ui/Switch'
import { useSystemInfo } from '@/features/chat/hooks/useMaxAttempts'
import { useChatStore } from '@/features/chat/store'
import { useDeleteDocument, useDocuments } from '@/features/documents/useDocuments'
import { useReindex } from '../explorer/useExplorer'
import { titleCase } from '@/lib/format'
import { fadeUp, stagger } from '@/lib/motion'
import type { DeleteResult, SelectionFilter } from '@/types/api'
import { Section } from '../components/Section'

interface ActionSpec {
  id: string
  title: string
  description: string
  icon: ReactNode
  word: string
  optimistic: QueryKey[]
  extraToggle?: { label: string; hint: string }
  run: (selection: SelectionFilter, toggle: boolean) => Promise<DeleteResult>
}

const schema = z
  .object({
    scope: z.enum(['all', 'before']),
    before: z.string().optional(),
    toggle: z.boolean(),
    confirm: z.string(),
    word: z.string(),
  })
  .refine((v) => v.scope === 'all' || Boolean(v.before), { path: ['before'], message: 'Pick a date' })
  .refine((v) => v.confirm.trim() === v.word, {
    path: ['confirm'],
    message: 'Confirmation text does not match',
  })
type FormValues = z.infer<typeof schema>

function useAdminAction(spec: ActionSpec) {
  const queryClient = useQueryClient()
  return useMutation({
    meta: { silent: true },
    mutationFn: ({ selection, toggle }: { selection: SelectionFilter; toggle: boolean }) =>
      spec.run(selection, toggle),
    onMutate: async ({ selection }) => {
      if (!selection.delete_all) return { snapshots: [] as [QueryKey, unknown][] }
      const snapshots: [QueryKey, unknown][] = []
      for (const key of spec.optimistic) {
        await queryClient.cancelQueries({ queryKey: key })
        queryClient.getQueriesData({ queryKey: key }).forEach(([k, data]) => {
          snapshots.push([k, data])
          if (data && typeof data === 'object' && 'items' in (data as object))
            queryClient.setQueryData(k, { ...(data as object), items: [], total: 0 })
          else if (Array.isArray(data)) queryClient.setQueryData(k, [])
        })
      }
      return { snapshots }
    },
    onError: (error, _vars, context) => {
      context?.snapshots.forEach(([k, data]) => queryClient.setQueryData(k, data))
      toast.error(`${spec.title} failed: ${describeError(error)}`)
    },
    onSuccess: (result) =>
      toast.success(`${spec.title}: removed ${result.deleted} record${result.deleted === 1 ? '' : 's'}`),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      queryClient.invalidateQueries({ queryKey: ['chat'] })
    },
  })
}

function ActionDialog({
  spec,
  open,
  onOpenChange,
}: {
  spec: ActionSpec
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const mutation = useAdminAction(spec)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { scope: 'all', before: '', toggle: false, confirm: '', word: spec.word },
  })
  const scope = form.watch('scope')
  const errors = form.formState.errors
  const close = (value: boolean) => {
    if (!value) form.reset({ scope: 'all', before: '', toggle: false, confirm: '', word: spec.word })
    onOpenChange(value)
  }
  return (
    <Dialog open={open} onOpenChange={close} title={spec.title} size="sm">
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          const selection: SelectionFilter =
            values.scope === 'all'
              ? { delete_all: true }
              : { before: new Date(`${values.before}T00:00:00`).toISOString() }
          await mutation.mutateAsync({ selection, toggle: values.toggle }).catch(() => undefined)
          close(false)
        })}
      >
        <div className="border-error/25 bg-error/[0.06] dark:bg-error/20 flex gap-3 rounded-2xl border p-3.5 text-sm">
          <AlertTriangle className="text-error mt-0.5 size-4 shrink-0 dark:text-[#ffb3ad]" aria-hidden />
          <p className="text-ink-soft">{spec.description} This cannot be undone.</p>
        </div>
        <div>
          <div className="text-ink-muted mb-1.5 text-xs font-bold tracking-wider uppercase">Scope</div>
          <Controller
            control={form.control}
            name="scope"
            render={({ field }) => (
              <SegmentedControl<'all' | 'before'>
                label="Deletion scope"
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: 'all', label: 'Everything' },
                  { value: 'before', label: 'Older than' },
                ]}
              />
            )}
          />
          {scope === 'before' ? (
            <div className="mt-2">
              <Input
                type="date"
                aria-label="Delete records created before"
                {...form.register('before')}
                max={new Date().toISOString().slice(0, 10)}
              />
              {errors.before ? <p className="text-error mt-1 text-xs">{errors.before.message}</p> : null}
            </div>
          ) : null}
        </div>
        {spec.extraToggle ? (
          <label className="bg-surface-strong flex items-start justify-between gap-3 rounded-xl p-3 text-sm">
            <span>
              <span className="font-semibold">{spec.extraToggle.label}</span>
              <span className="text-ink-muted block text-xs">{spec.extraToggle.hint}</span>
            </span>
            <Controller
              control={form.control}
              name="toggle"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  label={spec.extraToggle?.label ?? ''}
                />
              )}
            />
          </label>
        ) : null}
        <label className="block text-sm">
          <span className="text-ink-muted">
            Type{' '}
            <code className="bg-charcoal-900 text-cream rounded px-1.5 py-0.5 font-mono text-xs">
              {spec.word}
            </code>{' '}
            to confirm
          </span>
          <Input
            className="mt-2"
            autoComplete="off"
            {...form.register('confirm')}
            aria-invalid={Boolean(errors.confirm)}
          />
          {errors.confirm ? <p className="text-error mt-1 text-xs">{errors.confirm.message}</p> : null}
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" size="sm" loading={mutation.isPending}>
            {spec.title}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

function ActionRow({ spec }: { spec: ActionSpec }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.li
      variants={fadeUp}
      className="border-line bg-surface-strong/60 flex flex-wrap items-center gap-3 rounded-2xl border p-3.5"
    >
      <span className="bg-error/10 text-error grid size-9 shrink-0 place-items-center rounded-xl dark:text-[#ffb3ad]">
        {spec.icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold">{spec.title}</div>
        <div className="text-ink-muted text-xs">{spec.description}</div>
      </div>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="size-3.5" />
        {spec.title.split(' ')[0]}
      </Button>
      <ActionDialog spec={spec} open={open} onOpenChange={setOpen} />
    </motion.li>
  )
}

function SystemPanel() {
  const system = useSystemInfo()
  if (system.isPending) return <Skeleton className="h-56 rounded-[var(--radius-card)]" />
  if (system.error)
    return (
      <Card>
        <ErrorState error={system.error} onRetry={() => system.refetch()} />
      </Card>
    )
  const s = system.data
  const blocks: { title: string; data: Record<string, unknown> }[] = [
    { title: 'Agent', data: s.agent },
    { title: 'RAG', data: Object.fromEntries(Object.entries(s.rag).filter(([k]) => k !== 'index')) },
    { title: 'Embedding', data: s.embedding },
    { title: 'Sandbox', data: s.sandbox },
  ]
  return (
    <Card className="p-4 sm:p-5">
      <CardHeader
        title={`${s.app_name} v${s.version}`}
        description={`Environment: ${s.environment}`}
        icon={<Server className="size-4" />}
      />
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {blocks.map((block) => (
          <div key={block.title} className="bg-surface-strong rounded-2xl p-3">
            <div className="text-ink-muted mb-2 text-[11px] font-bold tracking-wider uppercase">
              {block.title}
            </div>
            <dl className="space-y-1 text-xs">
              {Object.entries(block.data).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-2">
                  <dt className="text-ink-muted truncate">{titleCase(key)}</dt>
                  <dd className="truncate font-mono font-semibold" title={String(value)}>
                    {typeof value === 'boolean'
                      ? value
                        ? 'yes'
                        : 'no'
                      : value == null
                        ? '-'
                        : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </Card>
  )
}

function DocumentsAdmin() {
  const docs = useDocuments()
  const remove = useDeleteDocument()
  const reindex = useReindex()
  const [selected, setSelected] = useState<string[]>([])
  const [confirm, setConfirm] = useState(false)
  const [typed, setTyped] = useState('')
  const items = docs.data?.items ?? []
  return (
    <Card className="p-4 sm:p-5">
      <CardHeader
        title="Documents and index"
        description="Delete documents with their chunks, or rebuild embeddings."
        icon={<Database className="size-4" />}
        actions={
          <Button
            variant="secondary"
            size="sm"
            loading={reindex.isPending}
            onClick={() => reindex.mutate(undefined)}
          >
            <RefreshCcw className="size-3.5" />
            Re-index all
          </Button>
        }
      />
      <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto">
        {docs.isPending ? <Skeleton className="h-24" /> : null}
        {items.map((doc) => (
          <li key={doc.id}>
            <label className="hover:bg-charcoal-900/[0.05] flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-[var(--charcoal-900)]"
                checked={selected.includes(doc.id)}
                onChange={(e) =>
                  setSelected((cur) =>
                    e.target.checked ? [...cur, doc.id] : cur.filter((id) => id !== doc.id),
                  )
                }
              />
              <span className="min-w-0 flex-1 truncate font-semibold">{doc.filename}</span>
              <span className="text-ink-muted text-xs">{doc.chunk_count} chunks</span>
            </label>
          </li>
        ))}
        {!docs.isPending && !items.length ? (
          <li className="text-ink-muted py-4 text-center text-xs">No documents uploaded.</li>
        ) : null}
      </ul>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-ink-muted text-xs">{selected.length} selected</span>
        <Button variant="danger" size="sm" disabled={!selected.length} onClick={() => setConfirm(true)}>
          <FileX2 className="size-3.5" />
          Delete selected
        </Button>
      </div>
      <Dialog
        open={confirm}
        onOpenChange={(v) => {
          setConfirm(v)
          if (!v) setTyped('')
        }}
        title={`Delete ${selected.length} document${selected.length === 1 ? '' : 's'}?`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={selected.length > 1 && typed !== 'DELETE'}
              onClick={() => {
                selected.forEach((id) => remove.mutate(id))
                setSelected([])
                setConfirm(false)
                setTyped('')
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-ink-soft text-sm">
          Chunks and vectors of the selected documents are removed permanently.
        </p>
        {selected.length > 1 ? (
          <label className="mt-3 block text-sm">
            <span className="text-ink-muted">
              Type{' '}
              <code className="bg-charcoal-900 text-cream rounded px-1.5 py-0.5 font-mono text-xs">
                DELETE
              </code>{' '}
              to confirm a bulk delete
            </span>
            <Input
              className="mt-2"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              aria-label="Type DELETE to confirm"
            />
          </label>
        ) : null}
      </Dialog>
    </Card>
  )
}

export default function AdminSection() {
  const newChat = useChatStore((s) => s.newChat)
  const actions = useMemo<ActionSpec[]>(
    () => [
      {
        id: 'evaluations',
        title: 'Clear evaluation logs',
        description: 'Removes evaluator verdicts and resets correctness flags on affected requests.',
        icon: <ShieldX className="size-4" />,
        word: 'CLEAR',
        optimistic: [['dashboard', 'evaluations']],
        extraToggle: {
          label: 'Only non-final attempts',
          hint: 'Keep the verdict that decided each final answer.',
        },
        run: (s, t) => adminApi.clearEvaluations({ ...s, only_non_final: t, reset_request_flags: true }),
      },
      {
        id: 'conversations',
        title: 'Clear conversation history',
        description: 'Deletes chat sessions and their messages.',
        icon: <MessageSquareX className="size-4" />,
        word: 'DELETE',
        optimistic: [
          ['chat', 'conversations'],
          ['dashboard', 'recent-conversations'],
        ],
        extraToggle: {
          label: 'Also purge request logs',
          hint: 'Delete evaluations, tool and token logs of these sessions too.',
        },
        run: async (s, t) => {
          const r = await adminApi.clearConversations({ ...s, purge_requests: t })
          newChat()
          return r
        },
      },
      {
        id: 'requests',
        title: 'Delete request logs',
        description: 'Deletes agent requests with their traces, tool calls, tokens and evaluations.',
        icon: <Layers className="size-4" />,
        word: 'DELETE',
        optimistic: [
          ['dashboard', 'requests'],
          ['dashboard', 'tool-executions'],
        ],
        run: (s) => adminApi.clearRequests(s),
      },
      {
        id: 'errors',
        title: 'Clear error logs',
        description: 'Removes recorded language model, web search, PDF, vector database and sandbox errors.',
        icon: <Bug className="size-4" />,
        word: 'CLEAR',
        optimistic: [['dashboard', 'recent-errors']],
        run: (s) => adminApi.clearErrors(s),
      },
      {
        id: 'code',
        title: 'Clear Python execution logs',
        description: 'Removes stored sandbox runs, including code, stdout and stderr.',
        icon: <SquareTerminal className="size-4" />,
        word: 'CLEAR',
        optimistic: [['admin', 'code-executions']],
        run: (s) => adminApi.clearCodeExecutions(s),
      },
      {
        id: 'retrievals',
        title: 'Clear retrieval logs',
        description: 'Removes RAG retrieval history and similarity scores.',
        icon: <Database className="size-4" />,
        word: 'CLEAR',
        optimistic: [],
        run: (s) => adminApi.clearRetrievals(s),
      },
    ],
    [newChat],
  )
  const [resetOpen, setResetOpen] = useState(false)
  const [resetWord, setResetWord] = useState('')
  const queryClient = useQueryClient()
  const reset = useMutation({
    mutationFn: () => adminApi.resetMetrics({ confirm: 'RESET', reset_chunk_counters: true }),
    onSuccess: (r) => {
      toast.success(`Metrics reset · ${r.deleted} records removed`)
      queryClient.invalidateQueries()
    },
  })
  return (
    <Section
      id="admin"
      description="Management operations. Every destructive action asks for confirmation and requires the admin API key."
    >
      <SystemPanel />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="p-4 sm:p-5 xl:col-span-3">
          <CardHeader
            title="Danger zone"
            description="Bulk deletions require typing a confirmation word."
            icon={<AlertTriangle className="size-4" />}
          />
          <motion.ul
            variants={stagger(0.04)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-4 space-y-2"
          >
            {actions.map((spec) => (
              <ActionRow key={spec.id} spec={spec} />
            ))}
            <motion.li
              variants={fadeUp}
              className="border-error/30 bg-error/[0.05] flex flex-wrap items-center gap-3 rounded-2xl border p-3.5"
            >
              <span className="bg-error text-cream grid size-9 shrink-0 place-items-center rounded-xl">
                <RotateCcw className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold">Reset all metrics</div>
                <div className="text-ink-muted text-xs">
                  Deletes every evaluation, tool, token, retrieval and error log and resets chunk counters.
                </div>
              </div>
              <Button variant="danger" size="sm" onClick={() => setResetOpen(true)}>
                Reset
              </Button>
            </motion.li>
          </motion.ul>
        </Card>
        <div className="xl:col-span-2">
          <DocumentsAdmin />
        </div>
      </div>
      <Dialog
        open={resetOpen}
        onOpenChange={(v) => {
          setResetOpen(v)
          if (!v) setResetWord('')
        }}
        title="Reset all metrics?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={resetWord !== 'RESET'}
              loading={reset.isPending}
              onClick={async () => {
                await reset.mutateAsync().catch(() => undefined)
                setResetOpen(false)
                setResetWord('')
              }}
            >
              Reset metrics
            </Button>
          </>
        }
      >
        <div className="border-error/25 bg-error/[0.06] dark:bg-error/20 flex gap-3 rounded-2xl border p-3.5 text-sm">
          <AlertTriangle className="text-error mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="text-ink-soft">
            The dashboard returns to zero. Conversations and documents are kept.
          </p>
        </div>
        <label className="mt-4 block text-sm">
          <span className="text-ink-muted">
            Type{' '}
            <code className="bg-charcoal-900 text-cream rounded px-1.5 py-0.5 font-mono text-xs">RESET</code>{' '}
            to confirm
          </span>
          <Input
            className="mt-2"
            value={resetWord}
            onChange={(e) => setResetWord(e.target.value)}
            aria-label="Type RESET to confirm"
          />
        </label>
      </Dialog>
    </Section>
  )
}
