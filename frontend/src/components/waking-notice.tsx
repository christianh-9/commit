import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { backend, useBackendAwake } from '@/api/wake'

// shows a message if the backend takes more than 3s to wake up
export function WakingNotice() {
  const awake = useBackendAwake()
  const [state, setState] = useState<'quiet' | 'waiting' | 'failed'>('quiet')

  useEffect(() => {
    if (awake) return
    let live = true
    const timer = setTimeout(() => live && setState((s) => (s === 'quiet' ? 'waiting' : s)), 3000)
    backend.wake().then((ok) => live && !ok && setState('failed'))
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [awake])

  if (awake || state === 'quiet') return null

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border bg-card p-3 text-sm shadow-lg"
    >
      {state === 'waiting' ? (
        <>
          <Loader2 className="size-5 shrink-0 animate-spin text-primary" aria-hidden />
          <p>
            <span className="font-semibold">Starting the server.</span> The first load after a break takes up to a
            minute.
          </p>
        </>
      ) : (
        <>
          <p className="flex-1">
            <span className="font-semibold">Couldn't reach the server.</span> Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => {
              setState('waiting')
              backend.wake().then((ok) => !ok && setState('failed'))
            }}
            className="h-11 shrink-0 rounded-lg px-3 font-semibold text-primary outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Try again
          </button>
        </>
      )}
    </div>
  )
}
