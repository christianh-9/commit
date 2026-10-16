import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { BrandMark, GoogleButton } from '@/pages/auth'

const GREENS = ['#e4e9e5', '#9be9a8', '#40c463', '#30a14e', '#216e39']

// A fixed, made-up year of training so the page shows what the heatmap looks like.
const sample = Array.from({ length: 7 * 22 }, (_, i) => {
  const n = (i * 37 + (i % 7) * 11) % 17
  return n < 7 ? 0 : n < 10 ? 1 : n < 13 ? 2 : n < 15 ? 3 : 4
})

const features = [
  {
    title: 'Log a workout in a minute',
    body: 'Pick exercises from a list grouped by muscle group, then add your sets with reps and weight.',
  },
  {
    title: 'Keep a weekly streak',
    body: 'Choose how many days a week you want to train. Every week you hit that number adds to your streak.',
  },
  {
    title: 'See your whole year',
    body: 'A heatmap shows every day you trained over the past year, so gaps and good runs are easy to spot.',
  },
]

/** Public home page for signed-out visitors: says what Commit is and how to start. */
export default function Landing() {
  return (
    <main className="mx-auto grid max-w-lg gap-10 px-4 pt-[calc(2.5rem+env(safe-area-inset-top))] pb-12">
      <header className="grid gap-4">
        <BrandMark />
        <h1 className="text-[2.75rem] leading-[0.9] font-extrabold">Track your workouts. Keep your streak.</h1>
        <p className="text-lg text-muted-foreground">
          Commit is a workout log for your phone. Record what you lift, set a weekly training goal, and see a year of
          training at a glance.
        </p>
      </header>

      <div aria-hidden className="overflow-hidden rounded-2xl border bg-card p-4">
        <div className="grid grid-flow-col grid-rows-7 justify-start gap-[3px]">
          {sample.map((level, i) => (
            <span key={i} className="size-3 rounded-[3px]" style={{ background: GREENS[level] }} />
          ))}
        </div>
      </div>

      <section aria-labelledby="features-heading" className="grid gap-5">
        <h2 id="features-heading" className="sr-only">
          What you can do
        </h2>
        {features.map((f) => (
          <div key={f.title} className="grid gap-1">
            <h3 className="text-xl font-bold">{f.title}</h3>
            <p className="text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="start-heading" className="grid gap-3">
        <h2 id="start-heading" className="text-2xl font-extrabold">
          Get started
        </h2>
        <GoogleButton />
        <Button asChild size="lg">
          <Link to="/register">Create an account with email</Link>
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            Log in
          </Link>
        </p>
      </section>

      <footer className="grid gap-2 border-t pt-6 text-sm text-muted-foreground">
        <p>
          Signing in with Google is only used to create and log in to your Commit account. Commit receives your name and
          email address from Google and nothing else.
        </p>
        <Link to="/privacy" className="font-semibold text-primary underline-offset-4 hover:underline">
          Privacy policy
        </Link>
      </footer>
    </main>
  )
}
