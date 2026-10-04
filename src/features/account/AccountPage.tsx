import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { AlertTriangle, Database, KeyRound, Trash2, UserRound } from 'lucide-react'
import { accountApi } from '@/api/auth'
import { describeError } from '@/api/errors'
import { qk } from '@/api/keys'
import { Button, buttonVariants } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { ErrorState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDateTime } from '@/lib/format'
import { fadeUp, stagger } from '@/lib/motion'
import type { AccountSummary, User } from '@/types/api'
import { Field, FormError } from '@/features/auth/AuthShell'
import { email, name, password } from '@/features/auth/schemas'
import { endSession, useAccountSummary } from '@/features/auth/useAuth'

const profileSchema = z.object({
  first_name: name,
  last_name: name,
  email,
  current_password: z.string().optional(),
})
type ProfileValues = z.infer<typeof profileSchema>

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Required'),
    new_password: password,
    confirm_password: z.string().min(1, 'Required'),
  })
  .refine((v) => v.new_password === v.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match',
  })
  .refine((v) => v.new_password !== v.current_password, {
    path: ['new_password'],
    message: 'Choose a different password',
  })
type PasswordValues = z.infer<typeof passwordSchema>

function ProfileCard({ user }: { user: User }) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      current_password: '',
    },
  })
  useEffect(() => {
    form.reset({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      current_password: '',
    })
  }, [user, form])
  const emailChanged = form.watch('email').trim().toLowerCase() !== user.email
  const update = useMutation({
    meta: { silent: true },
    mutationFn: (values: ProfileValues) =>
      accountApi.update({
        first_name: values.first_name,
        last_name: values.last_name,
        ...(emailChanged ? { email: values.email, current_password: values.current_password } : {}),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(qk.me, updated)
      queryClient.invalidateQueries({ queryKey: qk.account })
      toast.success('Profile updated')
    },
  })
  const errors = form.formState.errors
  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        title="Profile"
        description="Your name and sign-in email."
        icon={<UserRound className="size-4" />}
      />
      <form
        className="mt-5 space-y-4"
        noValidate
        onSubmit={form.handleSubmit(async (values) => {
          setError(null)
          if (emailChanged && !values.current_password) {
            form.setError('current_password', { message: 'Required to change your email' })
            return
          }
          await update.mutateAsync(values).catch((err) => setError(describeError(err)))
        })}
      >
        <FormError message={error} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="First name"
            autoComplete="given-name"
            error={errors.first_name?.message}
            {...form.register('first_name')}
          />
          <Field
            label="Last name"
            autoComplete="family-name"
            error={errors.last_name?.message}
            {...form.register('last_name')}
          />
        </div>
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...form.register('email')}
        />
        {emailChanged ? (
          <Field
            label="Current password"
            type="password"
            autoComplete="current-password"
            hint="Confirm it's you before changing your email."
            error={errors.current_password?.message}
            {...form.register('current_password')}
          />
        ) : null}
        <Button type="submit" size="sm" loading={update.isPending} disabled={!form.formState.isDirty}>
          Save changes
        </Button>
      </form>
    </Card>
  )
}

function PasswordCard() {
  const [error, setError] = useState<string | null>(null)
  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  })
  const change = useMutation({
    meta: { silent: true },
    mutationFn: accountApi.changePassword,
    onSuccess: (result) => {
      form.reset()
      toast.success(
        result.revoked_sessions
          ? `Password changed. Signed out ${result.revoked_sessions} other session${result.revoked_sessions === 1 ? '' : 's'}.`
          : 'Password changed',
      )
    },
  })
  const errors = form.formState.errors
  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        title="Password"
        description="Changing it signs you out everywhere else."
        icon={<KeyRound className="size-4" />}
      />
      <form
        className="mt-5 space-y-4"
        noValidate
        onSubmit={form.handleSubmit(async (values) => {
          setError(null)
          await change.mutateAsync(values).catch((err) => setError(describeError(err)))
        })}
      >
        <FormError message={error} />
        <Field
          label="Current password"
          type="password"
          autoComplete="current-password"
          error={errors.current_password?.message}
          {...form.register('current_password')}
        />
        <Field
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters with a letter and a number."
          error={errors.new_password?.message}
          {...form.register('new_password')}
        />
        <Field
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          error={errors.confirm_password?.message}
          {...form.register('confirm_password')}
        />
        <Button type="submit" size="sm" loading={change.isPending}>
          Change password
        </Button>
      </form>
    </Card>
  )
}

function DataCard({ summary }: { summary: AccountSummary }) {
  const stats: [string, number][] = [
    ['Conversations', summary.conversations],
    ['Messages', summary.messages],
    ['Documents', summary.documents],
    ['Chunks', summary.chunks],
    ['Agent requests', summary.requests],
    ['Active sessions', summary.active_sessions],
  ]
  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        title="Your data"
        description="Everything below is private to your account."
        icon={<Database className="size-4" />}
      />
      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="bg-charcoal-900/[0.05] dark:bg-cream/[0.06] rounded-2xl px-3.5 py-3">
            <dt className="text-ink-muted text-xs">{label}</dt>
            <dd className="font-display mt-0.5 text-xl font-bold tabular-nums">{value.toLocaleString()}</dd>
          </div>
        ))}
      </dl>
      <p className="text-ink-muted mt-4 text-xs">
        Member since {formatDateTime(summary.user.created_at, 'MMM d, yyyy')}. Manage conversations, documents
        and logs from{' '}
        <Link
          to="/veriloom/agent_eval/dashboard#controls"
          className="text-ink font-bold underline-offset-4 hover:underline"
        >
          Data &amp; Controls
        </Link>
        .
      </p>
    </Card>
  )
}

function DeleteAccountCard() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [word, setWord] = useState('')
  const [error, setError] = useState<string | null>(null)
  const remove = useMutation({
    meta: { silent: true },
    mutationFn: () => accountApi.remove({ password, confirm: 'DELETE' }),
    onSuccess: () => {
      toast.success('Your account and all of its data were deleted')
      endSession(queryClient)
    },
    onError: (err) => setError(describeError(err)),
  })
  const close = (value: boolean) => {
    setOpen(value)
    if (!value) {
      setPassword('')
      setWord('')
      setError(null)
    }
  }
  return (
    <Card className="border-error/30 p-5 sm:p-6">
      <CardHeader
        title="Delete account"
        description="Permanently removes your account, conversations, documents, embeddings and metrics."
        icon={<Trash2 className="size-4" />}
      />
      <Button variant="danger" size="sm" className="mt-5" onClick={() => setOpen(true)}>
        Delete my account
      </Button>
      <Dialog
        open={open}
        onOpenChange={close}
        title="Delete your account?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={word !== 'DELETE' || !password}
              loading={remove.isPending}
              onClick={() => {
                setError(null)
                remove.mutate()
              }}
            >
              Delete forever
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="border-error/25 bg-error/[0.06] dark:bg-error/20 flex gap-3 rounded-2xl border p-3.5 text-sm">
            <AlertTriangle className="text-error mt-0.5 size-4 shrink-0 dark:text-[#ffb3ad]" aria-hidden />
            <p className="text-ink-soft">This cannot be undone. All of your data is deleted immediately.</p>
          </div>
          <FormError message={error} />
          <Field
            label="Password"
            name="delete-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Field
            label="Type DELETE to confirm"
            name="delete-confirm"
            value={word}
            onChange={(e) => setWord(e.target.value)}
          />
        </div>
      </Dialog>
    </Card>
  )
}

export default function AccountPage() {
  useDocumentTitle('Account')
  const summary = useAccountSummary()
  return (
    <div className="mx-auto max-w-5xl px-4 pb-12">
      <div className="mb-6 pt-4">
        <h1 className="font-display text-2xl font-bold">Account</h1>
        <p className="text-ink-muted mt-1 text-sm">Manage your profile, password and personal data.</p>
      </div>
      {summary.isPending ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-72 rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : summary.error ? (
        <Card className="p-6">
          <ErrorState error={summary.error} onRetry={() => summary.refetch()} />
        </Card>
      ) : (
        <motion.div
          variants={stagger(0.05)}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 lg:grid-cols-2"
        >
          <motion.div variants={fadeUp}>
            <ProfileCard user={summary.data.user} />
          </motion.div>
          <motion.div variants={fadeUp}>
            <PasswordCard />
          </motion.div>
          <motion.div variants={fadeUp}>
            <DataCard summary={summary.data} />
          </motion.div>
          <motion.div variants={fadeUp}>
            <DeleteAccountCard />
          </motion.div>
        </motion.div>
      )}
      <div className="mt-6 text-center">
        <Link to="/veriloom/chat/ai-assistant" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          Back to assistant
        </Link>
      </div>
    </div>
  )
}
