import { describe, expect, it, vi } from 'vitest'

import { createLayoutTemplatePlugin } from '../../../../../packages/webbuilder-plugins/src/layout-templates/plugin'
import type {
  ResourceTransactionParticipant,
  WebBuilderPluginContext,
} from '@toototech/webbuilder/core'

const createContext = (): WebBuilderPluginContext => ({
  editor: {} as any,
  resource: { resourceType: 'PAGE' },
  projectData: { pages: [] },
  usedComponentTypes: new Set(),
  capabilityIds: new Set(),
  tenant: {
    roles: [],
    permissions: new Set(),
  },
  commands: {},
  hostServices: {},
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
  route: {
    getQuery: () => ({}),
    replaceQuery: vi.fn(),
    onBeforeLeave: () => () => undefined,
  },
  registerCleanup: vi.fn(),
})

const createParticipant = (id: string): ResourceTransactionParticipant => ({
  id,
  label: id,
  isDirty: true,
  failurePolicy: 'warning',
  flushDraft: () => true,
  publish: () => true,
  releaseLock: () => undefined,
})

describe('layoutTemplate feature plugin', () => {
  it('contributes layout and template panels without importing their implementations', () => {
    const plugin = createLayoutTemplatePlugin()

    expect(plugin.id).toBe('layout-template')
    expect(plugin.alwaysEnabled).toBe(true)
    expect(plugin.panels).toEqual([
      { id: 'layout', label: 'Layout', order: 40 },
      { id: 'template', label: 'Template', order: 50 },
    ])
  })

  it('accepts injected layout and template panel implementations as a panel seam', () => {
    const LayoutPanel = { name: 'LayoutPanel' }
    const TemplateRulesPanel = { name: 'TemplateRulesPanel' }
    const plugin = createLayoutTemplatePlugin({
      panels: {
        layout: {
          component: LayoutPanel,
          props: { source: 'layout-rules' },
        },
        template: {
          component: TemplateRulesPanel,
          props: { previewScope: 'rules-only' },
        },
      },
    })

    expect(plugin.panels).toEqual([
      {
        id: 'layout',
        label: 'Layout',
        order: 40,
        component: LayoutPanel,
        props: { source: 'layout-rules' },
      },
      {
        id: 'template',
        label: 'Template',
        order: 50,
        component: TemplateRulesPanel,
        props: { previewScope: 'rules-only' },
      },
    ])
    expect(plugin.preview).toBeUndefined()
  })

  it('delegates resource participants to the injected runtime', () => {
    const collectResourceParticipants = vi.fn(() => [
      createParticipant('layout-draft'),
      createParticipant('template-rules'),
    ])
    const plugin = createLayoutTemplatePlugin({ collectResourceParticipants })
    const context = createContext()

    expect(plugin.resources?.[0]?.(context).map(participant => participant.id)).toEqual([
      'layout-draft',
      'template-rules',
    ])
    expect(collectResourceParticipants).toHaveBeenCalledWith(context)
  })

  it('combines resource and lock participant seams from the injected runtime', () => {
    const collectResourceParticipants = vi.fn(() => [
      createParticipant('layout-draft'),
    ])
    const collectLockParticipants = vi.fn(() => [
      createParticipant('layout-locks'),
      createParticipant('template-locks'),
    ])
    const plugin = createLayoutTemplatePlugin({
      collectResourceParticipants,
      collectLockParticipants,
    })
    const context = createContext()

    expect(plugin.resources?.[0]?.(context).map(participant => participant.id)).toEqual([
      'layout-draft',
      'layout-locks',
      'template-locks',
    ])
    expect(collectResourceParticipants).toHaveBeenCalledWith(context)
    expect(collectLockParticipants).toHaveBeenCalledWith(context)
  })

  it('delegates beforeProjectLoad to the injected runtime', async () => {
    const beforeProjectLoad = vi.fn(async (context: WebBuilderPluginContext) => {
      context.projectData = { merged: true }
    })
    const plugin = createLayoutTemplatePlugin({ beforeProjectLoad })
    const context = createContext()

    await plugin.beforeProjectLoad?.(context)

    expect(beforeProjectLoad).toHaveBeenCalledWith(context)
    expect(context.projectData).toEqual({ merged: true })
  })
})
