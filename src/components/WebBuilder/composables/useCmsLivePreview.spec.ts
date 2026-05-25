import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  __injectCmsLivePreviewForTest,
  useCmsLivePreview,
} from './useCmsLivePreview'

vi.mock('@/utils/auth', () => ({
  getAccessToken: vi.fn(() => 'test-token'),
}))

const flushPromises = () => Promise.resolve()

class TestStyle {
  display = ''
  backgroundImage = ''
  backgroundSize = ''
  backgroundPosition = ''

  removeProperty(name: string) {
    if (name === 'display') this.display = ''
    if (name === 'background-image') this.backgroundImage = ''
  }
}

class TestClassList {
  constructor(private readonly el: TestElement) {}

  add(className: string) {
    const classes = new Set(this.el.className.split(/\s+/).filter(Boolean))
    classes.add(className)
    this.el.className = Array.from(classes).join(' ')
  }
}

class TestElement {
  tagName: string
  ownerDocument: TestDocument
  parentNode: TestElement | null = null
  textContent = ''
  innerHTML = ''
  style = new TestStyle()
  href = ''
  classList = new TestClassList(this)
  private attrs = new Map<string, string>()
  private childNodes: TestElement[] = []

  constructor(tagName: string, doc: TestDocument) {
    this.tagName = tagName.toUpperCase()
    this.ownerDocument = doc
  }

  get attributes() {
    return Array.from(this.attrs.entries()).map(([name, value]) => ({ name, value }))
  }

  get children() {
    return this.childNodes
  }

  get firstElementChild() {
    return this.childNodes[0] ?? null
  }

  get parentElement() {
    return this.parentNode
  }

  get nextSibling() {
    if (!this.parentNode) return null
    const siblings = this.parentNode.childNodes
    return siblings[siblings.indexOf(this) + 1] ?? null
  }

  get className() {
    return this.attrs.get('class') ?? ''
  }

  set className(value: string) {
    if (value) this.attrs.set('class', value)
    else this.attrs.delete('class')
  }

  get id() {
    return this.attrs.get('id') ?? ''
  }

  set id(value: string) {
    if (value) this.attrs.set('id', value)
    else this.attrs.delete('id')
  }

  appendChild(child: TestElement) {
    child.parentNode = this
    this.childNodes.push(child)
    return child
  }

  insertBefore(child: TestElement, reference: TestElement | null) {
    child.parentNode = this
    const index = reference ? this.childNodes.indexOf(reference) : -1
    if (index >= 0) this.childNodes.splice(index, 0, child)
    else this.childNodes.push(child)
    return child
  }

  remove() {
    if (!this.parentNode) return
    const siblings = this.parentNode.childNodes
    const index = siblings.indexOf(this)
    if (index >= 0) siblings.splice(index, 1)
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
  }

  removeAttribute(name: string) {
    this.attrs.delete(name)
    if (name === 'href') this.href = ''
  }

  cloneNode(deep = false) {
    const clone = new TestElement(this.tagName, this.ownerDocument)
    this.attributes.forEach((attr) => clone.setAttribute(attr.name, attr.value))
    clone.textContent = this.textContent
    clone.innerHTML = this.innerHTML
    clone.style.display = this.style.display
    clone.style.backgroundImage = this.style.backgroundImage
    clone.style.backgroundSize = this.style.backgroundSize
    clone.style.backgroundPosition = this.style.backgroundPosition
    clone.href = this.href
    if (deep) this.childNodes.forEach((child) => clone.appendChild(child.cloneNode(true)))
    return clone
  }

  matches(selector: string): boolean {
    return selector.split(',').some((part) => this.matchesSingle(part.trim()))
  }

  closest(selector: string): TestElement | null {
    let current: TestElement | null = this
    while (current) {
      if (current.matches(selector)) return current
      current = current.parentNode
    }
    return null
  }

  contains(target: TestElement): boolean {
    if (target === this) return true
    return this.childNodes.some((child) => child.contains(target))
  }

  querySelector(selector: string): TestElement | null {
    return this.querySelectorAll(selector)[0] ?? null
  }

  querySelectorAll(selector: string): TestElement[] {
    const result: TestElement[] = []
    const visit = (node: TestElement) => {
      node.childNodes.forEach((child) => {
        if (child.matches(selector)) result.push(child)
        visit(child)
      })
    }
    visit(this)
    return result
  }

  private matchesSingle(selector: string): boolean {
    if (!selector) return false
    if (selector.startsWith('.')) {
      const className = selector.slice(1)
      return this.className.split(/\s+/).includes(className)
    }
    const attrMatch = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/)
    if (attrMatch) {
      const [, name, expected] = attrMatch
      if (!this.hasAttribute(name)) return false
      return expected === undefined || this.getAttribute(name) === expected
    }
    return this.tagName.toLowerCase() === selector.toLowerCase()
  }
}

class TestDocument {
  body = new TestElement('body', this)

  createElement(tagName: string) {
    return new TestElement(tagName, this)
  }
}

function append(parent: TestElement, child: TestElement, attrs: Record<string, string> = {}) {
  Object.entries(attrs).forEach(([name, value]) => child.setAttribute(name, value))
  parent.appendChild(child)
  return child
}

function mockFetchData(dataQueue: any[]): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    json: async () => ({ data: dataQueue.shift() }),
  }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function createGrapes() {
  const initCallbacks: Array<(editor: any) => void> = []
  return {
    onInit(cb: (editor: any) => void) {
      initCallbacks.push(cb)
    },
    init(editor: any) {
      initCallbacks.forEach((cb) => cb(editor))
    },
  }
}

function createEditor(options: { wrapper?: any; pages?: any[] } = {}) {
  const listeners = new Map<string, Array<(...args: any[]) => void>>()
  return {
    Pages: {
      getAll: () => options.pages ?? [],
    },
    getWrapper: () => options.wrapper,
    on(event: string, cb: (...args: any[]) => void) {
      const next = listeners.get(event) ?? []
      next.push(cb)
      listeners.set(event, next)
    },
    trigger(event: string, ...args: any[]) {
      ;(listeners.get(event) ?? []).forEach((cb) => cb(...args))
    },
  }
}

function createComponent(el: TestElement, attrs: Record<string, string>) {
  const listeners = new Map<string, Array<(...args: any[]) => void>>()
  return {
    getAttributes: () => attrs,
    getView: () => ({ el }),
    components: () => ({ models: [] }),
    on(event: string, cb: (...args: any[]) => void) {
      const next = listeners.get(event) ?? []
      next.push(cb)
      listeners.set(event, next)
    },
    trigger(event: string, ...args: any[]) {
      ;(listeners.get(event) ?? []).forEach((cb) => cb(...args))
    },
  }
}

function createProductListElement(doc: TestDocument): TestElement {
  const root = doc.createElement('section')
  root.setAttribute('data-cms-component', 'product-latest')
  root.setAttribute('data-page-size', '2')
  const grid = append(root, doc.createElement('div'), { 'data-wb-product-grid': '' })
  const card = append(grid, doc.createElement('article'), {
    id: 'template-card',
    'data-cms-repeat': 'product',
  })
  const link = append(card, doc.createElement('a'), { 'data-cms-bind-href': 'product.url' })
  const title = append(link, doc.createElement('span'), { 'data-cms-bind': 'product.name' })
  title.textContent = 'Template'
  doc.body.appendChild(root)
  return root
}

describe('useCmsLivePreview', () => {
  beforeEach(() => {
    vi.useRealTimers()
    vi.stubGlobal('window', { location: { origin: 'http://localhost' } })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('clones WYSIWYG list cards from the hidden template and binds shared CMS product data', async () => {
    const doc = new TestDocument()
    const root = createProductListElement(doc)
    mockFetchData([
      {
        list: [
          { id: 11, name: 'Servo A', slug: 'servo-a' },
          { id: 12, name: 'Servo B', url: '/legacy-product-path' },
        ],
      },
    ])

    await __injectCmsLivePreviewForTest(root as any, 'test-token')

    const templateCard = root.querySelector('[data-cms-repeat="product"]')!
    expect(templateCard.style.display).toBe('none')
    expect(templateCard.hasAttribute('data-cms-hidden')).toBe(true)

    const wrapper = root.querySelector('[data-cms-preview-wrapper]')!
    expect(wrapper.style.display).toBe('contents')

    const cards = Array.from(wrapper.querySelectorAll('[data-cms-preview]'))
    expect(cards).toHaveLength(2)
    expect(cards[0].querySelector('[data-cms-bind]')?.textContent).toBe('Servo A')
    expect(cards[0].querySelector('a')?.href).toBe('/products/servo-a.html')
    expect(cards[1].querySelector('a')?.href).toBe('/products/12.html')
    expect(cards.some((card) => card.id === 'template-card')).toBe(false)
  })

  it('cleans up the previous preview wrapper before cloning refreshed list cards', async () => {
    const doc = new TestDocument()
    const root = createProductListElement(doc)
    mockFetchData([
      { list: [{ id: 11, name: 'First', slug: 'first' }] },
      { list: [{ id: 12, name: 'Second', slug: 'second' }] },
    ])

    await __injectCmsLivePreviewForTest(root as any, 'test-token')
    await __injectCmsLivePreviewForTest(root as any, 'test-token')

    expect(root.querySelectorAll('[data-cms-preview-wrapper]')).toHaveLength(1)
    expect(root.querySelectorAll('[data-cms-preview]')).toHaveLength(1)
    expect(root.querySelector('[data-cms-preview]')?.querySelector('[data-cms-bind]')?.textContent).toBe('Second')
  })

  it('hides repeat containers and renders filtered FAQ preview cards next to the template', async () => {
    const doc = new TestDocument()
    const root = doc.createElement('section')
    root.setAttribute('data-cms-component', 'faq-section')
    root.setAttribute('data-category-id', '2')
    root.setAttribute('data-limit', '2')
    const repeat = append(root, doc.createElement('div'), {
      class: 'faq-grid',
      'data-cms-repeat': 'faq',
    })
    const card = append(repeat, doc.createElement('article'))
    const question = append(card, doc.createElement('h3'), { 'data-cms-bind': 'faq.question' })
    question.textContent = 'Question'
    const answer = append(card, doc.createElement('div'), { 'data-cms-html': 'faq.answerHtml' })
    answer.textContent = 'Answer'
    doc.body.appendChild(root)
    mockFetchData([
      [
        { id: 3, categoryId: 2, question: 'Later', answer: 'Later answer', sort: 2 },
        { id: 1, categoryId: 2, question: 'First', answerHtml: '<strong>First</strong>', sort: 1 },
        { id: 2, categoryId: 9, question: 'Other', answer: 'Other answer', sort: 1 },
      ],
    ])

    await __injectCmsLivePreviewForTest(root as any, 'test-token')

    const repeatEl = root.querySelector('[data-cms-repeat]')!
    expect(repeatEl.style.display).toBe('none')
    expect(repeatEl.hasAttribute('data-cms-hidden')).toBe(true)

    const preview = root.querySelector('[data-cms-preview]')!
    const cards = Array.from(preview.children)
    expect(cards).toHaveLength(2)
    expect(cards[0].getAttribute('data-open')).toBe('true')
    expect(cards[0].querySelector('[data-cms-bind]')?.textContent).toBe('First')
    expect(cards[0].querySelector('[data-cms-html]')?.innerHTML).toBe('<strong>First</strong>')
    expect(cards[1].querySelector('[data-cms-bind]')?.textContent).toBe('Later')
  })

  it('schedules preview refreshes after component add and attribute changes', async () => {
    vi.useFakeTimers()
    const doc = new TestDocument()
    const root = createProductListElement(doc)
    const fetchMock = mockFetchData([
      { list: [{ id: 11, name: 'Scheduled', slug: 'scheduled' }] },
      { list: [{ id: 12, name: 'Changed', slug: 'changed' }] },
    ])
    const component = createComponent(root, { 'data-cms-component': 'product-latest' })
    const grapes = createGrapes()
    const editor = createEditor()

    useCmsLivePreview(grapes as any)
    grapes.init(editor)
    editor.trigger('component:add', component)

    expect(fetchMock).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(249)
    expect(fetchMock).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    await flushPromises()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(root.querySelector('[data-cms-preview]')?.querySelector('[data-cms-bind]')?.textContent).toBe('Scheduled')

    component.trigger('change:attributes')
    await vi.advanceTimersByTimeAsync(399)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1)
    await flushPromises()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(root.querySelector('[data-cms-preview]')?.querySelector('[data-cms-bind]')?.textContent).toBe('Changed')
  })
})
