import { describe, expect, it } from 'vitest'

import { collectWebBuilderResourceParticipants } from './resourceContributions.js'
import type {
  WebBuilderFeaturePlugin,
  WebBuilderPluginContext,
} from './index.js'

const createContext = (): WebBuilderPluginContext => ({
  resource: { resourceType: 'PAGE' },
  projectData: null,
  usedComponentTypes: new Set(),
  capabilityIds: new Set(),
  tenant: {
    roles: [],
    permissions: new Set(),
  },
  editor: {} as any,
  commands: {},
  hostServices: {},
  route: {
    getQuery: () => ({}),
    replaceQuery: () => undefined,
    onBeforeLeave: () => () => undefined,
  },
  settings: {
    getSnapshot: () => null,
    hydrate: () => undefined,
    subscribe: () => () => undefined,
  },
  ui: {
    confirm: async () => true,
    message: {
      success: () => undefined,
      warning: () => undefined,
      info: () => undefined,
      error: () => undefined,
    },
  },
  registerCleanup: () => undefined,
})

describe('collectWebBuilderResourceParticipants', () => {
  it('ignores malformed runtime resource contribution values', () => {
    const plugins: WebBuilderFeaturePlugin[] = [
      { id: 'missing', alwaysEnabled: true },
      { id: 'nullish', alwaysEnabled: true, resources: null as any },
      { id: 'object', alwaysEnabled: true, resources: {} as any },
      { id: 'provider-object', alwaysEnabled: true, resources: [() => ({}) as any] },
    ]

    expect(collectWebBuilderResourceParticipants(plugins, createContext())).toEqual([])
  })
})
