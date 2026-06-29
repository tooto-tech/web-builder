import { describe, expect, it } from 'vitest'

import { renderGlobalSettingsPublishedAssets } from './publisher.js'
import type { GlobalSettingsSnapshot } from '@toototech/webbuilder-core'

const createSnapshot = (
  overrides: Partial<GlobalSettingsSnapshot> = {}
): GlobalSettingsSnapshot => ({
  version: 'draft-1',
  hash: 'hash-1',
  updatedAt: '2026-06-02T00:00:00.000Z',
  colors: [{ id: 'brand', value: '#ff0000' }],
  typography: {
    fontFamily: 'Inter',
    googleName: 'Inter',
  },
  customCss: '.demo { color: var(--wb-gc-brand); }',
  customCode: [
    {
      id: 'head',
      position: 'head',
      enabled: true,
      code: '<script>window.headLoaded = true</script>',
    },
    {
      id: 'disabled',
      position: 'head',
      enabled: false,
      code: '<script>window.disabledLoaded = true</script>',
    },
    {
      id: 'body-start',
      position: 'body-start',
      enabled: true,
      code: '<div id="body-start"></div>',
    },
    {
      id: 'body-end',
      position: 'body-end',
      enabled: true,
      code: '<script>window.bodyEndLoaded = true</script>',
    },
  ],
  ...overrides,
})

describe('global settings publisher assets', () => {
  it('renders CSS, font link, custom code positions, and metadata from a published snapshot', () => {
    const assets = renderGlobalSettingsPublishedAssets(createSnapshot())

    expect(assets.css).toContain('--wb-gc-brand: #ff0000;')
    expect(assets.css).toContain('--wb-global-font-family: Inter, sans-serif;')
    expect(assets.css).toContain('.demo { color: var(--wb-gc-brand); }')
    expect(assets.headHtml).toContain(
      'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
    )
    expect(assets.headHtml).toContain('<script>window.headLoaded = true</script>')
    expect(assets.headHtml).not.toContain('disabledLoaded')
    expect(assets.bodyStartHtml).toBe('<div id="body-start"></div>')
    expect(assets.bodyEndHtml).toBe('<script>window.bodyEndLoaded = true</script>')
    expect(assets.metadata).toEqual({
      globalSettings: {
        version: 'draft-1',
        hash: 'hash-1',
        updatedAt: '2026-06-02T00:00:00.000Z',
      },
    })
  })

  it('omits empty head and body fragments while keeping generated baseline CSS', () => {
    const assets = renderGlobalSettingsPublishedAssets(
      createSnapshot({
        typography: {},
        customCss: '',
        customCode: [],
      })
    )

    expect(assets.css).toContain(':root')
    expect(assets.headHtml).toBe('')
    expect(assets.bodyStartHtml).toBe('')
    expect(assets.bodyEndHtml).toBe('')
  })
})
