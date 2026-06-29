import { describe, expect, it } from 'vitest'
import {
  bindDynamicRenderData,
  composeDynamicUrl,
  composePlaceholderUrl,
  normalizeSiteHref,
  removeDynamicRenderCloneIds
} from './dynamicRenderPipeline.js'

class TestElement {
  tagName: string
  textContent = ''
  innerHTML = ''
  href = ''
  src = ''
  alt = ''
  parentNode: TestElement | null = null
  ownerDocument: TestDocument
  style = {
    backgroundImage: '',
    backgroundSize: '',
    backgroundPosition: ''
  }
  private attrs = new Map<string, string>()
  children: TestElement[] = []
  classList = {
    add: (className: string) => {
      const current = this.getAttribute('class')
      this.setAttribute('class', current ? `${current} ${className}` : className)
    }
  }

  constructor(tagName: string, doc: TestDocument) {
    this.tagName = tagName.toUpperCase()
    this.ownerDocument = doc
  }

  get firstChild() {
    return this.children[0] ?? null
  }

  get attributes() {
    return Array.from(this.attrs.entries()).map(([name, value]) => ({ name, value }))
  }

  appendChild(child: TestElement) {
    if (child.parentNode) {
      child.parentNode.children = child.parentNode.children.filter((item) => item !== child)
    }
    child.parentNode = this
    this.children.push(child)
  }

  replaceChild(nextChild: TestElement, oldChild: TestElement) {
    const index = this.children.indexOf(oldChild)
    if (index >= 0) {
      nextChild.parentNode = this
      oldChild.parentNode = null
      this.children[index] = nextChild
    }
  }

  remove() {
    if (!this.parentNode) return
    this.parentNode.children = this.parentNode.children.filter((item) => item !== this)
    this.parentNode = null
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
    if (name === 'src') this.src = value
    if (name === 'alt') this.alt = value
  }

  removeAttribute(name: string) {
    this.attrs.delete(name)
  }

  matches(selector: string) {
    return selector.split(',').some((part) => {
      const trimmed = part.trim()
      const exactAttrMatch = trimmed.match(/^\[([^=\]]+)="([^"]+)"\]$/)
      if (exactAttrMatch) return this.getAttribute(exactAttrMatch[1]) === exactAttrMatch[2]
      const attrMatch = trimmed.match(/^\[([^\]]+)\]$/)
      return attrMatch ? this.hasAttribute(attrMatch[1]) : false
    })
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

describe('dynamicRenderPipeline', () => {
  it('normalizes site hrefs without rewriting absolute, hash, mail, or phone links', () => {
    expect(normalizeSiteHref('products/a.html')).toBe('/products/a.html')
    expect(normalizeSiteHref('./products/a.html')).toBe('/products/a.html')
    expect(normalizeSiteHref('/products/a.html')).toBe('/products/a.html')
    expect(normalizeSiteHref('#top')).toBe('#top')
    expect(normalizeSiteHref('mailto:test@example.com')).toBe('mailto:test@example.com')
    expect(normalizeSiteHref('https://example.com/a')).toBe('https://example.com/a')
  })

  it('composes dynamic URLs with encoded and raw placeholders', () => {
    expect(composeDynamicUrl('a b', '/post/{{encoded}}.html')).toBe('/post/a%20b.html')
    expect(composeDynamicUrl('a b', '/post/{{value}}.html')).toBe('/post/a b.html')
    expect(composeDynamicUrl('a b', '/post/')).toBe('/post/a b')
    expect(composePlaceholderUrl('post.url', '/post/{{encoded}}')).toBe('/post/%7B%7Bpost.url%7D%7D')
  })

  it('removes ids from a cloned root and descendants', () => {
    const child = {
      removeAttributeCalls: [] as string[],
      removeAttribute(name: string) {
        this.removeAttributeCalls.push(name)
      },
    }
    const root = {
      removeAttributeCalls: [] as string[],
      hasAttribute: (name: string) => name === 'id',
      querySelectorAll: (selector: string) => (selector === '[id]' ? [child] : []),
      removeAttribute(name: string) {
        this.removeAttributeCalls.push(name)
      },
    }

    removeDynamicRenderCloneIds(root as any)

    expect(root.removeAttributeCalls).toEqual(['id'])
    expect(child.removeAttributeCalls).toEqual(['id'])
  })

  it('binds preview data without stripping binding attributes', () => {
    const doc = new TestDocument()
    const root = doc.createElement('div')
    const title = doc.createElement('h3')
    title.setAttribute('data-cms-bind', 'post.title')
    const link = doc.createElement('a')
    link.setAttribute('data-cms-bind-href', 'post.slug')
    link.setAttribute('data-cms-bind-href-template', '/post/{{encoded}}.html')
    const image = doc.createElement('div')
    image.setAttribute('data-cms-bind-src', 'post.image')
    root.appendChild(title)
    root.appendChild(link)
    root.appendChild(image)

    bindDynamicRenderData(
      root as any,
      {
        'post.title': 'Launch',
        'post.slug': 'a b',
        'post.image': '/img/a.jpg'
      },
      { removeBindingAttrs: false, imageStrategy: 'preview-background' }
    )

    expect(title.textContent).toBe('Launch')
    expect(title.getAttribute('data-cms-bind')).toBe('post.title')
    expect(link.href).toBe('/post/a%20b.html')
    expect(image.style.backgroundImage).toBe("url('/img/a.jpg')")
    expect(image.textContent).toBe('')
  })

  it('binds publish data with normalized links, SEO images, and stripped binding attrs', () => {
    const doc = new TestDocument()
    const root = doc.createElement('div')
    const card = doc.createElement('div')
    card.setAttribute('data-wb-dynamic', 'link')
    card.setAttribute('data-cms-bind-href', 'product.url')
    const image = doc.createElement('div')
    image.setAttribute('data-wb-dynamic', 'image')
    image.setAttribute('data-cms-bind-src', 'product.image')
    image.setAttribute('data-cms-bind-alt', 'product.name')
    image.setAttribute('class', 'product-image')
    card.appendChild(image)
    root.appendChild(card)

    const boundRoot = bindDynamicRenderData(
      card as any,
      {
        'product.url': '/products/a.html',
        'product.image': '/img/product.jpg',
        'product.name': 'Product A'
      },
      {
        doc: doc as any,
        removeBindingAttrs: true,
        normalizeDynamicElements: true,
        imageStrategy: 'seo-img'
      }
    ) as unknown as TestElement

    expect(boundRoot.tagName).toBe('A')
    expect(boundRoot.href).toBe('/products/a.html')
    expect(boundRoot.getAttribute('data-cms-bind-href')).toBeNull()
    expect(root.children[0]).toBe(boundRoot)
    const boundImage = boundRoot.children[0]
    expect(boundImage.tagName).toBe('IMG')
    expect(boundImage.src).toBe('/img/product.jpg')
    expect(boundImage.alt).toBe('Product A')
    expect(boundImage.getAttribute('class')).toBe('product-image')
    expect(boundImage.getAttribute('data-cms-bind-src')).toBeNull()
  })

  it('applies dynamic show and hide conditions for bound fields', () => {
    const doc = new TestDocument()
    const root = doc.createElement('div')
    const showWhenImage = doc.createElement('section')
    showWhenImage.setAttribute('data-cms-if', 'post.image')
    const showWhenMissingImage = doc.createElement('section')
    showWhenMissingImage.setAttribute('data-cms-if', 'post.image')
    showWhenMissingImage.setAttribute('data-cms-if-mode', 'falsy')
    const hiddenWhenTitleExists = doc.createElement('section')
    hiddenWhenTitleExists.setAttribute('data-cms-if', 'post.title')
    hiddenWhenTitleExists.setAttribute('data-cms-if-mode', 'falsy')
    root.appendChild(showWhenImage)
    root.appendChild(showWhenMissingImage)
    root.appendChild(hiddenWhenTitleExists)

    bindDynamicRenderData(
      root as any,
      {
        'post.image': '',
        'post.title': 'Launch'
      },
      { removeBindingAttrs: true }
    )

    expect(root.children).toEqual([showWhenMissingImage])
    expect(showWhenMissingImage.getAttribute('data-cms-if')).toBeNull()
    expect(showWhenMissingImage.getAttribute('data-cms-if-mode')).toBeNull()
  })

  it('leaves unknown dynamic condition expressions for downstream renderers', () => {
    const doc = new TestDocument()
    const root = doc.createElement('div')
    const expression = doc.createElement('section')
    expression.setAttribute('data-cms-if', '!#lists.isEmpty(post.tags)')
    root.appendChild(expression)

    bindDynamicRenderData(root as any, {}, { removeBindingAttrs: true })

    expect(root.children).toEqual([expression])
    expect(expression.getAttribute('data-cms-if')).toBe('!#lists.isEmpty(post.tags)')
  })
})
