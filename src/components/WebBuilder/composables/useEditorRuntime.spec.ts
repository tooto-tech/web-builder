import { describe, expect, it, vi } from 'vitest'
import { getEditorRuntime } from './useEditorRuntime'

describe('useEditorRuntime', () => {
  it('reuses one runtime per editor adapter', () => {
    const editor = { on: vi.fn() }

    expect(getEditorRuntime(editor)).toBe(getEditorRuntime(editor))
  })

  it('tracks nested manual load scopes and resets on cleanup', async () => {
    const runtime = getEditorRuntime({ on: vi.fn() })

    const finishOuter = runtime.startManualLoad()
    const finishInner = runtime.startManualLoad()
    expect(runtime.isManualLoad).toBe(true)

    finishInner()
    expect(runtime.isManualLoad).toBe(true)

    finishOuter()
    expect(runtime.isManualLoad).toBe(false)

    await runtime.runManualLoad(async () => {
      expect(runtime.isManualLoad).toBe(true)
    })
    expect(runtime.isManualLoad).toBe(false)

    runtime.startManualLoad()
    runtime.cleanup()
    expect(runtime.isManualLoad).toBe(false)
  })

  it('registers refresh handlers once and removes them on cleanup', () => {
    const runtime = getEditorRuntime({ on: vi.fn() })
    const cmsHandler = vi.fn()
    const templateHandler = vi.fn()

    runtime.onCmsPreviewRefresh(cmsHandler)
    runtime.onCmsPreviewRefresh(cmsHandler)
    const removeTemplateHandler = runtime.onTemplatePreviewRefresh(templateHandler)

    runtime.requestCmsPreviewRefresh(120)
    runtime.requestTemplatePreviewRefresh()
    expect(cmsHandler).toHaveBeenCalledTimes(1)
    expect(cmsHandler).toHaveBeenCalledWith(120)
    expect(templateHandler).toHaveBeenCalledTimes(1)

    removeTemplateHandler()
    runtime.requestTemplatePreviewRefresh()
    expect(templateHandler).toHaveBeenCalledTimes(1)

    runtime.cleanup()
    runtime.requestCmsPreviewRefresh()
    expect(cmsHandler).toHaveBeenCalledTimes(1)
  })

  it('keeps editor-scoped cache in runtime state', () => {
    const runtime = getEditorRuntime({ on: vi.fn() })

    runtime.setCache('template:1', { id: 1 })
    expect(runtime.getCache<{ id: number }>('template:1')).toEqual({ id: 1 })

    runtime.deleteCache('template:1')
    expect(runtime.getCache('template:1')).toBeUndefined()

    runtime.setCache('template:2', 'cached')
    runtime.cleanup()
    expect(runtime.getCache('template:2')).toBeUndefined()
  })
})
