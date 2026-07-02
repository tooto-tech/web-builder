import { describe, expect, it, vi } from 'vitest'

import { usePublishController } from './usePublishController.js'
import type { WebBuilderFeaturePlugin } from '../../core/index.js'

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
  getSnapshot: () => ({
    version: 'settings-v1',
    colors: [],
    typography: {},
    customCss: '',
    customCode: [],
  }),
  hydrate: () => undefined,
  subscribe: () => () => undefined,
})

const createEditor = () => ({
  getProjectData: vi.fn(() => ({
    pages: [{ component: { type: 'wb-hero' } }],
  })),
})

const baseOptions = (overrides: Record<string, unknown> = {}) => ({
  editor: createEditor(),
  resource: { resourceId: 1, resourceType: 'PAGE', resourceScope: 'OWNED' },
  hostServices: {
    page: {
      saveDraft: vi.fn(),
      publish: vi.fn(async request => ({ ...(request as Record<string, unknown>), updateTime: 'published-at' })),
      publishLayoutPage: vi.fn(),
      generateCss: vi.fn(async () => ({ css: '.generated {}' })),
      getDraft: vi.fn(),
      getHistoryDetail: vi.fn(),
      getPagePage: vi.fn(),
    },
  },
  saveDraft: vi.fn(async () => true),
  plugins: [],
  commands: {},
  tenant: { roles: [], permissions: new Set<string>() },
  settings: createSettings(),
  ui: createUi(),
  route: createRoute(),
  getSessionKey: () => 'session-1',
  getResourceName: () => 'Home',
  getBaseUpdateTime: () => 'draft-at',
  setBaseUpdateTime: vi.fn(),
  ...overrides,
})

describe('usePublishController', () => {
  it('runs beforePublish, saves draft, renders publisher assets, publishes, and runs success hooks', async () => {
    const order: string[] = []
    const plugin: WebBuilderFeaturePlugin = {
      id: 'publisher',
      alwaysEnabled: true,
      beforePublish: () => {
        order.push('beforePublish')
      },
      publisher: {
        id: 'publisher:test',
        render: async () => {
          order.push('publisher')
          return { css: '.publisher {}', metadata: { publisher: true } }
        },
      },
      afterPublishSuccess: () => {
        order.push('afterPublishSuccess')
      },
    }
    const options = baseOptions({ plugins: [plugin] })
    const controller = usePublishController(options as any)

    await expect(controller.publish()).resolves.toBe(true)

    expect(order).toEqual(['beforePublish', 'publisher', 'afterPublishSuccess'])
    expect(options.saveDraft).toHaveBeenCalledWith({ silent: true })
    expect(options.hostServices.page.generateCss).toHaveBeenCalledWith(expect.objectContaining({
      schemaJson: expect.stringContaining('wb-hero'),
    }))
    expect(options.hostServices.page.publish).toHaveBeenCalledWith(expect.objectContaining({
      resourceId: 1,
      resourceName: 'Home',
      schemaJson: expect.stringContaining('wb-hero'),
      baseUpdateTime: 'draft-at',
      sessionKey: 'session-1',
      publisherAssets: expect.objectContaining({
        css: '.publisher {}',
        metadata: { publisher: true },
      }),
      generatedCss: { css: '.generated {}' },
    }))
    expect(options.setBaseUpdateTime).toHaveBeenCalledWith('published-at')
  })

  it('stops before saving when beforePublish returns false', async () => {
    const plugin: WebBuilderFeaturePlugin = {
      id: 'blocking',
      alwaysEnabled: true,
      beforePublish: () => false,
    }
    const options = baseOptions({ plugins: [plugin] })
    const controller = usePublishController(options as any)

    await expect(controller.publish()).resolves.toBe(false)

    expect(options.saveDraft).not.toHaveBeenCalled()
    expect(options.hostServices.page.publish).not.toHaveBeenCalled()
  })

  it('blocks page publish when publishing dirty resource participants fails', async () => {
    const plugin: WebBuilderFeaturePlugin = {
      id: 'resources',
      alwaysEnabled: true,
      resources: [() => [{
        id: 'shared-publish',
        label: 'Shared publish',
        isDirty: true,
        flushDraft: vi.fn(),
        publish: vi.fn(async () => ({ success: false, message: 'shared failed' })),
        releaseLock: vi.fn(),
        failurePolicy: 'blocking',
      }]],
    }
    const options = baseOptions({ plugins: [plugin] })
    const controller = usePublishController(options as any)

    await expect(controller.publish()).resolves.toBe(false)

    expect(options.hostServices.page.publish).not.toHaveBeenCalled()
    expect(options.ui.message.error).toHaveBeenCalledWith('shared failed')
  })

  it('guards against re-entrant publish calls', async () => {
    const options = baseOptions({
      saveDraft: vi.fn(async () => new Promise<boolean>(() => undefined)),
    })
    const controller = usePublishController(options as any)

    const first = controller.publish()
    await expect(controller.publish()).resolves.toBe(false)

    expect(controller.isPublishing.value).toBe(true)
    expect(options.saveDraft).toHaveBeenCalledTimes(1)
    void first
  })
})
