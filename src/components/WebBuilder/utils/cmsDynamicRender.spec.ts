import { describe, expect, it } from 'vitest'
import {
  bindCmsDynamicRenderData,
  buildCmsDynamicRequest,
  normalizeCmsDynamicPage,
  normalizeCmsDynamicItems,
} from './cmsDynamicRender'

class TestElement {
  tagName: string
  textContent = ''
  href = ''
  parentNode: TestElement | null = null
  ownerDocument: TestDocument
  private attrs = new Map<string, string>()
  children: TestElement[] = []

  constructor(tagName: string, doc: TestDocument) {
    this.tagName = tagName.toUpperCase()
    this.ownerDocument = doc
  }

  get attributes() {
    return Array.from(this.attrs.entries()).map(([name, value]) => ({ name, value }))
  }

  appendChild(child: TestElement) {
    child.parentNode = this
    this.children.push(child)
  }

  hasAttribute(name: string) {
    return this.attrs.has(name)
  }

  getAttribute(name: string) {
    return this.attrs.get(name) ?? null
  }

  setAttribute(name: string, value: string) {
    this.attrs.set(name, value)
    if (name === 'href') this.href = value
  }

  removeAttribute(name: string) {
    this.attrs.delete(name)
  }

  matches(selector: string) {
    const attrMatch = selector.match(/^\[([^\]]+)\]$/)
    return attrMatch ? this.hasAttribute(attrMatch[1]) : false
  }

  querySelectorAll(selector: string): TestElement[] {
    const result: TestElement[] = []
    const visit = (node: TestElement) => {
      node.children.forEach((child) => {
        if (child.matches(selector)) result.push(child)
        visit(child)
      })
    }
    visit(this)
    return result
  }
}

class TestDocument {
  createElement(tagName: string) {
    return new TestElement(tagName, this)
  }
}

describe('cmsDynamicRender', () => {
  it('builds post list request params and normalizes post fields', () => {
    const request = buildCmsDynamicRequest('post-list', {
      'data-page-size': '8',
      'data-category-id': '42',
    })

    expect(request).toEqual({
      endpoint: '/admin-api/content/post/page',
      params: {
        pageNo: '1',
        pageSize: '8',
        categoryId: '42',
      },
    })

    expect(
      normalizeCmsDynamicItems('post-list', [
        {
          id: 9,
          typeCode: 'news',
          contents: [{ name: 'Launch', slug: 'hello-world', excerpt: 'Intro' }],
          image: '/cover.jpg',
        },
      ]),
    ).toEqual([
      expect.objectContaining({
        'post.id': '9',
        'post.name': 'Launch',
        'post.slug': 'hello-world',
        'post.excerpt': 'Intro',
        'post.image': '/cover.jpg',
        'post.url': '/en/post/news/hello-world.html',
      }),
    ])
  })

  it('builds product list request params and normalizes product fields', () => {
    const request = buildCmsDynamicRequest('product-list', {
      'data-page-size': '6',
      'data-category-id': '7',
      'data-sort-field': 'datasheet:voltage',
      'data-sort-asc': 'true',
      'data-list-mode': 'datasheet',
    })

    expect(request.params).toEqual({
      pageNo: '1',
      pageSize: '9999',
      includeSpecifications: 'true',
      sortingField: 'createTime',
      asc: 'false',
      categoryId: '7',
    })

    expect(
      normalizeCmsDynamicItems('product-list', [
        {
          id: 12,
          name: 'Servo',
          slug: 'servo-a',
          picUrl: '/servo.jpg',
          price: 12345,
          specifications: [{ code: 'designation', value: 'S-100' }],
        },
      ]),
    ).toEqual([
      expect.objectContaining({
        'product.id': '12',
        'product.name': 'Servo',
        'product.picUrl': '/servo.jpg',
        'product.priceFormatted': '¥123.45',
        'product.url': '/products/servo-a.html',
        'product.datasheetDesignation': 'S-100',
      }),
    ])
  })

  it('filters and orders faq empty-state data through a single page normalizer', () => {
    const page = normalizeCmsDynamicPage(
      'faq-section',
      {
        list: [
          { id: 3, categoryId: 2, question: 'Later', sort: 2 },
          { id: 1, categoryId: 2, question: 'First', sort: 1 },
          { id: 2, categoryId: 9, question: 'Other', sort: 1 },
        ],
      },
      { 'data-category-id': '2', 'data-limit': '5' },
    )

    expect(page.items.map((item) => item.question)).toEqual(['First', 'Later'])
    expect(page.isEmpty).toBe(false)
    expect(page.total).toBe(2)

    const empty = normalizeCmsDynamicPage('faq-section', { list: [] }, { 'data-category-id': '2' })
    expect(empty.items).toEqual([])
    expect(empty.isEmpty).toBe(true)
    expect(empty.totalPages).toBe(0)
  })

  it('normalizes pagination metadata from backend page envelopes', () => {
    const page = normalizeCmsDynamicPage(
      'post-list',
      {
        list: [{ id: 1, contents: [{ name: 'A' }] }],
        total: 25,
        pageNo: 2,
        pageSize: 10,
      },
      { pageNo: '2', pageSize: '10' },
    )

    expect(page).toMatchObject({
      pageNo: 2,
      pageSize: 10,
      total: 25,
      totalPages: 3,
      isEmpty: false,
    })
  })

  it('binds CMS fields through the shared field binding adapter', () => {
    const doc = new TestDocument()
    const root = doc.createElement('article')
    const title = doc.createElement('h2')
    title.setAttribute('data-cms-bind', 'post.name')
    const link = doc.createElement('a')
    link.setAttribute('data-cms-bind-href', 'post.url')
    root.appendChild(title)
    root.appendChild(link)

    bindCmsDynamicRenderData(root as any, {
      'post.name': 'Launch',
      'post.url': '/en/post/news/launch.html',
    })

    expect(title.textContent).toBe('Launch')
    expect(link.href).toBe('/en/post/news/launch.html')
  })
})
