import { Plus } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { ActivityCalendar } from 'react-activity-calendar'
import 'react-activity-calendar/tooltips.css'
import { Link } from 'react-router'
import { useHeatmap, useMe, useStreak } from '@/api/queries'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { buildHeatmap, isoDate } from '@/lib/logic'

// GitHub's contribution ramp; level 0 is tinted to sit on the card.
const GREENS = ['#e4e9e5', '#9be9a8', '#40c463', '#30a14e', '#216e39']

export default function Home() {
  const me = useMe()
  const today = new Date()
  return (
    <main className="grid grid-cols-[minmax(0,1fr)] gap-4 px-4 pt-[calc(1.5rem+env(safe-area-inset-top))]">
      <header className="grid gap-1">
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          {today.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
        </p>
        <h1 className="text-[2rem] leading-none font-extrabold">
          {me.data ? `Hey, ${me.data.display_name}` : <Skeleton className="h-8 w-40" />}
        </h1>
      </header>
      <StreakCard />
      <HeatmapCard />
      <Button asChild size="lg" className="h-16 text-lg">
        <Link to="/log">
          <Plus className="size-6" aria-hidden />
          Log workout
        </Link>
      </Button>
    </main>
  )
}

function StreakCard() {
  const { data } = useStreak()
  if (!data) return <Skeleton className="h-[188px] rounded-2xl" />
  const { current_streak, best_streak, days_this_week, target_days_per_week: target } = data
  return (
    <section aria-labelledby="streak-heading" className="rounded-2xl border bg-card p-5">
      <h2 id="streak-heading" className="sr-only">
        Streak
      </h2>
      <div className="flex items-end justify-between gap-4">
        <p className="flex items-end gap-2">
          <span className="scoreboard text-[5.5rem]">{current_streak}</span>
          <span className="pb-1.5 text-sm leading-tight font-semibold">
            week
            <br />
            streak
          </span>
        </p>
        <p className="pb-1.5 text-right text-sm text-muted-foreground">
          Best
          <br />
          <span className="font-mono font-semibold text-foreground">
            {best_streak} {best_streak === 1 ? 'week' : 'weeks'}
          </span>
        </p>
      </div>
      <div className="mt-5 grid gap-2">
        <p className="flex justify-between text-sm">
          <span>
            <span className="font-semibold">
              {days_this_week} of {target} days
            </span>{' '}
            <span className="text-muted-foreground">this week</span>
          </span>
          {days_this_week >= target && <span className="font-semibold text-primary">Goal met</span>}
        </p>
        {/* One segment per target day: the goal is a count, so the bar shows countable steps. */}
        <div
          role="progressbar"
          aria-label="Days trained this week"
          aria-valuemin={0}
          aria-valuemax={target}
          aria-valuenow={days_this_week}
          className="flex gap-1"
        >
          {Array.from({ length: target }, (_, i) => (
            <span key={i} className={`h-3 flex-1 rounded-[3px] ${i < days_this_week ? 'bg-chart-4' : 'bg-muted'}`} />
          ))}
        </div>
      </div>
    </section>
  )
}

function HeatmapCard() {
  const { data } = useHeatmap()
  const ref = useRef<HTMLDivElement>(null)

  // Start scrolled to the most recent weeks on narrow screens.
  useEffect(() => {
    const el = ref.current?.querySelector('.react-activity-calendar__scroll-container')
    if (el) el.scrollLeft = el.scrollWidth
  }, [data])

  return (
    <section aria-labelledby="heatmap-heading" className="rounded-2xl border bg-card p-4">
      <h2 id="heatmap-heading" className="mb-3 text-lg font-bold">
        Past year
      </h2>
      {data ? (
        <div ref={ref}>
          <ActivityCalendar
            data={buildHeatmap(data, isoDate(new Date()))}
            weekStart={1}
            blockSize={12}
            blockMargin={3}
            blockRadius={3}
            fontSize={12}
            colorScheme="light"
            theme={{ light: GREENS }}
            labels={{ totalCount: '{{count}} workouts in the past year' }}
            tooltips={{
              activity: {
                text: ({ count, date }) =>
                  `${count || 'No'} workout${count === 1 ? '' : 's'} on ${new Date(`${date}T00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
              },
            }}
          />
        </div>
      ) : (
        <Skeleton className="h-[150px]" />
      )}
    </section>
  )
}
