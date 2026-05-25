import { beforeEach, describe, expect, it, vi } from 'vitest'
import { acquireLock, releaseLock, updateHeartbeat } from '@/api/content/page'
import { config as axiosConfig } from '@/config/axios/config'
import {
  lockErrorMessage,
  mapLockOperationError,
  useLockableResource,
} from './useLockableResource'
import { wbMessage } from '../utils/wbMessage'

vi.mock('@/api/content/page', () => ({
  acquireLock: vi.fn(),
  buildPageResourceParams: (identity: any) => {
    const params: Record<string, any> = {}
    if (identity.resourceId !== undefined) params.resourceId = identity.resourceId
    if (identity.resourceType) params.resourceType = identity.resourceType
    if (identity.resourceScope) params.resourceScope = identity.resourceScope
    if (identity.ownerType) params.ownerType = identity.ownerType
    if (identity.ownerId !== undefined) params.ownerId = identity.ownerId
    return params
  },
  releaseLock: vi.fn(),
  updateHeartbeat: vi.fn(),
}))

vi.mock('@/config/axios/config', () => ({
  config: { base_url: 'http://localhost' },
}))

vi.mock('@/utils/auth', () => ({
  getAccessToken: vi.fn(() => 'test-token'),
  getTenantId: vi.fn(() => null),
  getVisitTenantId: vi.fn(() => null),
}))

vi.mock('../utils/wbMessage', () => ({
  wbMessage: { warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() },
}))

describe('useLockableResource', () => {
  const resource = {
    resourceId: 31,
    resourceType: 'TEMP_RULES',
    resourceScope: 'OWNED',
    ownerType: 'TEMP_POST_DETAIL',
    ownerId: 21,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    axiosConfig.base_url = 'http://localhost:48080/admin-api'
    vi.stubGlobal('window', {
      location: { origin: 'http://localhost' },
    })
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(null))))
  })

  it('acquires a lock and stores holding state with the locked resource', async () => {
    vi.mocked(acquireLock).mockResolvedValue(null as any)
    const lockable = useLockableResource({
      resourceName: '模板规则',
      getResource: () => resource,
      getSessionKey: () => 'session-a',
    })

    await expect(lockable.ensureEditable()).resolves.toBe(true)

    expect(acquireLock).toHaveBeenCalledWith({
      ...resource,
      sessionKey: 'session-a',
    })
    expect(lockable.getState()).toEqual({
      status: 'holding',
      holder: null,
      resource,
      message: '',
    })
  })

  it('maps current-user and other-user acquire conflicts to holder state and messages', async () => {
    const lockable = useLockableResource({
      resourceName: '布局规则',
      getResource: () => resource,
      getSessionKey: () => 'session-a',
    })

    vi.mocked(acquireLock).mockResolvedValueOnce({
      ...resource,
      sessionKey: 'session-b',
      userId: 9,
      username: 'current user',
      lockTime: new Date(),
      heartbeatTime: new Date(),
      isCurrentUser: true,
      isCurrentSession: false,
    })

    await expect(lockable.ensureEditable()).resolves.toBe(false)
    expect(lockable.getState().status).toBe('conflict')
    expect(lockable.getState().message).toBe('布局规则正在其他浏览器或标签页中编辑')
    expect(wbMessage.warning).toHaveBeenCalledWith('布局规则正在其他浏览器或标签页中编辑')

    vi.mocked(acquireLock).mockResolvedValueOnce({
      ...resource,
      sessionKey: 'session-c',
      userId: 10,
      username: 'Alice',
      lockTime: new Date(),
      heartbeatTime: new Date(),
      isCurrentUser: false,
      isCurrentSession: false,
    })

    await expect(lockable.ensureEditable(true)).resolves.toBe(false)
    expect(lockable.getState().holder?.username).toBe('Alice')
    expect(lockable.getState().message).toBe('布局规则正在由 Alice 编辑')
    expect(wbMessage.warning).toHaveBeenCalledTimes(1)
  })

  it('changes a held lock to takeover conflict on heartbeat', async () => {
    vi.mocked(updateHeartbeat).mockResolvedValue({
      success: true,
      takenOver: true,
      takeoverInfo: {
        ...resource,
        sessionKey: 'session-b',
        userId: 9,
        username: 'Alice',
        lockTime: new Date(),
        heartbeatTime: new Date(),
        isCurrentUser: false,
        isCurrentSession: false,
      },
    } as any)
    const lockable = useLockableResource({
      resourceName: '模板规则',
      getResource: () => resource,
      getSessionKey: () => 'session-a',
    })
    lockable.markHolding(resource)

    await lockable.heartbeat()

    expect(updateHeartbeat).toHaveBeenCalledWith(resource, 'session-a')
    expect(lockable.getState().status).toBe('conflict')
    expect(lockable.getState().holder?.username).toBe('Alice')
    expect(lockable.getState().message).toBe('模板规则已被 Alice 接管')
  })

  it('releases with keepalive without clearing held state', async () => {
    const lockable = useLockableResource({
      resourceName: '模板规则',
      getResource: () => resource,
      getSessionKey: () => 'session-a',
    })
    lockable.markHolding(resource)

    lockable.releaseKeepalive()

    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe(
      'http://localhost:48080/admin-api/cms/page/lock/release?resourceId=31&resourceType=TEMP_RULES&resourceScope=OWNED&ownerType=TEMP_POST_DETAIL&ownerId=21&sessionKey=session-a',
    )
    expect(init).toMatchObject({
      method: 'DELETE',
      keepalive: true,
      credentials: 'omit',
      headers: {
        Authorization: 'Bearer test-token',
      },
    })
    expect(lockable.getState().status).toBe('holding')

    vi.mocked(releaseLock).mockResolvedValue(undefined as any)
    await lockable.release()
    expect(releaseLock).toHaveBeenCalledWith(resource, 'session-a')
    expect(lockable.getState().status).toBe('idle')
  })

  it('runs successful save and publish operations and keeps the lock holding', async () => {
    const lockable = useLockableResource({
      resourceName: '布局规则',
      getResource: () => resource,
      getSessionKey: () => 'session-a',
    })
    const onSaveSuccess = vi.fn()
    const onPublishSuccess = vi.fn()

    await expect(
      lockable.save(() => Promise.resolve({ resourceId: 40 }), { onSuccess: onSaveSuccess }),
    ).resolves.toMatchObject({
      success: true,
      hasConflict: false,
      hasFailure: false,
      result: { resourceId: 40 },
    })
    expect(onSaveSuccess).toHaveBeenCalledWith({ resourceId: 40 })
    expect(lockable.getState().status).toBe('holding')

    await expect(
      lockable.publish(() => Promise.resolve({ resourceId: 41 }), {
        onSuccess: onPublishSuccess,
      }),
    ).resolves.toMatchObject({
      success: true,
      hasConflict: false,
      hasFailure: false,
      result: { resourceId: 41 },
    })
    expect(onPublishSuccess).toHaveBeenCalledWith({ resourceId: 41 })
    expect(lockable.getState().resource).toEqual(resource)
  })

  it('maps save and publish lock errors without losing page conflict detection', async () => {
    expect(mapLockOperationError('布局规则', { code: 1009012001 })).toEqual({
      hasConflict: true,
      message: '布局规则 保存冲突，请刷新后重试',
    })
    expect(mapLockOperationError('模板规则', { code: 1009013002, message: '锁已被占用' })).toEqual({
      hasConflict: false,
      message: '锁已被占用',
    })
    expect(lockErrorMessage('模板规则', { code: 1009013000 })).toBe(
      '模板规则 缺少编辑锁，会话已失效，请刷新后重试',
    )

    const lockable = useLockableResource({
      resourceName: '布局规则',
      getResource: () => resource,
      getSessionKey: () => 'session-a',
    })

    await expect(
      lockable.save(() => Promise.reject({ code: 1009012001 }), { silent: true }),
    ).resolves.toMatchObject({
      success: false,
      hasConflict: true,
      hasFailure: true,
      message: '布局规则 保存冲突，请刷新后重试',
    })

    await expect(
      lockable.publish(() => Promise.reject({ code: 1009013002, message: '锁已被占用' })),
    ).resolves.toMatchObject({
      success: false,
      hasConflict: false,
      hasFailure: true,
      message: '锁已被占用',
    })
    expect(wbMessage.error).toHaveBeenCalledWith('锁已被占用')
  })
})
