import { describe, expect, it, vi } from 'vitest'

import {
  createWebBuilderPublisherPluginRegistry,
  renderWebBuilderPublisherAssets,
  type TenantContext,
  type WebBuilderFeaturePlugin,
  type WebBuilderPluginResolveContext,
  type WebBuilderPublisherContribution,
} from './index.js'

const createTenant = (): TenantContext => ({
  roles: [],
  permissions: new Set(),
})

const createResolveContext = (
  overrides: Partial<WebBuilderPluginResolveContext> = {}
): WebBuilderPluginResolveContext => ({
  resource: { resourceType: 'PAGE', resourceId: 10 },
  projectData: null,
  usedComponentTypes: new Set(),
  capabilityIds: new Set(),
  tenant: createTenant(),
  ...overrides,
})

describe('webbuilder publisher package API', () => {
  it('resolves active plugins and collects publisher contributions from the package root', () => {
    const plugins: WebBuilderFeaturePlugin[] = [
      {
        id: 'global-settings',
        order: 20,
        alwaysEnabled: true,
        publisher: {
          id: 'publisher:global-settings',
          order: 20,
        },
      },
      {
        id: 'cms-components',
        order: 90,
        loadComponentTypes: ['wb-cms-post-list'],
        publisher: {
          id: 'publisher:cms-components',
          order: 90,
        },
      },
      {
        id: 'inactive',
        order: 10,
        publisher: {
          id: 'publisher:inactive',
          order: 10,
        },
      },
    ]

    const registry = createWebBuilderPublisherPluginRegistry({
      plugins,
      resolveContext: createResolveContext({
        usedComponentTypes: new Set(['wb-cms-post-list']),
      }),
    })

    expect(registry.activePlugins.map(plugin => plugin.id)).toEqual([
      'global-settings',
      'cms-components',
    ])
    expect(registry.publisherContributions.map(contribution => contribution.id)).toEqual([
      'publisher:global-settings',
      'publisher:cms-components',
    ])
  })

  it('merges rendered publisher assets in contribution order', async () => {
    const renderGlobalSettings = vi.fn(() => ({
      css: ':root { --brand: #000; }',
      headHtml: '<link rel="stylesheet" href="/global.css">',
      metadata: {
        globalSettings: {
          version: 'settings-v1',
        },
      },
    }))
    const renderI18n = vi.fn(async () => ({
      css: '.translated { font-variant-east-asian: normal; }',
      bodyEndHtml: '<script>window.i18nReady = true</script>',
      metadata: {
        globalSettings: {
          hash: 'settings-hash',
        },
        i18n: {
          bundle: 'zh-CN',
        },
      },
    }))
    const contributions: WebBuilderPublisherContribution[] = [
      {
        id: 'publisher:global-settings',
        order: 20,
        render: renderGlobalSettings,
      },
      {
        id: 'publisher:marker',
        order: 30,
      },
      {
        id: 'publisher:i18n',
        order: 100,
        render: renderI18n,
      },
    ]

    const assets = await renderWebBuilderPublisherAssets(contributions, {
      projectData: { pages: [] },
      globalSettings: null,
    })

    expect(renderGlobalSettings).toHaveBeenCalledBefore(renderI18n)
    expect(assets).toEqual({
      css: [
        ':root { --brand: #000; }',
        '.translated { font-variant-east-asian: normal; }',
      ].join('\n'),
      headHtml: '<link rel="stylesheet" href="/global.css">',
      bodyEndHtml: '<script>window.i18nReady = true</script>',
      metadata: {
        globalSettings: {
          version: 'settings-v1',
          hash: 'settings-hash',
        },
        i18n: {
          bundle: 'zh-CN',
        },
      },
    })
  })
})
