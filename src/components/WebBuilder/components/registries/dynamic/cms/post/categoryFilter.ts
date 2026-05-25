import type { GrapesEditor } from '../../../../../types/editor'
import { registerCmsComponent } from '@/components/WebBuilder/utils/cmsFactory'

export const WB_CMS_POST_CATEGORY_FILTER_TYPE = 'wb-cms-post-category-filter'

const POST_CATEGORY_FILTER_CSS = `
  .wb-post-category-filter {
    display: block;
    width: 100%;
  }
  .wb-post-category-filter__mobile-bar {
    display: none;
  }
  .wb-post-category-filter__all {
    display: inline-flex;
    align-items: center;
    color: inherit;
    font-size: 28px;
    line-height: 1.2;
    font-weight: 700;
    margin: 0 0 48px;
    text-align: left;
    text-decoration: none;
  }
  .wb-post-category-filter__groups {
    display: grid;
    gap: 40px;
  }
  .wb-post-category-filter__group {
    display: grid;
    gap: 18px;
  }
  .wb-post-category-filter__group + .wb-post-category-filter__group {
    padding-top: 40px;
    border-top: 1px solid currentColor;
  }
  .wb-post-category-filter__group-title {
    margin: 0;
    color: inherit;
    font-size: 18px;
    line-height: 1.35;
    font-weight: 700;
  }
  .wb-post-category-filter__group-prefix,
  .wb-post-category-filter__group-name {
    font: inherit;
  }
  .wb-post-category-filter__group-count,
  .wb-post-category-filter__option-count {
    opacity: 0.62;
    font-weight: inherit;
  }
  .wb-post-category-filter__options {
    display: grid;
    gap: 14px;
  }
  .wb-post-category-filter__option {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: inherit;
    font-size: 16px;
    line-height: 1.45;
    text-decoration: none;
  }
  .wb-post-category-filter__option-check {
    position: relative;
    display: inline-block;
    width: 14px;
    height: 14px;
    flex: 0 0 14px;
    border: 1px solid currentColor;
    border-radius: 2px;
  }
  .wb-post-category-filter__option.is-active .wb-post-category-filter__option-check::after {
    content: '';
    position: absolute;
    left: 3px;
    top: 1px;
    width: 5px;
    height: 8px;
    border: solid currentColor;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
  .wb-post-category-filter__option-label {
    min-width: 0;
  }
  .wb-post-category-filter__drawer {
    display: block;
  }
  .wb-post-category-filter__drawer-backdrop,
  .wb-post-category-filter__drawer-head {
    display: none;
  }
  .wb-post-category-filter__drawer-panel {
    display: block;
  }
  @media (max-width: 767px) {
    .wb-post-category-filter__mobile-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      width: 100%;
    }
  .wb-post-category-filter__mobile-all,
  .wb-post-category-filter__mobile-toggle {
    color: inherit;
    font-size: 22px;
    line-height: 1.25;
    font-weight: 700;
    text-decoration: none;
    }
    .wb-post-category-filter__mobile-toggle {
      min-width: 44px;
      min-height: 44px;
      padding: 0;
      border: 0;
      background: transparent;
      font: inherit;
      cursor: pointer;
      touch-action: manipulation;
    }
    .wb-post-category-filter__mobile-count {
    display: none;
      opacity: 0.62;
      font-weight: inherit;
    }
    .wb-post-category-filter__all {
      display: none;
    }
    .wb-post-category-filter__drawer {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: block;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.22s ease;
    }
    .wb-post-category-filter.is-filter-open .wb-post-category-filter__drawer,
    .wb-post-category-filter__drawer.is-open {
      opacity: 1;
      pointer-events: auto;
    }
    .wb-post-category-filter__drawer-backdrop {
      position: absolute;
      inset: 0;
      display: block;
      width: 100%;
      height: 100%;
      border: 0;
      background: rgba(0, 0, 0, 0.34);
      cursor: pointer;
    }
    .wb-post-category-filter__drawer-panel {
      position: absolute;
      top: 0;
      right: 0;
      display: flex;
      flex-direction: column;
      width: min(82vw, 320px);
      max-width: calc(100vw - 48px);
      height: 100%;
      padding: 28px 24px 32px;
      overflow-y: auto;
      background: #ffffff;
      color: #111827;
      box-shadow: -18px 0 40px rgba(15, 23, 42, 0.16);
      transform: translateX(100%);
      transition: transform 0.24s ease;
    }
    .wb-post-category-filter.is-filter-open .wb-post-category-filter__drawer-panel,
    .wb-post-category-filter__drawer.is-open .wb-post-category-filter__drawer-panel {
      transform: translateX(0);
    }
    .wb-post-category-filter__drawer-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 28px;
    }
    .wb-post-category-filter__drawer-title {
      font-size: 18px;
      line-height: 1.35;
      font-weight: 700;
    }
    .wb-post-category-filter__drawer-close {
      min-width: 44px;
      min-height: 44px;
      padding: 0;
      border: 0;
      background: transparent;
      color: inherit;
      font-size: 14px;
      line-height: 1;
      font-weight: 700;
      cursor: pointer;
      touch-action: manipulation;
    }
    .wb-post-category-filter__groups {
      gap: 24px;
    }
    .wb-post-category-filter__group + .wb-post-category-filter__group {
      padding-top: 24px;
    }
    .wb-post-category-filter__group-title {
      font-size: 16px;
    }
    .wb-post-category-filter__option {
      font-size: 14px;
      line-height: 1.45;
    }
    .wb-post-category-filter__options {
      gap: 12px;
    }
  }
`

function postCategoryFilterScript(this: HTMLElement) {
  if (!this || (this as any).__wbPostCategoryFilterReady) return
  ;(this as any).__wbPostCategoryFilterReady = true

  const drawer = this.querySelector('[data-wb-post-category-filter-drawer]') as HTMLElement | null
  if (!drawer) return
  const panel = this.querySelector('[data-wb-post-category-filter-panel]') as HTMLElement | null

  const toggles = Array.from(
    this.querySelectorAll('[data-wb-post-category-filter-toggle]')
  ) as HTMLElement[]
  const closers = Array.from(
    this.querySelectorAll('[data-wb-post-category-filter-close]')
  ) as HTMLElement[]

  const isMobileView = () =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(max-width: 767px)').matches

  const setOpen = (open: boolean) => {
    const mobile = isMobileView()
    this.classList.toggle('is-filter-open', open)
    drawer.classList.toggle('is-open', open)
    drawer.setAttribute('aria-hidden', mobile && !open ? 'true' : 'false')
    if (panel) {
      if (mobile) {
        panel.setAttribute('role', 'dialog')
        panel.setAttribute('aria-modal', 'true')
        panel.setAttribute('aria-label', 'Post category filter')
      } else {
        panel.removeAttribute('role')
        panel.removeAttribute('aria-modal')
        panel.removeAttribute('aria-label')
      }
    }
    toggles.forEach((toggle) => {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false')
    })
  }

  toggles.forEach((toggle) => {
    toggle.addEventListener('click', (event) => {
      event.preventDefault()
      setOpen(true)
    })
  })

  closers.forEach((closer) => {
    closer.addEventListener('click', (event) => {
      event.preventDefault()
      setOpen(false)
    })
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false)
  })

  window.addEventListener('resize', () => setOpen(false))
  setOpen(false)
}

export function registerCmsPostCategoryFilter(editor: GrapesEditor): void {
  registerCmsComponent(editor, {
    type: WB_CMS_POST_CATEGORY_FILTER_TYPE,
    name: '文章分类导航',
    dataWbComponent: 'cms-post-category-filter',
    dataCmsComponent: 'post-category-filter',
    defaultAttributes: {
      'data-wb-post-category-filter': '',
      'data-type-code': 'insights',
      'data-type-id': '',
      'data-show-empty-categories': 'false',
      class: 'wb-post-category-filter'
    },
    defaultProps: {
      cmsTypeCode: 'insights',
      cmsTypeId: '',
      cmsShowEmptyCategories: false
    },
    traits: [
      {
        type: 'text',
        label: '文章类型 Code',
        name: 'cmsTypeCode',
        changeProp: true
      },
      {
        type: 'text',
        label: '文章类型 ID',
        name: 'cmsTypeId',
        changeProp: true
      },
      {
        type: 'checkbox',
        label: '显示空分类',
        name: 'cmsShowEmptyCategories',
        changeProp: true
      }
    ],
    watchProps: ['cmsTypeCode', 'cmsTypeId', 'cmsShowEmptyCategories'],
    syncAttrs(model: any) {
      return {
        'data-wb-post-category-filter': '',
        'data-type-code': String(model.get('cmsTypeCode') || 'insights'),
        'data-type-id': String(model.get('cmsTypeId') || ''),
        'data-show-empty-categories': model.get('cmsShowEmptyCategories') ? 'true' : 'false'
      }
    },
    styles: POST_CATEGORY_FILTER_CSS,
    script: postCategoryFilterScript,
    publishStartIndex: 0,
    dynamicPublish: true,
    components: [
      {
        tagName: 'div',
        attributes: { class: 'wb-post-category-filter__mobile-bar' },
        components: [
          {
            tagName: 'a',
            attributes: {
              class: 'wb-post-category-filter__mobile-all',
              href: '#',
              'data-cms-bind-href': 'postCategoryFilterAllUrl'
            },
            components: [
              { tagName: 'span', content: 'All category' },
              { tagName: 'span', content: ' ' },
              {
                tagName: 'span',
                attributes: { class: 'wb-post-category-filter__mobile-count' },
                components: [
                  { tagName: 'span', content: '(' },
                  {
                    tagName: 'span',
                    attributes: { 'data-cms-bind': 'postCategoryFilterAllCount' },
                    content: '12'
                  },
                  { tagName: 'span', content: ')' }
                ]
              }
            ]
          },
          {
            tagName: 'button',
            attributes: {
              class: 'wb-post-category-filter__mobile-toggle',
              type: 'button',
              'aria-expanded': 'false',
              'data-wb-post-category-filter-toggle': ''
            },
            content: 'Filter'
          }
        ]
      },
      {
        tagName: 'a',
        attributes: {
          class: 'wb-post-category-filter__all',
          href: '#',
          'data-cms-bind-href': 'postCategoryFilterAllUrl'
        },
        content: 'All category'
      },
      {
        tagName: 'div',
        attributes: {
          class: 'wb-post-category-filter__drawer',
          'data-wb-post-category-filter-drawer': ''
        },
        components: [
          {
            tagName: 'button',
            attributes: {
              class: 'wb-post-category-filter__drawer-backdrop',
              type: 'button',
              'aria-label': 'Close filter',
              'data-wb-post-category-filter-close': ''
            }
          },
          {
            tagName: 'aside',
            attributes: {
              class: 'wb-post-category-filter__drawer-panel',
              'data-wb-post-category-filter-panel': ''
            },
            components: [
              {
                tagName: 'div',
                attributes: { class: 'wb-post-category-filter__drawer-head' },
                components: [
                  {
                    tagName: 'span',
                    attributes: { class: 'wb-post-category-filter__drawer-title' },
                    content: 'Filter'
                  },
                  {
                    tagName: 'button',
                    attributes: {
                      class: 'wb-post-category-filter__drawer-close',
                      type: 'button',
                      'aria-label': 'Close filter',
                      'data-wb-post-category-filter-close': ''
                    },
                    content: 'Close'
                  }
                ]
              },
              {
                tagName: 'div',
                attributes: { class: 'wb-post-category-filter__groups' },
                components: [
                  {
                    tagName: 'section',
                    attributes: {
                      class: 'wb-post-category-filter__group',
                      'data-cms-repeat': 'filterGroup@postCategoryFilterGroups'
                    },
                    components: [
                      {
                        tagName: 'h4',
                        attributes: { class: 'wb-post-category-filter__group-title' },
                        components: [
                          {
                            tagName: 'span',
                            attributes: {
                              class: 'wb-post-category-filter__group-prefix',
                              'data-cms-bind': 'filterGroup.titlePrefix'
                            },
                            content: 'By'
                          },
                          { tagName: 'span', content: ' ' },
                          {
                            tagName: 'span',
                            attributes: {
                              class: 'wb-post-category-filter__group-name',
                              'data-cms-bind': 'filterGroup.titleText'
                            },
                            content: 'Content Type'
                          },
                          { tagName: 'span', content: ' ' },
                          {
                            tagName: 'span',
                            attributes: { class: 'wb-post-category-filter__group-count' },
                            components: [
                              { tagName: 'span', content: '(' },
                              {
                                tagName: 'span',
                                attributes: { 'data-cms-bind': 'filterGroup.count' },
                                content: '34'
                              },
                              { tagName: 'span', content: ')' }
                            ]
                          }
                        ]
                      },
                      {
                        tagName: 'div',
                        attributes: { class: 'wb-post-category-filter__options' },
                        components: [
                          {
                            tagName: 'a',
                            attributes: {
                              class: 'wb-post-category-filter__option',
                              href: '#',
                              'data-cms-repeat': 'filterOption@filterGroup.children',
                              'data-cms-bind-href': 'filterOption.url',
                              'data-cms-bind-classappend': 'filterOption.activeClassName'
                            },
                            components: [
                              {
                                tagName: 'span',
                                attributes: {
                                  class: 'wb-post-category-filter__option-check',
                                  'aria-hidden': 'true'
                                }
                              },
                              {
                                tagName: 'span',
                                attributes: {
                                  class: 'wb-post-category-filter__option-label',
                                  'data-cms-bind': 'filterOption.name'
                                },
                                content: 'Engineering Thinking'
                              },
                              {
                                tagName: 'span',
                                attributes: { class: 'wb-post-category-filter__option-count' },
                                components: [
                                  { tagName: 'span', content: '(' },
                                  {
                                    tagName: 'span',
                                    attributes: { 'data-cms-bind': 'filterOption.count' },
                                    content: '24'
                                  },
                                  { tagName: 'span', content: ')' }
                                ]
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  })
}
