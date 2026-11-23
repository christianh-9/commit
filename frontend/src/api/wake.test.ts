import { describe, expect, test, vi } from 'vitest'
import { createWaker } from './wake'

const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })
const noWait = () => Promise.resolve()

describe('createWaker', () => {
  test('retries until /health answers ok, skipping network errors and HTML pages', async () => {
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(new Response('<html>Service waking up</html>', { headers: { 'Content-Type': 'text/html' } }))
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(json({ status: 'ok', database: 'ok' }))
    const waker = createWaker({ fetchFn, wait: noWait })

    await expect(waker.wake()).resolves.toBe(true)
    expect(fetchFn).toHaveBeenCalledTimes(4)
    expect(waker.isAwake()).toBe(true)
  })

  test('only checks once, however many callers ask', async () => {
    const fetchFn = vi.fn().mockResolvedValue(json({ status: 'ok' }))
    const waker = createWaker({ fetchFn, wait: noWait })

    await Promise.all([waker.wake(), waker.wake(), waker.wake()])
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  test('gives up after the attempt limit and can be retried later', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    const waker = createWaker({ fetchFn, wait: noWait, attempts: 3 })

    await expect(waker.wake()).resolves.toBe(false)
    expect(fetchFn).toHaveBeenCalledTimes(3)
    expect(waker.isAwake()).toBe(false)

    fetchFn.mockResolvedValue(json({ status: 'ok' }))
    await expect(waker.wake()).resolves.toBe(true)
  })

  test('notifies subscribers when the backend becomes awake', async () => {
    const waker = createWaker({ fetchFn: vi.fn().mockResolvedValue(json({ status: 'ok' })), wait: noWait })
    const listener = vi.fn()
    waker.subscribe(listener)

    await waker.wake()
    expect(listener).toHaveBeenCalled()
  })
})
