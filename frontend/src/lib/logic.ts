import type { components } from '@/api/schema'

type Schemas = components['schemas']
export type SetRead = Schemas['SetRead']
export type Exercise = Schemas['ExerciseRead']
export type Activity = { date: string; count: number; level: number }

const DAY_MS = 86_400_000

/** Local calendar date as yyyy-MM-dd. */
export function isoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Every day of the past year ending `today`, level 0-4 relative to the busiest day. */
export function buildHeatmap(days: { day: string; count: number }[], today: string, length = 365): Activity[] {
  const counts = new Map(days.map((d) => [d.day, d.count]))
  const max = Math.max(1, ...counts.values())
  // UTC arithmetic so DST never skips or repeats a day.
  const end = Date.parse(`${today}T00:00:00Z`)
  return Array.from({ length }, (_, i) => {
    const date = new Date(end - (length - 1 - i) * DAY_MS).toISOString().slice(0, 10)
    const count = counts.get(date) ?? 0
    return { date, count, level: count && Math.ceil((count / max) * 4) }
  })
}

type ValidationItem = { loc: (string | number)[]; msg: string }

/** FastAPI 422 detail -> { field: message }, or null when detail isn't a list. */
export function fieldErrors(detail: unknown): Record<string, string> | null {
  if (!Array.isArray(detail)) return null
  return Object.fromEntries((detail as ValidationItem[]).map((e) => [String(e.loc.at(-1)), e.msg.replace(/^Value error, /, '')]))
}

export function groupSets(sets: SetRead[]) {
  const groups = new Map<string, { exercise: Exercise; sets: SetRead[] }>()
  for (const s of sets) {
    const g = groups.get(s.exercise.id) ?? { exercise: s.exercise, sets: [] }
    g.sets.push(s)
    groups.set(s.exercise.id, g)
  }
  return [...groups.values()]
}

export function formatSet({ reps, weight }: { reps: number; weight?: number | null }): string {
  return weight == null ? `${reps} reps` : `${reps} × ${weight}`
}
