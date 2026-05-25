import { describe, expect, it } from 'vitest'
import { applyLanguageSwitcherPreviewToProjectData } from './languageSwitcher'

const languages = [
  {
    id: 1,
    name: 'English (United States)',
    code: 'en_US',
    slug: 'en',
    sortOrder: 20,
    status: 0,
    defaultLang: 1,
    createTime: new Date()
  },
  {
    id: 2,
    name: '繁体中文 (Chinese)',
    code: 'zh_TW',
    slug: 'zh-tw',
    sortOrder: 30,
    status: 0,
    defaultLang: 0,
    createTime: new Date()
  }
]

describe('language switcher preview', () => {
  it('injects enabled languages without changing the source project data shape', async () => {
    const projectData: any = {
      pages: [
        {
          frames: [
            {
              component: {
                components: [
                  {
                    type: 'wb-language-switcher',
                    attributes: {
                      'data-wb-component': 'language-switcher',
                      'data-wb-language-label-mode': 'name'
                    },
                    classes: ['wb-language-switcher'],
                    components: [
                      {
                        tagName: 'button',
                        classes: ['wb-language-switcher__toggle'],
                        components: [
                          {
                            tagName: 'span',
                            classes: ['wb-language-switcher__current'],
                            components: [{ type: 'textnode', content: 'English' }]
                          }
                        ]
                      },
                      {
                        tagName: 'div',
                        classes: ['wb-language-switcher__menu'],
                        components: [
                          {
                            tagName: 'a',
                            classes: ['wb-language-switcher__option', 'custom-option'],
                            attributes: {
                              href: '#',
                              style: 'color:red',
                              'data-keep': '1'
                            },
                            components: [
                              {
                                tagName: 'span',
                                classes: ['wb-language-switcher__option-label'],
                                components: [{ type: 'textnode', content: 'English' }]
                              }
                            ]
                          }
                        ]
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

    const result = await applyLanguageSwitcherPreviewToProjectData(projectData, {
      currentLocale: 'zh_TW',
      languages
    })

    const switcher = projectData.pages[0].frames[0].component.components[0]
    const current = switcher.components[0].components[0]
    const options = switcher.components[1].components

    expect(result).toEqual({ changed: true, languageCount: 2 })
    expect(switcher.attributes['data-wb-language-current-slug']).toBe('zh-tw')
    expect(current.components[0].content).toBe('繁体中文')
    expect(options).toHaveLength(2)
    expect(options[0].attributes['data-language-slug']).toBe('en')
    expect(options[0].components[0].components[0].content).toBe('English')
    expect(options[0].attributes.style).toBe('color:red')
    expect(options[0].attributes['data-keep']).toBe('1')
    expect(options[1].classes).toContain('is-active')
    expect(options[1].attributes['aria-current']).toBe('page')
  })
})
