import { Eye, EyeOff } from 'lucide-react'
import { useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { groupTimezones } from '@/lib/timezones'

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

// native radios so arrow keys work
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

export function TimezoneSelect({ current, ...props }: ComponentProps<'select'> & { current: string }) {
  const groups = useMemo(() => groupTimezones(Intl.supportedValuesOf('timeZone'), current), [current])
  return (
    <select
      className="h-11 w-full rounded-lg border border-input bg-card px-3 text-base dark:bg-input/30 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
      {...props}
    >
      {groups.map((g) => (
        <optgroup key={g.region} label={g.region}>
          {g.zones.map((z) => (
            <option key={z.value} value={z.value}>
              {z.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}

export function PasswordInput({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className={`pr-12 ${className ?? ''}`} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {visible ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
      </button>
    </div>
  )
}
