import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useFieldArray, useForm, type Control, type FieldErrors, type UseFormGetValues, type UseFormRegister } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { api, call } from '@/api/client'
import { keys, useExercises, useMe, useToday, useWorkout } from '@/api/queries'
import type { components } from '@/api/schema'
import { Field } from '@/components/field'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { showApiError } from '@/lib/forms'
import { toFormEntries, type Exercise } from '@/lib/logic'

// inputs are strings, convert them to numbers
const optionalNumber = (schema: z.ZodNumber) =>
  z
    .string()
    .trim()
    .transform((v) => (v === '' ? undefined : Number(v)))
    .pipe(schema.optional())

// built per render because "today" depends on the account's timezone
const makeSchema = (today: string) =>
  z.object({
    performed_on: z.iso.date('Pick a date').refine((d) => d <= today, 'Date cannot be in the future'),
    duration_min: optionalNumber(z.number('Enter minutes').int('Whole minutes only').min(1).max(600)),
    notes: z.string().max(2000).transform((v) => v.trim() || undefined),
    entries: z
      .array(
        z.object({
          exercise_id: z.string(),
          name: z.string(),
          sets: z
            .array(
              z.object({
                reps: z.string().trim().min(1, 'Enter reps').transform(Number).pipe(z.number('Enter reps').int().min(1, 'At least 1').max(1000)),
                weight: optionalNumber(z.number('Enter a number').min(0).max(9999.99)),
              }),
            )
            .min(1),
        }),
      )
      .min(1, 'Add at least one exercise'),
  })
type FormIn = z.input<ReturnType<typeof makeSchema>>
type FormOut = z.output<ReturnType<typeof makeSchema>>

const emptySet = { reps: '', weight: '' }

type Workout = components['schemas']['WorkoutRead']

// /log for a new workout, /workouts/:id/edit to change one
export default function Log() {
  const { id } = useParams()
  // key: a fresh form for each workout, so values never carry over between edits
  return id ? <EditWorkout key={id} id={id} /> : <NewWorkout />
}

// waits for the account so the default date uses its timezone (usually already cached)
function NewWorkout() {
  const { isPending } = useMe()
  if (!isPending) return <WorkoutForm />
  return (
    <main>
      <PageHeader title="Log workout" />
      <div className="grid gap-5 px-4">
        <Skeleton className="h-[70px]" />
        <Skeleton className="h-14 rounded-lg" />
      </div>
    </main>
  )
}

function EditWorkout({ id }: { id: string }) {
  const { data, isPending, isError } = useWorkout(id)
  if (data) return <WorkoutForm workout={data} />
  return (
    <main>
      <PageHeader title="Edit workout" />
      {isPending ? (
        <div className="grid gap-5 px-4">
          <Skeleton className="h-[70px]" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : (
        isError && (
          <p className="px-4 text-muted-foreground">
            This workout doesn't exist anymore.{' '}
            <Link to="/history" className="font-semibold text-primary underline-offset-4 hover:underline">
              Back to history
            </Link>
          </p>
        )
      )}
    </main>
  )
}

function WorkoutForm({ workout }: { workout?: Workout }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [picking, setPicking] = useState(false)
  const today = useToday()
  const schema = useMemo(() => makeSchema(today), [today])
  const form = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(schema),
    // onBlur so a newly added set isn't flagged as empty right away
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: workout
      ? {
          performed_on: workout.performed_on,
          duration_min: workout.duration_min?.toString() ?? '',
          notes: workout.notes ?? '',
          entries: toFormEntries(workout.sets),
        }
      : { performed_on: today, duration_min: '', notes: '', entries: [] },
  })
  const entries = useFieldArray({ control: form.control, name: 'entries' })
  const { errors } = form.formState

  const mutation = useMutation({
    mutationFn: ({ entries, ...rest }: FormOut) => {
      const body = {
        ...rest,
        // server numbers the sets in this order
        sets: entries.flatMap((e) => e.sets.map((s) => ({ exercise_id: e.exercise_id, reps: s.reps, weight: s.weight }))),
      }
      return workout
        ? call(api.PUT('/workouts/{workout_id}', { params: { path: { workout_id: workout.id } }, body }))
        : call(api.POST('/workouts', { body }))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: keys.workouts })
      toast.success(workout ? 'Workout updated' : 'Workout saved')
      navigate(workout ? '/history' : '/')
    },
    onError: (err) => showApiError(err, form.setError, ['performed_on', 'duration_min', 'notes']),
  })

  function addExercise(ex: Exercise) {
    entries.append({ exercise_id: ex.id, name: ex.name, sets: [emptySet] })
    form.clearErrors('entries')
    setPicking(false)
  }

  return (
    <main>
      <PageHeader title={workout ? 'Edit workout' : 'Log workout'} />
      <form noValidate onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="grid gap-5 px-4">
        <Field id="performed_on" label="Date" error={errors.performed_on?.message}>
          <Input id="performed_on" type="date" max={today} aria-invalid={!!errors.performed_on} aria-describedby="performed_on-error" {...form.register('performed_on')} />
        </Field>

        <section aria-labelledby="exercises-heading" className="grid gap-3">
          <h2 id="exercises-heading" className="text-xl font-bold">
            Exercises
          </h2>
          {entries.fields.map((entry, i) => (
            <ExerciseBlock
              key={entry.id}
              index={i}
              name={entry.name}
              control={form.control}
              register={form.register}
              getValues={form.getValues}
              errors={errors}
              onRemove={() => entries.remove(i)}
            />
          ))}
          <Button type="button" variant="outline" className="h-14 border-dashed text-base" onClick={() => setPicking(true)}>
            <Plus aria-hidden /> Add exercise
          </Button>
          {errors.entries?.root?.message || errors.entries?.message ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.entries?.root?.message ?? errors.entries?.message}
            </p>
          ) : null}
        </section>

        <Field id="duration_min" label="Duration in minutes (optional)" error={errors.duration_min?.message}>
          <Input id="duration_min" inputMode="numeric" aria-invalid={!!errors.duration_min} aria-describedby="duration_min-error" {...form.register('duration_min')} />
        </Field>
        <Field id="notes" label="Notes (optional)" error={errors.notes?.message}>
          <Textarea id="notes" rows={3} aria-invalid={!!errors.notes} aria-describedby="notes-error" {...form.register('notes')} />
        </Field>

        <Button type="submit" size="lg" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : workout ? 'Save changes' : 'Save workout'}
        </Button>
      </form>
      <ExercisePicker open={picking} onOpenChange={setPicking} onPick={addExercise} />
    </main>
  )
}

function ExerciseBlock({
  index,
  name,
  control,
  register,
  getValues,
  errors,
  onRemove,
}: {
  index: number
  name: string
  control: Control<FormIn, unknown, FormOut>
  register: UseFormRegister<FormIn>
  getValues: UseFormGetValues<FormIn>
  errors: FieldErrors<FormIn>
  onRemove: () => void
}) {
  const sets = useFieldArray({ control, name: `entries.${index}.sets` })
  const setErrors = errors.entries?.[index]?.sets
  return (
    <div className="rounded-2xl border bg-card">
      <div className="flex items-center justify-between gap-2 py-1 pr-1 pl-4">
        <h3 className="truncate text-lg font-bold">{name}</h3>
        <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${name}`} onClick={onRemove}>
          <Trash2 aria-hidden />
        </Button>
      </div>
      <ol className="grid gap-2 px-4 pb-3">
        <li aria-hidden className="grid grid-cols-[2.5rem_1fr_1fr_2.75rem] gap-2 text-xs font-semibold text-muted-foreground">
          <span>Set</span>
          <span>Reps</span>
          <span>Weight</span>
        </li>
        {sets.fields.map((s, j) => {
          const err = setErrors?.[j]
          const id = `entries-${index}-sets-${j}`
          return (
            <li key={s.id} className="grid gap-1">
              <div className="grid grid-cols-[2.5rem_1fr_1fr_2.75rem] items-center gap-2">
                <span className="font-mono text-sm text-muted-foreground">{j + 1}</span>
                <Input
                  id={`${id}-reps`}
                  inputMode="numeric"
                  aria-label={`Set ${j + 1} reps`}
                  aria-invalid={!!err?.reps}
                  className="font-mono"
                  {...register(`entries.${index}.sets.${j}.reps`)}
                />
                <Input
                  id={`${id}-weight`}
                  inputMode="decimal"
                  placeholder="—"
                  aria-label={`Set ${j + 1} weight (optional)`}
                  aria-invalid={!!err?.weight}
                  className="font-mono"
                  {...register(`entries.${index}.sets.${j}.weight`)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove set ${j + 1}`}
                  disabled={sets.fields.length === 1}
                  onClick={() => sets.remove(j)}
                >
                  <X aria-hidden />
                </Button>
              </div>
              {(err?.reps || err?.weight) && (
                <p role="alert" className="pl-12 text-sm text-destructive">
                  {err.reps?.message ?? err.weight?.message}
                </p>
              )}
            </li>
          )
        })}
      </ol>
      <Button
        type="button"
        variant="ghost"
        className="h-12 w-full rounded-t-none border-t text-primary"
        // copy the previous set
        onClick={() => {
          const last = getValues(`entries.${index}.sets`).at(-1)
          sets.append(last ? { ...last } : emptySet)
        }}
      >
        <Plus aria-hidden /> Add set
      </Button>
    </div>
  )
}

function ExercisePicker({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (o: boolean) => void; onPick: (e: Exercise) => void }) {
  const { data, isPending } = useExercises()
  const groups: Record<string, Exercise[]> = {}
  for (const e of data ?? []) (groups[e.muscle_group] ??= []).push(e)
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Add exercise" description="Search exercises by name or muscle group" className="top-4">
      {/* cmdk's fuzzy match is too loose ("pre" matched "Hip Thrust") */}
      <Command filter={(value, search) => (value.toLowerCase().includes(search.trim().toLowerCase()) ? 1 : 0)}>
      <CommandInput placeholder="Search exercises" />
      <CommandList className="max-h-[min(70dvh,32rem)]">
        <CommandEmpty>{isPending ? 'Loading exercises…' : 'No exercise matches that search.'}</CommandEmpty>
        {Object.entries(groups).map(([group, list]) => (
          <CommandGroup key={group} heading={group} className="capitalize">
            {list.map((e) => (
              <CommandItem key={e.id} value={`${e.name} ${group}`} onSelect={() => onPick(e)} className="min-h-12 text-base">
                {e.name}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
      </Command>
    </CommandDialog>
  )
}
