import createClient from 'openapi-fetch'
import type { paths } from './schema'

const TOKEN_KEY = 'commit.token'

export const token = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export const api = createClient<paths>({ baseUrl: '/api' })

api.use({
  onRequest({ request }) {
    const t = token.get()
    if (t) request.headers.set('Authorization', `Bearer ${t}`)
    return request
  },
  onResponse({ request, response }) {
    // A 401 from /auth/login means wrong credentials, not an expired session.
    if (response.status === 401 && !request.url.endsWith('/auth/login')) {
      token.clear()
      if (location.pathname !== '/login') location.assign('/login')
    }
    return response
  },
})

export class ApiError extends Error {
  status: number
  detail: unknown
  constructor(status: number, detail: unknown) {
    super(typeof detail === 'string' ? detail : `Something went wrong (${status}). Try again.`)
    this.status = status
    this.detail = detail
  }
}

/** Resolve an openapi-fetch call to its data, or throw ApiError. */
export async function call<T>(req: Promise<{ data?: T; error?: unknown; response: Response }>): Promise<T> {
  const { data, error, response } = await req
  if (!response.ok) throw new ApiError(response.status, (error as { detail?: unknown } | undefined)?.detail)
  return data as T
}
