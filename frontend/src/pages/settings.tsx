import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { api, call, token } from '@/api/client'
import { keys, useMe } from '@/api/queries'
import { DaysPicker, Field, TimezoneOptions } from '@/components/field'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { showApiError } from '@/lib/forms'

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
  const { errors, isDirty } = form.formState

  useEffect(() => {
    if (me.data) form.reset({ display_name: me.data.display_name, target_days_per_week: me.data.target_days_per_week, timezone: me.data.timezone })
  }, [me.data, form])

  const mutation = useMutation({
    mutationFn: (body: Values) => call(api.PATCH('/users/me', { body })),
    onSuccess: (user) => {
      queryClient.setQueryData(keys.me, user)
      // Target and timezone both change how the streak is counted.
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
              <Input id="timezone" list="timezones" autoComplete="off" aria-invalid={!!errors.timezone} aria-describedby="timezone-error" {...form.register('timezone')} />
              <TimezoneOptions />
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
        <Button variant="outline" size="lg" className="text-destructive" onClick={logout}>
          <LogOut aria-hidden /> Log out
        </Button>
      </div>
    </main>
  )
}
