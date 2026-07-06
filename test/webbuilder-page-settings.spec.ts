import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  applyPageSettingsToPage,
  getPageSettingsFromPage,
} from '../packages/webbuilder/src/vue/pageSettings'

describe('page settings helpers', () => {
  it('reads and applies page settings to a GrapesJS page model', () => {
    const values = new Map<string, unknown>([
      ['id', 'home'],
      ['name', 'Home'],
      ['slug', 'home'],
      ['custom', {
        tdkTitle: 'Old title',
        tdkDescription: 'Old description',
        tdkKeywords: 'old',
        customHead: '<meta name="old">',
        customBody: '<script>old()</script>',
        wbPreviewResourceId: 42,
      }],
    ])
    const page = {
      get: (key: string) => values.get(key),
      set: (key: string, value: unknown) => values.set(key, value),
    }

    expect(getPageSettingsFromPage(page)).toMatchObject({
      id: 'home',
      name: 'Home',
      slug: 'home',
      tdkTitle: 'Old title',
      previewResourceId: 42,
    })

    applyPageSettingsToPage(page, {
      id: 'home',
      name: 'Landing',
      slug: 'landing',
      tdkTitle: 'SEO title',
      tdkDescription: 'SEO description',
      tdkKeywords: 'seo,landing',
      customHead: '<meta name="new">',
      customBody: '<script>new()</script>',
      previewResourceId: null,
    })

    expect(values.get('name')).toBe('Landing')
    expect(values.get('slug')).toBe('landing')
    expect(values.get('custom')).toMatchObject({
      slug: 'landing',
      tdkTitle: 'SEO title',
      tdkDescription: 'SEO description',
      tdkKeywords: 'seo,landing',
      tdk: {
        title: 'SEO title',
        description: 'SEO description',
        keywords: 'seo,landing',
      },
      customHead: '<meta name="new">',
      customBody: '<script>new()</script>',
    })
    expect(values.get('custom')).not.toHaveProperty('wbPreviewResourceId')
  })
})

describe('WebBuilder page settings drawer wiring', () => {
  it('opens the package-owned PageSettingsDrawer from the top bar action', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'packages/webbuilder/src/vue/WebBuilder.vue'),
      'utf8',
    )

    expect(source).toContain('PageSettingsDrawer')
    expect(source).toContain('@open-page-settings="openPageSettings"')
    expect(source).not.toContain('@open-page-settings="selectPanel(\'settings\')"')
  })
})
