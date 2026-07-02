import { describe, expect, it } from 'vitest'

import { evaluateAutosavePolicy } from './autosavePolicy.js'

describe('autosavePolicy', () => {
  it('does not autosave when disabled or no change is pending', () => {
    expect(evaluateAutosavePolicy({
      enabled: false,
      nowMs: 1000,
      pendingSinceMs: 0,
      lastSavedAtMs: null,
      isSaving: false,
      debounceMs: 800,
      retryBackoffMs: 0,
      failureCount: 0,
    })).toEqual({ shouldSave: false, reason: 'disabled' })

    expect(evaluateAutosavePolicy({
      enabled: true,
      nowMs: 1000,
      pendingSinceMs: null,
      lastSavedAtMs: null,
      isSaving: false,
      debounceMs: 800,
      retryBackoffMs: 0,
      failureCount: 0,
    })).toEqual({ shouldSave: false, reason: 'no-pending-change' })
  })

  it('waits until the debounce window has elapsed', () => {
    expect(evaluateAutosavePolicy({
      enabled: true,
      nowMs: 1500,
      pendingSinceMs: 1000,
      lastSavedAtMs: null,
      isSaving: false,
      debounceMs: 800,
      retryBackoffMs: 0,
      failureCount: 0,
    })).toEqual({ shouldSave: false, reason: 'debouncing', waitMs: 300 })
  })

  it('allows autosave after debounce when no save is in flight', () => {
    expect(evaluateAutosavePolicy({
      enabled: true,
      nowMs: 1800,
      pendingSinceMs: 1000,
      lastSavedAtMs: null,
      isSaving: false,
      debounceMs: 800,
      retryBackoffMs: 0,
      failureCount: 0,
    })).toEqual({ shouldSave: true, reason: 'ready' })
  })

  it('blocks while saving and applies retry backoff after failures', () => {
    expect(evaluateAutosavePolicy({
      enabled: true,
      nowMs: 2000,
      pendingSinceMs: 1000,
      lastSavedAtMs: null,
      isSaving: true,
      debounceMs: 800,
      retryBackoffMs: 0,
      failureCount: 0,
    })).toEqual({ shouldSave: false, reason: 'saving' })

    expect(evaluateAutosavePolicy({
      enabled: true,
      nowMs: 2600,
      pendingSinceMs: 1000,
      lastSavedAtMs: 2000,
      isSaving: false,
      debounceMs: 800,
      retryBackoffMs: 1000,
      failureCount: 1,
    })).toEqual({ shouldSave: false, reason: 'backoff', waitMs: 400 })
  })
})
