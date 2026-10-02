import { KeyRound, Moon, Settings2, Sun, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { AdminKeyForm } from '@/components/ui/AdminKeyForm'
import { Popover } from '@/components/ui/Popover'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { env } from '@/lib/env'
import { useSettingsStore, type ThemeMode } from '@/store/settings'

export function SettingsMenu() {
  const { theme, setTheme, adminKey, setAdminKey } = useSettingsStore()
  const source = adminKey ? 'Saved on this device' : env.adminApiKey ? 'From VITE_ADMIN_API_KEY' : 'Not set'
  return (
    <Popover
      align="end"
      className="w-80"
      trigger={
        <Button variant="ghost" size="icon-sm" aria-label="Settings">
          <Settings2 className="size-4" />
        </Button>
      }
    >
      <div className="space-y-4">
        <div>
          <div className="text-ink-muted mb-2 text-xs font-bold tracking-wider uppercase">Theme</div>
          <SegmentedControl<ThemeMode>
            label="Theme"
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'coral', label: 'Coral' },
              { value: 'charcoal', label: 'Charcoal' },
            ]}
          />
        </div>
        <div>
          <div className="text-ink-muted mb-1 flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
            <KeyRound className="size-3.5" aria-hidden />
            Admin API key
          </div>
          <p className="text-ink-muted mb-2 text-xs">
            {source}. Required for admin views, logs and destructive actions.
          </p>
          <AdminKeyForm />
          {adminKey ? (
            <Button
              variant="ghost"
              size="xs"
              className="mt-2"
              onClick={() => {
                setAdminKey('')
                toast.message('Saved admin key removed')
              }}
            >
              <Trash2 className="size-3" />
              Forget saved key
            </Button>
          ) : null}
        </div>
      </div>
    </Popover>
  )
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useSettingsStore()
  const dark = theme === 'charcoal'
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleTheme}
      aria-label={dark ? 'Switch to coral mode' : 'Switch to charcoal mode'}
    >
      <span key={theme} className="animate-[tip-in_260ms_ease-out]">
        {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </span>
    </Button>
  )
}
