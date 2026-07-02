import { describe, expect, it, vi } from 'vitest'

import { useLockController } from '../../../../../../packages/webbuilder/src/vue/controllers/useLockController.js'

const createUi = () => ({
  confirm: vi.fn(async () => true),
  message: {
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
})

const createLockService = () => ({
  acquire: vi.fn(async () => ({
    locked: true,
    ownedByMe: true,
    heartbeatIntervalMs: 100,
  })),
  heartbeat: vi.fn(async () => ({
    locked: true,
    ownedByMe: true,
    heartbeatIntervalMs: 100,
  })),
  release: vi.fn(async () => undefined),
  query: vi.fn(),
})

describe('useLockController', () => {
  it('acquires a lock and heartbeats with the active session key', async () => {
    vi.useFakeTimers()
    const lock = createLockService()
    const controller = useLockController({
      editor: {},
      resource: { resourceId: 1, resourceType: 'PAGE' },
      hostServices: { lock },
      ui: createUi(),
      getSessionKey: () => 'session-1',
      heartbeatIntervalMs: 100,
    })

    await expect(controller.acquire()).resolves.toBe(true)
    await vi.advanceTimersByTimeAsync(100)

    expect(lock.acquire).toHaveBeenCalledWith(
      { resourceId: 1, resourceKey: undefined, resourceScope: undefined, resourceType: 'PAGE', ownerId: undefined, ownerType: undefined },
      { sessionKey: 'session-1', forceTakeover: false, immediateTakeover: false },
    )
    expect(lock.heartbeat).toHaveBeenCalledWith(
      expect.objectContaining({ resourceId: 1 }),
      { sessionKey: 'session-1' },
    )
    vi.useRealTimers()
  })

  it('marks the editor readonly when another holder owns the lock', async () => {
    const setReadOnly = vi.fn()
    const lock = createLockService()
    lock.acquire.mockResolvedValueOnce({
      locked: true,
      ownedByMe: false,
      holder: { userId: 7, displayName: 'Grace' },
      message: 'Grace is editing',
    })
    const ui = createUi()
    const controller = useLockController({
      editor: { setReadOnly },
      resource: { resourceId: 1, resourceType: 'PAGE' },
      hostServices: { lock },
      ui,
      getSessionKey: () => 'session-1',
    })

    await expect(controller.acquire()).resolves.toBe(false)

    expect(controller.isLockedByOther.value).toBe(true)
    expect(setReadOnly).toHaveBeenCalledWith(true)
    expect(ui.message.warning).toHaveBeenCalledWith('Grace is editing')
  })

  it('releases owned locks and stops heartbeat timers', async () => {
    vi.useFakeTimers()
    const lock = createLockService()
    const controller = useLockController({
      editor: {},
      resource: { resourceId: 1, resourceType: 'PAGE' },
      hostServices: { lock },
      ui: createUi(),
      getSessionKey: () => 'session-1',
      heartbeatIntervalMs: 100,
    })

    await controller.acquire()
    await controller.release()
    await vi.advanceTimersByTimeAsync(200)

    expect(lock.release).toHaveBeenCalledWith(
      expect.objectContaining({ resourceId: 1 }),
      { sessionKey: 'session-1' },
    )
    expect(lock.heartbeat).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('reports takeover when heartbeat no longer owns the lock', async () => {
    vi.useFakeTimers()
    const lock = createLockService()
    const onTakenOver = vi.fn()
    lock.heartbeat.mockResolvedValueOnce({
      locked: true,
      ownedByMe: false,
      holder: { userId: 8, displayName: 'Lin' },
      message: 'Lin took over',
    })
    const controller = useLockController({
      editor: {},
      resource: { resourceId: 1, resourceType: 'PAGE' },
      hostServices: { lock },
      ui: createUi(),
      getSessionKey: () => 'session-1',
      heartbeatIntervalMs: 100,
      onTakenOver,
    })

    await controller.acquire()
    await vi.advanceTimersByTimeAsync(100)

    expect(controller.lockState.value.ownedByMe).toBe(false)
    expect(onTakenOver).toHaveBeenCalledWith(expect.objectContaining({ ownedByMe: false }))
    vi.useRealTimers()
  })
})
