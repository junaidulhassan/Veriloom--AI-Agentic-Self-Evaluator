import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'

const schema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255, 'Keep it under 255 characters'),
})
type Values = z.infer<typeof schema>

export function RenameDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial: string
  onSubmit: (title: string) => void
}) {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { title: initial } })
  useEffect(() => {
    if (open) form.reset({ title: initial })
  }, [open, initial, form])
  const error = form.formState.errors.title?.message
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Rename conversation" size="sm">
      <form
        onSubmit={form.handleSubmit((values) => {
          onSubmit(values.title.trim())
          onOpenChange(false)
        })}
        className="space-y-4"
      >
        <div>
          <Input
            autoFocus
            aria-label="Conversation title"
            aria-invalid={Boolean(error)}
            {...form.register('title')}
          />
          {error ? <p className="text-error mt-1.5 text-xs">{error}</p> : null}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" size="sm">
            Save
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
