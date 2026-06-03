import { describe, expect, it, vi } from 'vitest'

import {
  createGlobalSettingsSource,
  createMemoryGlobalSettingsSource,
} from './settingsSource.js'
import type { GlobalSettingsSnapshot } from '@tooto-tech/webbuilder-core'

const createSnapshot = (
  overrides: Partial<GlobalSettingsSnapshot> = {}
): GlobalSettingsSnapshot => ({
  colors: [],
  typography: {},
  customCss: '',
  customCode: [],
  ...overrides,
})

describe('global settings SettingsSource', () => {
  it('starts empty and exposes the latest hydrated snapshot', () => {
    const source = createGlobalSettingsSource()
    const snapshot = createSnapshot({
      version: 'draft-1',
      customCss: ':root { --brand: red; }',
    })

    expect(source.getSnapshot()).toBeNull()

    source.hydrate(snapshot)

    expect(source.getSnapshot()).toBe(snapshot)
  })

  it('notifies subscribers on hydrate and stops after unsubscribe', () => {
    const source = createMemoryGlobalSettingsSource()
    const listener = vi.fn()
    const unsubscribe = source.subscribe(listener)
    const firstSnapshot = createSnapshot({ version: 'draft-1' })
    const secondSnapshot = createSnapshot({ version: 'draft-2' })

    source.hydrate(firstSnapshot)
    unsubscribe()
    source.hydrate(secondSnapshot)

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(firstSnapshot)
    expect(source.getSnapshot()).toBe(secondSnapshot)
  })

  it('preserves snapshot metadata and does not replay current state on subscribe', () => {
    const source = createGlobalSettingsSource()
    const snapshot = createSnapshot({
      version: 'draft-1',
      hash: 'hash-1',
      updatedAt: '2026-06-02T00:00:00.000Z',
    })
    const listener = vi.fn()

    source.hydrate(snapshot)
    source.subscribe(listener)

    expect(source.getSnapshot()).toBe(snapshot)
    expect(source.getSnapshot()).toMatchObject({
      version: 'draft-1',
      hash: 'hash-1',
      updatedAt: '2026-06-02T00:00:00.000Z',
    })
    expect(listener).not.toHaveBeenCalled()
  })

  it('notifies multiple subscribers independently', () => {
    const source = createGlobalSettingsSource()
    const activeListener = vi.fn()
    const removedListener = vi.fn()
    const unsubscribeRemoved = source.subscribe(removedListener)
    source.subscribe(activeListener)

    unsubscribeRemoved()
    source.hydrate(createSnapshot({ version: 'draft-1' }))

    expect(activeListener).toHaveBeenCalledTimes(1)
    expect(removedListener).not.toHaveBeenCalled()
  })
})
