import { afterEach, describe, expect, it, vi } from 'vitest'

import { navbarScript } from './script.js'

class FakeNavbarElement {
  readonly classList: {
    add: (...classes: string[]) => void
    remove: (...classes: string[]) => void
    contains: (className: string) => boolean
    toggle: (className: string, force?: boolean) => boolean
  }

  readonly children: FakeNavbarElement[] = []
  parentElement: FakeNavbarElement | null = null
  innerHTML = ''

  private readonly classes: Set<string>
  private readonly attributes = new Map<string, string>()
  private readonly listeners = new Map<string, Array<(event?: unknown) => void>>()

  constructor(classes: string[] = [], attributes: Record<string, string> = {}) {
    this.classes = new Set(classes)
    Object.entries(attributes).forEach(([key, value]) => this.attributes.set(key, value))
    this.classList = {
      add: (...classNames: string[]) => {
        classNames.forEach((className) => this.classes.add(className))
      },
      remove: (...classNames: string[]) => {
        classNames.forEach((className) => this.classes.delete(className))
      },
      contains: (className: string) => this.classes.has(className),
      toggle: (className: string, force?: boolean) => {
        const next = force ?? !this.classes.has(className)
        if (next) this.classes.add(className)
        else this.classes.delete(className)
        return next
      },
    }
  }

  append(...children: FakeNavbarElement[]) {
    children.forEach((child) => {
      child.parentElement = this
      this.children.push(child)
    })
  }

  get textContent() {
    return this.innerHTML
  }

  set textContent(value: string) {
    this.innerHTML = value
  }

  querySelector(selector: string) {
    return this.querySelectorAll(selector)[0] ?? null
  }

  querySelectorAll(selector: string) {
    const selectors = selector.split(',').map((item) => item.trim()).filter(Boolean)
    return this.descendants().filter((element) =>
      selectors.some((item) => element.matches(item)),
    )
  }

  matches(selector: string) {
    const classNames = [...selector.matchAll(/\.([A-Za-z0-9_-]+)/g)].map((match) => match[1])
    if (!classNames.every((className) => this.classes.has(className))) return false

    const attributeMatches = [...selector.matchAll(/\[([A-Za-z0-9_-]+)(?:="([^"]*)")?\]/g)]
    return attributeMatches.every((match) => {
      const key = match[1]
      const expected = match[2]
      if (!this.attributes.has(key)) return false
      return expected === undefined || this.attributes.get(key) === expected
    })
  }

  closest(selector: string) {
    let current: FakeNavbarElement | null = this
    while (current) {
      if (current.matches(selector)) return current
      current = current.parentElement
    }
    return null
  }

  addEventListener(type: string, handler: (event?: unknown) => void) {
    const handlers = this.listeners.get(type) ?? []
    handlers.push(handler)
    this.listeners.set(type, handlers)
  }

  getAttribute(name: string) {
    return this.attributes.get(name) ?? null
  }

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value)
  }

  removeAttribute(name: string) {
    this.attributes.delete(name)
  }

  private descendants() {
    return this.children.flatMap((child) => [child, ...child.descendants()])
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('navbarScript', () => {
  it('only activates the link with the matching hash on the same path', () => {
    const root = new FakeNavbarElement(['gjs-navbar'])
    const burger = new FakeNavbarElement(['gjs-navbar__burger'])
    const menu = new FakeNavbarElement(['gjs-navbar__menu'])
    const highwayLink = new FakeNavbarElement(['gjs-navbar__link'], {
      href: 'uniroc-case#highway',
    })
    const tunnelLink = new FakeNavbarElement(['gjs-navbar__link'], {
      href: 'uniroc-case#tunnel',
    })

    menu.append(highwayLink, tunnelLink)
    root.append(burger, menu)

    vi.stubGlobal('window', {
      location: {
        href: 'https://example.test/uniroc-case#highway',
        origin: 'https://example.test',
        pathname: '/uniroc-case',
        hash: '#highway',
      },
      matchMedia: vi.fn(() => ({ matches: true })),
      addEventListener: vi.fn(),
      scrollY: 0,
      pageYOffset: 0,
    })
    vi.stubGlobal('document', {
      addEventListener: vi.fn(),
      documentElement: { scrollTop: 0 },
      body: { scrollTop: 0 },
    })

    navbarScript.call(root as unknown as HTMLElement)

    expect(highwayLink.classList.contains('is-active')).toBe(true)
    expect(highwayLink.getAttribute('aria-current')).toBe('page')
    expect(tunnelLink.classList.contains('is-active')).toBe(false)
    expect(tunnelLink.getAttribute('aria-current')).toBeNull()
  })

  it('fetches the backend menu code and renders the published navbar in backend order', async () => {
    const root = new FakeNavbarElement(['gjs-navbar'])
    const burger = new FakeNavbarElement(['gjs-navbar__burger'])
    const menu = new FakeNavbarElement(['gjs-navbar__menu'], {
      'data-menu-code': 'main-menu',
    })
    const staleLink = new FakeNavbarElement(['gjs-navbar__link'], {
      href: '/stale.html',
    })

    staleLink.textContent = 'Stale'
    menu.append(staleLink)
    root.append(burger, menu)

    const fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        data: {
          items: [
            { title: 'Products', resolvedUrl: '/products.html' },
            {
              title: 'Solutions',
              submenuType: 'mega',
              children: [
                {
                  title: 'Manufacturing',
                  resolvedUrl: '/solutions/manufacturing.html',
                  menuImage: 'https://example.test/manufacturing.jpg',
                  menuImageAlt: 'Manufacturing',
                },
              ],
            },
            {
              title: 'About',
              submenuType: 'dropdown',
              children: [{ title: 'Company', resolvedUrl: '/about/company.html' }],
            },
          ],
        },
      }),
    }))

    vi.stubGlobal('fetch', fetch)
    vi.stubGlobal('window', {
      location: {
        href: 'https://example.test/en/products.html',
        origin: 'https://example.test',
        pathname: '/en/products.html',
        hash: '',
      },
      matchMedia: vi.fn(() => ({ matches: true })),
      addEventListener: vi.fn(),
      scrollY: 0,
      pageYOffset: 0,
    })
    vi.stubGlobal('document', {
      addEventListener: vi.fn(),
      documentElement: {
        scrollTop: 0,
        getAttribute: vi.fn(() => 'en'),
      },
      body: { scrollTop: 0 },
    })

    navbarScript.call(root as unknown as HTMLElement)
    await Promise.resolve()
    await Promise.resolve()

    expect(fetch).toHaveBeenCalledWith(
      '/app-api/content/menu/code/main-menu?language=en',
      expect.objectContaining({ credentials: 'same-origin', cache: 'no-store' }),
    )
    expect(menu.innerHTML.indexOf('Products')).toBeLessThan(menu.innerHTML.indexOf('Solutions'))
    expect(menu.innerHTML.indexOf('Solutions')).toBeLessThan(menu.innerHTML.indexOf('About'))
    expect(menu.innerHTML).toContain('gjs-nav-group--mega')
    expect(menu.innerHTML).toContain('data-mega-image-src="https://example.test/manufacturing.jpg"')
    expect(menu.innerHTML).toContain('gjs-nav-group__dropdown-item')
    expect(menu.innerHTML).not.toContain('Stale')
  })
})
