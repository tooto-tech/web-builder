import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── 全局 mock：在 import 源文件之前声明 ──────────────────────────────────────

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

// 完整替代 mock，避免 importOriginal 触发包含 .vue 文件的依赖链
// hasPageResourceLocator / normalizePageResourceIdentity 内联真实实现
vi.mock('@/api/content/page', () => {
  const normalizePageResourceIdentity = (identity: any) => {
    const normalizeString = (v: any) => (typeof v === 'string' && v.trim() ? v.trim() : undefined)
    const normalizeNumber = (v: any) => {
      if (typeof v === 'number' && Number.isFinite(v)) return v
      if (typeof v === 'string') {
        const n = Number(v.trim())
        return Number.isFinite(n) ? n : undefined
      }
      return undefined
    }
    const resourceType = normalizeString(identity?.resourceType)
    const ownerId = normalizeNumber(identity?.ownerId)
    const ownerType = normalizeString(identity?.ownerType) || (ownerId !== undefined ? resourceType : undefined)
    const resourceId = normalizeNumber(identity?.resourceId)
    const resourceKey = normalizeString(identity?.resourceKey)
    const resourceScope = normalizeString(identity?.resourceScope) || (ownerType && ownerId !== undefined ? 'OWNED' : undefined)
    return { resourceId, resourceKey, resourceType, resourceScope, ownerType, ownerId }
  }
  const hasPageResourceLocator = (identity: any) => {
    const n = normalizePageResourceIdentity(identity)
    return Boolean(n.resourceId !== undefined || n.resourceKey || (n.ownerType && n.ownerId !== undefined))
  }
  const buildPageResourceParams = (identity: any) => {
    const n = normalizePageResourceIdentity(identity)
    const params: Record<string, any> = {}
    if (n.resourceId !== undefined) params.resourceId = n.resourceId
    if (n.resourceKey) params.resourceKey = n.resourceKey
    if (n.resourceType) params.resourceType = n.resourceType
    if (n.resourceScope) params.resourceScope = n.resourceScope
    if (n.ownerType) params.ownerType = n.ownerType
    if (n.ownerId !== undefined) params.ownerId = n.ownerId
    return params
  }
  return {
    acquireLock: vi.fn(),
    releaseLock: vi.fn(),
    updateHeartbeat: vi.fn(),
    hasPageResourceLocator,
    normalizePageResourceIdentity,
    buildPageResourceParams,
  }
})

vi.mock('@/config/axios/config', () => ({
  config: { base_url: 'http://localhost' },
}))

vi.mock('@/config/axios', () => ({
  default: vi.fn(),
}))

vi.mock('@/utils/auth', () => ({
  getAccessToken: vi.fn(() => 'test-token'),
  getTenantId: vi.fn(() => null),
  getVisitTenantId: vi.fn(() => null),
}))

vi.mock('../utils/sessionKey', () => ({
  getOrCreateSessionKey: vi.fn(() => 'test-session-key'),
}))

// node 环境没有 window.setInterval，用 vi.stubGlobal 补上
vi.stubGlobal('window', {
  location: { origin: 'http://localhost', reload: vi.fn() },
  setInterval: (fn: () => void, ms: number) => setInterval(fn, ms),
  clearInterval: (id: any) => clearInterval(id),
})

// ── 被测模块（在 mock 声明之后 import）────────────────────────────────────────

import useEditLock from './useEditLock'
import { ElMessageBox } from 'element-plus'

// ── 工厂：构建最小 PageResourceIdentity ────────────────────────────────────────

const makeResource = () => ({
  resourceId: 1,
  resourceKey: 'page-key',
  resourceType: 'PAGE',
  resourceScope: 'OWNED' as const,
})

const makeOptions = (overrides?: any) => ({
  pageResource: () => makeResource(),
  ...overrides,
})

// ── 测试套件 ──────────────────────────────────────────────────────────────────

describe('useEditLock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── 场景 1：获取锁成功 ──────────────────────────────────────────────────────

  it('acquireLock 返回 null 时，hasEditLock 应变为 true', async () => {
    const mockAcquireLock = vi.fn().mockResolvedValue(null)

    const lock = useEditLock(
      makeOptions({
        _deps: { acquireLock: mockAcquireLock },
      }),
    )

    const result = await lock.tryAcquireLock()

    expect(result).toBe(true)
    expect(lock.hasEditLock.value).toBe(true)
    expect(mockAcquireLock).toHaveBeenCalledTimes(1)
  })

  // ── 场景 2：锁被其他用户占用，用户选择取消 ─────────────────────────────────

  it('acquireLock 返回 lockHolder，用户取消确认时，tryAcquireLock 返回 false', async () => {
    const lockHolder = {
      isCurrentSession: false,
      isCurrentUser: false,
      username: '张三',
      resourceId: 1,
      resourceKey: 'page-key',
      resourceType: 'PAGE',
      resourceScope: 'OWNED',
    }
    const mockAcquireLock = vi.fn().mockResolvedValue(lockHolder)
    // 用户点击取消：ElMessageBox.confirm reject
    vi.mocked(ElMessageBox.confirm).mockRejectedValue(new Error('cancel'))

    const lock = useEditLock(
      makeOptions({
        _deps: { acquireLock: mockAcquireLock },
      }),
    )

    const result = await lock.tryAcquireLock()

    expect(result).toBe(false)
    expect(lock.hasEditLock.value).toBe(false)
  })

  // ── 场景 3：心跳检测到被接管，hasEditLock 变为 false ──────────────────────

  it('updateHeartbeat 返回 takenOver=true 时，hasEditLock 应变为 false', async () => {
    const mockAcquireLock = vi.fn().mockResolvedValue(null)
    const mockReleaseLock = vi.fn().mockResolvedValue(undefined)
    const mockUpdateHeartbeat = vi.fn().mockResolvedValue({
      takenOver: true,
      takeoverInfo: { isCurrentUser: false, username: '李四' },
    })

    const lock = useEditLock(
      makeOptions({
        _deps: {
          acquireLock: mockAcquireLock,
          releaseLock: mockReleaseLock,
          updateHeartbeat: mockUpdateHeartbeat,
        },
      }),
    )

    // 先让 hasEditLock = true
    await lock.tryAcquireLock()
    expect(lock.hasEditLock.value).toBe(true)

    // 触发心跳
    await lock.sendHeartbeat()

    expect(lock.hasEditLock.value).toBe(false)
    expect(mockUpdateHeartbeat).toHaveBeenCalledTimes(1)
  })

  // ── 场景 4：释放锁时 releaseLock 应被调用一次 ─────────────────────────────

  it('持有锁时调用 releaseEditLock 应调用 releaseLock 一次', async () => {
    const mockAcquireLock = vi.fn().mockResolvedValue(null)
    const mockReleaseLock = vi.fn().mockResolvedValue(undefined)

    const lock = useEditLock(
      makeOptions({
        _deps: {
          acquireLock: mockAcquireLock,
          releaseLock: mockReleaseLock,
        },
      }),
    )

    // 先获取锁
    await lock.tryAcquireLock()
    expect(lock.hasEditLock.value).toBe(true)

    // 释放锁
    await lock.releaseEditLock()

    expect(mockReleaseLock).toHaveBeenCalledTimes(1)
    expect(lock.hasEditLock.value).toBe(false)
  })
})
