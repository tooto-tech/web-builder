import { describe, expect, it, vi } from 'vitest'

import { useDraftController } from '../../../../../../packages/webbuilder/src/vue/controllers/useDraftController.js'
import type { WebBuilderFeaturePlugin } from '../../../../../../packages/webbuilder/src/core/index.js'

const createUi = () => ({
  confirm: vi.fn(async () => true),
  message: {
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
})

const createRoute = () => ({
  getQuery: () => ({}),
  replaceQuery: () => undefined,
  onBeforeLeave: () => () => undefined,
})

const createSettings = () => ({
  getSnapshot: () => null,
  hydrate: () => undefined,
  subscribe: () => () => undefined,
})

const createEditor = (projectData: Record<string, unknown> = { pages: [] }) => ({
  getProjectData: vi.fn(() => projectData),
})

const baseOptions = (overrides: Record<string, unknown> = {}) => ({
  editor: createEditor(),
  resource: { resourceId: 1, resourceType: 'PAGE', resourceScope: 'OWNED' },
  hostServices: {
    page: {
      saveDraft: vi.fn(async request => ({ ...(request as Record<string, unknown>), updateTime: 't2' })),
      getDraft: vi.fn(),
      generateCss: vi.fn(),
      getHistoryDetail: vi.fn(),
      getPagePage: vi.fn(),
    },
  },
  plugins: [],
  commands: {},
  tenant: { roles: [], permissions: new Set<string>() },
  settings: createSettings(),
  ui: createUi(),
  route: createRoute(),
  getSessionKey: () => 'session-1',
  getResourceName: () => 'Home',
  ...overrides,
})

describe('useDraftController', () => {
  it('runs save hooks, serialization hooks, host save, and success hooks in order', async () => {
    const order: string[] = []
    const plugin: WebBuilderFeaturePlugin = {
      id: 'hooks',
      alwaysEnabled: true,
      beforeSave: () => {
        order.push('beforeSave')
      },
      beforeProjectSerialize: () => {
        order.push('beforeProjectSerialize')
      },
      afterSaveSuccess: () => {
        order.push('afterSaveSuccess')
      },
    }
    const options = baseOptions({ plugins: [plugin] })
    const controller = useDraftController(options as any)

    await expect(controller.saveDraft()).resolves.toBe(true)

    expect(order).toEqual(['beforeSave', 'beforeProjectSerialize', 'afterSaveSuccess'])
    expect(options.hostServices.page.saveDraft).toHaveBeenCalledWith(expect.objectContaining({
      resourceId: 1,
      resourceName: 'Home',
      sessionKey: 'session-1',
      forceOverride: false,
    }))
    expect(controller.isDirty.value).toBe(false)
  })

  it('stops before serialization when beforeSave returns false', async () => {
    const plugin: WebBuilderFeaturePlugin = {
      id: 'blocking',
      alwaysEnabled: true,
      beforeSave: () => false,
    }
    const editor = createEditor()
    const options = baseOptions({ editor, plugins: [plugin] })
    const controller = useDraftController(options as any)

    await expect(controller.saveDraft()).resolves.toBe(false)

    expect(editor.getProjectData).not.toHaveBeenCalled()
    expect(options.hostServices.page.saveDraft).not.toHaveBeenCalled()
  })

  it('flushes dirty resource participants before saving the page draft', async () => {
    const flushDraft = vi.fn(async () => ({ success: true }))
    const plugin: WebBuilderFeaturePlugin = {
      id: 'resources',
      alwaysEnabled: true,
      resources: [() => [{
        id: 'global-settings',
        label: 'Global settings',
        isDirty: true,
        flushDraft,
        publish: vi.fn(),
        releaseLock: vi.fn(),
        failurePolicy: 'blocking',
      }]],
    }
    const options = baseOptions({ plugins: [plugin] })
    const controller = useDraftController(options as any)

    await expect(controller.saveDraft()).resolves.toBe(true)

    expect(flushDraft).toHaveBeenCalledTimes(1)
    expect(options.hostServices.page.saveDraft).toHaveBeenCalledTimes(1)
  })

  it('blocks page saving when a blocking resource participant fails', async () => {
    const plugin: WebBuilderFeaturePlugin = {
      id: 'resources',
      alwaysEnabled: true,
      resources: [() => [{
        id: 'global-settings',
        label: 'Global settings',
        isDirty: true,
        flushDraft: vi.fn(async () => ({ success: false, message: 'failed' })),
        publish: vi.fn(),
        releaseLock: vi.fn(),
        failurePolicy: 'blocking',
      }]],
    }
    const options = baseOptions({ plugins: [plugin] })
    const controller = useDraftController(options as any)

    await expect(controller.saveDraft()).resolves.toBe(false)

    expect(options.hostServices.page.saveDraft).not.toHaveBeenCalled()
    expect(options.ui.message.error).toHaveBeenCalledWith('failed')
  })

  it('retries conflict saves with force override when the host confirms', async () => {
    const options = baseOptions()
    options.hostServices.page.saveDraft = vi.fn()
      .mockRejectedValueOnce({ code: 1009012001, message: 'conflict' })
      .mockResolvedValueOnce({ updateTime: 't3' })
    const controller = useDraftController(options as any)

    await expect(controller.saveDraft()).resolves.toBe(true)

    expect(options.ui.confirm).toHaveBeenCalledWith({
      title: '保存冲突',
      message: '页面已被他人修改，是否强制覆盖？',
      confirmText: '强制覆盖',
      cancelText: '取消',
    })
    expect(options.hostServices.page.saveDraft).toHaveBeenNthCalledWith(2, expect.objectContaining({
      forceOverride: true,
    }))
  })

  it('loads draft data through host services and hydrates the editor', async () => {
    const loadProjectData = vi.fn()
    const options = baseOptions({
      editor: {
        ...createEditor(),
        loadProjectData,
      },
    })
    options.hostServices.page.getDraft = vi.fn(async () => ({
      schemaJson: JSON.stringify({ pages: [{ id: 'home' }] }),
      updateTime: 'loaded-at',
    }))
    const controller = useDraftController(options as any)

    await expect(controller.loadDraft()).resolves.toEqual({ pages: [{ id: 'home' }] })

    expect(loadProjectData).toHaveBeenCalledWith({ pages: [{ id: 'home' }] })
    expect(controller.baseUpdateTime.value).toBe('loaded-at')
    expect(controller.currentPage.value).toEqual(expect.objectContaining({ updateTime: 'loaded-at' }))
  })
})
