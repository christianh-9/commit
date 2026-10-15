import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { api, call } from '@/api/client'
import { keys, useWorkouts } from '@/api/queries'
import type { components } from '@/api/schema'
import { PageHeader } from '@/components/layout'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import { formatSet, groupSets } from '@/lib/logic'

type Workout = components['schemas']['WorkoutRead']

const longDate = (d: string) =>
  new Date(`${d}T00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })

export default function History() {
  const { data, isPending } = useWorkouts()
  return (
    <main>
      <PageHeader title="History" />
      <div className="grid gap-3 px-4">
        {isPending && Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[88px] rounded-2xl" />)}
        {data?.length === 0 && (
          <div className="grid justify-items-start gap-3 rounded-2xl border border-dashed p-6">
            <p className="text-lg font-semibold">No workouts yet</p>
            <p className="text-muted-foreground">Your logged workouts show up here, newest first.</p>
            <Button asChild>
              <Link to="/log">
                <Plus aria-hidden /> Log workout
              </Link>
            </Button>
          </div>
        )}
        {data?.map((w) => <WorkoutCard key={w.id} workout={w} />)}
      </div>
    </main>
  )
}

function WorkoutCard({ workout }: { workout: Workout }) {
  const groups = groupSets(workout.sets)
  const summary = [
    `${groups.length} exercise${groups.length === 1 ? '' : 's'}`,
    `${workout.sets.length} set${workout.sets.length === 1 ? '' : 's'}`,
    workout.duration_min && `${workout.duration_min} min`,
  ].filter(Boolean)

  return (
    <Collapsible className="group rounded-2xl border bg-card">
      <CollapsibleTrigger className="flex w-full items-center gap-3 rounded-2xl p-4 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <div className="grid min-w-0 flex-1 gap-1">
          <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">{longDate(workout.performed_on)}</p>
          <p className="truncate font-semibold">{groups.map((g) => g.exercise.name).join(', ')}</p>
          <p className="text-sm text-muted-foreground">{summary.join(' · ')}</p>
        </div>
        <ChevronDown aria-hidden className="size-5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="grid gap-4 border-t px-4 pt-3 pb-4">
        {groups.map(({ exercise, sets }) => (
          <div key={exercise.id} className="grid gap-1.5">
            <p className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">{exercise.name}</span>
              <span className="text-xs text-muted-foreground capitalize">{exercise.muscle_group}</span>
            </p>
            <ol className="flex flex-wrap gap-1.5">
              {sets.map((s) => (
                <li key={s.id} className="rounded-md bg-muted px-2 py-1 font-mono text-sm">
                  {formatSet(s)}
                </li>
              ))}
            </ol>
          </div>
        ))}
        {workout.notes && <p className="text-sm whitespace-pre-line text-muted-foreground">{workout.notes}</p>}
        <DeleteWorkout workout={workout} />
      </CollapsibleContent>
    </Collapsible>
  )
}

function DeleteWorkout({ workout }: { workout: Workout }) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => call(api.DELETE('/workouts/{workout_id}', { params: { path: { workout_id: workout.id } } })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.workouts })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast.success('Workout deleted')
    },
    onError: (err) => toast.error(err.message),
  })
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="justify-self-start" disabled={mutation.isPending}>
          <Trash2 aria-hidden /> Delete workout
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this workout?</AlertDialogTitle>
          <AlertDialogDescription>
            {longDate(workout.performed_on)} and its {workout.sets.length} sets will be removed. Your streak and heatmap update to match. This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => mutation.mutate()}>
            Delete workout
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
