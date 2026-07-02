import { describe, expect, it } from 'vitest'

import {
  createNaiveThemeOverrides,
  DARK_THEME,
  DEFAULT_THEME,
  mergeTheme,
  type WebBuilderThemeTokens,
} from '../../../../../packages/webbuilder/src/vue/theme.js'

describe('WebBuilder theme tokens', () => {
  it('returns the default theme when no overrides are provided', () => {
    expect(mergeTheme()).toEqual(DEFAULT_THEME)
    expect(mergeTheme(undefined)).toEqual(DEFAULT_THEME)
    expect(mergeTheme({})).toEqual(DEFAULT_THEME)
  })

  it('keeps default values pinned to the legacy hardcoded appearance', () => {
    expect(DEFAULT_THEME['--wb-topbar-bg']).toBe('#001533')
    expect(DEFAULT_THEME['--wb-primary']).toBe('#2251FF')
    expect(DEFAULT_THEME['--wb-primary-hover']).toBe('#2563eb')
    expect(DEFAULT_THEME['--wb-btn-hover-bg']).toBe('#ffffff29')
    expect(DEFAULT_THEME['--wb-btn-active-bg']).toBe('#ffffff29')
    expect(DEFAULT_THEME['--wb-loading-bg']).toBe('#f0f2f5')
    expect(DEFAULT_THEME['--wb-diagnostic-border']).toBe('#f59e0b')
    expect(DEFAULT_THEME['--wb-side-panel-width']).toBe('280px')
    expect(DEFAULT_THEME['--wb-rail-width']).toBe('40px')
  })

  it('applies partial overrides without touching other tokens', () => {
    const merged = mergeTheme({
      '--wb-topbar-bg': '#1e293b',
      '--wb-primary': '#16a34a',
    })

    expect(merged['--wb-topbar-bg']).toBe('#1e293b')
    expect(merged['--wb-primary']).toBe('#16a34a')
    expect(merged['--wb-primary-hover']).toBe(DEFAULT_THEME['--wb-primary-hover'])
    expect(merged['--wb-loading-bg']).toBe(DEFAULT_THEME['--wb-loading-bg'])
  })

  it('does not mutate the default theme when merging', () => {
    const snapshot = { ...DEFAULT_THEME }
    mergeTheme({ '--wb-topbar-bg': '#000000' })
    expect(DEFAULT_THEME).toEqual(snapshot)
  })

  it('passes through unknown keys without throwing', () => {
    const merged = mergeTheme({
      '--wb-not-a-real-token': '#123456',
    } as Partial<WebBuilderThemeTokens>)

    expect((merged as Record<string, string>)['--wb-not-a-real-token']).toBe('#123456')
    expect(merged['--wb-topbar-bg']).toBe(DEFAULT_THEME['--wb-topbar-bg'])
  })

  it('ships a dark preset covering every token', () => {
    expect(Object.keys(DARK_THEME).sort()).toEqual(Object.keys(DEFAULT_THEME).sort())
    expect(DARK_THEME['--wb-topbar-bg']).not.toBe(DEFAULT_THEME['--wb-topbar-bg'])
  })

  it('maps shell theme tokens into Naive UI theme overrides', () => {
    const overrides = createNaiveThemeOverrides(DEFAULT_THEME)

    expect(overrides.common?.primaryColor).toBe(DEFAULT_THEME['--wb-primary'])
    expect(overrides.common?.primaryColorHover).toBe(DEFAULT_THEME['--wb-primary-hover'])
    expect(overrides.Button?.colorPrimary).toBe(DEFAULT_THEME['--wb-primary'])
    expect(overrides.Collapse?.titleTextColor).toBe(DEFAULT_THEME['--wb-loading-text'])
    expect(overrides.Tree?.nodeColorHover).toBe(DEFAULT_THEME['--wb-accent-soft-bg'])
    expect(overrides.Popover?.color).toBe('#ffffff')
  })
})
