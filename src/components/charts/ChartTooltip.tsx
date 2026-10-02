import type { ReactNode } from 'react'

interface Item {
  name?: string | number
  value?: unknown
  color?: string
  dataKey?: unknown
  payload?: Record<string, unknown>
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}: {
  active?: boolean
  payload?: Item[]
  label?: string | number
  formatter?: (value: number, name: string, item: Item) => ReactNode
  labelFormatter?: (label: string | number) => ReactNode
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-strong text-ink min-w-36 rounded-2xl px-3 py-2.5 text-xs">
      {label != null && label !== '' ? (
        <div className="font-display mb-1.5 text-[12.5px] font-bold">
          {labelFormatter ? labelFormatter(label) : label}
        </div>
      ) : null}
      <ul className="space-y-1">
        {payload.map((item, index) => (
          <li
            key={`${String(item.dataKey ?? item.name)}-${index}`}
            className="flex items-center justify-between gap-4"
          >
            <span className="text-ink-soft flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: item.color }} aria-hidden />
              {String(item.name ?? item.dataKey ?? '')}
            </span>
            <span className="font-mono font-semibold tabular-nums">
              {formatter && typeof item.value === 'number'
                ? formatter(item.value, String(item.name ?? ''), item)
                : typeof item.value === 'number'
                  ? item.value.toLocaleString('en', { maximumFractionDigits: 2 })
                  : String(item.value ?? '')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
