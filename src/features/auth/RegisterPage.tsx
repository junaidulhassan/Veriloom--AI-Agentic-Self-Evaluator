import { useState } from 'react'
import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus } from 'lucide-react'
import { describeError } from '@/api/errors'
import { Button } from '@/components/ui/Button'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { AuthShell, Field, FormError } from './AuthShell'
import { email, name, password } from './schemas'
import { useRegister } from './useAuth'

const schema = z
  .object({
    first_name: name,
    last_name: name,
    email,
    password,
    confirm_password: z.string().min(1, 'Required'),
  })
  .refine((values) => values.password === values.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match',
  })
type Values = z.infer<typeof schema>

export default function RegisterPage() {
  useDocumentTitle('Create account')
  const register = useRegister()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { first_name: '', last_name: '', email: '', password: '', confirm_password: '' },
  })
  const errors = form.formState.errors
  return (
    <AuthShell
      title="Create your account"
      subtitle="Your conversations, documents and insights stay private to you."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/veriloom/login" className="text-ink font-bold underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        noValidate
        onSubmit={form.handleSubmit(async (values) => {
          setError(null)
          await register.mutateAsync(values).catch((err) => setError(describeError(err)))
        })}
      >
        <FormError message={error} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="First name"
            autoComplete="given-name"
            autoFocus
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
        <Field
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters with a letter and a number."
          error={errors.password?.message}
          {...form.register('password')}
        />
        <Field
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirm_password?.message}
          {...form.register('confirm_password')}
        />
        <Button type="submit" className="w-full" loading={register.isPending}>
          <UserPlus className="size-4" aria-hidden />
          Create account
        </Button>
      </form>
    </AuthShell>
  )
}
