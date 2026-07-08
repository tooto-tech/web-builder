import { describe, expect, it } from 'vitest'
import {
  createLayoutPageData,
  getGrapesPageMatchIds,
  getLayoutPageFallbackName,
  getPageLayoutSlot,
  layoutTargetMatchesPage,
  normalizeLayoutSettings,
  resolveLayoutIdForPage,
} from './layoutSettings'

describe('layoutSettings', () => {
  it('returns no layout when no rule matches and no global layout exists', () => {
    const settings = normalizeLayoutSettings({
      header: {
        defaultLayoutId: 10,
        rules: [],
      },
    })

    expect(resolveLayoutIdForPage(settings.header, 'home')).toBeNull()
  })

  it('does not fall back to available layouts when no rule matches', () => {
    const settings = normalizeLayoutSettings({
      footer: {
        rules: [],
      },
    })

    expect(resolveLayoutIdForPage(settings.footer, 'home', ['global-footer'])).toBeNull()
  })

  it('resolves include and exclude rules by descending priority', () => {
    const settings = normalizeLayoutSettings({
      header: {
        defaultLayoutId: 10,
        rules: [
          {
            id: 'exclude-products',
            layoutId: 20,
            matchMode: 'exclude',
            pageIds: ['products'],
            enabled: true,
            priority: 1,
          },
          {
            id: 'home-only',
            layoutId: 30,
            matchMode: 'include',
            pageIds: ['home'],
            enabled: true,
            priority: 2,
          },
        ],
      },
    })

    expect(resolveLayoutIdForPage(settings.header, 'home')).toBe(30)
    expect(resolveLayoutIdForPage(settings.header, 'about')).toBe(20)
    expect(resolveLayoutIdForPage(settings.header, 'products')).toBeNull()
  })

  it('preserves dynamic target resource types and rule conditions', () => {
    const settings = normalizeLayoutSettings({
      header: {
        rules: [
          {
            id: 'post-category-header',
            layoutId: 'wb-header-post',
            matchMode: 'exclude',
            pageIds: [],
            enabled: true,
            priority: 4,
            targetResourceTypes: ['TEMP_POST_DETAIL'],
            conditions: {
              categoryIds: [18, '21'],
              excludePostIds: [99],
              publishTimeRange: {
                start: '2026-01-01',
                end: '2026-12-31',
              },
            },
          },
        ],
      },
    })

    expect(settings.header.rules[0]).toMatchObject({
      targetResourceTypes: ['TEMP_POST_DETAIL'],
      conditions: {
        categoryIds: [18, 21],
        excludePostIds: [99],
        publishTimeRange: {
          start: '2026-01-01',
          end: '2026-12-31',
        },
      },
    })
  })

  it('matches article detail layout rules by target resource type and article category', () => {
    const settings = normalizeLayoutSettings({
      header: {
        rules: [
          {
            id: 'post-template-fallback',
            layoutId: 'wb-header-fallback',
            matchMode: 'exclude',
            pageIds: [],
            enabled: true,
            priority: 1,
            targetResourceTypes: ['TEMP_POST_DETAIL'],
            conditions: {},
          },
          {
            id: 'post-category-specific',
            layoutId: 'wb-header-category',
            matchMode: 'exclude',
            pageIds: [],
            enabled: true,
            priority: 1,
            targetResourceTypes: ['TEMP_POST_DETAIL'],
            conditions: {
              categoryIds: [18],
            },
          },
        ],
      },
    })

    expect(resolveLayoutIdForPage(settings.header, 'post.detail', [], {
      resourceType: 'TEMP_POST_DETAIL',
      attributes: {
        postId: 42,
        categoryIds: [18, 33],
      },
    })).toBe('wb-header-category')
  })

  it('excludes dynamic detail rules when exclude conditions match', () => {
    const settings = normalizeLayoutSettings({
      header: {
        rules: [
          {
            id: 'excluded-post',
            layoutId: 'wb-header-a',
            matchMode: 'exclude',
            pageIds: [],
            enabled: true,
            priority: 9,
            targetResourceTypes: ['TEMP_POST_DETAIL'],
            conditions: {
              categoryIds: [18],
              excludePostIds: [42],
            },
          },
          {
            id: 'category-fallback',
            layoutId: 'wb-header-b',
            matchMode: 'exclude',
            pageIds: [],
            enabled: true,
            priority: 1,
            targetResourceTypes: ['TEMP_POST_DETAIL'],
            conditions: {
              categoryIds: [18],
            },
          },
        ],
      },
    })

    expect(resolveLayoutIdForPage(settings.header, 'post.detail', [], {
      resourceType: 'TEMP_POST_DETAIL',
      attributes: {
        postId: 42,
        categoryIds: [18],
      },
    })).toBe('wb-header-b')
  })

  it('applies an exclude rule globally except selected pages', () => {
    const settings = normalizeLayoutSettings({
      footer: {
        rules: [
          {
            id: 'all-except-home',
            layoutId: 'footer-global',
            matchMode: 'exclude',
            pageIds: ['home'],
            enabled: true,
            priority: 0,
          },
        ],
      },
    })

    expect(resolveLayoutIdForPage(settings.footer, 'home')).toBeNull()
    expect(resolveLayoutIdForPage(settings.footer, 'about')).toBe('footer-global')
    expect(resolveLayoutIdForPage(settings.footer, 'products')).toBe('footer-global')
  })

  it('applies an exclude rule globally when page ids are empty', () => {
    const settings = normalizeLayoutSettings({
      header: {
        rules: [
          {
            id: 'global-header',
            layoutId: 'wb-header-2',
            matchMode: 'exclude',
            pageIds: [],
            enabled: true,
            priority: 0,
          },
        ],
      },
    })

    expect(resolveLayoutIdForPage(settings.header, 'home')).toBe('wb-header-2')
    expect(resolveLayoutIdForPage(settings.header, 'about')).toBe('wb-header-2')
  })

  it('skips rules pointing to removed layout pages', () => {
    const settings = normalizeLayoutSettings({
      header: {
        rules: [
          {
            id: 'stale-rule',
            layoutId: 'missing-header',
            matchMode: 'exclude',
            pageIds: ['home'],
            enabled: true,
            priority: 0,
          },
          {
            id: 'current-rule',
            layoutId: 'current-header',
            matchMode: 'exclude',
            pageIds: ['home'],
            enabled: true,
            priority: 1,
          },
        ],
      },
    })

    expect(resolveLayoutIdForPage(settings.header, 'about', ['current-header'])).toBe('current-header')
  })

  it('matches any known page alias', () => {
    const settings = normalizeLayoutSettings({
      header: {
        rules: [
          {
            id: 'home-only',
            layoutId: 30,
            matchMode: 'include',
            pageIds: ['home'],
            enabled: true,
            priority: 0,
          },
        ],
      },
    })

    expect(resolveLayoutIdForPage(settings.header, ['首页', 'home-page', 'home'])).toBe(30)
  })

  it('keeps generated layout page ids recoverable after reload', () => {
    expect(getLayoutPageFallbackName('wb-header-2')).toBe('Header 2')
    expect(getGrapesPageMatchIds({
      get: (key: string) => key === 'custom' ? { wbLayoutPageId: 'wb-header-2' } : '',
      name: 'Header 2',
    })).toContain('wb-header-2')
  })

  it('matches legacy layout aliases against current layout page ids', () => {
    const headerPage = {
      id: 'generated-1',
      name: 'Header 2',
      get(key: string) {
        if (key === 'custom') {
          return {
            wbLayoutSlot: 'header',
            wbLayoutPageId: 'wb-header-2',
          }
        }
        return (this as any)[key]
      },
    }

    expect(layoutTargetMatchesPage('wb-header-2', headerPage)).toBe(true)
    expect(layoutTargetMatchesPage('Header 2', headerPage)).toBe(true)
    expect(layoutTargetMatchesPage('wb-header-3', headerPage)).toBe(false)
  })

  it('recognizes layout pages even when custom slot metadata is missing', () => {
    expect(getPageLayoutSlot({ id: 'wb-header' })).toBe('header')
    expect(getPageLayoutSlot({ name: 'Header 2' })).toBe('header')
    expect(getPageLayoutSlot({ id: 'wb-footer-3' })).toBe('footer')
    expect(getPageLayoutSlot({ name: 'Footer' })).toBe('footer')
  })

  it('does not reuse layout ids still reserved by old rules', () => {
    const pageData = createLayoutPageData('header', [], ['wb-header'])

    expect(pageData.id).toBe('wb-header-2')
    expect(pageData.custom.wbLayoutPageId).toBe('wb-header-2')
  })

  it('allows a matching rule to intentionally disable a layout', () => {
    const settings = normalizeLayoutSettings({
      footer: {
        rules: [
          {
            id: 'no-footer-home',
            layoutId: null,
            matchMode: 'include',
            pageIds: ['home'],
            enabled: true,
            priority: 0,
          },
          {
            id: 'footer-for-others',
            layoutId: 40,
            matchMode: 'exclude',
            pageIds: ['home'],
            enabled: true,
            priority: 1,
          },
        ],
      },
    })

    expect(resolveLayoutIdForPage(settings.footer, 'home')).toBeNull()
    expect(resolveLayoutIdForPage(settings.footer, 'about', [40])).toBe(40)
  })

  it('ignores exclude rules without a target layout id', () => {
    const settings = normalizeLayoutSettings({
      header: {
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
    })

    expect(resolveLayoutIdForPage(settings.header, 'home', ['wb-header-7'])).toBeNull()
    expect(resolveLayoutIdForPage(settings.header, 'cases', ['wb-header-7'])).toBeNull()
  })
})
