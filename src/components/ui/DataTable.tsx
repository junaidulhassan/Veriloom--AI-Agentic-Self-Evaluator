import { Fragment, memo, useDeferredValue, useMemo, useState, type ReactNode } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Columns3,
  Download,
} from 'lucide-react'
import { DropdownMenu as RM } from 'radix-ui'
import { cn } from '@/lib/utils'
import { downloadCsv } from '@/lib/download'
import { Button } from './Button'
import { EmptyState, ErrorState } from './EmptyState'
import { SearchInput } from './Input'
import { Skeleton } from './Skeleton'

export interface ServerPagination {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export interface DataTableProps<T> {
  data: T[] | undefined
  columns: ColumnDef<T, unknown>[]
  loading?: boolean
  error?: unknown
  onRetry?: () => void
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: ReactNode
  searchable?: boolean
  searchPlaceholder?: string
  toolbar?: ReactNode
  pageSize?: number
  server?: ServerPagination
  renderExpanded?: (row: T) => ReactNode
  onRowClick?: (row: T) => void
  getRowId?: (row: T, index: number) => string
  exportName?: string
  maxHeight?: number
  initialSorting?: SortingState
  initialHidden?: VisibilityState
  dense?: boolean
}

function DataTableInner<T>({
  data,
  columns,
  loading,
  error,
  onRetry,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyIcon,
  searchable = true,
  searchPlaceholder = 'Filter rows',
  toolbar,
  pageSize = 10,
  server,
  renderExpanded,
  onRowClick,
  getRowId,
  exportName,
  maxHeight = 560,
  initialSorting = [],
  initialHidden = {},
  dense,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting)
  const [visibility, setVisibility] = useState<VisibilityState>(initialHidden)
  const [filter, setFilter] = useState('')
  const deferredFilter = useDeferredValue(filter)
  const [expanded, setExpanded] = useState<string | null>(null)
  const rows = useMemo(() => data ?? [], [data])

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, columnVisibility: visibility, globalFilter: deferredFilter },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setVisibility,
    onGlobalFilterChange: setFilter,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(server
      ? { manualPagination: true, pageCount: Math.max(1, Math.ceil(server.total / server.pageSize)) }
      : { getPaginationRowModel: getPaginationRowModel() }),
    initialState: { pagination: { pageSize, pageIndex: 0 } },
    autoResetPageIndex: true,
  })

  const visibleRows = table.getRowModel().rows
  const pageCount = server ? Math.max(1, Math.ceil(server.total / server.pageSize)) : table.getPageCount()
  const pageIndex = server ? server.page - 1 : table.getState().pagination.pageIndex
  const total = server ? server.total : table.getFilteredRowModel().rows.length
  const canPrev = pageIndex > 0
  const canNext = pageIndex + 1 < pageCount
  const colSpan = table.getVisibleLeafColumns().length + (renderExpanded ? 1 : 0)

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {searchable ? (
          <SearchInput
            value={filter}
            onChange={setFilter}
            placeholder={searchPlaceholder}
            className="w-full sm:w-64"
            pending={filter !== deferredFilter}
          />
        ) : null}
        {toolbar}
        <div className="ml-auto flex items-center gap-1.5">
          {exportName ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={!rows.length}
              onClick={() =>
                downloadCsv(
                  table.getFilteredRowModel().rows.map((row) => row.original as Record<string, unknown>),
                  exportName,
                )
              }
              aria-label="Download table as CSV"
            >
              <Download className="size-3.5" />
              CSV
            </Button>
          ) : null}
          <RM.Root modal={false}>
            <RM.Trigger asChild>
              <Button variant="ghost" size="sm" aria-label="Toggle columns">
                <Columns3 className="size-3.5" />
                Columns
              </Button>
            </RM.Trigger>
            <RM.Portal>
              <RM.Content
                align="end"
                sideOffset={6}
                className="glass-strong text-ink z-[90] min-w-48 rounded-2xl p-1"
              >
                {table
                  .getAllLeafColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <RM.CheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                      onSelect={(event) => event.preventDefault()}
                      className="data-[highlighted]:bg-charcoal-900/[0.07] dark:data-[highlighted]:bg-cream/10 flex cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 text-sm outline-none select-none"
                    >
                      <span
                        className={cn(
                          'border-line-strong grid size-4 place-items-center rounded border',
                          column.getIsVisible() &&
                            'border-charcoal-900 bg-charcoal-900 dark:border-coral-400 dark:bg-coral-400',
                        )}
                      >
                        <RM.ItemIndicator>
                          <span className="bg-cream dark:bg-charcoal-900 block size-1.5 rounded-sm" />
                        </RM.ItemIndicator>
                      </span>
                      {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
                    </RM.CheckboxItem>
                  ))}
              </RM.Content>
            </RM.Portal>
          </RM.Root>
        </div>
      </div>

      <div
        className="border-line bg-surface-strong/60 overflow-auto rounded-2xl border"
        style={{ maxHeight }}
      >
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-[13px]">
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {renderExpanded ? (
                  <th className="border-line bg-surface-strong w-8 border-b px-2 backdrop-blur" />
                ) : null}
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  const sortable = header.column.getCanSort()
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'}
                      className="border-line bg-surface-strong text-ink-muted border-b px-3 py-2.5 text-[11.5px] font-bold tracking-wide whitespace-nowrap uppercase backdrop-blur"
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    >
                      {header.isPlaceholder ? null : sortable ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="hover:text-ink inline-flex items-center gap-1 rounded-md"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === 'asc' ? (
                            <ArrowUp className="size-3" />
                          ) : sorted === 'desc' ? (
                            <ArrowDown className="size-3" />
                          ) : (
                            <ChevronsUpDown className="size-3 opacity-40" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={colSpan} className="border-line border-b px-3 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  </tr>
                ))
              : null}
            {!loading && error ? (
              <tr>
                <td colSpan={colSpan}>
                  <ErrorState error={error} onRetry={onRetry} compact />
                </td>
              </tr>
            ) : null}
            {!loading && !error && !visibleRows.length ? (
              <tr>
                <td colSpan={colSpan}>
                  <EmptyState
                    compact
                    icon={emptyIcon}
                    title={filter ? 'No matching rows' : emptyTitle}
                    description={filter ? 'Try a different filter.' : emptyDescription}
                  />
                </td>
              </tr>
            ) : null}
            {!loading && !error
              ? visibleRows.map((row) => {
                  const isOpen = expanded === row.id
                  return (
                    <Fragment key={row.id}>
                      <tr
                        onClick={() => {
                          if (onRowClick) onRowClick(row.original)
                          else if (renderExpanded) setExpanded(isOpen ? null : row.id)
                        }}
                        className={cn(
                          'group hover:bg-coral-100/60 dark:hover:bg-coral-500/[0.08] transition-colors',
                          (onRowClick || renderExpanded) && 'cursor-pointer',
                          isOpen && 'bg-coral-100/50 dark:bg-coral-500/[0.08]',
                        )}
                      >
                        {renderExpanded ? (
                          <td className="border-line border-b px-2 align-middle">
                            <button
                              type="button"
                              aria-label={isOpen ? 'Collapse row' : 'Expand row'}
                              aria-expanded={isOpen}
                              onClick={(event) => {
                                event.stopPropagation()
                                setExpanded(isOpen ? null : row.id)
                              }}
                              className="text-ink-muted hover:bg-charcoal-900/10 hover:text-ink grid size-6 place-items-center rounded-full"
                            >
                              <ChevronRight
                                className={cn('size-3.5 transition-transform', isOpen && 'rotate-90')}
                              />
                            </button>
                          </td>
                        ) : null}
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className={cn(
                              'border-line border-b px-3 align-middle',
                              dense ? 'py-1.5' : 'py-2.5',
                            )}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                      {renderExpanded ? (
                        <tr>
                          <td colSpan={colSpan} className="p-0">
                            <AnimatePresence initial={false}>
                              {isOpen ? (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                                  className="border-line bg-surface-sunken/60 overflow-hidden border-b"
                                >
                                  <div className="p-4">{renderExpanded(row.original)}</div>
                                </motion.div>
                              ) : null}
                            </AnimatePresence>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  )
                })
              : null}
          </tbody>
        </table>
      </div>

      <div className="text-ink-muted flex flex-wrap items-center justify-between gap-2 text-xs">
        <span>
          {total.toLocaleString('en')} {total === 1 ? 'row' : 'rows'}
        </span>
        <div className="flex items-center gap-1.5">
          <span>
            Page {pageIndex + 1} of {pageCount}
          </span>
          <Button
            variant="soft"
            size="icon-xs"
            aria-label="Previous page"
            disabled={!canPrev}
            onClick={() => (server ? server.onPageChange(server.page - 1) : table.previousPage())}
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button
            variant="soft"
            size="icon-xs"
            aria-label="Next page"
            disabled={!canNext}
            onClick={() => (server ? server.onPageChange(server.page + 1) : table.nextPage())}
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export const DataTable = memo(DataTableInner) as typeof DataTableInner
