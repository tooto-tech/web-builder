import { describe, expect, it, vi } from 'vitest'

import { useRevisionController } from '../../../../../../packages/webbuilder/src/vue/controllers/useRevisionController.js'
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

describe('useRevisionController', () => {
  it('lists revisions through hostServices.revision', async () => {
    const revision = {
      list: vi.fn(async () => [{ id: 1, createdAt: '2026-07-02T00:00:00.000Z' }]),
      getDetail: vi.fn(),
    }
    const controller = useRevisionController({
      editor: {},
      resource: { resourceId: 1, resourceType: 'PAGE' },
      hostServices: { revision },
      plugins: [],
      ui: createUi(),
      settings: createSettings(),
      route: createRoute(),
    })

    await expect(controller.list({ pageNo: 1 })).resolves.toEqual([
      { id: 1, createdAt: '2026-07-02T00:00:00.000Z' },
    ])
    expect(revision.list).toHaveBeenCalledWith(
      expect.objectContaining({ resourceId: 1 }),
      { pageNo: 1 },
    )
  })

  it('restores revision schema into the editor and marks the draft dirty', async () => {
    const order: string[] = []
    const loadProjectData = vi.fn()
    const markDirty = vi.fn()
    const plugin: WebBuilderFeaturePlugin = {
      id: 'loader',
      alwaysEnabled: true,
      beforeProjectLoad: () => {
        order.push('beforeProjectLoad')
      },
    }
    const revision = {
      list: vi.fn(),
      getDetail: vi.fn(async () => ({
        id: 2,
        schemaJson: JSON.stringify({ pages: [{ id: 'home' }] }),
      })),
    }
    const controller = useRevisionController({
      editor: { loadProjectData },
      resource: { resourceId: 1, resourceType: 'PAGE' },
      hostServices: { revision },
      plugins: [plugin],
      ui: createUi(),
      settings: createSettings(),
      route: createRoute(),
      markDirty,
    })

    await expect(controller.restore(2)).resolves.toBe(true)

    expect(order).toEqual(['beforeProjectLoad'])
    expect(loadProjectData).toHaveBeenCalledWith({ pages: [{ id: 'home' }] })
    expect(markDirty).toHaveBeenCalledTimes(1)
  })

  it('returns false with a host error when revision services are unavailable', async () => {
    const ui = createUi()
    const controller = useRevisionController({
      editor: {},
      resource: { resourceId: 1, resourceType: 'PAGE' },
      hostServices: {},
      plugins: [],
      ui,
      settings: createSettings(),
      route: createRoute(),
    })

    await expect(controller.restore(1)).resolves.toBe(false)
    expect(ui.message.error).toHaveBeenCalledWith('缺少 hostServices.revision.getDetail')
  })
})
