import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { api, call, token } from '@/api/client'
import { keys } from '@/api/queries'
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
      <div className="grid gap-5">
        <GoogleButton />
        <div className="flex items-center gap-3 text-sm text-muted-foreground" role="separator" aria-label="or">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
        {children}
      </div>
      <p className="text-center text-sm text-muted-foreground">{footer}</p>
      <Link to="/privacy" className="text-center text-xs text-muted-foreground underline-offset-4 hover:underline">
        Privacy policy
      </Link>
    </main>
  )
}

/** A plain link: the browser has to leave the app for Google's sign-in page. */
function GoogleButton() {
  return (
    <Button asChild variant="outline" size="lg" className="bg-card font-semibold">
      <a href="/api/auth/google/login">
        <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
        Continue with Google
      </a>
    </Button>
  )
}

/** Remove the #fragment without adding a history entry, keeping React Router's state. */
function clearHash() {
  history.replaceState(history.state, '', location.pathname + location.search)
}

/** Landing page for the backend's Google redirect: /auth/callback#token=<jwt>[&new=1]. */
export function AuthCallback() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  // StrictMode runs effects twice in dev; the second run would see the cleared hash and bounce to /login.
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const params = new URLSearchParams(location.hash.slice(1))
    const jwt = params.get('token')
    clearHash()
    if (!jwt) {
      toast.error("Google sign-in didn't finish. Try again.")
      navigate('/login', { replace: true })
      return
    }
    token.set(jwt)
    if (params.get('new') !== '1') {
      navigate('/', { replace: true })
      return
    }
    call(api.PATCH('/users/me', { body: { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone } }))
      .then((user) => queryClient.setQueryData(keys.me, user))
      // The timezone can still be set in Settings, so a failure here shouldn't block sign-in.
      .catch(() => queryClient.invalidateQueries({ queryKey: keys.me }))
      .finally(() => {
        navigate('/settings', { replace: true })
        toast.success('Welcome! Pick how many days a week you want to train.')
      })
  }, [navigate, queryClient])

  return (
    <main className="grid min-h-dvh place-content-center justify-items-center gap-4 px-4" role="status">
      <BrandMark />
      <p className="text-lg font-semibold">Signing you in…</p>
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

  // The backend's Google callback lands here as /login#error=<message> when sign-in fails.
  useEffect(() => {
    const error = new URLSearchParams(location.hash.slice(1)).get('error')
    if (error) {
      clearHash()
      toast.error(error)
    }
  }, [])

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
