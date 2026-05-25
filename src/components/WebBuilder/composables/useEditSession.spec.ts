import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('vue-router', () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}))

vi.mock('element-plus', () => ({
  ElMessageBox: { confirm: vi.fn() },
  ElLoading: { service: vi.fn(() => ({ close: vi.fn(), setText: vi.fn() })) },
}))

vi.mock('@/components/WebBuilder/utils/wbMessage', () => ({
  wbMessage: { warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() },
}))

vi.mock('@/api/content/page', () => {
  const normalizePageResourceIdentity = (identity: Record<string, unknown> | null | undefined) => identity ?? {}
  const hasPageResourceLocator = (identity: Record<string, unknown> | null | undefined) =>
    Boolean(identity?.resourceId || identity?.resourceKey)
  return {
    acquireLock: vi.fn(),
    releaseLock: vi.fn(),
    updateHeartbeat: vi.fn(),
    hasPageResourceLocator,
    normalizePageResourceIdentity,
  }
})

vi.mock('../utils/sessionKey', () => ({
  getOrCreateSessionKey: vi.fn(() => 'test-session-key'),
}))

vi.mock('../utils/lockKeepalive', () => ({
  releaseLockKeepalive: vi.fn(() => false),
}))

vi.stubGlobal('window', {
  location: { reload: vi.fn() },
  setTimeout: (callback: () => void, ms: number) => setTimeout(callback, ms),
  clearTimeout: (id: ReturnType<typeof setTimeout>) => clearTimeout(id),
  setInterval: (callback: () => void, ms: number) => setInterval(callback, ms),
  clearInterval: (id: ReturnType<typeof setInterval>) => clearInterval(id),
})

import { ElMessageBox } from 'element-plus'
import useEditSession from './useEditSession'

const mockedConfirm = vi.mocked(ElMessageBox.confirm)

const pageResource = () => ({
  resourceId: 1,
  resourceKey: 'home',
  resourceType: 'PAGE',
  resourceScope: 'OWNED',
})

describe('useEditSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('acquires an edit lock and exposes the current session seam', async () => {
    const acquireLock = vi.fn(async () => null)
    const editSession = useEditSession({
      pageResource,
      editorChanges: { hasChanges: ref(false) },
      _deps: { acquireLock },
    })

    await expect(editSession.tryAcquireLock()).resolves.toBe(true)

    expect(editSession.session.value).toMatchObject({
      sessionKey: 'test-session-key',
      hasEditLock: true,
      hasUnsavedChanges: false,
    })
    expect(editSession.currentSessionKey.value).toBe('test-session-key')
  })

  it('derives beforeunload protection from editor changes without caller reverse injection', () => {
    const hasChanges = ref(true)
    const editSession = useEditSession({
      pageResource,
      editorChanges: { hasChanges },
    })
    const event = {
      preventDefault: vi.fn(),
      returnValue: undefined as string | undefined,
    } as unknown as BeforeUnloadEvent

    editSession.handleBeforeUnload(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(event.returnValue).toBe('')
    expect(editSession.hasUnsavedChanges.value).toBe(true)
  })

  it('can skip the next beforeunload prompt while still releasing the held lock', async () => {
    vi.useFakeTimers()
    const acquireLock = vi.fn(async () => null)
    const releaseLock = vi.fn(async () => undefined)
    const editSession = useEditSession({
      pageResource,
      editorChanges: { hasChanges: ref(true) },
      _deps: { acquireLock, releaseLock },
    })
    const event = {
      preventDefault: vi.fn(),
      returnValue: undefined as string | undefined,
    } as unknown as BeforeUnloadEvent

    await editSession.tryAcquireLock()
    editSession.allowNextBeforeUnload()
    editSession.handleBeforeUnload(event)

    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(event.returnValue).toBeUndefined()
    expect(releaseLock).toHaveBeenCalledWith(
      expect.objectContaining({ resourceId: 1 }),
      'test-session-key',
    )
    vi.clearAllTimers()
  })

  it('can include resource transaction dirtiness in unsaved session state', () => {
    const acquireLock = vi.fn(async () => null)
    const editSession = useEditSession({
      pageResource,
      editorChanges: { hasChanges: ref(false) },
      hasDirtyResources: () => true,
      _deps: { acquireLock },
    })

    expect(editSession.hasUnsavedChanges.value).toBe(true)
  })

  it('keeps editor changes in unsaved state when resource transaction is clean', () => {
    const editSession = useEditSession({
      pageResource,
      editorChanges: { hasChanges: ref(true) },
      hasDirtyResources: () => false,
    })

    expect(editSession.hasUnsavedChanges.value).toBe(true)
  })

  it('includes resource transaction dirtiness in the acquired session state', async () => {
    const acquireLock = vi.fn(async () => null)
    const editSession = useEditSession({
      pageResource,
      editorChanges: { hasChanges: ref(false) },
      hasDirtyResources: () => true,
      _deps: { acquireLock },
    })

    await editSession.tryAcquireLock()

    expect(editSession.session.value).toMatchObject({
      hasUnsavedChanges: true,
    })
  })

  it('releases the held lock when heartbeat detects takeover', async () => {
    const acquireLock = vi.fn(async () => null)
    const releaseLock = vi.fn(async () => undefined)
    const updateHeartbeat = vi.fn(async () => ({
      takenOver: true,
      takeoverInfo: { isCurrentUser: false, username: '李四' },
    }))
    const onTakenOver = vi.fn(async () => undefined)
    const editSession = useEditSession({
      pageResource,
      editorChanges: { hasChanges: ref(false) },
      onTakenOver,
      _deps: { acquireLock, releaseLock, updateHeartbeat },
    })

    await editSession.tryAcquireLock()
    await editSession.sendHeartbeat()

    expect(editSession.hasEditLock.value).toBe(false)
    expect(releaseLock).toHaveBeenCalledWith(expect.objectContaining({ resourceId: 1 }), 'test-session-key')
    expect(onTakenOver).toHaveBeenCalled()
  })

  it('releases the held lock when the heartbeat timer detects takeover', async () => {
    vi.useFakeTimers()
    const acquireLock = vi.fn(async () => null)
    const releaseLock = vi.fn(async () => undefined)
    const updateHeartbeat = vi.fn(async () => ({
      takenOver: true,
      takeoverInfo: { isCurrentUser: false, username: '李四' },
    }))
    const editSession = useEditSession({
      pageResource,
      editorChanges: { hasChanges: ref(false) },
      _deps: { acquireLock, releaseLock, updateHeartbeat },
    })

    await editSession.tryAcquireLock()
    editSession.startTimers()
    await vi.advanceTimersByTimeAsync(10000)

    expect(editSession.hasEditLock.value).toBe(false)
    expect(updateHeartbeat).toHaveBeenCalled()
    expect(releaseLock).toHaveBeenCalledWith(expect.objectContaining({ resourceId: 1 }), 'test-session-key')
    editSession.stopTimers()
  })

  it('leaves the session empty when lock contention is declined', async () => {
    mockedConfirm.mockRejectedValueOnce('cancel' as never)
    const acquireLock = vi.fn(async () => ({
      isCurrentSession: false,
      isCurrentUser: false,
      username: '张三',
    }))
    const editSession = useEditSession({
      pageResource,
      editorChanges: { hasChanges: ref(false) },
      _deps: { acquireLock },
    })

    await expect(editSession.tryAcquireLock()).resolves.toBe(false)

    expect(editSession.hasEditLock.value).toBe(false)
    expect(editSession.session.value).toMatchObject({
      sessionKey: 'test-session-key',
      hasEditLock: false,
    })
  })
})
