import { describe, expect, it } from 'vitest'
import {
  WB_I18N_KEY_ATTR,
  applyI18nTranslationsToProjectData,
  extractI18nEntriesFromProjectData,
  hashI18nSource,
} from '../../../../../packages/webbuilder-plugins/src/localization/i18n'

describe('webbuilder-i18n utilities', () => {
  it('extracts and applies project data translations without mutating the source', () => {
    const projectData: any = {
      pages: [
        {
          id: 'home',
          custom: { tdkTitle: 'Home title' },
          frames: [
            {
              component: {
                components: [
                  {
                    type: 'text',
                    attributes: { [WB_I18N_KEY_ATTR]: 'hero_title' },
                    components: 'Source headline',
                  },
                ],
              },
            },
          ],
        },
      ],
    }

    const entries = extractI18nEntriesFromProjectData(projectData)

    expect(entries.some(entry => entry.key === 'hero_title')).toBe(true)
    expect(entries.some(entry => entry.key === 'page:home:seo' && entry.field === 'seo.title')).toBe(true)

    const translated = applyI18nTranslationsToProjectData(projectData, [
      {
        key: 'hero_title',
        field: 'prop:components/0/content',
        source: 'Source headline',
        sourceHash: hashI18nSource('Source headline'),
        translation: 'Translated headline',
      },
    ])

    expect(projectData.pages[0].frames[0].component.components[0].components).toBe('Source headline')
    expect(translated?.pages[0].frames[0].component.components[0].components).toBe('Translated headline')
  })
})
