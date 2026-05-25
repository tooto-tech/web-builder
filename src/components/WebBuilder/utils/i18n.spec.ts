import { describe, expect, it } from 'vitest'
import {
  WB_I18N_KEY_ATTR,
  WB_I18N_SKIP_ATTR,
  applyI18nTranslationsToProjectData,
  collectI18nKeysFromModel,
  ensureModelI18nKeys,
  extractI18nEntriesFromProjectData,
  hashI18nSource,
  isIdentityTranslationAllowed,
  isModelI18nSkipped,
  mergeI18nEntries,
  setModelI18nSkipped,
  stripI18nTranslationsFromProjectData
} from './i18n'

class MockComponent {
  attrs: Record<string, any>
  children: MockComponent[]
  content: string
  type: string
  name: string

  constructor(options: {
    attrs?: Record<string, any>
    children?: MockComponent[]
    content?: string
    type?: string
    name?: string
  }) {
    this.attrs = options.attrs ?? {}
    this.children = options.children ?? []
    this.content = options.content ?? ''
    this.type = options.type ?? 'text'
    this.name = options.name ?? ''
  }

  get(key: string) {
    if (key === 'attributes') return this.attrs
    if (key === 'components') return this.children
    if (key === 'content') return this.content
    if (key === 'type') return this.type
    if (key === 'name') return this.name
    return undefined
  }

  getAttributes() {
    return this.attrs
  }

  addAttributes(attrs: Record<string, any>) {
    this.attrs = { ...this.attrs, ...attrs }
  }

  components() {
    return this.children
  }
}

const makeProjectData = () => ({
  pages: [
    {
      id: 'home',
      name: 'Home',
      custom: {
        tdkTitle: 'Home title',
        tdkDescription: 'Home description',
        tdkKeywords: 'bearing, motor',
        tdk: {
          title: 'Home title',
          description: 'Home description',
          keywords: 'bearing, motor'
        }
      },
      frames: [
        {
          component: {
            components: [
              {
                type: 'text',
                attributes: { [WB_I18N_KEY_ATTR]: 'hero_title' },
                components: 'Source headline'
              },
              {
                type: 'image',
                attributes: {
                  [WB_I18N_KEY_ATTR]: 'hero_image',
                  alt: 'Source alt',
                  title: 'Source title',
                  'aria-label': 'Source aria'
                }
              },
              {
                type: 'button',
                attributes: { [WB_I18N_KEY_ATTR]: 'cta_button' },
                slideButtonText: 'Contact now',
                config: {
                  items: [
                    { title: 'First item', description: 'First description', href: '/keep-url' }
                  ]
                }
              },
              {
                type: 'paragraph',
                attributes: { [WB_I18N_KEY_ATTR]: 'body_copy' },
                components: [
                  {
                    type: 'textnode',
                    content: 'Nested text node'
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  ]
})

describe('WebBuilder i18n utilities', () => {
  it('extracts source entries without putting translations in the source schema', () => {
    const projectData = makeProjectData()
    const entries = extractI18nEntriesFromProjectData(projectData)

    expect(entries.some((entry) => entry.key === 'hero_title' && entry.field === 'text')).toBe(true)
    expect(entries.some((entry) => entry.key === 'hero_image' && entry.field === 'alt')).toBe(true)
    expect(
      entries.some((entry) => entry.key === 'hero_image' && entry.field === 'aria-label')
    ).toBe(true)
    expect(
      entries.some((entry) => entry.key === 'page:home:seo' && entry.field === 'seo.title')
    ).toBe(true)
    expect(
      entries.some((entry) => entry.key === 'cta_button' && entry.field === 'prop:slideButtonText')
    ).toBe(true)
    expect(
      entries.some(
        (entry) => entry.key === 'cta_button' && entry.field === 'prop:config/items/0/description'
      )
    ).toBe(true)
    expect(
      entries.some(
        (entry) => entry.key === 'body_copy' && entry.field === 'prop:components/0/content'
      )
    ).toBe(true)
    expect(entries.some((entry) => entry.componentType === 'textnode')).toBe(false)
    expect(entries.some((entry) => `${entry.field}`.includes('href'))).toBe(false)

    const translated = applyI18nTranslationsToProjectData(projectData, [
      {
        key: 'hero_title',
        field: 'text',
        source: 'Source headline',
        sourceHash: hashI18nSource('Source headline'),
        translation: 'Translated headline'
      },
      {
        key: 'hero_image',
        field: 'aria-label',
        source: 'Source aria',
        sourceHash: hashI18nSource('Source aria'),
        translation: 'Translated aria'
      },
      {
        key: 'cta_button',
        field: 'prop:slideButtonText',
        source: 'Contact now',
        sourceHash: hashI18nSource('Contact now'),
        translation: 'Jetzt kontaktieren'
      },
      {
        key: 'cta_button',
        field: 'prop:config/items/0/title',
        source: 'First item',
        sourceHash: hashI18nSource('First item'),
        translation: 'Erster Eintrag'
      },
      {
        key: 'body_copy',
        field: 'prop:components/0/content',
        source: 'Nested text node',
        sourceHash: hashI18nSource('Nested text node'),
        translation: 'Verschachtelter Text'
      }
    ])

    expect(projectData.pages[0].frames[0].component.components[0].components).toBe(
      'Source headline'
    )
    expect(projectData.pages[0].frames[0].component.components[2].slideButtonText).toBe(
      'Contact now'
    )
    expect(translated?.pages[0].frames[0].component.components[0].components).toBe(
      'Translated headline'
    )
    expect(translated?.pages[0].frames[0].component.components[1].attributes['aria-label']).toBe(
      'Translated aria'
    )
    expect(translated?.pages[0].frames[0].component.components[2].slideButtonText).toBe(
      'Jetzt kontaktieren'
    )
    expect(translated?.pages[0].frames[0].component.components[2].config.items[0].title).toBe(
      'Erster Eintrag'
    )
    expect(translated?.pages[0].frames[0].component.components[2].config.items[0].href).toBe(
      '/keep-url'
    )
    expect(translated?.pages[0].frames[0].component.components[3].components[0].content).toBe(
      'Verschachtelter Text'
    )
  })

  it('uses wb-image imageAlt without extracting duplicate generated inner img alt', () => {
    const projectData: any = {
      pages: [
        {
          id: 'gallery',
          frames: [
            {
              component: {
                components: [
                  {
                    type: 'wb-image',
                    imageSrc: 'https://example.com/image.jpg',
                    imageAlt: '2025: The Future of AI',
                    attributes: { [WB_I18N_KEY_ATTR]: 'history_image' },
                    components: [
                      {
                        tagName: 'img',
                        attributes: {
                          [WB_I18N_KEY_ATTR]: 'history_image_inner',
                          src: 'https://example.com/image.jpg',
                          alt: '2025: The Future of AI'
                        }
                      }
                    ]
                  }
                ]
              }
            }
          ]
        }
      ]
    }

    const entries = extractI18nEntriesFromProjectData(projectData)

    expect(
      entries.some((entry) => entry.key === 'history_image' && entry.field === 'prop:imageAlt')
    ).toBe(true)
    expect(entries.some((entry) => entry.key === 'history_image_inner')).toBe(false)

    const translated = applyI18nTranslationsToProjectData(projectData, [
      {
        key: 'history_image',
        field: 'prop:imageAlt',
        source: '2025: The Future of AI',
        sourceHash: hashI18nSource('2025: The Future of AI'),
        translation: '2025：AI 的未来'
      }
    ])
    const image = translated?.pages[0].frames[0].component.components[0]

    expect(image.imageAlt).toBe('2025：AI 的未来')
    expect(image.components[0].attributes.alt).toBe('2025：AI 的未来')
  })

  it('strips translation-only data from project data', () => {
    const stripped = stripI18nTranslationsFromProjectData({
      pages: [],
      wbI18nTranslations: { 'zh-CN': {} },
      attributes: {
        [WB_I18N_KEY_ATTR]: 'stable_key',
        'data-wb-i18n-locale': 'zh-CN'
      }
    })

    expect(stripped).not.toHaveProperty('wbI18nTranslations')
    expect(stripped.attributes).toEqual({ [WB_I18N_KEY_ATTR]: 'stable_key' })
  })

  it('skips non-translatable literals during extraction but still allows identity results', () => {
    const projectData: any = {
      pages: [
        {
          id: 'footer',
          custom: {},
          frames: [
            {
              component: {
                components: [
                  {
                    type: 'text',
                    attributes: { [WB_I18N_KEY_ATTR]: 'email' },
                    components: 'info@thb-bearing.com'
                  },
                  {
                    type: 'text',
                    attributes: { [WB_I18N_KEY_ATTR]: 'phone' },
                    components: '+86 021 54846037'
                  },
                  {
                    type: 'text',
                    attributes: { [WB_I18N_KEY_ATTR]: 'copyright' },
                    components:
                      '© 2025 thbbearing. All rights reserved. Designed and developed by Toototech.'
                  },
                  {
                    type: 'text',
                    attributes: { [WB_I18N_KEY_ATTR]: 'copy' },
                    components: 'Contact our bearing experts'
                  }
                ]
              }
            }
          ]
        }
      ]
    }

    const entries = extractI18nEntriesFromProjectData(projectData)

    expect(entries.some((entry) => entry.key === 'copy')).toBe(true)
    expect(entries.some((entry) => entry.key === 'email')).toBe(false)
    expect(entries.some((entry) => entry.key === 'phone')).toBe(false)
    expect(entries.some((entry) => entry.key === 'copyright')).toBe(false)
    expect(isIdentityTranslationAllowed('info@thb-bearing.com')).toBe(true)
    expect(isIdentityTranslationAllowed('+86 021 54846037')).toBe(true)
  })

  it('lets selected GrapesJS components opt out of i18n extraction and preview application', () => {
    const textNode = new MockComponent({ type: 'textnode', content: 'Copyright text' }) as any
    const footer = new MockComponent({
      type: 'footer',
      attrs: { [WB_I18N_KEY_ATTR]: 'footer_copy' },
      children: [textNode]
    }) as any
    textNode.parent = () => footer

    expect(setModelI18nSkipped(textNode, true)).toBe(true)
    expect(isModelI18nSkipped(textNode)).toBe(true)
    expect(footer.attrs[WB_I18N_SKIP_ATTR]).toBe('true')
    expect(footer.attrs.translate).toBe('no')
    expect(collectI18nKeysFromModel(textNode, { includeAncestors: true }).size).toBe(0)

    const projectData: any = {
      pages: [
        {
          id: 'home',
          custom: {},
          frames: [
            {
              component: {
                components: [
                  {
                    type: 'footer',
                    attributes: {
                      [WB_I18N_KEY_ATTR]: 'footer_copy',
                      [WB_I18N_SKIP_ATTR]: 'true',
                      translate: 'no'
                    },
                    components: [
                      {
                        type: 'textnode',
                        content: 'Copyright text'
                      }
                    ]
                  }
                ]
              }
            }
          ]
        }
      ]
    }

    expect(extractI18nEntriesFromProjectData(projectData)).toEqual([])
    const translated = applyI18nTranslationsToProjectData(projectData, [
      {
        key: 'footer_copy',
        field: 'prop:components/0/content',
        source: 'Copyright text',
        sourceHash: hashI18nSource('Copyright text'),
        translation: 'Urheberrecht'
      }
    ])

    expect(translated?.pages[0].frames[0].component.components[0].components[0].content).toBe(
      'Copyright text'
    )

    expect(setModelI18nSkipped(footer, false)).toBe(true)
    expect(isModelI18nSkipped(footer)).toBe(false)
    expect(footer.attrs[WB_I18N_SKIP_ATTR]).toBeUndefined()
    expect(footer.attrs.translate).toBeUndefined()
  })

  it('keeps save/load project data free of preview-only translation state', () => {
    const source = makeProjectData()
    const translated = applyI18nTranslationsToProjectData(source, [
      {
        key: 'page:home:seo',
        field: 'seo.title',
        source: 'Home title',
        sourceHash: hashI18nSource('Home title'),
        translation: 'Startseite'
      },
      {
        key: 'cta_button',
        field: 'prop:config/items/0/description',
        source: 'First description',
        sourceHash: hashI18nSource('First description'),
        translation: 'Erste Beschreibung'
      }
    ])
    const saved = stripI18nTranslationsFromProjectData(source)

    expect(translated?.pages[0].custom.tdkTitle).toBe('Startseite')
    expect(translated?.pages[0].frames[0].component.components[2].config.items[0].description).toBe(
      'Erste Beschreibung'
    )
    const savedButton = saved.pages[0].frames[0].component.components[2]!
    expect(saved.pages[0].custom.tdkTitle).toBe('Home title')
    expect((savedButton as any).config.items[0].description).toBe('First description')
  })

  it('ignores circular editor references while scanning visible config values', () => {
    const circularConfig: any = {
      title: 'Visible card title',
      nested: {
        description: 'Visible nested description'
      }
    }
    circularConfig.self = circularConfig

    const projectData: any = {
      pages: [
        {
          id: 'cyclic',
          frames: [
            {
              component: {
                components: [
                  {
                    type: 'custom-card',
                    attributes: { [WB_I18N_KEY_ATTR]: 'cyclic_card' },
                    settings: circularConfig
                  }
                ]
              }
            }
          ]
        }
      ]
    }

    const entries = extractI18nEntriesFromProjectData(projectData)

    expect(
      entries.some((entry) => entry.key === 'cyclic_card' && entry.field === 'prop:settings/title')
    ).toBe(true)
    expect(
      entries.some(
        (entry) => entry.key === 'cyclic_card' && entry.field === 'prop:settings/nested/description'
      )
    ).toBe(true)
  })

  it('marks entries stale when the saved source hash no longer matches', () => {
    const [entry] = mergeI18nEntries(
      [
        {
          key: 'hero_title',
          field: 'text',
          source: 'New source',
          sourceHash: hashI18nSource('New source')
        }
      ],
      [
        {
          key: 'hero_title',
          field: 'text',
          source: 'Old source',
          sourceHash: hashI18nSource('Old source'),
          translation: 'Saved translation'
        }
      ]
    )

    expect(entry.status).toBe('stale')
    expect(entry.reviewStatus).toBe('reviewed')
  })

  it('marks old translated entries as ready without review workflow', () => {
    const [entry] = mergeI18nEntries(
      [
        {
          key: 'hero_title',
          field: 'text',
          source: 'Source',
          sourceHash: hashI18nSource('Source')
        }
      ],
      [
        {
          key: 'hero_title',
          field: 'text',
          source: 'Source',
          sourceHash: hashI18nSource('Source'),
          translation: 'Saved translation',
          status: 'translated'
        }
      ]
    )

    expect(entry.status).toBe('translated')
    expect(entry.reviewStatus).toBe('reviewed')
  })

  it('treats unchanged sentence translations as missing but allows identity brand terms', () => {
    const [sentence, brand] = mergeI18nEntries(
      [
        {
          key: 'hero_title',
          field: 'text',
          source: 'More than bearings. Support your bearing decisions.',
          sourceHash: hashI18nSource('More than bearings. Support your bearing decisions.')
        },
        {
          key: 'brand',
          field: 'text',
          source: 'THB',
          sourceHash: hashI18nSource('THB')
        }
      ],
      [
        {
          key: 'hero_title',
          field: 'text',
          source: 'More than bearings. Support your bearing decisions.',
          sourceHash: hashI18nSource('More than bearings. Support your bearing decisions.'),
          translation: 'More than bearings. Support your bearing decisions.'
        },
        {
          key: 'brand',
          field: 'text',
          source: 'THB',
          sourceHash: hashI18nSource('THB'),
          translation: 'THB'
        }
      ]
    )

    expect(sentence.status).toBe('missing')
    expect(sentence.translation).toBe('')
    expect(brand.status).toBe('translated')
    expect(brand.translation).toBe('THB')
    expect(isIdentityTranslationAllowed('THB')).toBe(true)
    expect(isIdentityTranslationAllowed('Home')).toBe(false)
  })

  it('keeps explicit backend translated identity results', () => {
    const [entry] = mergeI18nEntries(
      [
        {
          key: 'hero_title',
          field: 'text',
          source: 'Heading',
          sourceHash: hashI18nSource('Heading')
        }
      ],
      [
        {
          key: 'hero_title',
          field: 'text',
          source: 'Heading',
          sourceHash: hashI18nSource('Heading'),
          translation: 'Heading',
          status: 'translated'
        }
      ]
    )

    expect(entry.status).toBe('translated')
    expect(entry.translation).toBe('Heading')
    expect(entry.reviewStatus).toBe('reviewed')
  })

  it('ensures GrapesJS model i18n keys are unique and key textnode parents', () => {
    const first = new MockComponent({
      attrs: { [WB_I18N_KEY_ATTR]: 'duplicate_key' },
      content: 'First'
    })
    const second = new MockComponent({
      attrs: { [WB_I18N_KEY_ATTR]: 'duplicate_key' },
      content: 'Second'
    })
    const textNode = new MockComponent({ type: 'textnode', content: 'Nested text' })
    const paragraph = new MockComponent({ type: 'paragraph', children: [textNode] })
    const wrapper = new MockComponent({ children: [first, second, paragraph] })
    const editor = { getWrapper: () => wrapper }

    ensureModelI18nKeys(editor)

    expect(first.attrs[WB_I18N_KEY_ATTR]).toBe('duplicate_key')
    expect(second.attrs[WB_I18N_KEY_ATTR]).not.toBe('duplicate_key')
    expect(second.attrs[WB_I18N_KEY_ATTR]).toMatch(/^wb_/)
    expect(paragraph.attrs[WB_I18N_KEY_ATTR]).toMatch(/^wb_/)
    expect(textNode.attrs[WB_I18N_KEY_ATTR]).toBeUndefined()
  })

  it('does not serialize live GrapesJS models while assigning keys', () => {
    const component = new MockComponent({ content: 'Live model text', type: 'headline' }) as any
    component.toJSON = () => {
      throw new Error('live model serialization should not run')
    }
    const wrapper = new MockComponent({ children: [component] })
    const editor = { getWrapper: () => wrapper }

    expect(() => ensureModelI18nKeys(editor)).not.toThrow()
    expect(component.attrs[WB_I18N_KEY_ATTR]).toMatch(/^wb_/)
  })

  it('collects parent i18n key when the selected GrapesJS model is a text node', () => {
    const textNode = new MockComponent({ type: 'textnode', content: 'Nested text' }) as any
    const paragraph = new MockComponent({
      attrs: { [WB_I18N_KEY_ATTR]: 'paragraph_key' },
      type: 'paragraph',
      children: [textNode]
    }) as any
    textNode.parent = () => paragraph

    const keys = collectI18nKeysFromModel(textNode, { includeAncestors: true })

    expect(keys.has('paragraph_key')).toBe(true)
  })

  it('does not include ancestor keys when the selected model already has i18n keys', () => {
    const textNode = new MockComponent({ type: 'textnode', content: 'Nested text' }) as any
    const heading = new MockComponent({
      attrs: { [WB_I18N_KEY_ATTR]: 'heading_key' },
      type: 'heading',
      children: [textNode]
    }) as any
    const slide = new MockComponent({
      attrs: { [WB_I18N_KEY_ATTR]: 'slide_key' },
      type: 'home-banner-slide',
      children: [heading]
    }) as any
    textNode.parent = () => heading
    heading.parent = () => slide

    const headingKeys = collectI18nKeysFromModel(heading, { includeAncestors: true })
    const textNodeKeys = collectI18nKeysFromModel(textNode, { includeAncestors: true })

    expect([...headingKeys]).toEqual(['heading_key'])
    expect([...textNodeKeys]).toEqual(['heading_key'])
  })
})
