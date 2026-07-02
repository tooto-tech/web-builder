import { describe, expect, it, vi } from 'vitest'

import { createWebBuilderPluginManager } from '../../../../../packages/webbuilder/src/core/pluginManager.js'
import type { WebBuilderFeaturePlugin, WebBuilderPluginActivationContext } from '../../../../../packages/webbuilder/src/core/index.js'

const createActivationContext = (
  overrides: Partial<WebBuilderPluginActivationContext> = {},
): WebBuilderPluginActivationContext => ({
  resource: { resourceType: 'PAGE' },
  projectData: null,
  usedComponentTypes: new Set(),
  capabilityIds: new Set(),
  tenant: {
    roles: [],
    permissions: new Set(),
  },
  commands: {},
  hostServices: {},
  route: {
    getQuery: () => ({}),
    replaceQuery: vi.fn(),
    onBeforeLeave: () => () => undefined,
  },
  settings: {
    getSnapshot: () => null,
    hydrate: vi.fn(),
    subscribe: () => () => undefined,
  },
  ui: {
    confirm: vi.fn(async () => true),
    message: {
      success: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    },
  },
  ...overrides,
})

const createPlugin = (
  id: string,
  overrides: Partial<WebBuilderFeaturePlugin> = {},
): WebBuilderFeaturePlugin => ({
  id,
  alwaysEnabled: true,
  ...overrides,
})

describe('createWebBuilderPluginManager', () => {
  it('does not throw when cleanup runs after GrapesJS has already removed the plugin', () => {
    const plugins = new Map<string, unknown>()
    const editor = {
      Plugins: {
        add: vi.fn((descriptor) => {
          plugins.set(descriptor.id, descriptor)
          descriptor.plugin(editor)
          return descriptor
        }),
        get: vi.fn((id: string) => plugins.get(id)),
        remove: vi.fn((id: string) => {
          if (!plugins.has(id)) {
            throw new TypeError("Cannot read properties of undefined (reading 'remove')")
          }
          plugins.delete(id)
        }),
      },
    }
    const dispose = createWebBuilderPluginManager([
      createPlugin('basic'),
    ]).activateEditor(editor as any, createActivationContext())

    plugins.delete('basic')

    expect(() => dispose()).not.toThrow()
    expect(editor.Plugins.remove).not.toHaveBeenCalled()
  })
})
