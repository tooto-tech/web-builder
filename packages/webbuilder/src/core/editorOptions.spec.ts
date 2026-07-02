import { describe, expect, it } from 'vitest'

import {
  DEFAULT_WEB_BUILDER_DEVICES,
  resolveWebBuilderOptions,
} from './editorOptions.js'

describe('resolveWebBuilderOptions', () => {
  it('resolves an empty options object to SDK-like defaults', () => {
    const resolved = resolveWebBuilderOptions()

    expect(resolved.devices).toEqual(DEFAULT_WEB_BUILDER_DEVICES)
    expect(resolved.grapesjs.height).toBe('100%')
    expect(resolved.grapesjs.storageManager).toBe(false)
    expect(resolved.grapesjs.panels).toEqual({ defaults: [] })
    expect(resolved.canvas.frameReset).toBe(true)
    expect(resolved.canvas.bottomDropZone).toBe(true)
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
})
