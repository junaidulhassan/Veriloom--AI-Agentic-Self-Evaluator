import { useNavigate } from 'react-router'
import { DropdownMenu as RM } from 'radix-ui'
import { LogOut, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { useCurrentUser, useLogout } from '@/features/auth/useAuth'

const item =
  'data-[highlighted]:bg-charcoal-900 data-[highlighted]:text-cream dark:data-[highlighted]:bg-coral-500 dark:data-[highlighted]:text-charcoal-900 flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm outline-none select-none'

export function UserMenu() {
  const navigate = useNavigate()
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  if (!user) return null
  const initials = `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase()
  return (
    <RM.Root modal={false}>
      <RM.Trigger asChild>
        <button
          type="button"
          aria-label={`Account menu for ${user.first_name} ${user.last_name}`}
          className="bg-btn text-btn-ink focus-visible:ring-coral-700 grid size-8 place-items-center rounded-full text-xs font-bold focus-visible:ring-2 focus-visible:outline-none"
        >
          {initials || <UserRound className="size-4" />}
        </button>
      </RM.Trigger>
      <RM.Portal>
        <RM.Content
          align="end"
          sideOffset={8}
          className="glass-strong text-ink z-[90] w-60 rounded-2xl p-1 data-[state=open]:animate-[tip-in_140ms_ease-out]"
        >
          <div className="px-3 py-2.5">
            <div className="truncate text-sm font-bold">
              {user.first_name} {user.last_name}
            </div>
            <div className="text-ink-muted truncate text-xs">{user.email}</div>
          </div>
          <RM.Separator className="bg-line mx-2 my-1 h-px" />
          <RM.Item className={item} onSelect={() => navigate('/veriloom/account')}>
            <UserRound className="size-4" aria-hidden />
            Account
          </RM.Item>
          <RM.Item
            className={item}
            onSelect={() =>
              logout.mutate(undefined, {
                onSuccess: () => toast.message('Signed out'),
              })
            }
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </RM.Item>
        </RM.Content>
      </RM.Portal>
    </RM.Root>
  )
}
