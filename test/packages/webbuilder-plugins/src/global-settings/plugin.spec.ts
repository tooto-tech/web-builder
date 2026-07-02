import { describe, expect, it, vi } from 'vitest'

import { createGlobalSettingsPlugin } from '../../../../../packages/webbuilder-plugins/src/global-settings/plugin.js'
import { createGlobalSettingsSource } from '../../../../../packages/webbuilder-plugins/src/global-settings/runtime/settingsSource.js'
import { GLOBAL_SETTINGS_STYLE_IDS } from '../../../../../packages/webbuilder-plugins/src/global-settings/runtime/canvasInjection.js'
import type { GlobalSettingsSnapshot, WebBuilderPluginContext } from '@toototech/webbuilder/core'

const PROJECT_PAINT_EVENT = 'webbuilder:project:paint'

class FakeElement {
  id = ''
  rel = ''
  href = ''
  textContent = ''
  private readonly attributes = new Map<string, string>()
  private parent: FakeHead | null = null

  constructor(readonly tagName: string) {}

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value)
  }

  getAttribute(name: string) {
    return this.attributes.get(name) ?? null
  }

  attachTo(parent: FakeHead) {
    this.parent = parent
  }

  remove() {
    this.parent?.removeChild(this)
    this.parent = null
  }
}

class FakeHead {
  readonly children: FakeElement[] = []

  appendChild(element: FakeElement) {
    this.children.push(element)
    element.attachTo(this)
    return element
  }

  removeChild(element: FakeElement) {
    const index = this.children.indexOf(element)
    if (index >= 0) {
      this.children.splice(index, 1)
    }
  }

  querySelector(selector: string) {
    const googleFontMatch = selector.match(/^link\[data-wb-gf="([^"]+)"\]$/)
    if (googleFontMatch) {
      return (
        this.children.find(
          element =>
            element.tagName === 'link' &&
            element.getAttribute('data-wb-gf') === googleFontMatch[1]
        ) ?? null
      )
    }
    return null
  }
}

class FakeDocument {
  readonly head = new FakeHead()
  readonly documentElement = new FakeHead()

  createElement(tagName: string) {
    return new FakeElement(tagName)
  }

  getElementById(id: string) {
    return this.head.children.find(element => element.id === id) ?? null
  }
}

const createSnapshot = (): GlobalSettingsSnapshot => ({
  version: 'draft-1',
  colors: [{ id: 'brand' }],
  typography: { fontFamily: 'Inter' },
  customCss: ':root { --brand: red; }',
  customCode: [
    {
      id: 'head',
      position: 'head',
      enabled: true,
      code: '<script>window.globalSettingsLoaded = true</script>',
    },
  ],
})

const createContext = (
  overrides: Partial<WebBuilderPluginContext> = {}
): WebBuilderPluginContext => ({
  editor: {} as any,
  resource: {
    resourceId: 12,
    resourceType: 'PAGE',
  },
  projectData: null,
  usedComponentTypes: new Set(),
  capabilityIds: new Set(),
  tenant: {
    tenantId: 'tenant-1',
    roles: [],
    permissions: new Set(),
  },
  commands: {},
  hostServices: {},
  settings: createGlobalSettingsSource(),
  ui: {
    confirm: vi.fn(async () => true),
    message: {
      success: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    },
  },
  route: {
    getQuery: () => ({}),
    replaceQuery: vi.fn(),
    onBeforeLeave: () => () => undefined,
  },
  registerCleanup: vi.fn(),
  ...overrides,
})

describe('globalSettings feature plugin', () => {
  it('declares a publisher contribution for published global settings assets', async () => {
    const plugin = createGlobalSettingsPlugin()

    expect(plugin.publisher).toMatchObject({
      id: 'publisher:global-settings',
      order: 20,
    })
    const assets = await plugin.publisher?.render?.({
      projectData: null,
      globalSettings: createSnapshot(),
    })

    expect(assets).toMatchObject({
      css: expect.stringContaining('--wb-global-font-family'),
      headHtml: expect.stringContaining('<script>'),
    })
  })

  it('hydrates draft global settings before project data is loaded', async () => {
    const snapshot = createSnapshot()
    const loadDraft = vi.fn(async () => snapshot)
    const context = createContext({
      hostServices: {
        globalSettings: {
          loadDraft,
          saveDraft: vi.fn(),
          publish: vi.fn(),
        },
      },
    })
    const plugin = createGlobalSettingsPlugin()

    await plugin.beforeProjectLoad?.(context)

    expect(loadDraft).toHaveBeenCalledWith({
      resource: context.resource,
      tenantId: 'tenant-1',
    })
    expect(context.settings.getSnapshot()).toBe(snapshot)
  })

  it('does not reload draft global settings when the settings source is already hydrated', async () => {
    const settings = createGlobalSettingsSource()
    const snapshot = createSnapshot()
    settings.hydrate(snapshot)
    const loadDraft = vi.fn(async () => ({
      ...snapshot,
      version: 'stale',
    }))
    const context = createContext({
      settings,
      hostServices: {
        globalSettings: {
          loadDraft,
          saveDraft: vi.fn(),
          publish: vi.fn(),
        },
      },
    })
    const plugin = createGlobalSettingsPlugin()

    await plugin.beforeProjectLoad?.(context)

    expect(loadDraft).not.toHaveBeenCalled()
    expect(context.settings.getSnapshot()).toBe(snapshot)
  })

  it('does not require a global settings host service in tests or disabled hosts', async () => {
    const context = createContext()
    const plugin = createGlobalSettingsPlugin()

    await expect(plugin.beforeProjectLoad?.(context)).resolves.toBeUndefined()
    expect(context.settings.getSnapshot()).toBeNull()
  })

  it('injects the hydrated snapshot into the canvas and cleans up subscriptions', () => {
    const doc = new FakeDocument()
    const settings = createGlobalSettingsSource()
    settings.hydrate(createSnapshot())
    const listeners = new Map<string, (eventData?: unknown) => void>()
    const editor = {
      Canvas: {
        getDocument: () => doc,
      },
      on: vi.fn((eventName: string, callback: (eventData?: unknown) => void) => {
        listeners.set(eventName, callback)
      }),
      off: vi.fn(),
    }
    const context = createContext({
      editor: editor as any,
      settings,
    })
    const plugin = createGlobalSettingsPlugin()

    const cleanup = plugin.activateEditor?.(context)

    expect(doc.getElementById(GLOBAL_SETTINGS_STYLE_IDS.customCss)?.textContent).toBe(
      ':root { --brand: red; }'
    )

    settings.hydrate({
      ...createSnapshot(),
      customCss: '.updated { color: red; }',
    })

    expect(doc.getElementById(GLOBAL_SETTINGS_STYLE_IDS.customCss)?.textContent).toBe(
      '.updated { color: red; }'
    )

    cleanup?.()
    settings.hydrate(createSnapshot())

    expect(doc.getElementById(GLOBAL_SETTINGS_STYLE_IDS.customCss)).toBeNull()
    expect(editor.off).toHaveBeenCalledWith('load', expect.any(Function))
    expect(editor.off).toHaveBeenCalledWith('canvas:frame:load', expect.any(Function))
  })

  it('injects an already hydrated snapshot when the canvas document becomes available after activation', () => {
    const doc = new FakeDocument()
    const settings = createGlobalSettingsSource()
    settings.hydrate(createSnapshot())
    const listeners = new Map<string, (eventData?: unknown) => void>()
    let canvasDocument: FakeDocument | null = null
    const editor = {
      Canvas: {
        getDocument: () => canvasDocument,
      },
      on: vi.fn((eventName: string, callback: (eventData?: unknown) => void) => {
        listeners.set(eventName, callback)
      }),
      off: vi.fn(),
    }
    const context = createContext({
      editor: editor as any,
      settings,
    })
    const plugin = createGlobalSettingsPlugin()

    plugin.activateEditor?.(context)

    expect(doc.getElementById(GLOBAL_SETTINGS_STYLE_IDS.customCss)).toBeNull()

    canvasDocument = doc
    listeners.get(PROJECT_PAINT_EVENT)?.()

    expect(doc.getElementById(GLOBAL_SETTINGS_STYLE_IDS.customCss)?.textContent).toBe(
      ':root { --brand: red; }'
    )
  })
})
