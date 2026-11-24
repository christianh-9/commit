import { describe, expect, test } from 'vitest'
import { groupTimezones } from './timezones'

const zones = ['America/New_York', 'America/Los_Angeles', 'America/Argentina/Salta', 'Europe/London']

describe('groupTimezones', () => {
  test('groups by region, sorted, with readable city names', () => {
    expect(groupTimezones(zones, 'Europe/London')).toEqual([
      {
        region: 'America',
        zones: [
          { value: 'America/Argentina/Salta', label: 'Argentina / Salta' },
          { value: 'America/Los_Angeles', label: 'Los Angeles' },
          { value: 'America/New_York', label: 'New York' },
        ],
      },
      { region: 'Europe', zones: [{ value: 'Europe/London', label: 'London' }] },
    ])
  })

  test("adds the current timezone when the browser's list doesn't have it", () => {
    const groups = groupTimezones(zones, 'UTC')
    expect(groups.at(-1)).toEqual({ region: 'Other', zones: [{ value: 'UTC', label: 'UTC' }] })
  })

  test('does not duplicate a current timezone that is already listed', () => {
    const all = groupTimezones(zones, 'America/New_York').flatMap((g) => g.zones.map((z) => z.value))
    expect(all.filter((v) => v === 'America/New_York')).toHaveLength(1)
  })
})
