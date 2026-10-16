import type { ReactNode } from 'react'
import { Link } from 'react-router'

// Shown publicly as the address for privacy questions and deletion requests.
const CONTACT_EMAIL = 'hongchristian99@gmail.com'
const UPDATED = 'October 15, 2026'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-2">
      <h2 className="text-xl font-bold">{title}</h2>
      {children}
    </section>
  )
}

export default function Privacy() {
  return (
    <main className="mx-auto grid max-w-2xl gap-6 px-4 py-10 leading-relaxed [&_li]:ml-5 [&_li]:list-disc [&_ul]:grid [&_ul]:gap-1">
      <header className="grid gap-2">
        <Link to="/" className="font-mono text-sm font-semibold text-primary underline-offset-4 hover:underline">
          commit
        </Link>
        <h1 className="text-[2.5rem] leading-[0.9] font-extrabold">Privacy policy</h1>
        <p className="text-sm text-muted-foreground">Last updated {UPDATED}</p>
      </header>

      <p>
        Commit is a personal workout tracker. This page explains what it stores about you, why, and how to have it
        deleted.
      </p>

      <Section title="What Commit stores">
        <ul>
          <li>Your account: email address, display name, timezone, and how many days a week you want to train.</li>
          <li>Your password, if you sign up with one. It's stored only as a one-way hash, never as the password itself.</li>
          <li>
            If you sign in with Google: your Google account ID, so the same account is found next time. Google shares your
            name and email address with Commit; nothing else from your Google account is requested.
          </li>
          <li>Your workouts: dates, exercises, sets, reps, weights, duration, and any notes you write.</li>
        </ul>
      </Section>

      <Section title="How it's used">
        <p>
          Only to run the app: signing you in, saving your workouts, and showing your history, streak, and activity
          heatmap. Commit has no ads and no analytics or tracking, and your data is never sold or shared for marketing.
        </p>
      </Section>

      <Section title="Where it's kept">
        <p>
          The app runs on Render and your data is stored in a Postgres database hosted by Neon, both in the United
          States. Your browser keeps a sign-in token in local storage so you stay logged in; logging out removes it. A
          short-lived cookie is used only while you sign in with Google. Fonts are loaded from Google Fonts.
        </p>
      </Section>

      <Section title="Deleting your data">
        <p>
          You can delete individual workouts in the app at any time. To delete your whole account and everything in
          it, email <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary underline-offset-4 hover:underline">{CONTACT_EMAIL}</a>{' '}
          from the address you signed up with. It will be removed within 30 days.
        </p>
      </Section>

      <Section title="Questions">
        <p>
          Email <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary underline-offset-4 hover:underline">{CONTACT_EMAIL}</a>. If this
          policy changes, the date at the top will change too.
        </p>
      </Section>
    </main>
  )
}
