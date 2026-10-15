import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router'
import { z } from 'zod'
import { api, call, token } from '@/api/client'
import { DaysPicker, Field, TimezoneOptions } from '@/components/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { showApiError } from '@/lib/forms'

const loginSchema = z.object({
  username: z.email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
})
type LoginValues = z.infer<typeof loginSchema>

const registerSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters').max(128),
  display_name: z.string().trim().min(1, 'Enter a name').max(50),
  target_days_per_week: z.number().int().min(1).max(7),
  timezone: z.string().min(1),
})
type RegisterValues = z.infer<typeof registerSchema>

function login(values: LoginValues) {
  return call(
    api.POST('/auth/login', {
      body: { ...values, scope: '' },
      bodySerializer: (b) => new URLSearchParams(b),
      // openapi-fetch defaults to JSON; OAuth2PasswordRequestForm needs a form body.
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  )
}

function AuthShell({ title, children, footer }: { title: string; children: React.ReactNode; footer: React.ReactNode }) {
  if (token.get()) return <Navigate to="/" replace />
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-4 py-10">
      <div className="grid gap-3">
        <BrandMark />
        <h1 className="text-[2.5rem] leading-[0.9] font-extrabold">{title}</h1>
      </div>
      {children}
      <p className="text-center text-sm text-muted-foreground">{footer}</p>
    </main>
  )
}

/** Five heatmap squares stepping up the green ramp. */
function BrandMark() {
  return (
    <div className="flex items-center gap-2" aria-label="Commit">
      <div className="flex gap-1" aria-hidden>
        {['#dce2dd', '#9be9a8', '#40c463', '#30a14e', '#216e39'].map((c) => (
          <span key={c} className="size-3.5 rounded-[3px]" style={{ background: c }} />
        ))}
      </div>
      <span className="font-mono text-sm font-semibold tracking-tight">commit</span>
    </div>
  )
}

export function Login() {
  const navigate = useNavigate()
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })
  const { errors } = form.formState
  const mutation = useMutation({
    mutationFn: login,
    onSuccess: ({ access_token }) => {
      token.set(access_token)
      navigate('/', { replace: true })
    },
    onError: (err) => showApiError(err, form.setError, ['username', 'password']),
  })

  return (
    <AuthShell
      title="Log in"
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="grid gap-5">
        <Field id="username" label="Email" error={errors.username?.message}>
          <Input id="username" type="email" autoComplete="email" inputMode="email" aria-invalid={!!errors.username} aria-describedby="username-error" {...form.register('username')} />
        </Field>
        <Field id="password" label="Password" error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} aria-describedby="password-error" {...form.register('password')} />
        </Field>
        <Button type="submit" size="lg" disabled={mutation.isPending}>
          {mutation.isPending ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </AuthShell>
  )
}

export function Register() {
  const navigate = useNavigate()
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { target_days_per_week: 3, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
  })
  const { errors } = form.formState
  const mutation = useMutation({
    mutationFn: async (values: RegisterValues) => {
      await call(api.POST('/auth/register', { body: values }))
      return login({ username: values.email, password: values.password })
    },
    onSuccess: ({ access_token }) => {
      token.set(access_token)
      navigate('/', { replace: true })
    },
    onError: (err) => showApiError(err, form.setError, ['email', 'password', 'display_name', 'target_days_per_week', 'timezone']),
  })

  return (
    <AuthShell
      title="Start your streak"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="grid gap-5">
        <Field id="display_name" label="Name" error={errors.display_name?.message}>
          <Input id="display_name" autoComplete="nickname" aria-invalid={!!errors.display_name} aria-describedby="display_name-error" {...form.register('display_name')} />
        </Field>
        <Field id="email" label="Email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" inputMode="email" aria-invalid={!!errors.email} aria-describedby="email-error" {...form.register('email')} />
        </Field>
        <Field id="password" label="Password" error={errors.password?.message} hint="At least 8 characters">
          <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} aria-describedby="password-error" {...form.register('password')} />
        </Field>
        <Field id="target_days_per_week" label="Days per week you want to train" error={errors.target_days_per_week?.message}>
          <Controller
            control={form.control}
            name="target_days_per_week"
            render={({ field }) => <DaysPicker id="target_days_per_week" value={field.value} onChange={field.onChange} />}
          />
        </Field>
        <Field id="timezone" label="Timezone" error={errors.timezone?.message} hint="Used to decide which day a workout counts for">
          <Input id="timezone" list="timezones" autoComplete="off" aria-invalid={!!errors.timezone} aria-describedby="timezone-error" {...form.register('timezone')} />
          <TimezoneOptions />
        </Field>
        <Button type="submit" size="lg" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  )
}
