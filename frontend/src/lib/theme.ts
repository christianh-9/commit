import { useSyncExternalStore } from 'react'

export type Preference = 'system' | 'light' | 'dark'
export type Theme = 'light' | 'dark'

const KEY = 'commit.theme'
const BACKGROUND: Record<Theme, string> = { light: '#f3f5f2', dark: '#0f1612' }

export function parsePreference(value: string | null): Preference {
  return value === 'light' || value === 'dark' ? value : 'system'
}

export function resolveTheme(preference: Preference, systemDark: boolean): Theme {
  return preference === 'system' ? (systemDark ? 'dark' : 'light') : preference
}

// storage can throw in private mode
function readPreference(): Preference {
  try {
    return parsePreference(localStorage.getItem(KEY))
  } catch {
    return 'system'
  }
}

const media = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null
let preference = readPreference()
let theme = resolveTheme(preference, media?.matches ?? false)
const listeners = new Set<() => void>()

function apply() {
  theme = resolveTheme(preference, media?.matches ?? false)
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BACKGROUND[theme])
  listeners.forEach((l) => l())
}

media?.addEventListener('change', apply)

export function setPreference(next: Preference) {
  preference = next
  try {
    if (next === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, next)
  } catch {
  }
  apply()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useTheme() {
  const current = useSyncExternalStore(subscribe, () => theme)
  const pref = useSyncExternalStore(subscribe, () => preference)
  return { theme: current, preference: pref, setPreference }
}

if (typeof document !== 'undefined') apply()
