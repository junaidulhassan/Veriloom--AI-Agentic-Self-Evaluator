import { Moon, Settings2, Sun } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Popover } from '@/components/ui/Popover'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useSettingsStore, type ThemeMode } from '@/store/settings'

export function SettingsMenu() {
  const { theme, setTheme } = useSettingsStore()
  return (
    <Popover
      align="end"
      className="w-64"
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
