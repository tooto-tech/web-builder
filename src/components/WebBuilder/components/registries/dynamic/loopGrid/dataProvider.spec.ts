import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_LOOP_GRID_SCHEMA } from './types'
import {
  createLatestOnlyLoader,
  createLoopGridDataProvider,
  type LoopGridDataProviderAdapters
} from './dataProvider'

vi.mock('@/api/content/page', () => ({
  getDraft: vi.fn(),
  getHistoryDetail: vi.fn(),
  getPagePage: vi.fn()
}))
vi.mock('@/api/content/post', () => ({ getPostPage: vi.fn() }))
vi.mock('@/api/content/postCategory', () => ({ getAllPostCategoryList: vi.fn() }))
vi.mock('@/api/content/faqItem', () => ({ getAllFaqItemList: vi.fn() }))
vi.mock('@/api/content/productCategoryContent', () => ({ getProductCategoryContent: vi.fn() }))
vi.mock('@/api/content/mediaResource', () => ({ getMediaResourcePage: vi.fn() }))
vi.mock('@/api/content/mediaResourceCategory', () => ({ getAllMediaResourceCategoryList: vi.fn() }))
vi.mock('@/api/mall/product/spu', () => ({ getSpuPage: vi.fn() }))
vi.mock('@/api/mall/product/category', () => ({ getCategoryList: vi.fn() }))

function makeAdapters(
  overrides: Partial<LoopGridDataProviderAdapters> = {}
): LoopGridDataProviderAdapters {
  return {
    posts: { loadPage: vi.fn() },
    products: { loadPage: vi.fn() },
    media: { loadPage: vi.fn() },
    templates: {
      loadList: vi.fn(),
      loadDraft: vi.fn(),
      loadHistoryDetail: vi.fn()
    },
    postCategories: { loadList: vi.fn() },
    productCategories: { loadList: vi.fn() },
    mediaCategories: { loadList: vi.fn() },
    context: {
      loadProductCategoryContent: vi.fn(),
      loadFaqItems: vi.fn()
    },
    ...overrides
  }
}

describe('loop grid data provider', () => {
  it('loads post preview data through the post adapter', async () => {
    const adapters = makeAdapters()
    vi.mocked(adapters.posts.loadPage).mockResolvedValue({
      list: [
        {
          id: 42,
          typeName: 'News',
          publishTime: '2026-05-01T00:00:00Z',
          contents: [{ name: 'Adapter Post', excerpt: 'Summary', slug: 'adapter-post' }]
        }
      ],
      total: 1,
      pageNo: 1,
      pageSize: 6
    })

    const provider = createLoopGridDataProvider(adapters)
    const result = await provider.loadPreviewData({
      ...DEFAULT_LOOP_GRID_SCHEMA,
      query: { ...DEFAULT_LOOP_GRID_SCHEMA.query, sourceType: 'posts' }
    })

    expect(adapters.posts.loadPage).toHaveBeenCalledWith({
      pageNo: 1,
      pageSize: 6
    })
    expect(result).toMatchObject({
      items: [
        {
          id: '42',
          type: 'posts',
          title: 'Adapter Post',
          excerpt: 'Summary',
          taxonomy: 'News'
        }
      ],
      pageNo: 1,
      total: 1,
      totalPages: 1
    })
  })

  it('returns an empty preview result when the adapter returns no records', async () => {
    const adapters = makeAdapters()
    vi.mocked(adapters.products.loadPage).mockResolvedValue({ list: [], total: 0 })

    const provider = createLoopGridDataProvider(adapters)
    const result = await provider.loadPreviewData({
      ...DEFAULT_LOOP_GRID_SCHEMA,
      loopItemType: 'product',
      query: { ...DEFAULT_LOOP_GRID_SCHEMA.query, sourceType: 'products' }
    })

    expect(result).toEqual({
      items: [],
      pageNo: 1,
      total: 0,
      totalPages: 1
    })
  })

  it('returns an error preview result when an adapter request fails', async () => {
    const adapters = makeAdapters()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.mocked(adapters.media.loadPage).mockRejectedValue(new Error('media unavailable'))

    const provider = createLoopGridDataProvider(adapters)
    const result = await provider.loadPreviewData({
      ...DEFAULT_LOOP_GRID_SCHEMA,
      loopItemType: 'media',
      query: { ...DEFAULT_LOOP_GRID_SCHEMA.query, sourceType: 'media' }
    })

    expect(result).toEqual({
      items: [],
      error: 'media unavailable'
    })
    expect(consoleError).toHaveBeenCalledWith(
      '[WebBuilder] Failed to load loop grid preview data',
      expect.any(Error)
    )
    consoleError.mockRestore()
  })

  it('ignores stale async responses in latest-only loaders', async () => {
    const loader = createLatestOnlyLoader<string>()
    const applied: string[] = []
    let resolveSlow!: (value: string) => void
    let resolveFast!: (value: string) => void

    const slow = new Promise<string>((resolve) => {
      resolveSlow = resolve
    })
    const fast = new Promise<string>((resolve) => {
      resolveFast = resolve
    })

    const slowRun = loader.run(() => slow, (value) => applied.push(value))
    const fastRun = loader.run(() => fast, (value) => applied.push(value))

    resolveFast('new')
    await fastRun
    resolveSlow('old')
    await slowRun

    expect(applied).toEqual(['new'])
  })
})
