import { beforeEach, describe, expect, it } from 'vitest'
import { createLayoutPublishContext, getPublishPages, resetLayoutPublishCache } from './layoutPublish'
import { WB_LAYOUT_PAGE_CUSTOM_KEY, WB_LAYOUT_PAGE_ID_CUSTOM_KEY } from './layoutSettings'

const makePage = (data: Record<string, any>) => ({
  ...data,
  get(key: string) {
    return data[key]
  },
  getName() {
    return data.name
  },
  getMainComponent() {
    return {
      pageId: data.id,
      toHTML: data.toHTML,
      components: data.components,
    }
  },
})

const makeEditor = (pages: any[]) => ({
  Pages: {
    getAll: () => pages,
  },
  getHtml: ({ component }: any) => `<div data-page="${component.pageId}"></div>`,
  getCss: ({ component }: any) => `.page-${component.pageId}{display:block}`,
  getJs: ({ component }: any) => `console.log("${component.pageId}")`,
})

const makeEditorWithEmptyHtml = (pages: any[]) => ({
  ...makeEditor(pages),
  getHtml: () => '',
})

describe('layoutPublish', () => {
  beforeEach(() => {
    resetLayoutPublishCache()
  })

  it('applies a global exclude rule with empty page ids to every publish page', () => {
    const home = makePage({ id: 'home', name: 'Home', slug: 'home' })
    const about = makePage({ id: 'about', name: 'About', slug: 'about' })
    const header = makePage({
      id: 'wb-header',
      name: 'Header',
      custom: {
        [WB_LAYOUT_PAGE_CUSTOM_KEY]: 'header',
        [WB_LAYOUT_PAGE_ID_CUSTOM_KEY]: 'wb-header',
      },
    })
    const editor = makeEditor([home, about, header])
    const context = createLayoutPublishContext(editor, {
      header: {
        defaultLayoutId: null,
        rules: [
          {
            id: 'global-header',
            layoutId: 'wb-header',
            matchMode: 'exclude',
            pageIds: [],
            enabled: true,
            priority: 0,
          },
        ],
      },
      footer: { defaultLayoutId: null, rules: [] },
    })

    expect(getPublishPages(editor).map((page) => page.id)).toEqual(['home', 'about'])
    expect(context.resolve(home).header?.html).toContain('data-page="wb-header"')
    expect(context.resolve(about).header?.html).toContain('data-page="wb-header"')
  })

  it('resolves exclude header rules against real layout pages by alias', () => {
    const home = makePage({ id: 'home', name: 'Home', slug: 'home' })
    const about = makePage({ id: 'about', name: 'About', slug: 'about' })
    const header = makePage({
      id: 'generated-1',
      name: 'Header 2',
      custom: {
        [WB_LAYOUT_PAGE_CUSTOM_KEY]: 'header',
        [WB_LAYOUT_PAGE_ID_CUSTOM_KEY]: 'wb-header-2',
      },
    })
    const editor = makeEditor([home, about, header])
    const context = createLayoutPublishContext(editor, {
      header: {
        defaultLayoutId: null,
        rules: [
          {
            id: 'all-except-home',
            layoutId: 'Header 2',
            matchMode: 'exclude',
            pageIds: ['home'],
            enabled: true,
            priority: 0,
          },
        ],
      },
      footer: { defaultLayoutId: null, rules: [] },
    })

    expect(context.resolve(home).header).toBeNull()
    expect(context.resolve(about).header?.html).toContain('data-page="generated-1"')
  })

  it('ignores exclude rules with null layout ids during publish resolution', () => {
    const home = makePage({ id: 'home', name: 'Home', slug: 'home' })
    const cases = makePage({ id: 'cases', name: 'Cases', slug: 'cases' })
    const header = makePage({
      id: 'generated-7',
      name: 'Header 7',
      custom: {
        [WB_LAYOUT_PAGE_CUSTOM_KEY]: 'header',
        [WB_LAYOUT_PAGE_ID_CUSTOM_KEY]: 'wb-header-7',
      },
    })
    const editor = makeEditor([home, cases, header])
    const context = createLayoutPublishContext(editor, {
      header: {
        defaultLayoutId: null,
        rules: [
          {
            id: 'invalid-null-exclude',
            layoutId: null,
            matchMode: 'exclude',
            pageIds: ['home'],
            enabled: true,
            priority: 0,
          },
        ],
      },
      footer: { defaultLayoutId: null, rules: [] },
    })

    expect(context.resolve(home).header).toBeNull()
    expect(context.resolve(cases).header).toBeNull()
  })

  it('falls back to component serialization when editor getHtml returns empty for a header', () => {
    const about = makePage({ id: 'about', name: 'About', slug: 'about' })
    const header = makePage({
      id: 'wb-header',
      name: 'Header',
      custom: {
        [WB_LAYOUT_PAGE_CUSTOM_KEY]: 'header',
        [WB_LAYOUT_PAGE_ID_CUSTOM_KEY]: 'wb-header',
      },
      toHTML: () => '<header class="gjs-navbar"></header>',
    })
    const editor = makeEditorWithEmptyHtml([about, header])
    const context = createLayoutPublishContext(editor, {
      header: {
        defaultLayoutId: null,
        rules: [
          {
            id: 'global-header',
            layoutId: 'wb-header',
            matchMode: 'exclude',
            pageIds: [],
            enabled: true,
            priority: 0,
          },
        ],
      },
      footer: { defaultLayoutId: null, rules: [] },
    })

    expect(context.resolve(about).header?.html).toContain('gjs-navbar')
  })
})
