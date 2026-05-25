import { describe, expect, it, vi } from 'vitest'

vi.mock('@/api/content/menu', () => ({
  getMenuList: vi.fn(),
  getAvailablePagePage: vi.fn(),
  getAvailablePages: vi.fn(),
  getAvailablePostPage: vi.fn(),
  getAvailablePosts: vi.fn(),
  getAvailableProductPage: vi.fn(),
  getAvailableProducts: vi.fn(),
}))

vi.mock('@/api/content/page', () => ({
  getPagePage: vi.fn(),
}))

import {
  createTraitDataSourceRegistry,
  dedupeTraitDataSourceOptions,
  getLocalPageLinkOptions,
  normalizePageHref,
  resolveRemotePageHref,
} from './traitDataSourceRegistry'

const makePage = (attrs: Record<string, any>) => ({
  ...attrs,
  get: (key: string) => attrs[key],
})

describe('traitDataSourceRegistry', () => {
  it('normalizes hrefs and dedupes options by normalized value', () => {
    expect(normalizePageHref('about')).toBe('/about')
    expect(normalizePageHref('https://example.com')).toBe('https://example.com')
    expect(resolveRemotePageHref({ resourceName: 'About Us' })).toBe('/about-us.html')

    expect(
      dedupeTraitDataSourceOptions([
        { value: '/a', label: 'A' },
        { value: ' /a ', label: 'Duplicate' },
        { value: '', label: 'Empty' },
        { value: '/b', label: 'B' },
      ]),
    ).toEqual([
      { value: '/a', label: 'A' },
      { value: '/b', label: 'B' },
    ])
  })

  it('builds local page link options from editor pages', () => {
    const editor = {
      Pages: {
        getAll: () => [
          makePage({ id: 'home', name: 'Home', slug: '' }),
          makePage({ id: 'about', name: 'About', slug: 'about' }),
          makePage({ id: 'about-copy', name: 'About Copy', slug: 'about' }),
        ],
      },
    }

    expect(getLocalPageLinkOptions(editor as any)).toEqual([
      { value: '/', label: 'Home', group: '页面' },
      { value: '/about', label: 'About', group: '页面' },
    ])
  })

  it('loads page links through source APIs, falls back to CMS pages, and caches results', async () => {
    const deps = {
      getAvailablePagePage: vi.fn(async () => ({ list: [] })),
      getAvailablePages: vi.fn(async () => []),
      getPagePage: vi.fn(async () => ({
        list: [{ resourceName: 'CMS About', resourceKey: 'about' }],
      })),
    }
    const registry = createTraitDataSourceRegistry({} as any, deps as any)

    await expect(registry.loadPageLinks()).resolves.toEqual([
      { value: '/cms-about.html', label: 'CMS About', group: '页面' },
    ])
    await expect(registry.loadPageLinks()).resolves.toEqual([
      { value: '/cms-about.html', label: 'CMS About', group: '页面' },
    ])

    expect(deps.getAvailablePagePage).toHaveBeenCalledTimes(1)
    expect(deps.getAvailablePages).toHaveBeenCalledTimes(1)
    expect(deps.getPagePage).toHaveBeenCalledTimes(1)
  })

  it('loads post links per type and reuses cached type-specific results', async () => {
    const deps = {
      getAvailablePostPage: vi.fn(async () => ({
        list: [
          { name: 'Post A', resolvedUrl: '/posts/a', typeId: 10 },
          { name: 'Post B', resolvedUrl: '/posts/b', typeId: 20 },
        ],
      })),
      getAvailablePosts: vi.fn(async () => []),
    }
    const registry = createTraitDataSourceRegistry({} as any, deps as any)

    await expect(registry.loadPostLinks({ typeId: '10' })).resolves.toEqual([
      { value: '/posts/a', label: 'Post A', group: '文章', typeId: 10 },
      { value: '/posts/b', label: 'Post B', group: '文章', typeId: 20 },
    ])
    expect(registry.getCachedPostLinks('10')).toHaveLength(2)
    await registry.loadPostLinks({ typeId: '10' })
    expect(deps.getAvailablePostPage).toHaveBeenCalledTimes(1)
  })

  it('falls back to available product list when paged product source is empty', async () => {
    const deps = {
      getAvailableProductPage: vi.fn(async () => ({ list: [] })),
      getAvailableProducts: vi.fn(async () => [{ name: 'Product A', resolvedUrl: '/p/a' }]),
    }
    const registry = createTraitDataSourceRegistry({} as any, deps as any)

    await expect(registry.loadProductLinks()).resolves.toEqual([
      { value: '/p/a', label: 'Product A', group: '产品' },
    ])
  })

  it('loads menu options with value and label variants', async () => {
    const deps = {
      getMenuList: vi.fn(async () => [
        { id: 1, name: 'Main', code: 'main' },
        { id: 2, name: 'Footer', code: 'footer' },
      ]),
    }
    const registry = createTraitDataSourceRegistry({} as any, deps as any)

    await expect(
      registry.loadMenuOptions({
        valueField: 'code',
        labelMode: 'name-code-always',
        requireCode: true,
      }),
    ).resolves.toEqual([
      { value: 'main', label: 'Main (main)', id: '1', code: 'main' },
      { value: 'footer', label: 'Footer (footer)', id: '2', code: 'footer' },
    ])

    await registry.loadMenuOptions({
      valueField: 'code',
      labelMode: 'name-code-always',
      requireCode: true,
    })
    expect(deps.getMenuList).toHaveBeenCalledTimes(1)
  })
})
