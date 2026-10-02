import { useQuery } from '@tanstack/react-query'
import { qk } from '@/api/keys'
import { systemApi } from '@/api/system'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tooltip } from '@/components/ui/Tooltip'
import { getToolConfig } from '@/features/tools/registry'
import { cn } from '@/lib/utils'

export function ToolChips() {
  const { data, isPending, isError } = useQuery({
    queryKey: qk.tools,
    queryFn: systemApi.tools,
    staleTime: 5 * 60_000,
  })
  if (isPending) return <Skeleton className="h-16" />
  if (isError || !data) return <p className="text-ink-muted text-xs">Tool list unavailable.</p>
  return (
    <div>
      <p className="text-ink-muted mb-2 text-[11px]">
        The agent decides which tools to use for each question.
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {data.map((tool) => {
          const config = getToolConfig(tool.name)
          const Icon = config.icon
          return (
            <li key={tool.name}>
              <Tooltip content={tool.available ? config.description : 'Currently unavailable'}>
                <span
                  tabIndex={0}
                  className={cn(
                    'inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11.5px] font-semibold',
                    tool.available
                      ? 'border-line bg-surface-strong text-ink-soft'
                      : 'border-line-strong text-ink-muted border-dashed line-through',
                  )}
                >
                  <Icon
                    className="size-3"
                    style={{ color: tool.available ? config.color : undefined }}
                    aria-hidden
                  />
                  {config.shortLabel}
                </span>
              </Tooltip>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
