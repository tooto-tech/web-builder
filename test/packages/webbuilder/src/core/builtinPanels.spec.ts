import { describe, expect, it } from 'vitest'

import {
  collectBuiltinWebBuilderPanels,
  collectWebBuilderPanelContributions,
  type WebBuilderFeaturePlugin,
} from '../../../../../packages/webbuilder/src/core/index.js'

describe('collectBuiltinWebBuilderPanels', () => {
  it('combines built-in panels with plugin panels using contribution ordering', () => {
    const plugins: WebBuilderFeaturePlugin[] = [
      {
        id: 'plugin-panels',
        label: 'Plugin Panels',
        panels: [
          { id: 'seo', label: 'SEO', icon: 'seo-icon', order: 30 },
          { id: 'settings', label: 'Settings', icon: 'settings-icon', order: 15 },
        ],
      },
    ]

    expect(collectBuiltinWebBuilderPanels(collectWebBuilderPanelContributions(plugins))).toEqual([
      expect.objectContaining({ id: 'blocks', order: 10 }),
      expect.objectContaining({ id: 'settings', order: 15 }),
      expect.objectContaining({ id: 'styles', order: 20 }),
      expect.objectContaining({ id: 'seo', order: 30 }),
      expect.objectContaining({ id: 'layers', order: 40 }),
      expect.objectContaining({ id: 'assets', order: 60 }),
    ])
  })

  it('rejects plugin panels that duplicate built-in panel ids', () => {
    expect(() =>
      collectBuiltinWebBuilderPanels([
        { id: 'styles', label: 'Plugin Styles', order: 5 },
      ])
    ).toThrow('Duplicate WebBuilder panel id "styles"')
  })
})
