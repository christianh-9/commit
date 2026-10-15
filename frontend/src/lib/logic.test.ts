import { describe, expect, test } from 'vitest'
import { buildHeatmap, fieldErrors, formatSet, groupSets, isoDate } from './logic'

describe('buildHeatmap', () => {
  test('fills every day of the past year ending today, oldest first', () => {
    const out = buildHeatmap([], '2026-10-11')
    expect(out).toHaveLength(365)
    expect(out[0].date).toBe('2025-10-12')
    expect(out.at(-1)).toEqual({ date: '2026-10-11', count: 0, level: 0 })
  })

  test('keeps counts for workout days and scales level 1-4 against the busiest day', () => {
    const out = buildHeatmap(
      [
        { day: '2026-10-01', count: 1 },
        { day: '2026-10-05', count: 2 },
        { day: '2026-10-10', count: 4 },
      ],
      '2026-10-11',
    )
    const byDate = Object.fromEntries(out.map((a) => [a.date, a]))
    expect(byDate['2026-10-01']).toEqual({ date: '2026-10-01', count: 1, level: 1 })
    expect(byDate['2026-10-05'].level).toBe(2)
    expect(byDate['2026-10-10'].level).toBe(4)
    expect(byDate['2026-10-02'].level).toBe(0)
  })

  test('a single workout per day is full intensity', () => {
    const out = buildHeatmap([{ day: '2026-10-11', count: 1 }], '2026-10-11')
    expect(out.at(-1)!.level).toBe(4)
  })

  test('crosses DST changes without skipping or repeating days', () => {
    const dates = buildHeatmap([], '2026-11-02').map((a) => a.date)
    expect(new Set(dates).size).toBe(365)
    expect(dates).toContain('2026-11-01')
    expect(dates).toContain('2026-03-08')
  })
})

describe('isoDate', () => {
  test('formats the local calendar date, not UTC', () => {
    expect(isoDate(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
  })
})

describe('fieldErrors', () => {
  test('maps FastAPI 422 detail to fields by the last loc item', () => {
    const detail = [
      { loc: ['body', 'password'], msg: 'String should have at least 8 characters', type: 'x' },
      { loc: ['body', 'sets', 0, 'reps'], msg: 'Input should be greater than or equal to 1', type: 'x' },
    ]
    expect(fieldErrors(detail)).toEqual({
      password: 'String should have at least 8 characters',
      reps: 'Input should be greater than or equal to 1',
    })
  })

  test("drops Pydantic's 'Value error, ' prefix", () => {
    expect(fieldErrors([{ loc: ['body', 'timezone'], msg: 'Value error, Unknown timezone' }])).toEqual({
      timezone: 'Unknown timezone',
    })
  })

  test('returns null when detail is a plain string', () => {
    expect(fieldErrors('Workout date cannot be in the future')).toBeNull()
  })
})

describe('groupSets', () => {
  test('groups sets by exercise in first-seen order, keeping set order', () => {
    const squat = { id: 'a', name: 'Squat', muscle_group: 'legs' }
    const bench = { id: 'b', name: 'Bench', muscle_group: 'chest' }
    const groups = groupSets([
      { id: '1', set_number: 1, reps: 5, weight: 100, exercise: squat },
      { id: '2', set_number: 2, reps: 8, weight: 60, exercise: bench },
      { id: '3', set_number: 3, reps: 5, weight: 105, exercise: squat },
    ])
    expect(groups.map((g) => g.exercise.name)).toEqual(['Squat', 'Bench'])
    expect(groups[0].sets.map((s) => s.id)).toEqual(['1', '3'])
  })
})

describe('formatSet', () => {
  test('shows reps × weight, dropping trailing zeros', () => {
    expect(formatSet({ reps: 8, weight: 62.5 })).toBe('8 × 62.5')
    expect(formatSet({ reps: 5, weight: 100 })).toBe('5 × 100')
  })

  test('shows reps alone when weight is missing', () => {
    expect(formatSet({ reps: 12, weight: null })).toBe('12 reps')
  })
})
