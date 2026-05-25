/**
 * usePublish 单元测试
 *
 * 策略：只测试流程控制路径（防重入、schema-only 发布请求和发布结果处理）。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ── 全局 mock：必须在 import 被测模块之前声明 ────────────────────────────────

vi.mock('element-plus', () => ({
  ElMessageBox: { confirm: vi.fn() }
}))

vi.mock('@/components/WebBuilder/utils/wbMessage', () => ({
  wbMessage: { warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() }
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
    const ownerType =
      normalizeString(identity?.ownerType) || (ownerId !== undefined ? resourceType : undefined)
    const resourceId = normalizeNumber(identity?.resourceId)
    const resourceKey = normalizeString(identity?.resourceKey)
    const resourceScope =
      normalizeString(identity?.resourceScope) ||
      (ownerType && ownerId !== undefined ? 'OWNED' : undefined)
    return { resourceId, resourceKey, resourceType, resourceScope, ownerType, ownerId }
  }
  const hasPageResourceLocator = (identity: any) => {
    const n = normalizePageResourceIdentity(identity)
    return Boolean(
      n.resourceId !== undefined || n.resourceKey || (n.ownerType && n.ownerId !== undefined)
    )
  }
  return {
    publishVersion: vi.fn(),
    publishContentPage: vi.fn(),
    hasPageResourceLocator,
    normalizePageResourceIdentity
  }
})

vi.mock('../utils/sessionKey', () => ({
  getOrCreateSessionKey: vi.fn(() => 'test-session-key')
}))

// 其余工具函数 mock
vi.mock('../utils/editorHelpers', () => ({
  getEditorSchemaJson: vi.fn(() => '{}')
}))

const stubRequestAnimationFrame = () =>
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0)
    return 0
  })

// node 环境无 requestAnimationFrame，补全 stub 保证 waitForPaint 可以工作
stubRequestAnimationFrame()

vi.stubGlobal('window', {
  location: { reload: vi.fn() }
})

// ── 被测模块（在 mock 声明之后 import）────────────────────────────────────────

import usePublish from './usePublish'
import { ElMessageBox } from 'element-plus'

// ── 工厂：构建最小 options ────────────────────────────────────────────────────

const makeResource = () => ({
  resourceId: 1,
  resourceKey: 'page-key',
  resourceType: 'PAGE',
  resourceScope: 'OWNED' as const
})

/**
 * 最小化的 editor mock，能通过 usePublish 内部的基本检查。
 */
const makeMinimalEditor = () => ({
  Pages: {
    getAll: vi.fn(() => ({ models: [] })),
    getSelected: vi.fn(() => null)
  },
  getConfig: vi.fn(() => ({ canvas: { styles: [] } })),
  getHtml: vi.fn(() => ''),
  getCss: vi.fn(() => ''),
  getJs: vi.fn(() => '')
})

const makeOptions = (overrides?: Partial<Parameters<typeof usePublish>[0]>) => ({
  pageResource: makeResource,
  getEditor: () => makeMinimalEditor(),
  getSessionKey: () => 'test-session-key',
  getBaseUpdateTime: () => undefined,
  setBaseUpdateTime: vi.fn(),
  ...overrides
})

// ── 测试套件 ──────────────────────────────────────────────────────────────────

describe('usePublish', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    stubRequestAnimationFrame()
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── 场景 1：防重入保护 ──────────────────────────────────────────────────────

  it('isPublishing 为 true 时，publish() 应立即返回 false 且不调用 API', async () => {
    const mockPublishVersion = vi.fn()

    const { publish, isPublishing } = usePublish(
      makeOptions({
        _deps: { publishVersion: mockPublishVersion }
      })
    )

    // 手动设置重入标志
    isPublishing.value = true

    const result = await publish()

    expect(result).toBe(false)
    expect(mockPublishVersion).not.toHaveBeenCalled()
  })

  it('publishes page content without showing its own confirmation prompt', async () => {
    const baseUpdateTime = new Date('2025-12-31T00:00:00Z')
    const mockPublishVersion = vi.fn().mockResolvedValue({
      updateTime: new Date('2026-01-01T00:00:00Z')
    })

    vi.mocked(ElMessageBox.confirm).mockRejectedValue(new Error('confirm should stay in workspace'))

    const { publish } = usePublish(
      makeOptions({
        pageResource: () => ({
          resourceId: 1,
          resourceKey: 'post-key',
          resourceType: 'CMS_POST',
          resourceScope: 'OWNED'
        }),
        getBaseUpdateTime: () => baseUpdateTime,
        _deps: { publishVersion: mockPublishVersion }
      })
    )

    const result = await publish()

    expect(result).toBe(true)
    expect(ElMessageBox.confirm).not.toHaveBeenCalled()
    expect(mockPublishVersion).toHaveBeenCalledTimes(1)
    const payload = mockPublishVersion.mock.calls[0][0]
    expect(payload).toMatchObject({
      resourceId: 1,
      resourceKey: 'post-key',
      resourceType: 'CMS_POST',
      resourceScope: 'OWNED',
      schemaJson: '{}',
      baseUpdateTime,
      sessionKey: 'test-session-key'
    })
    expect(payload).not.toHaveProperty('htmlContent')
    expect(payload).not.toHaveProperty('dataSourceDefinitions')
  })

  it('publishes schema-only payload without regenerating html or data source definitions', async () => {
    vi.stubEnv('VITE_WEBBUILDER_BACKEND_PUBLISHER', 'true')

    const mockPublishVersion = vi.fn().mockResolvedValue({
      updateTime: new Date('2026-01-01T00:00:00Z')
    })
    const dataSources = [{ id: 'products', kind: 'product-list', query: { pageSize: 12 } }]
    const schemaJson = JSON.stringify({
      pages: [{ id: 'home', frames: [{ component: { type: 'wrapper' } }] }],
      dataSources
    })
    const getHtml = vi.fn(() => {
      throw new Error('html generation should not run')
    })

    const { publish } = usePublish(
      makeOptions({
        pageResource: () => ({
          resourceId: 1,
          resourceKey: 'post-key',
          resourceType: 'CMS_POST',
          resourceScope: 'OWNED'
        }),
        getEditor: () => ({
          ...makeMinimalEditor(),
          getHtml
        }),
        serializeSchemaJson: () => schemaJson,
        _deps: { publishVersion: mockPublishVersion }
      })
    )

    const result = await publish()

    expect(result).toBe(true)
    expect(getHtml).not.toHaveBeenCalled()
    expect(mockPublishVersion).toHaveBeenCalledTimes(1)
    const payload = mockPublishVersion.mock.calls[0][0]
    expect(payload).toMatchObject({
      schemaJson
    })
    expect(payload).not.toHaveProperty('htmlContent')
    expect(payload).not.toHaveProperty('dataSourceDefinitions')
  })

  it('does not log raw schema or html content when publish succeeds', async () => {
    const mockPublishVersion = vi.fn().mockResolvedValue({
      updateTime: new Date('2026-01-01T00:00:00Z')
    })
    const schemaJson = JSON.stringify({ secretContent: 'publish-schema-sentinel' })
    const htmlContent = '<main>publish-html-sentinel</main>'
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    vi.mocked(ElMessageBox.confirm).mockResolvedValue({} as any)

    const { publish } = usePublish(
      makeOptions({
        pageResource: () => ({
          resourceId: 1,
          resourceKey: 'post-key',
          resourceType: 'CMS_POST',
          resourceScope: 'OWNED'
        }),
        getEditor: () => ({
          ...makeMinimalEditor(),
          getHtml: vi.fn(() => htmlContent)
        }),
        serializeSchemaJson: () => schemaJson,
        _deps: { publishVersion: mockPublishVersion }
      })
    )

    try {
      const result = await publish()

      expect(result).toBe(true)
      const loggedText = logSpy.mock.calls.map((args) => JSON.stringify(args)).join('\n')
      expect(loggedText).not.toContain('publish-schema-sentinel')
      expect(loggedText).not.toContain('publish-html-sentinel')
      expect(loggedText).not.toContain(schemaJson)
      expect(loggedText).not.toContain(htmlContent)
    } finally {
      logSpy.mockRestore()
    }
  })

  it('marks the next unload as system initiated before auto reloading after publish', async () => {
    const mockPublishVersion = vi.fn().mockResolvedValue({
      updateTime: new Date('2026-01-01T00:00:00Z')
    })
    const onBeforeAutoReload = vi.fn()

    const { publish } = usePublish(
      makeOptions({
        onBeforeAutoReload,
        _deps: { publishVersion: mockPublishVersion }
      })
    )

    await expect(publish()).resolves.toBe(true)

    expect(onBeforeAutoReload).not.toHaveBeenCalled()
    expect(window.location.reload).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(800)

    expect(onBeforeAutoReload).toHaveBeenCalledTimes(1)
    expect(window.location.reload).toHaveBeenCalledTimes(1)
  })
})
