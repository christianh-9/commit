import { useSyncExternalStore } from 'react'

type Options = {
  fetchFn?: typeof fetch
  wait?: (ms: number) => Promise<void>
  // 60 tries, 2s apart = ~2 min
  attempts?: number
}

// polls /health until the backend is up. render can return its own html
// "waking up" page in the meantime, so only {status: ok} counts
export function createWaker({
  fetchFn = (...args) => fetch(...args),
  wait = (ms) => new Promise((r) => setTimeout(r, ms)),
  attempts = 60,
}: Options = {}) {
  let awake = false
  let pending: Promise<boolean> | null = null
  const listeners = new Set<() => void>()

  async function check() {
    try {
      const res = await fetchFn('/api/health', { cache: 'no-store' })
      return res.ok && (await res.json()).status === 'ok'
    } catch {
      return false
    }
  }

  async function poll() {
    for (let i = 0; i < attempts; i++) {
      if (await check()) {
        awake = true
        listeners.forEach((l) => l())
        return true
      }
      if (i < attempts - 1) await wait(2000)
    }
    return false
  }

  return {
    isAwake: () => awake,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    // callers share one in-flight check
    wake(): Promise<boolean> {
      if (awake) return Promise.resolve(true)
      pending ??= poll().finally(() => (pending = null))
      return pending
    },
  }
}

export const backend = createWaker()

export function useBackendAwake() {
  return useSyncExternalStore(backend.subscribe, backend.isAwake)
}
