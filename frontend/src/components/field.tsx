import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

/** Label + control + error message, wired for screen readers via `${id}-error`. */
export function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-sm text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}

/** Segmented 1-7 picker built on native radios, so arrow keys work for free. */
export function DaysPicker({ value, onChange, id }: { value: number; onChange: (n: number) => void; id: string }) {
  return (
    <div id={id} role="radiogroup" aria-label="Target days per week" className="grid grid-cols-7 gap-1.5">
      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
        <label key={n} className="relative">
          <input type="radio" name={id} value={n} checked={value === n} onChange={() => onChange(n)} className="peer sr-only" />
          <span className="grid h-12 cursor-pointer place-items-center rounded-lg border border-input bg-card font-heading text-xl font-extrabold [font-stretch:75%] transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50">
            {n}
          </span>
        </label>
      ))}
    </div>
  )
}

/** Native autocomplete for <Input list="timezones">. */
export function TimezoneOptions() {
  return (
    <datalist id="timezones">
      {Intl.supportedValuesOf('timeZone').map((tz) => (
        <option key={tz} value={tz} />
      ))}
    </datalist>
  )
}
