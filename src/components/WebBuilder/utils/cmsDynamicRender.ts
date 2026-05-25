import {
  bindDynamicRenderData,
  normalizeSiteHref,
  type BindDynamicRenderOptions,
  type DynamicRenderData,
} from './dynamicRenderPipeline'

export type CmsDynamicAttrs = Record<string, string>
export type CmsDynamicRawItem = Record<string, unknown>
export type CmsDynamicRawPage = CmsDynamicRawItem[] | {
  list?: unknown
  total?: unknown
  totalCount?: unknown
  count?: unknown
  recordsTotal?: unknown
  pageNo?: unknown
  pageSize?: unknown
  pages?: unknown
  totalPages?: unknown
  pageCount?: unknown
}
export type CmsDynamicFieldValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | unknown[]
  | Record<string, unknown>
export type CmsDynamicItemData = Record<string, CmsDynamicFieldValue>

export interface CmsDynamicRequest {
  endpoint: string
  params: Record<string, string>
}

export interface CmsDynamicPage {
  items: CmsDynamicRawItem[]
  itemData: CmsDynamicItemData[]
  total: number
  pageNo: number
  pageSize: number
  totalPages: number
  isEmpty: boolean
}

export interface CmsDynamicRenderConfig {
  endpoint: string
  buildParams: (attrs: CmsDynamicAttrs) => Record<string, string>
  transformItem: (item: CmsDynamicRawItem) => CmsDynamicItemData
}

function formatDate(value: any): string {
  if (!value) return ''
  try {
    return new Date(value).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return String(value)
  }
}

function buildFeaturesText(features: any): string {
  if (Array.isArray(features)) return features.filter(Boolean).join(' / ')
  if (features == null) return ''
  return String(features)
}

export function buildStaticProductUrl(item: unknown): string {
  const source = item as any
  const slug = String(source?.slug ?? source?.productSlug ?? '').trim()
  const productId = source?.id ?? source?.spuId
  const identifier = slug || (productId == null ? '' : String(productId).trim())
  const canonicalUrl = identifier ? `/products/${encodeURIComponent(identifier)}.html` : '#'

  const explicitUrl = normalizeSiteHref(source?.url ?? source?.productUrl)
  if (!explicitUrl) return canonicalUrl

  if (/^\/(?:[a-z]{2}(?:-[a-z]{2})?)?\/?products\//i.test(explicitUrl)) {
    return explicitUrl
  }

  return canonicalUrl
}

export function buildStaticPostUrl(item: unknown): string {
  const source = item as any
  const content = source?.contents?.[0] || {}
  const explicitUrl = normalizeSiteHref(
    source?.url ||
      source?.postUrl ||
      source?.detailUrl ||
      source?.link ||
      content?.url ||
      content?.postUrl ||
      content?.detailUrl ||
      content?.link,
  )
  if (explicitUrl) return explicitUrl

  const slug = String(source?.slug ?? content?.slug ?? '').trim()
  const typeCode = String(source?.typeCode ?? '').trim()
  const id = source?.id == null ? '' : String(source.id).trim()
  const identifier = slug || id
  if (!identifier || !typeCode) return '#'

  return `/en/post/${encodeURIComponent(typeCode)}/${encodeURIComponent(identifier)}.html`
}

export function buildTechnicalServiceUrl(item: unknown): string {
  const source = item as any
  const explicitUrl = normalizeSiteHref(source?.detailUrl ?? source?.url)
  if (/^\/(?:[a-z]{2}(?:-[a-z]{2})?)?\/?[^?#]+\.html(?:[?#]|$)/i.test(explicitUrl)) {
    return explicitUrl
  }

  const categoryCode = String(source?.categoryCode ?? '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
  const slug = String(source?.slug ?? source?.contents?.[0]?.slug ?? '').trim()
  const id = String(source?.id ?? '').trim()
  const identifier = slug || id
  if (categoryCode && identifier) {
    return `/${categoryCode}/${identifier}.html`
  }

  return '#'
}

export function buildMediaDownloadUrl(item: unknown): string {
  const source = item as any
  const directUrl = normalizeSiteHref(source?.url)
  if (directUrl) return directUrl

  const firstItemUrl = normalizeSiteHref(source?.items?.[0]?.url)
  if (firstItemUrl) return firstItemUrl

  return '#'
}

export function buildProductSpecValueMap(item: unknown): Record<string, unknown> {
  const source = item as any
  const specs = Array.isArray(source?.specifications) ? source.specifications : []
  const result: Record<string, unknown> = {}
  specs.forEach((spec: any) => {
    const code = String(spec?.code || spec?.name || '').trim()
    if (!code) return
    result[code] = {
      code,
      name: spec?.name || spec?.label || code,
      label: spec?.label || spec?.name || code,
      groupCode: spec?.groupCode || 'general',
      groupName: spec?.groupName || '',
      valueType: spec?.valueType || 'TEXT',
      unit: spec?.unit || '',
      value: spec?.value || spec?.rawValue || spec?.textValue || '',
      rawValue: spec?.rawValue || spec?.value || spec?.textValue || '',
      numericValue: spec?.numericValue,
      minValue: spec?.minValue,
      maxValue: spec?.maxValue,
      optionValues: Array.isArray(spec?.optionValues) ? spec.optionValues : [],
    }
  })
  return result
}

function transformPostItem(item: any): CmsDynamicItemData {
  const content = item?.contents?.[0] || {}
  const title = content.name || item?.name || ''

  return {
    'post.id': item?.id == null ? '' : String(item.id),
    'post.name': title,
    'post.slug': content.slug || item?.slug || '',
    'post.image': item?.image || '',
    'post.imageAlt': item?.imageAlt != null ? String(item.imageAlt) : title,
    'post.excerpt': content.excerpt || item?.excerpt || '',
    'post.content': content.content || content.contentHtml || '',
    'post.publishTime': formatDate(item?.publishTime || item?.createTime || content.publishTime),
    'post.typeCode': item?.typeCode || '',
    'post.typeName': item?.typeName || '',
    'post.views': item?.views == null ? '' : String(item.views),
    'post.author': item?.author || item?.authorName || '',
    'post.metaKeywords': content.metaKeywords || content.keywords || '',
    'post.metaDescription': content.metaDescription || content.description || '',
    'post.url': buildStaticPostUrl(item),
    'post.categoryIds': item?.categoryIds || [],
    'post.categoryNames': item?.categoryNames || [],
    'post.tagIds': item?.tagIds || [],
    'post.tagNames': item?.tagNames || [],
  }
}

function transformProductItem(item: any): CmsDynamicItemData {
  const specValueMap = buildProductSpecValueMap(item)
  const designationSpec = specValueMap.designation as { value?: unknown } | undefined

  return {
    'product.id': item?.id == null ? '' : String(item.id),
    'product.name': item?.name || '',
    'product.slug': item?.slug || item?.productSlug || '',
    'product.brandName': item?.brandName || '',
    'product.categoryName': item?.categoryName || '',
    'product.introduction': item?.introduction || item?.brief || '',
    'product.featuresText': buildFeaturesText(item?.features),
    'product.keyword': item?.keyword || '',
    'product.description': item?.description || item?.detail || '',
    'product.picUrl': item?.sliderPicUrls?.[0] || item?.picUrl || '',
    'product.price': item?.price == null ? '' : String(item.price),
    'product.marketPrice': item?.marketPrice == null ? '' : String(item.marketPrice),
    'product.priceFormatted':
      item?.priceFormatted ||
      (item?.price != null ? `¥${(Number(item.price) / 100).toFixed(2)}` : ''),
    'product.salesCount': item?.salesCount != null ? `${item.salesCount} 销量` : '',
    'product.stock': item?.stock == null ? '' : String(item.stock),
    'product.url': item?.url || buildStaticProductUrl(item),
    'product.buyNowUrl': item?.buyNowUrl || buildStaticProductUrl(item),
    'product.buyNowTarget': item?.buyNowTarget || (item?.buyNowTargetBlank ? '_blank' : '_self'),
    'product.datasheetDesignation': designationSpec?.value || item?.name || '',
    'product.specValueJson': Object.keys(specValueMap).length ? JSON.stringify(specValueMap) : '',
    'product.specifications': Array.isArray(item?.specifications) ? JSON.stringify(item.specifications) : '',
  }
}

const buildPostListParams = (attrs: CmsDynamicAttrs) => {
  const params: Record<string, string> = {
    pageNo: '1',
    pageSize: attrs['data-page-size'] || '12',
  }
  if (attrs['data-category-id']) params.categoryId = attrs['data-category-id']
  return params
}

const buildProductListParams = (attrs: CmsDynamicAttrs) => {
  const listMode = attrs['data-list-mode'] || attrs['data-wb-list-mode'] || 'grid'
  const loadAll =
    listMode === 'datasheet' ||
    attrs['data-load-all'] === 'true' ||
    attrs['data-wb-load-all'] === 'true'
  const sortingField = attrs['data-sort-field'] || attrs['data-wb-sort-field'] || 'createTime'
  const isDatasheetSort = sortingField.startsWith('datasheet:')
  const params: Record<string, string> = {
    pageNo: '1',
    pageSize: loadAll ? '9999' : attrs['data-page-size'] || attrs['data-wb-page-size'] || '12',
    includeSpecifications: 'true',
    sortingField: isDatasheetSort ? 'createTime' : sortingField,
    asc: isDatasheetSort ? 'false' : attrs['data-sort-asc'] || attrs['data-wb-sort-asc'] || 'false',
  }
  const categoryId = attrs['data-category-id'] || attrs['data-wb-category-id']
  if (categoryId) params.categoryId = categoryId
  return params
}

export const CMS_DYNAMIC_RENDER_CONFIGS: Record<string, CmsDynamicRenderConfig> = {
  'post-list': {
    endpoint: '/admin-api/content/post/page',
    buildParams: buildPostListParams,
    transformItem: transformPostItem,
  },
  'cases-list': {
    endpoint: '/admin-api/content/post/page',
    buildParams: buildPostListParams,
    transformItem: transformPostItem,
  },
  'post-latest': {
    endpoint: '/admin-api/content/post/page',
    buildParams: (attrs) => ({
      pageNo: '1',
      pageSize: attrs['data-limit'] || '6',
    }),
    transformItem: transformPostItem,
  },
  'product-list': {
    endpoint: '/admin-api/product/spu/page',
    buildParams: buildProductListParams,
    transformItem: transformProductItem,
  },
  'product-latest': {
    endpoint: '/admin-api/product/spu/page',
    buildParams: (attrs) => ({
      pageNo: '1',
      pageSize: attrs['data-limit'] || '6',
      sortingField: 'createTime',
      asc: 'false',
    }),
    transformItem: transformProductItem,
  },
  'product-featured': {
    endpoint: '/admin-api/product/spu/page',
    buildParams: (attrs) => {
      const params: Record<string, string> = {
        pageNo: '1',
        pageSize: attrs['data-limit'] || '6',
        sortingField: 'createTime',
        asc: 'false',
      }
      if (attrs['data-category-id']) params.categoryId = attrs['data-category-id']
      return params
    },
    transformItem: transformProductItem,
  },
  'faq-section': {
    endpoint: '/admin-api/content/faq-item/list-all',
    buildParams: () => ({}),
    transformItem: (item) => ({
      'faq.question': item?.question || '',
      'faq.answerHtml': String(item?.answerHtml || item?.answer || '').replace(/\r?\n/g, '<br/>'),
    }),
  },
  'media-list': {
    endpoint: '/admin-api/content/media-resource/page',
    buildParams: (attrs) => {
      const params: Record<string, string> = {
        pageNo: '1',
        pageSize: attrs['data-page-size'] || '12',
      }
      if (attrs['data-category-id']) params.categoryId = attrs['data-category-id']
      if (attrs['data-resource-type']) params.type = attrs['data-resource-type']
      return params
    },
    transformItem: (item) => ({
      'media.title': item?.title || '',
      'media.url': item?.url || item?.mediaUrl || '',
      'media.coverUrl': item?.coverUrl || '',
      'media.description': item?.description || '',
      'media.detailUrl': '#',
    }),
  },
  'technical-service-list': {
    endpoint: '/admin-api/content/media-resource/page',
    buildParams: (attrs) => {
      const params: Record<string, string> = {
        pageNo: '1',
        pageSize: attrs['data-page-size'] || '99',
      }
      if (attrs['data-category-id']) params.categoryId = attrs['data-category-id']
      return params
    },
    transformItem: (item) => ({
      'media.title': item?.title || item?.contents?.[0]?.title || '',
      'media.coverUrl': item?.coverUrl || '',
      'media.description': item?.description || item?.contents?.[0]?.description || '',
      'media.detailUrl': buildTechnicalServiceUrl(item),
    }),
  },
  'technical-download-list': {
    endpoint: '/admin-api/content/media-resource/page',
    buildParams: (attrs) => {
      const params: Record<string, string> = {
        pageNo: '1',
        pageSize: attrs['data-page-size'] || '99',
      }
      if (attrs['data-category-id']) params.categoryId = attrs['data-category-id']
      return params
    },
    transformItem: (item) => ({
      'media.title': item?.title || item?.contents?.[0]?.title || '',
      'media.downloadUrl': buildMediaDownloadUrl(item),
    }),
  },
  'technical-support-detail': {
    endpoint: '/admin-api/content/media-resource/get-detail',
    buildParams: (attrs) => ({
      id: attrs['data-media-id'] || '',
    }),
    transformItem: (item) => ({
      'media.title': item?.title || item?.contents?.[0]?.title || '',
      'media.description': item?.description || item?.contents?.[0]?.description || '',
      'media.coverUrl': item?.coverUrl || '',
      'media.seoTitle': item?.contents?.[0]?.seoTitle || item?.title || '',
      'media.seoDescription': item?.contents?.[0]?.seoDescription || item?.description || '',
      'media.seoKeywords': item?.contents?.[0]?.seoKeywords || '',
    }),
  },
  'product-detail': {
    endpoint: '/admin-api/product/spu/get-detail',
    buildParams: (attrs) => ({
      id: attrs['data-product-id'] || '',
    }),
    transformItem: transformProductItem,
  },
}

export function getCmsDynamicRenderConfig(cmsType: string): CmsDynamicRenderConfig | undefined {
  return CMS_DYNAMIC_RENDER_CONFIGS[cmsType]
}

export function buildCmsDynamicRequest(
  cmsType: string,
  attrs: CmsDynamicAttrs,
): CmsDynamicRequest {
  const config = getCmsDynamicRenderConfig(cmsType)
  if (!config) {
    throw new Error(`Unsupported CMS dynamic component "${cmsType}"`)
  }
  return {
    endpoint: config.endpoint,
    params: config.buildParams(attrs),
  }
}

export function normalizeCmsDynamicItems(
  cmsType: string,
  items: CmsDynamicRawItem[],
): CmsDynamicItemData[] {
  const config = getCmsDynamicRenderConfig(cmsType)
  if (!config) return []
  return items.map((item) => config.transformItem(item))
}

export function normalizeCmsDynamicPage(
  cmsType: string,
  rawData: CmsDynamicRawPage,
  attrs: CmsDynamicAttrs = {},
): CmsDynamicPage {
  const rawPage = Array.isArray(rawData) ? null : rawData
  const sourceItems = Array.isArray(rawData) ? rawData : rawPage?.list ?? []
  let items: CmsDynamicRawItem[] = Array.isArray(sourceItems)
    ? sourceItems.filter((item): item is CmsDynamicRawItem => !!item && typeof item === 'object')
    : []
  let pageNo = parseInt(String(rawPage?.pageNo ?? attrs.pageNo ?? attrs['data-page-no'] ?? '1'), 10) || 1
  let pageSize = parseInt(String(rawPage?.pageSize ?? attrs.pageSize ?? attrs['data-page-size'] ?? items.length ?? '0'), 10) || 0
  let total = parseInt(
    String(rawPage?.total ?? rawPage?.totalCount ?? rawPage?.count ?? rawPage?.recordsTotal ?? items.length),
    10,
  ) || 0
  let totalPages = parseInt(
    String(
      rawPage?.pages ??
        rawPage?.totalPages ??
        rawPage?.pageCount ??
        (pageSize > 0 ? Math.ceil(total / pageSize) : 0),
    ),
    10,
  ) || 0

  if (cmsType === 'faq-section') {
    const categoryId = Number(attrs['data-category-id'] || 0)
    const limit = Math.max(1, Number(attrs['data-limit'] || 6) || 6)
    const filtered = items
      .filter((item) => {
        if (!Number.isFinite(categoryId) || categoryId <= 0) return true
        return Number(item?.categoryId) === categoryId
      })
      .sort((a, b) => {
        const sortA = Number(a?.sort ?? 0)
        const sortB = Number(b?.sort ?? 0)
        if (sortA !== sortB) return sortA - sortB
        return Number(a?.id ?? 0) - Number(b?.id ?? 0)
      })
      .slice(0, limit)
    items = filtered
    pageNo = 1
    pageSize = limit
    total = filtered.length
    totalPages = filtered.length > 0 ? 1 : 0
  }

  return {
    items,
    itemData: normalizeCmsDynamicItems(cmsType, items),
    total,
    pageNo,
    pageSize,
    totalPages,
    isEmpty: items.length === 0,
  }
}

export function bindCmsDynamicRenderData(
  root: Element,
  data: DynamicRenderData,
  options: BindDynamicRenderOptions = {},
): Element {
  return bindDynamicRenderData(root, data, options)
}

export function readCmsDynamicAttrs(el: Element): CmsDynamicAttrs {
  const attrs: CmsDynamicAttrs = {}
  Array.from(el.attributes).forEach((attr) => {
    attrs[attr.name] = attr.value
  })
  return attrs
}
