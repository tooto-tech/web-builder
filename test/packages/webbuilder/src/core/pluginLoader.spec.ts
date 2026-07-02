import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadPluginFromCode } from '../../../../../packages/webbuilder/src/core/pluginLoader.js'

describe('pluginLoader', () => {
  const originalDocument = globalThis.document
  const originalWindow = globalThis.window
  const originalCreateObjectUrl = URL.createObjectURL
  const originalRevokeObjectUrl = URL.revokeObjectURL

  beforeEach(() => {
    const plugin = vi.fn()
    const createdScripts: any[] = []

    ;(globalThis as any).window = {
      'grapesjs-demo-plugin': plugin,
    }
    ;(globalThis as any).document = {
      querySelector: vi.fn(() => null),
      createElement: vi.fn(() => {
        const script = {
          async: false,
          dataset: {} as Record<string, string>,
          onload: null as null | (() => void),
          onerror: null as null | (() => void),
          src: '',
        }
        createdScripts.push(script)
        return script
      }),
      head: {
        appendChild: vi.fn((script: any) => {
          script.onload?.()
        }),
      },
      __createdScripts: createdScripts,
    }
    ;(URL as any).createObjectURL = vi.fn(() => 'blob:webbuilder-plugin')
    ;(URL as any).revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    ;(globalThis as any).document = originalDocument
    ;(globalThis as any).window = originalWindow
    ;(URL as any).createObjectURL = originalCreateObjectUrl
    ;(URL as any).revokeObjectURL = originalRevokeObjectUrl
  })

  it('loads plugin source through a temporary URL and uses filename-derived globals', async () => {
    const fn = await loadPluginFromCode('window["grapesjs-demo-plugin"] = () => {}', {
      filename: 'grapesjs-demo-plugin.js',
    })

    expect(fn).toBe((globalThis.window as any)['grapesjs-demo-plugin'])
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:webbuilder-plugin')
    expect((globalThis.document as any).head.appendChild).toHaveBeenCalledOnce()
    expect((globalThis.document as any).__createdScripts[0].dataset.wbPluginSrc).toBe(
      'blob:webbuilder-plugin'
    )
  })
})
