import { beforeEach, describe, expect, it, vi } from 'vitest'
import { acquireLock, releaseLock } from '@/api/content/page'
import { config as axiosConfig } from '@/config/axios/config'
import useTemplateRulesManager from './useTemplateRulesManager'

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
  getDraft: vi.fn(),
  publishVersion: vi.fn(),
  releaseLock: vi.fn(),
  saveDraft: vi.fn(),
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

vi.mock('@/components/WebBuilder/utils/wbMessage', () => ({
  wbMessage: { warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() },
}))

describe('useTemplateRulesManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('window', {
      location: { origin: 'http://localhost' },
    })
    axiosConfig.base_url = 'http://localhost:48080/admin-api'
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(null))))
  })

  it('releases a held template rules lock with keepalive for beforeunload', async () => {
    vi.mocked(acquireLock).mockResolvedValue(null as any)
    const manager = useTemplateRulesManager({
      getSessionKey: () => 'template-session',
      getPageResource: () => ({
        resourceId: 21,
        resourceType: 'TEMP_POST_DETAIL',
        resourceScope: 'OWNED',
      }),
    })

    await manager.ensureRulesEditable()
    manager.releaseAllLocksKeepalive()

    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe(
      'http://localhost:48080/admin-api/cms/page/lock/release?resourceType=TEMP_RULES&resourceScope=OWNED&ownerType=TEMP_POST_DETAIL&ownerId=21&sessionKey=template-session',
    )
    expect(init).toMatchObject({
      method: 'DELETE',
      keepalive: true,
      credentials: 'omit',
      headers: {
        Authorization: 'Bearer test-token',
      },
    })
    expect(manager.getRulesLockState().status).toBe('holding')
  })

  it('keeps a held template rules lock available for awaited unmount release after keepalive', async () => {
    vi.mocked(acquireLock).mockResolvedValue(null as any)
    vi.mocked(releaseLock).mockResolvedValue(undefined as any)
    const manager = useTemplateRulesManager({
      getSessionKey: () => 'template-session',
      getPageResource: () => ({
        resourceId: 21,
        resourceType: 'TEMP_POST_DETAIL',
        resourceScope: 'OWNED',
      }),
    })

    await manager.ensureRulesEditable()
    manager.releaseAllLocksKeepalive()
    await manager.releaseAllLocks()

    expect(releaseLock).toHaveBeenCalledTimes(1)
    expect(releaseLock).toHaveBeenCalledWith({
      resourceType: 'TEMP_RULES',
      resourceScope: 'OWNED',
      ownerType: 'TEMP_POST_DETAIL',
      ownerId: 21,
    }, 'template-session')
    expect(manager.getRulesLockState().status).toBe('idle')
  })
})
