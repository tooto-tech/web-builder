import { describe, expect, it, vi } from 'vitest'

import { useAutosaveController } from '../../../../../../packages/webbuilder/src/vue/controllers/useAutosaveController.js'

describe('useAutosaveController', () => {
  it('debounces pending changes and saves silently', async () => {
    vi.useFakeTimers()
    const saveDraft = vi.fn(async () => true)
    const controller = useAutosaveController({
      saveDraft,
      options: { enabled: true, debounceMs: 100 },
    })

    controller.recordChange()
    vi.advanceTimersByTime(99)
    expect(saveDraft).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(saveDraft).toHaveBeenCalledWith({ silent: true })
    expect(controller.hasPendingChange.value).toBe(false)
    vi.useRealTimers()
  })

  it('does not schedule saves when disabled', async () => {
    vi.useFakeTimers()
    const saveDraft = vi.fn(async () => true)
    const controller = useAutosaveController({
      saveDraft,
      options: { enabled: false, debounceMs: 100 },
    })

    controller.recordChange()
    await vi.advanceTimersByTimeAsync(200)

    expect(saveDraft).not.toHaveBeenCalled()
    expect(controller.hasPendingChange.value).toBe(false)
    vi.useRealTimers()
  })

  it('flushes pending changes immediately and clears the timer', async () => {
    vi.useFakeTimers()
    const saveDraft = vi.fn(async () => true)
    const controller = useAutosaveController({
      saveDraft,
      options: { enabled: true, debounceMs: 1000 },
    })

    controller.recordChange()
    await expect(controller.flush()).resolves.toBe(true)
    await vi.advanceTimersByTimeAsync(1000)

    expect(saveDraft).toHaveBeenCalledTimes(1)
    expect(controller.hasPendingChange.value).toBe(false)
    vi.useRealTimers()
  })

  it('keeps failed changes pending for a later retry', async () => {
    vi.useFakeTimers()
    const saveDraft = vi.fn(async () => false)
    const controller = useAutosaveController({
      saveDraft,
      options: { enabled: true, debounceMs: 100 },
    })

    controller.recordChange()
    await vi.advanceTimersByTimeAsync(100)

    expect(controller.hasPendingChange.value).toBe(true)
    vi.useRealTimers()
  })
})
