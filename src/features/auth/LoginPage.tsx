import { useState } from 'react'
import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LogIn } from 'lucide-react'
import { describeError } from '@/api/errors'
import { Button } from '@/components/ui/Button'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { AuthShell, Field, FormError } from './AuthShell'
import { email } from './schemas'
import { useLogin } from './useAuth'

const schema = z.object({ email, password: z.string().min(1, 'Required') })
type Values = z.infer<typeof schema>

export default function LoginPage() {
  useDocumentTitle('Sign in')
  const login = useLogin()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })
  const errors = form.formState.errors
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your assistant, documents and dashboard."
      footer={
        <>
          New to Veriloom?{' '}
          <Link to="/veriloom/register" className="text-ink font-bold underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        noValidate
        onSubmit={form.handleSubmit(async (values) => {
          setError(null)
          await login.mutateAsync(values).catch((err) => setError(describeError(err)))
        })}
      >
        <FormError message={error} />
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          error={errors.email?.message}
          {...form.register('email')}
        />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...form.register('password')}
        />
        <Button type="submit" className="w-full" loading={login.isPending}>
          <LogIn className="size-4" aria-hidden />
          Sign in
        </Button>
      </form>
    </AuthShell>
  )
}
