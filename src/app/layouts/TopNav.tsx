import { useCallback } from 'react'
import { NavLink, useLocation } from 'react-router'
import { motion } from 'framer-motion'
import { LayoutDashboard, MessageSquareText, Search } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Logo } from '@/components/ui/Logo'
import { Kbd } from '@/components/ui/Kbd'
import { qk } from '@/api/keys'
import { dashboardApi } from '@/api/dashboard'
import { DEFAULT_RANGE, resolveWindow } from '@/features/dashboard/filters'
import { cn } from '@/lib/utils'
import { snappy } from '@/lib/motion'
import { useUiStore } from '@/store/ui'
import { loadDashboardPage } from '../router'
import { SettingsMenu, ThemeToggle } from './SettingsMenu'

const links = [
  { to: '/veriloom/chat/ai-assistant', label: 'Assistant', icon: MessageSquareText, match: '/veriloom/chat' },
  {
    to: '/veriloom/agent_eval/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    match: '/veriloom/agent_eval',
  },
]

export function TopNav() {
  const location = useLocation()
  const queryClient = useQueryClient()
  const setCommandOpen = useUiStore((s) => s.setCommandOpen)
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

  const prefetchDashboard = useCallback(() => {
    loadDashboardPage()
    const window = resolveWindow({ range: DEFAULT_RANGE })
    queryClient.prefetchQuery({
      queryKey: qk.dashboard('overview', window),
      queryFn: () => dashboardApi.overview(window),
      staleTime: 30_000,
    })
    queryClient.prefetchQuery({
      queryKey: qk.dashboard('timeseries', window),
      queryFn: () => dashboardApi.timeseries(window),
      staleTime: 30_000,
    })
  }, [queryClient])

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
      <nav
        aria-label="Primary"
        className="glass mx-auto flex h-14 max-w-[1800px] items-center gap-2 rounded-full pr-2 pl-3 sm:gap-4"
      >
        <NavLink
          to="/veriloom/chat/ai-assistant"
          aria-label="Veriloom home"
          className="shrink-0 rounded-full"
        >
          <Logo className="hidden sm:inline-flex" />
          <Logo compact className="sm:hidden" />
        </NavLink>
        <div className="bg-charcoal-900/[0.06] dark:bg-cream/[0.06] relative mx-auto flex items-center gap-1 rounded-full p-1">
          {links.map((link) => {
            const active = location.pathname.startsWith(link.match)
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onMouseEnter={link.label === 'Dashboard' ? prefetchDashboard : undefined}
                onFocus={link.label === 'Dashboard' ? prefetchDashboard : undefined}
                className={cn(
                  'relative inline-flex h-9 items-center gap-2 rounded-full px-3 text-[13px] font-bold transition-colors sm:px-4',
                  active ? 'text-btn-ink' : 'text-ink-soft hover:text-ink',
                )}
                aria-current={active ? 'page' : undefined}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-indicator"
                    transition={snappy}
                    className="bg-btn absolute inset-0 rounded-full shadow-[0_6px_16px_-8px_rgb(28_28_31/0.7)]"
                  />
                ) : null}
                <Icon className="relative size-4" aria-hidden />
                <span className="relative hidden sm:inline">{link.label}</span>
              </NavLink>
            )
          })}
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="border-line bg-surface text-ink-muted hover:text-ink hidden h-8 items-center gap-2 rounded-full border px-3 text-xs transition-colors md:inline-flex"
            aria-label="Open command palette"
          >
            <Search className="size-3.5" aria-hidden />
            Search
            <span className="flex gap-0.5">
              <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>
          <ThemeToggle />
          <SettingsMenu />
        </div>
      </nav>
    </header>
  )
}
