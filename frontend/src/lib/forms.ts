import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import { fieldErrors } from './logic'

/** Put FastAPI 422 messages under matching fields; everything else becomes a toast. */
export function showApiError<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>, fields: Path<T>[]) {
  const errors = err instanceof ApiError && err.status === 422 ? fieldErrors(err.detail) : null
  const unmatched: string[] = []
  for (const [field, message] of Object.entries(errors ?? {})) {
    if ((fields as string[]).includes(field)) setError(field as Path<T>, { message })
    else unmatched.push(message)
  }
  if (!errors) toast.error(err instanceof Error ? err.message : 'Something went wrong. Try again.')
  else if (unmatched.length) toast.error(unmatched.join('\n'))
}
