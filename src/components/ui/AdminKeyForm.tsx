import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSettingsStore } from '@/store/settings'
import { Button } from './Button'
import { Input } from './Input'

export function AdminKeyForm({ onSaved }: { onSaved?: () => void }) {
  const setAdminKey = useSettingsStore((s) => s.setAdminKey)
  const [value, setValue] = useState('')
  const queryClient = useQueryClient()
  return (
    <form
      className="flex w-full max-w-xs items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        if (!value.trim()) return
        setAdminKey(value)
        setValue('')
        toast.success('Admin key saved on this device')
        queryClient.invalidateQueries({ queryKey: ['admin'] })
        onSaved?.()
      }}
    >
      <Input
        type="password"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="X-Admin-Key"
        aria-label="Admin API key"
        icon={<KeyRound className="size-4" />}
        className="flex-1"
      />
      <Button type="submit" size="sm">
        Unlock
      </Button>
    </form>
  )
}
