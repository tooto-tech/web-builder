import { describe, expect, it } from 'vitest'

import {
  DEFAULT_WEB_BUILDER_DEVICES,
  resolveWebBuilderOptions,
} from '../../../../../packages/webbuilder/src/core/editorOptions.js'

describe('resolveWebBuilderOptions', () => {
  it('resolves an empty options object to SDK-like defaults', () => {
    const resolved = resolveWebBuilderOptions()

    expect(resolved.devices).toEqual(DEFAULT_WEB_BUILDER_DEVICES)
    expect(resolved.grapesjs.height).toBe('100%')
    expect(resolved.grapesjs.storageManager).toBe(false)
    expect(resolved.grapesjs.panels).toEqual({ defaults: [] })
    expect(resolved.canvas.frameReset).toBe(true)
    expect(resolved.canvas.bottomDropZone).toBe(true)
    expect(resolved.storage).toBeUndefined()
    expect(resolved.theme).toEqual({})
    expect(resolved.i18n).toEqual({ messages: {} })
    expect(resolved.capabilities.capabilityIds.size).toBe(0)
  })

  it('rejects duplicate feature plugin ids before editor init', () => {
    expect(() =>
      resolveWebBuilderOptions({
        plugins: [
          { id: 'duplicate', alwaysEnabled: true },
          { id: 'duplicate', alwaysEnabled: true },
        ],
      }),
    ).toThrow('Duplicate WebBuilder feature plugin id "duplicate"')
  })

  it('uses provided devices in both resolved options and grapesjs config', () => {
    const devices = [
      { id: 'wide', name: 'Wide', width: '' },
      { id: 'narrow', name: 'Narrow', width: '390px', widthMedia: '480px' },
    ]

    const resolved = resolveWebBuilderOptions({ devices })

    expect(resolved.devices).toEqual(devices)
    expect(resolved.grapesjs.deviceManager).toEqual({ devices })
  })

  it('preserves host-owned storage, theme, and i18n options', () => {
    const storage = {
      mode: 'backend' as const,
      supportsConflictOverride: true,
      getDraft: async () => null,
      saveDraft: async request => ({ ...request }),
      generateCss: async () => null,
      getHistoryDetail: async () => null,
      load: async () => null,
      save: async request => ({ ...request }),
    }

    const resolved = resolveWebBuilderOptions({
      storage,
      theme: { '--wb-color-accent': '#1d4ed8' },
      i18n: {
        locale: 'zh-CN',
        messages: {
          publish: '发布',
        },
      },
    })

    expect(resolved.storage).toBe(storage)
    expect(resolved.theme).toEqual({ '--wb-color-accent': '#1d4ed8' })
    expect(resolved.i18n).toEqual({
      locale: 'zh-CN',
      messages: {
        publish: '发布',
      },
    })
  })
})
