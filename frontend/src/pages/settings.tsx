import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LogOut, Monitor, Moon, Sun, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { api, call, token } from '@/api/client'
import { keys, useMe } from '@/api/queries'
import { DaysPicker, Field, TimezoneSelect } from '@/components/field'
import { PageHeader } from '@/components/layout'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { showApiError } from '@/lib/forms'
import { useTheme, type Preference } from '@/lib/theme'

const schema = z.object({
  display_name: z.string().trim().min(1, 'Enter a name').max(50),
  target_days_per_week: z.number().int().min(1).max(7),
  timezone: z.string().min(1, 'Enter a timezone'),
})
type Values = z.infer<typeof schema>

export default function Settings() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const me = useMe()
  const form = useForm<Values>({ resolver: zodResolver(schema) })
  const timezone = useWatch({ control: form.control, name: 'timezone' })
  const { errors, isDirty } = form.formState

  useEffect(() => {
    if (me.data) form.reset({ display_name: me.data.display_name, target_days_per_week: me.data.target_days_per_week, timezone: me.data.timezone })
  }, [me.data, form])

  const mutation = useMutation({
    mutationFn: (body: Values) => call(api.PATCH('/users/me', { body })),
    onSuccess: (user) => {
      queryClient.setQueryData(keys.me, user)
      // target and timezone both affect the streak
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast.success('Settings saved')
    },
    onError: (err) => showApiError(err, form.setError, ['display_name', 'target_days_per_week', 'timezone']),
  })

  function logout() {
    token.clear()
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  return (
    <main>
      <PageHeader title="Settings" />
      <div className="grid gap-8 px-4">
        {me.data ? (
          <form noValidate onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="grid gap-5">
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="font-semibold text-foreground">{me.data.email}</span>
            </p>
            <Field id="display_name" label="Name" error={errors.display_name?.message}>
              <Input id="display_name" autoComplete="nickname" aria-invalid={!!errors.display_name} aria-describedby="display_name-error" {...form.register('display_name')} />
            </Field>
            <Field id="target_days_per_week" label="Days per week you want to train" error={errors.target_days_per_week?.message}>
              <Controller
                control={form.control}
                name="target_days_per_week"
                render={({ field }) => <DaysPicker id="target_days_per_week" value={field.value} onChange={field.onChange} />}
              />
            </Field>
            <Field id="timezone" label="Timezone" error={errors.timezone?.message} hint="Used to decide which day a workout counts for">
              <TimezoneSelect
                id="timezone"
                current={timezone}
                aria-invalid={!!errors.timezone}
                aria-describedby="timezone-error"
                {...form.register('timezone')}
              />
            </Field>
            <Button type="submit" size="lg" disabled={!isDirty || mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        ) : (
          <div className="grid gap-5">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-[70px]" />
            <Skeleton className="h-[78px]" />
            <Skeleton className="h-[70px]" />
          </div>
        )}
        <Appearance />
        <Button variant="outline" size="lg" className="text-destructive" onClick={logout}>
          <LogOut aria-hidden /> Log out
        </Button>
        <DeleteAccount />
      </div>
    </main>
  )
}

function DeleteAccount() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirmText, setConfirmText] = useState('')
  const mutation = useMutation({
    mutationFn: () => call(api.DELETE('/users/me')),
    onSuccess: () => {
      token.clear()
      queryClient.clear()
      navigate('/', { replace: true })
      toast.success('Your account was deleted')
    },
    onError: (err) => toast.error(err.message),
  })

  return (
    <section aria-labelledby="delete-heading" className="grid gap-3 border-t pt-6">
      <h2 id="delete-heading" className="text-xl font-bold">
        Delete account
      </h2>
      <p className="text-sm text-muted-foreground">
        Permanently deletes your account and every workout you've logged. This can't be undone.
      </p>
      <AlertDialog onOpenChange={(open) => !open && setConfirmText('')}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="lg" className="justify-self-start">
            <Trash2 aria-hidden /> Delete account
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              Your account, workouts and streak will be deleted for good. Type <b>delete</b> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            aria-label="Type delete to confirm"
            autoComplete="off"
            autoCapitalize="none"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my account</AlertDialogCancel>
            {/* a plain button, so the dialog stays open while the request runs */}
            <Button
              variant="destructive"
              disabled={confirmText.trim().toLowerCase() !== 'delete' || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? 'Deleting…' : 'Delete account'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

const themes: { value: Preference; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
]

function Appearance() {
  const { preference, setPreference } = useTheme()
  return (
    <section aria-labelledby="appearance-heading" className="grid gap-3">
      <h2 id="appearance-heading" className="text-sm font-semibold">
        Appearance
      </h2>
      <div role="radiogroup" aria-labelledby="appearance-heading" className="grid grid-cols-3 gap-1.5">
        {themes.map(({ value, label, icon: Icon }) => (
          <label key={value}>
            <input
              type="radio"
              name="theme"
              value={value}
              checked={preference === value}
              onChange={() => setPreference(value)}
              className="peer sr-only"
            />
            <span className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-input bg-card text-sm font-semibold transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50">
              <Icon className="size-4" aria-hidden />
              {label}
            </span>
          </label>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">System matches your phone or computer. Saved on this device.</p>
    </section>
  )
}
