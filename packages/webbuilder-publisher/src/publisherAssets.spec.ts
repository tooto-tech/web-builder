import { describe, expect, it } from 'vitest'

import {
  createWebBuilderPublisherRuntimeRegistry,
  renderWebBuilderPublisherPluginAssets,
} from './publisherAssets.js'
import type { GlobalSettingsSnapshot } from '@toototech/webbuilder-core'

const createGlobalSettingsSnapshot = (): GlobalSettingsSnapshot => ({
  version: 'published-v1',
  hash: 'hash-1',
  updatedAt: '2026-06-02T00:00:00.000Z',
  colors: [{ id: 'brand', value: '#0055ff' }],
  typography: {
    fontFamily: 'Inter',
    googleName: 'Inter',
  },
  customCss: '.published { color: var(--wb-gc-brand); }',
  customCode: [
    {
      id: 'head',
      position: 'head',
      enabled: true,
      code: '<script>window.publisherHead = true</script>',
    },
  ],
})

describe('publisher assets runtime entry', () => {
  it('resolves publisher-safe plugins from project data without activating editor runtimes', () => {
    const registry = createWebBuilderPublisherRuntimeRegistry({
      projectData: {
        pages: [
          {
            frames: [
              {
                component: {
                  type: 'wrapper',
                  components: [{ type: 'wb-cms-post-list' }],
                },
              },
            ],
          },
        ],
      },
      globalSettings: createGlobalSettingsSnapshot(),
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

  it('renders published global settings assets and trace metadata', async () => {
    const assets = await renderWebBuilderPublisherPluginAssets({
      projectData: null,
      globalSettings: createGlobalSettingsSnapshot(),
    })

    expect(assets.css).toContain('--wb-gc-brand: #0055ff;')
    expect(assets.css).toContain('.published { color: var(--wb-gc-brand); }')
    expect(assets.headHtml).toContain(
      'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
    )
    expect(assets.headHtml).toContain('<script>window.publisherHead = true</script>')
    expect(assets.metadata).toEqual({
      globalSettings: {
        version: 'published-v1',
        hash: 'hash-1',
        updatedAt: '2026-06-02T00:00:00.000Z',
      },
    })
  })
})
