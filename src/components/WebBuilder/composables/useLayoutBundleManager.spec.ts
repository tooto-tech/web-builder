import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { acquireLock, getDraft, getPagePage, releaseLock } from '@/api/content/page'
import { config as axiosConfig } from '@/config/axios/config'
import {
  LAYOUT_PAGE_RESOURCE_SCOPE,
  LAYOUT_PAGE_RESOURCE_TYPES,
} from '../config/layoutSharedResources'
import useLayoutBundleManager from './useLayoutBundleManager'
import useLayoutSettings from './useLayoutSettings'

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
  getPagePage: vi.fn(),
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

describe('useLayoutBundleManager', () => {
  beforeEach(() => {
    useLayoutSettings().reset()
    vi.clearAllMocks()
    vi.mocked(getDraft).mockReset()
    vi.mocked(getPagePage).mockReset()
    vi.mocked(getPagePage).mockResolvedValue({
      total: 0,
      list: [],
    } as any)
    vi.stubGlobal('window', {
      location: { origin: 'http://localhost' },
    })
    axiosConfig.base_url = 'http://localhost:48080/admin-api'
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(null))))
  })

  it('loads shared layout drafts in content mode', async () => {
    const manager = useLayoutBundleManager({
      getEditorMode: () => 'content',
    })

    await manager.loadLayoutDrafts({
      assets: [],
      styles: [],
      pages: [],
    })

    expect(getPagePage).toHaveBeenCalledTimes(2)
    expect(getPagePage).toHaveBeenNthCalledWith(1, {
      pageNo: 1,
      pageSize: 200,
      status: 'draft',
      resourceType: LAYOUT_PAGE_RESOURCE_TYPES.header,
      resourceScope: LAYOUT_PAGE_RESOURCE_SCOPE,
    })
    expect(getPagePage).toHaveBeenNthCalledWith(2, {
      pageNo: 1,
      pageSize: 200,
      status: 'draft',
      resourceType: LAYOUT_PAGE_RESOURCE_TYPES.footer,
      resourceScope: LAYOUT_PAGE_RESOURCE_SCOPE,
    })
  })

  it('releases a held layout rules lock with keepalive for beforeunload', async () => {
    vi.mocked(acquireLock).mockResolvedValue(null as any)
    const manager = useLayoutBundleManager({
      getEditorMode: () => 'layout',
      getSessionKey: () => 'layout-session',
      getPageResource: () => ({
        resourceId: 11,
        resourceType: LAYOUT_PAGE_RESOURCE_TYPES.header,
        resourceScope: LAYOUT_PAGE_RESOURCE_SCOPE,
      }),
    })

    await manager.ensureRulesEditable()
    manager.releaseAllLocksKeepalive()

    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe(
      'http://localhost:48080/admin-api/cms/page/lock/release?resourceType=LAYOUT_RULES&resourceScope=OWNED&ownerType=LAYOUT_PAGE_HEADER&ownerId=11&sessionKey=layout-session',
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

  it('uses the explicit edit session key for layout rules locks', async () => {
    vi.mocked(acquireLock).mockResolvedValue(null as any)
    const manager = useLayoutBundleManager({
      getEditorMode: () => 'layout',
      session: ref({
        sessionKey: 'explicit-layout-session',
        hasEditLock: true,
        hasUnsavedChanges: false,
      }),
      getSessionKey: () => 'legacy-layout-session',
      getPageResource: () => ({
        resourceId: 11,
        resourceType: LAYOUT_PAGE_RESOURCE_TYPES.header,
        resourceScope: LAYOUT_PAGE_RESOURCE_SCOPE,
      }),
    })

    await manager.ensureRulesEditable()

    expect(acquireLock).toHaveBeenCalledWith(expect.objectContaining({
      sessionKey: 'explicit-layout-session',
    }))
  })

  it('keeps legacy layout rule migration out of beforeunload dirtiness', async () => {
    vi.mocked(getDraft).mockRejectedValueOnce(new Error('rules draft missing'))
    const manager = useLayoutBundleManager({
      getEditorMode: () => 'layout',
      getPageResource: () => ({
        resourceId: 11,
        resourceKey: 'layout.header.wb-header',
        resourceType: LAYOUT_PAGE_RESOURCE_TYPES.header,
        resourceScope: LAYOUT_PAGE_RESOURCE_SCOPE,
      }),
    })

    await manager.loadLayoutDrafts({
      assets: [],
      styles: [],
      pages: [
        {
          id: 'wb-header',
          name: 'Header',
          custom: {
            wbLayoutSlot: 'header',
            wbLayoutPageId: 'wb-header',
          },
        },
      ],
      wbLayoutSettings: {
        version: 1,
        header: {
          defaultLayoutId: null,
          rules: [
            {
              id: 'legacy-rule',
              layoutId: 'wb-header',
              matchMode: 'include',
              pageIds: ['home'],
              enabled: true,
              priority: 10,
            },
          ],
        },
        footer: {
          defaultLayoutId: null,
          rules: [],
        },
      },
    })

    expect(manager.hasPendingChanges.value).toBe(true)
    expect(manager.hasUnsavedUserChanges.value).toBe(false)
  })

  it('keeps a held layout rules lock available for awaited unmount release after keepalive', async () => {
    vi.mocked(acquireLock).mockResolvedValue(null as any)
    vi.mocked(releaseLock).mockResolvedValue(undefined as any)
    const manager = useLayoutBundleManager({
      getEditorMode: () => 'layout',
      getSessionKey: () => 'layout-session',
      getPageResource: () => ({
        resourceId: 11,
        resourceType: LAYOUT_PAGE_RESOURCE_TYPES.header,
        resourceScope: LAYOUT_PAGE_RESOURCE_SCOPE,
      }),
    })

    await manager.ensureRulesEditable()
    manager.releaseAllLocksKeepalive()
    await manager.releaseAllLocks()

    expect(releaseLock).toHaveBeenCalledTimes(1)
    expect(releaseLock).toHaveBeenCalledWith({
      resourceType: 'LAYOUT_RULES',
      resourceScope: 'OWNED',
      ownerType: LAYOUT_PAGE_RESOURCE_TYPES.header,
      ownerId: 11,
    }, 'layout-session')
    expect(manager.getRulesLockState().status).toBe('idle')
  })
})
