import { describe, expect, test } from 'vitest'
import { parsePreference, resolveTheme } from './theme'

describe('resolveTheme', () => {
  test('system follows the device setting', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })

  test('an explicit choice ignores the device setting', () => {
    expect(resolveTheme('dark', false)).toBe('dark')
    expect(resolveTheme('light', true)).toBe('light')
  })
})

describe('parsePreference', () => {
  test('keeps valid saved values', () => {
    expect(parsePreference('dark')).toBe('dark')
    expect(parsePreference('light')).toBe('light')
  })

  test('falls back to system for missing or unknown values', () => {
    expect(parsePreference(null)).toBe('system')
    expect(parsePreference('purple')).toBe('system')
  })
})
