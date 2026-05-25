import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../components/registries/dynamic/cms/post/list', () => ({
  CASES_LIST_CSS: '.wb-cases-list{}',
}))

vi.mock('../components/registries/dynamic/cms/post/styles', () => ({
  POST_CARD_CSS: '.wb-post-card{}',
}))

vi.mock('../components/registries/dynamic/cms/media/technicalSupportDetail', () => ({
  TECHNICAL_SUPPORT_DETAIL_STYLES: '.wb-tech-support-detail{}',
}))

vi.mock('../components/registries/dynamic/cms/product/detail.styles', () => ({
  PRODUCT_DETAIL_STYLES: '.wb-product-detail{}',
}))

vi.mock('../components/registries/dynamic/cms/product/detailV2.styles', () => ({
  PRODUCT_DETAIL_V2_STYLES: '.wb-product-detail-v2{}',
}))

vi.mock('../components/registries/dynamic/loopGrid/paginationStyles', () => ({
  LOOP_GRID_NEXT_ICON: '<svg data-next="true"></svg>',
  LOOP_GRID_PAGINATION_CSS: '.wb-loop-grid-pagination{}',
  LOOP_GRID_PREV_ICON: '<svg data-prev="true"></svg>',
}))

import { LOOP_GRID_PUBLISH_RENDER_OWNER, renderSsgComponents } from './ssgRenderer'

class TestElement {
  constructor(
    private readonly doc: TestDocument,
    private readonly kind: 'preview' | 'hidden' | 'loop-grid',
  ) {}

  style = {
    removeProperty: (name: string) => {
      if (name === 'display') {
        this.doc.html = this.doc.html.replace(/\s*style="display:\s*none;?"/gi, '')
      }
    },
  }

  remove() {
    if (this.kind === 'preview') {
      this.doc.html = this.doc.html.replace(/<[^>]+data-cms-preview[^>]*>[\s\S]*?<\/[^>]+>/gi, '')
    }
  }

  removeAttribute(name: string) {
    if (name === 'data-cms-hidden') {
      this.doc.html = this.doc.html.replace(/\sdata-cms-hidden(?:="[^"]*")?/gi, '')
    }
  }

  getAttribute(name: string) {
    if (this.kind !== 'loop-grid') return null
    if (name === 'data-cms-component') return 'loop-grid'
    if (name === 'data-wb-component') return 'loop-grid'
    return null
  }

  hasAttribute(name: string) {
    if (this.kind !== 'loop-grid') return false
    return name === 'data-cms-component' || name === 'data-wb-component'
  }

  querySelector() {
    return null
  }
}

class TestDocument {
  head = { appendChild: vi.fn() }
  body: { readonly innerHTML: string }
  documentElement: { readonly outerHTML: string }
  private readonly loopGridElement: TestElement

  constructor(public html: string) {
    const doc = this
    this.loopGridElement = new TestElement(this, 'loop-grid')
    this.body = {
      get innerHTML() {
        return doc.html
      },
    }
    this.documentElement = {
      get outerHTML() {
        return `<html><head></head><body>${doc.html}</body></html>`
      },
    }
  }

  querySelectorAll(selector: string) {
    if (selector === '[data-cms-preview]' && this.html.includes('data-cms-preview')) {
      return [new TestElement(this, 'preview')]
    }
    if (selector === '[data-cms-hidden]' && this.html.includes('data-cms-hidden')) {
      return [new TestElement(this, 'hidden')]
    }
    if (
      selector.includes('.wb-loop-grid') &&
      (this.html.includes('class="wb-loop-grid"') || this.html.includes("class='wb-loop-grid'"))
    ) {
      return [this.loopGridElement]
    }
    if (selector === '[data-cms-component]' && this.html.includes('data-cms-component="loop-grid"')) {
      return [this.loopGridElement]
    }
    if (selector === '[data-wb-component]' && this.html.includes('data-wb-component="loop-grid"')) {
      return [this.loopGridElement]
    }
    return []
  }

  querySelector() {
    return null
  }

  getElementById() {
    return null
  }

  createElement() {
    return {}
  }
}

let testDocument: TestDocument

class TestDOMParser {
  parseFromString(html: string) {
    testDocument = new TestDocument(html)
    return testDocument
  }
}

describe('renderSsgComponents', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubGlobal('DOMParser', TestDOMParser)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps publish-only cleanup inside the real renderer path', async () => {
    const { html, errors } = await renderSsgComponents(
      `
        <section>
          <div data-cms-preview>Editor preview</div>
          <div data-cms-hidden style="display:none"><article>Template card</article></div>
        </section>
      `,
      'token-123',
    )

    expect(errors).toEqual([])
    expect(html).toContain('Template card')
    expect(html).not.toContain('Editor preview')
    expect(html).not.toContain('data-cms-hidden')
    expect(html).not.toContain('display:none')
  })

  it('keeps LoopGrid as a backend-rendered CMS template during SSG', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { html, errors } = await renderSsgComponents(
      `
        <section class="wb-loop-grid" data-wb-component="loop-grid" data-cms-component="loop-grid">
          <div data-wb-loop-grid-cards="grid-1">
            <article data-cms-repeat="post">Template card</article>
          </div>
        </section>
      `,
      'token-123',
    )

    expect(LOOP_GRID_PUBLISH_RENDER_OWNER).toBe('backend-template')
    expect(errors).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
    expect(html).toContain('data-cms-component="loop-grid"')
    expect(html).toContain('data-cms-repeat="post"')
    expect(html).toContain('Template card')
  })
})
