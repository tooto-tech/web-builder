import { getDraft, getHistoryDetail, getPagePage } from '@/api/content/page'
import { getPostPage } from '@/api/content/post'
import { getAllPostCategoryList } from '@/api/content/postCategory'
import { getAllFaqItemList } from '@/api/content/faqItem'
import { getProductCategoryContent } from '@/api/content/productCategoryContent'
import { getMediaResourcePage } from '@/api/content/mediaResource'
import { getAllMediaResourceCategoryList } from '@/api/content/mediaResourceCategory'
import { getSpuPage } from '@/api/mall/product/spu'
import { getCategoryList as getProductCategoryList } from '@/api/mall/product/category'
import {
  LOOP_ITEM_RESOURCE_TYPE,
  LOOP_ITEM_TYPE_LABELS,
  getLoopItemType,
  type LoopItemType
} from '@/components/WebBuilder/config/templateSharedResources'
import { getEditorRuntime } from '@/components/WebBuilder/composables/useEditorRuntime'
import type { Editor } from 'grapesjs'
import type { LoopGridPreviewData, LoopGridPreviewTemplate } from './preview'
import type { LoopGridComponentSchema, LoopGridRecord, QueryConfig } from './types'

export type LoopItemTemplateOption = {
  value: string
  label: string
  historyId?: string
  extJson?: string | null
  schemaJson?: string | null
  htmlContentInit?: string | null
  htmlContentFull?: string | null
}

export interface LoopGridDataProviderAdapters {
  posts: { loadPage(params: Record<string, unknown>): Promise<unknown> }
  products: { loadPage(params: Record<string, unknown>): Promise<unknown> }
  media: { loadPage(params: Record<string, unknown>): Promise<unknown> }
  templates: {
    loadList(params: Record<string, unknown>): Promise<unknown>
    loadDraft(params: Record<string, unknown>): Promise<unknown>
    loadHistoryDetail(id: number): Promise<unknown>
  }
  postCategories: { loadList(): Promise<unknown> }
  productCategories: { loadList(params?: Record<string, unknown>): Promise<unknown> }
  mediaCategories: { loadList(): Promise<unknown> }
  context: {
    loadProductCategoryContent(categoryId: number): Promise<unknown>
    loadFaqItems(): Promise<unknown>
  }
}

export interface LoopGridDataProvider {
  loadTemplateOptions(
    editor: Editor,
    loopItemType: LoopItemType | '',
    force?: boolean
  ): Promise<LoopItemTemplateOption[]>
  loadPreviewTemplate(editor: Editor, resourceId: string): Promise<LoopGridPreviewTemplate | null>
  loadPreviewData(schema: LoopGridComponentSchema): Promise<LoopGridPreviewData>
}

const PRODUCT_CATEGORY_CONTEXT_LOOP_TYPES = new Set<LoopItemType>(['productCategoryFaq'])

const PRODUCT_CATEGORY_CONTEXT_POST_COLLECTION_OPTIONS = [
  { value: '', label: 'None / normal list' },
  { value: 'applicationPosts', label: 'Application articles' },
  { value: 'engineeringPosts', label: 'Engineering articles' },
  { value: 'challengePosts', label: 'Challenges articles' }
] as const

type ProductCategoryContextPostCollection =
  (typeof PRODUCT_CATEGORY_CONTEXT_POST_COLLECTION_OPTIONS)[number]['value']

export function createLatestOnlyLoader<T>() {
  let token = 0

  return {
    async run(load: () => Promise<T>, apply: (value: T) => void, fail?: (error: unknown) => void) {
      const currentToken = ++token
      try {
        const value = await load()
        if (currentToken !== token) return
        apply(value)
      } catch (error) {
        if (currentToken !== token) return
        fail?.(error)
      }
    }
  }
}

function normalizeLoopItemType(value: unknown): LoopItemType {
  const raw = String(value ?? '').trim()
  return Object.prototype.hasOwnProperty.call(LOOP_ITEM_TYPE_LABELS, raw)
    ? (raw as LoopItemType)
    : 'post'
}

function normalizeContextCollection(value: unknown): ProductCategoryContextPostCollection {
  const raw = String(value ?? '').trim()
  return PRODUCT_CATEGORY_CONTEXT_POST_COLLECTION_OPTIONS.some((option) => option.value === raw)
    ? (raw as ProductCategoryContextPostCollection)
    : ''
}

function isProductCategoryContextLoop(
  loopItemType: LoopItemType,
  contextCollection?: string
): boolean {
  return (
    PRODUCT_CATEGORY_CONTEXT_LOOP_TYPES.has(loopItemType) ||
    (loopItemType === 'post' && !!normalizeContextCollection(contextCollection))
  )
}

function resolveSourceType(
  loopItemType: LoopItemType,
  contextCollection?: string
): QueryConfig['sourceType'] {
  if (isProductCategoryContextLoop(loopItemType, contextCollection)) return 'context'
  if (loopItemType === 'product' || loopItemType === 'productCategory') return 'products'
  if (loopItemType === 'media' || loopItemType === 'mediaCategory') return 'media'
  return 'posts'
}

function isCategoryLoopItemType(loopItemType: LoopItemType): boolean {
  return (
    loopItemType === 'postCategory' ||
    loopItemType === 'productCategory' ||
    loopItemType === 'mediaCategory'
  )
}

function normalizeSiteHref(rawValue: any): string {
  const value = String(rawValue ?? '').trim()
  if (!value) return ''
  if (
    value.startsWith('/') ||
    value.startsWith('#') ||
    value.startsWith('mailto:') ||
    value.startsWith('tel:') ||
    /^https?:\/\//i.test(value) ||
    value.startsWith('//')
  ) {
    return value
  }
  return `/${value.replace(/^\.?\//, '')}`
}

function formatPreviewDate(value: any): string {
  if (value == null || value === '') return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-')
}

function unwrapPageResult(raw: any): {
  list: any[]
  total: number
  pageNo: number
  pageSize: number
} {
  const data = raw?.data && typeof raw.data === 'object' ? raw.data : raw
  const list = Array.isArray(data?.list)
    ? data.list
    : Array.isArray(data?.records)
      ? data.records
      : Array.isArray(data)
        ? data
        : []
  const total = Number(data?.total ?? data?.totalCount ?? list.length) || list.length
  const pageNo = Number(data?.pageNo ?? data?.current ?? 1) || 1
  const pageSize = Number(data?.pageSize ?? data?.size ?? list.length) || list.length || 1
  return { list, total, pageNo, pageSize }
}

function unwrapListResult(raw: any): any[] {
  const data = raw?.data && typeof raw.data === 'object' ? raw.data : raw
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.records)) return data.records
  return []
}

function firstCsvValue(value: unknown): string {
  if (Array.isArray(value)) {
    return `${value[0] ?? ''}`.trim()
  }
  return `${value ?? ''}`
    .split(',')
    .map((item) => item.trim())
    .find(Boolean) || ''
}

function buildPreviewPostUrl(item: any): string {
  const content = item?.contents?.[0] || {}
  const explicitUrl = normalizeSiteHref(
    item?.url ||
      item?.postUrl ||
      item?.detailUrl ||
      item?.link ||
      content?.url ||
      content?.postUrl ||
      content?.detailUrl ||
      content?.link
  )
  if (explicitUrl) return explicitUrl

  const slug = String(item?.slug ?? content?.slug ?? '').trim()
  const typeCode = String(item?.typeCode ?? '').trim()
  const id = item?.id == null ? '' : String(item.id).trim()
  const identifier = slug || id
  return identifier && typeCode
    ? `/en/post/${encodeURIComponent(typeCode)}/${encodeURIComponent(identifier)}.html`
    : '#'
}

function buildPreviewProductUrl(item: any): string {
  const slug = String(item?.slug ?? item?.productSlug ?? '').trim()
  const productId = item?.id ?? item?.spuId
  const identifier = slug || (productId == null ? '' : String(productId).trim())
  return identifier ? `/products/${encodeURIComponent(identifier)}.html` : '#'
}

function buildPreviewMediaUrl(item: any): string {
  const explicitUrl = normalizeSiteHref(item?.detailUrl ?? item?.url)
  if (/^\/(?:[a-z]{2}(?:-[a-z]{2})?)?\/?[^?#]+\.html(?:[?#]|$)/i.test(explicitUrl)) {
    return explicitUrl
  }
  const categoryCode = String(item?.categoryCode ?? '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
  const slug = String(item?.slug ?? item?.contents?.[0]?.slug ?? '').trim()
  const id = String(item?.id ?? '').trim()
  const identifier = slug || id
  return categoryCode && identifier ? `/${categoryCode}/${identifier}.html` : '#'
}

function transformPostPreviewRecord(item: any): LoopGridRecord {
  const content = item?.contents?.[0] || {}
  const publishTime = item?.publishTime || item?.createTime || content?.publishTime
  const title = content.name || item?.name || ''
  const url = buildPreviewPostUrl(item)
  return {
    id: item?.id == null ? `${title || 'post'}` : String(item.id),
    type: 'posts',
    title,
    subtitle: item?.typeName || item?.author || '',
    excerpt: content.excerpt || item?.excerpt || '',
    taxonomy: item?.typeName || '',
    image: item?.image || '',
    meta: formatPreviewDate(publishTime),
    href: url,
    fields: {
      'post.id': item?.id == null ? '' : String(item.id),
      'post.name': title,
      'post.slug': content.slug || item?.slug || '',
      'post.excerpt': content.excerpt || item?.excerpt || '',
      'post.content': content.content || item?.content || '',
      'post.publishTime': formatPreviewDate(publishTime),
      'post.image': item?.image || '',
      'post.imageAlt': item?.imageAlt || title,
      'post.url': url,
      'post.typeCode': item?.typeCode || '',
      'post.typeName': item?.typeName || ''
    }
  }
}

function transformProductPreviewRecord(item: any): LoopGridRecord {
  const url = buildPreviewProductUrl(item)
  const picUrl = item?.sliderPicUrls?.[0] || item?.picUrl || ''
  return {
    id: item?.id == null ? `${item?.name || 'product'}` : String(item.id),
    type: 'products',
    title: item?.name || '',
    subtitle: item?.brandName || item?.categoryName || '',
    excerpt: item?.introduction || item?.brief || '',
    taxonomy: item?.categoryName || '',
    image: picUrl,
    price: item?.price != null ? `¥${(Number(item.price) / 100).toFixed(2)}` : '',
    href: url,
    fields: {
      'product.id': item?.id == null ? '' : String(item.id),
      'product.name': item?.name || '',
      'product.slug': item?.slug || item?.productSlug || '',
      'product.picUrl': picUrl,
      'product.url': url
    }
  }
}

function transformMediaPreviewRecord(item: any): LoopGridRecord {
  const content = item?.contents?.[0] || {}
  const publishTime = item?.publishTime || item?.createTime || content?.createTime
  const title = item?.title || content?.title || ''
  const url = buildPreviewMediaUrl(item)
  return {
    id: item?.id == null ? `${title || 'media'}` : String(item.id),
    type: 'media',
    title,
    subtitle: item?.type || '',
    excerpt: item?.description || content?.description || '',
    taxonomy: item?.categoryCode || '',
    image: item?.coverUrl || '',
    meta: formatPreviewDate(publishTime),
    href: url,
    fields: {
      'media.id': item?.id == null ? '' : String(item.id),
      'media.title': title,
      'media.description': item?.description || content?.description || '',
      'media.slug': item?.slug || content?.slug || '',
      'media.detailUrl': url
    }
  }
}

type PreviewCategoryRecord = Record<string, any>

function flattenPreviewCategories(items: any[]): PreviewCategoryRecord[] {
  const result: PreviewCategoryRecord[] = []
  const visit = (item: any) => {
    if (!item) return
    result.push(item)
    const children = Array.isArray(item.children) ? item.children : []
    children.forEach(visit)
  }
  items.forEach(visit)
  return result
}

function normalizeCategoryParentId(value: unknown): string {
  const normalized = `${value ?? ''}`.trim()
  return normalized && normalized !== '0' ? normalized : ''
}

function schemaInputValue(schema: LoopGridComponentSchema, key: string): string {
  const extras = (schema.filterState?.extras || {}) as Record<string, unknown>
  return String(extras[key] ?? (schema as any)?.advanced?.[key] ?? (schema as any)?.[key] ?? '')
}

function filterPreviewCategoryLoopItems(
  items: PreviewCategoryRecord[],
  schema: LoopGridComponentSchema
): PreviewCategoryRecord[] {
  const mode = `${schemaInputValue(schema, 'cmsCategoryLoopMode') || 'root'}`.trim()
  const configuredParentId = `${schemaInputValue(schema, 'cmsCategoryParentId') || ''}`.trim()
  const currentCategoryId = firstCsvValue(schema.query.category)
  const parentId =
    mode === 'childrenOf' || mode === 'descendantsOf'
      ? configuredParentId || currentCategoryId
      : mode === 'currentChildren' || mode === 'currentDescendants'
        ? currentCategoryId
        : ''
  const normalizedParentId = normalizeCategoryParentId(parentId)

  const isFlatCategoryList = !items.some((item) => normalizeCategoryParentId(item.parentId))
  if (isFlatCategoryList) {
    if (mode === 'root' || !normalizedParentId) return items
    return items.filter((item) => `${item.id ?? ''}` === normalizedParentId)
  }

  const childrenByParent = new Map<string, PreviewCategoryRecord[]>()
  items.forEach((item) => {
    const itemParentId = normalizeCategoryParentId(item.parentId)
    childrenByParent.set(itemParentId, [...(childrenByParent.get(itemParentId) || []), item])
  })

  const collectDescendants = (
    id: string,
    includeSelf: boolean,
    result: PreviewCategoryRecord[]
  ) => {
    if (includeSelf) {
      const current = items.find((item) => `${item.id ?? ''}` === id)
      if (current) result.push(current)
    }
    ;(childrenByParent.get(id) || []).forEach((child) => {
      collectDescendants(`${child.id ?? ''}`, true, result)
    })
  }

  if (mode === 'descendantsOf' || mode === 'currentDescendants') {
    const result: PreviewCategoryRecord[] = []
    collectDescendants(normalizedParentId, false, result)
    return result
  }

  if (mode === 'childrenOf' || mode === 'currentChildren' || mode === 'root') {
    return childrenByParent.get(normalizedParentId) || []
  }

  return items
}

function buildCategoryUrl(loopItemType: LoopItemType, item: PreviewCategoryRecord): string {
  const code = `${item.code || item.id || ''}`.trim()
  if (!code) return '#'
  if (loopItemType === 'productCategory')
    return `/en/products/${encodeURIComponent(code)}/index.html`
  if (loopItemType === 'postCategory')
    return `/en/post-category/${encodeURIComponent(code)}/index.html`
  return `/en/${encodeURIComponent(code)}/index.html`
}

function transformCategoryPreviewRecord(
  item: PreviewCategoryRecord,
  loopItemType: LoopItemType,
  schema: LoopGridComponentSchema
): LoopGridRecord {
  const prefix =
    loopItemType === 'productCategory'
      ? 'productCategory'
      : loopItemType === 'mediaCategory'
        ? 'mediaCategory'
        : 'postCategory'
  const title = item.name || item.title || ''
  const description = item.description || item.remark || ''
  const url = buildCategoryUrl(loopItemType, item)

  return {
    id: item.id == null ? `${title || prefix}` : String(item.id),
    type: resolveSourceType(loopItemType),
    title,
    subtitle: item.code || '',
    excerpt: description,
    taxonomy: item.code || '',
    image: item.picUrl || item.image || '',
    href: url,
    fields: {
      [`${prefix}.id`]: item.id == null ? '' : String(item.id),
      [`${prefix}.name`]: title,
      [`${prefix}.description`]: description,
      [`${prefix}.url`]: url,
      [`${prefix}.clickTarget`]: schemaInputValue(schema, 'cmsCategoryClickTarget') || ''
    }
  }
}

function transformFaqContextRecord(item: any): LoopGridRecord {
  const question = String(item?.question || 'FAQ question')
  const answer = String(item?.answer || '')
  const answerHtml = String(item?.answerHtml || answer).replace(/\r?\n/g, '<br/>')
  return {
    id: item?.id == null ? question : String(item.id),
    type: 'context',
    title: question,
    excerpt: answer,
    fields: {
      'faq.id': item?.id == null ? '' : String(item.id),
      'faq.question': question,
      'faq.answer': answer,
      'faq.answerHtml': answerHtml
    }
  }
}

function transformCategoryPostContextRecord(item: any, alias = 'post'): LoopGridRecord {
  const title = String(item?.name || item?.title || 'Post title')
  const excerpt = String(item?.excerpt || '')
  const url = normalizeSiteHref(item?.url || item?.detailUrl || item?.link || '#') || '#'
  const publishTime = formatPreviewDate(item?.publishTime || item?.createTime)
  return {
    id: item?.id == null ? title : String(item.id),
    type: 'context',
    title,
    excerpt,
    image: item?.image || '',
    meta: publishTime,
    href: url,
    fields: {
      [`${alias}.id`]: item?.id == null ? '' : String(item.id),
      [`${alias}.name`]: title,
      [`${alias}.slug`]: item?.slug || '',
      [`${alias}.excerpt`]: excerpt,
      [`${alias}.publishTime`]: publishTime,
      [`${alias}.image`]: item?.image || '',
      [`${alias}.url`]: url
    }
  }
}

function buildContextLoopSampleData(
  loopItemType: LoopItemType,
  contextCollection?: string
): LoopGridRecord[] {
  if (loopItemType === 'productCategoryFaq') {
    return [
      transformFaqContextRecord({
        id: 1,
        question: 'FAQ question',
        answer: 'FAQ answer',
        answerHtml: 'FAQ answer'
      })
    ]
  }
  return [
    transformCategoryPostContextRecord({
      id: 1,
      name:
        PRODUCT_CATEGORY_CONTEXT_POST_COLLECTION_OPTIONS.find(
          (option) => option.value === contextCollection
        )?.label || LOOP_ITEM_TYPE_LABELS.post,
      excerpt: 'Article summary',
      url: '#'
    })
  ]
}

function buildLoopGridPreviewParams(schema: LoopGridComponentSchema): Record<string, any> {
  const params: Record<string, any> = {
    pageNo: Math.max(1, Number(schema.filterState.currentPage || 1) || 1),
    pageSize: Math.max(1, Number(schema.layout.itemsPerPage || 6) || 6)
  }

  const firstCategory = schema.query.category?.find((item) => `${item}`.trim())
  if (firstCategory) params.categoryId = `${firstCategory}`.trim()
  if (schema.filterState.search) params.keyword = schema.filterState.search

  if (schema.query.sourceType === 'products') {
    params.sortingField = resolveProductSortField(schema.query.orderBy) || 'createTime'
    params.asc = schema.query.order === 'asc' ? 'true' : 'false'
  }

  return params
}

function resolveProductSortField(orderBy: string): string {
  if (orderBy === 'price') return 'price'
  if (orderBy === 'popularity') return 'salesCount'
  if (orderBy === 'title') return 'name'
  return 'createTime'
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function toComponentDefList(components: any): any[] {
  if (!components) return []
  if (Array.isArray(components)) return components
  if (Array.isArray(components.models)) return components.models
  return []
}

function getComponentDefAttributes(def: any): Record<string, any> {
  return def?.attributes || def?.getAttributes?.() || {}
}

function findLoopItemRootDef(def: any): any | null {
  if (!def) return null
  const attrs = getComponentDefAttributes(def)
  if (Object.prototype.hasOwnProperty.call(attrs, 'data-wb-loop-item-root')) return def
  for (const child of toComponentDefList(def.components)) {
    const result = findLoopItemRootDef(child)
    if (result) return result
  }
  return null
}

const VOID_TAGS = new Set([
  'img',
  'br',
  'hr',
  'input',
  'meta',
  'link',
  'area',
  'base',
  'col',
  'embed',
  'source',
  'track',
  'wbr'
])

function componentDefToHtml(def: any): string {
  if (!def) return ''
  if (typeof def === 'string') return def
  const attrs = { ...(def.attributes || {}) }
  const type = `${def.type ?? def.get?.('type') ?? ''}`.trim()
  const dynamicKey = `${attrs['data-wb-dynamic'] ?? ''}`.trim()
  const tag =
    def.tagName ||
    (type === 'image' || type === 'wb-cms-dynamic-image' || dynamicKey === 'image' ? 'img' : 'div')
  if (!attrs.style && def.style && typeof def.style === 'object') {
    attrs.style = Object.entries(def.style)
      .map(([key, value]) => `${key}:${value}`)
      .join(';')
  }
  const attrStr = Object.entries(attrs)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
    .join(' ')
  if (VOID_TAGS.has(tag)) {
    return `<${tag}${attrStr ? ` ${attrStr}` : ''} />`
  }
  const childrenHtml = toComponentDefList(def.components).map(componentDefToHtml).join('')
  return `<${tag}${attrStr ? ` ${attrStr}` : ''}>${def.content || ''}${childrenHtml}</${tag}>`
}

function wrapLoopItemChildrenHtml(childrenHtml: string): string {
  const content = `${childrenHtml ?? ''}`.trim()
  if (!content) return ''
  return `<div data-wb-loop-item-root class="wb-loop-item-template__item">${content}</div>`
}

function componentDefChildrenToLoopItemHtml(def: any): string {
  const childrenHtml = toComponentDefList(def?.components).map(componentDefToHtml).join('')
  return wrapLoopItemChildrenHtml(childrenHtml)
}

function styleObjectToCss(style: Record<string, any>): string {
  return Object.entries(style || {})
    .filter(([, value]) => value !== undefined && value !== null && `${value}` !== '')
    .map(([key, value]) => `${key}:${value};`)
    .join('')
}

function selectorToString(selector: any): string {
  if (!selector) return ''
  if (typeof selector === 'string') return selector
  const name = `${selector.name ?? selector.label ?? selector.id ?? ''}`.trim()
  if (!name) return ''
  const type = `${selector.type ?? ''}`.trim()
  if (type === 'id' || name.startsWith('#')) return name.startsWith('#') ? name : `#${name}`
  if (name.startsWith('.') || name.startsWith('#') || name.startsWith('[')) return name
  return `.${name}`
}

function extractCssFromProjectData(projectData: any): string {
  const styles = Array.isArray(projectData?.styles) ? projectData.styles : []
  return styles
    .map((rule: any) => {
      const style = styleObjectToCss(rule?.style || {})
      if (!style) return ''
      const selectorsAdd = `${rule?.selectorsAdd ?? ''}`.trim()
      const selectors = selectorsAdd
        ? selectorsAdd
        : toComponentDefList(rule?.selectors).map(selectorToString).filter(Boolean).join(',')
      if (!selectors) return ''
      const css = `${selectors}{${style}}`
      const mediaText = `${rule?.mediaText ?? ''}`.trim()
      return mediaText ? `@media ${mediaText}{${css}}` : css
    })
    .filter(Boolean)
    .join('\n')
}

function extractLoopItemTemplateFromProjectData(projectData: any): string {
  const pages = Array.isArray(projectData?.pages) ? projectData.pages : []
  for (const page of pages) {
    const root = page?.component || page?.frames?.[0]?.component || page
    if (typeof root === 'string') {
      const html = extractLoopItemTemplateFromHtml(root)
      if (html) return html
    }
    const loopItemRoot = findLoopItemRootDef(root)
    if (loopItemRoot) return componentDefToHtml(loopItemRoot)
    const fallbackHtml = componentDefChildrenToLoopItemHtml(root)
    if (fallbackHtml) return fallbackHtml
  }
  return ''
}

function extractCssFromHtml(html: string): string {
  const source = `${html ?? ''}`.trim()
  if (!source || typeof DOMParser === 'undefined') return ''
  const doc = new DOMParser().parseFromString(source, 'text/html')
  return Array.from(doc.querySelectorAll('style'))
    .map((style) => style.textContent || '')
    .filter(Boolean)
    .join('\n')
}

function extractLoopItemTemplateFromHtml(html: string): string {
  const source = `${html ?? ''}`.trim()
  if (!source || typeof DOMParser === 'undefined') return ''
  const doc = new DOMParser().parseFromString(source, 'text/html')
  const root = doc.querySelector('[data-wb-loop-item-root]')
  if (root) return root.outerHTML
  const bodyChildren = Array.from(doc.body.children)
  if (bodyChildren.length === 1) return bodyChildren[0]?.outerHTML || ''
  return wrapLoopItemChildrenHtml(bodyChildren.map((child) => child.outerHTML).join(''))
}

function buildLoopGridPreviewTemplateFromPage(page: any): LoopGridPreviewTemplate | null {
  const schemaJson = `${page?.schemaJson ?? ''}`.trim()
  if (schemaJson) {
    try {
      const projectData = JSON.parse(schemaJson)
      const html = extractLoopItemTemplateFromProjectData(projectData)
      if (html) {
        return {
          html,
          label: `${page.resourceName || page.resourceKey || page.label || page.resourceId || page.id}`,
          css: extractCssFromProjectData(projectData)
        }
      }
    } catch (error) {
      console.warn('[WebBuilder] Failed to parse loop item schemaJson', error)
    }
  }

  const html = extractLoopItemTemplateFromHtml(page?.htmlContentInit || page?.htmlContentFull || '')
  if (!html) return null
  return {
    html,
    label: `${page.resourceName || page.resourceKey || page.label || page.resourceId || page.id}`,
    css: extractCssFromHtml(page?.htmlContentInit || page?.htmlContentFull || '')
  }
}

function cacheLoopGridPreviewTemplate(
  editor: Editor,
  resourceId: string,
  template: LoopGridPreviewTemplate | null
) {
  const normalizedId = `${resourceId ?? ''}`.trim()
  if (!normalizedId || !template) return
  getEditorRuntime(editor).setCache(`loopGridPreviewTemplate:${normalizedId}`, template)
}

function cacheLoopGridPreviewTemplateHistoryId(
  editor: Editor,
  resourceId: string,
  historyId?: string
) {
  const normalizedId = `${resourceId ?? ''}`.trim()
  const normalizedHistoryId = `${historyId ?? ''}`.trim()
  if (!normalizedId || !normalizedHistoryId) return
  getEditorRuntime(editor).setCache(
    `loopGridPreviewTemplateHistoryId:${normalizedId}`,
    normalizedHistoryId
  )
}

export function createLoopGridDataProvider(
  adapters: LoopGridDataProviderAdapters
): LoopGridDataProvider {
  async function loadTemplateOptions(
    editor: Editor,
    loopItemType: LoopItemType | '',
    force = false
  ): Promise<LoopItemTemplateOption[]> {
    if (!loopItemType) return []
    const runtime = getEditorRuntime(editor)
    const cacheKey = `loopItemTemplateOptions:${loopItemType}`
    const promiseKey = `loopItemTemplateOptionsPromise:${loopItemType}`
    const cachedOptions = runtime.getCache<LoopItemTemplateOption[]>(cacheKey)
    const pendingOptions = runtime.getCache<Promise<LoopItemTemplateOption[]>>(promiseKey)
    if (!force && Array.isArray(cachedOptions)) return cachedOptions
    if (!force && pendingOptions) return pendingOptions

    const requestPromise = adapters.templates
      .loadList({
        pageNo: 1,
        pageSize: 200,
        status: 'draft',
        resourceType: LOOP_ITEM_RESOURCE_TYPE
      })
      .then((page) => {
        const options = (page.list || [])
          .filter((item: any) => getLoopItemType(item.extJson) === loopItemType)
          .map((item: any) => ({
            value: `${item.resourceId ?? item.id ?? ''}`,
            label: `${item.resourceName || item.resourceKey || item.resourceId || item.id}（ID ${
              item.resourceId ?? item.id
            }）`,
            historyId: item.id == null ? '' : `${item.id}`,
            extJson: item.extJson,
            schemaJson: item.schemaJson,
            htmlContentInit: item.htmlContentInit,
            htmlContentFull: item.htmlContentFull
          }))
          .filter((item: LoopItemTemplateOption) => item.value)
        options.forEach((option) => {
          const template = buildLoopGridPreviewTemplateFromPage(option)
          cacheLoopGridPreviewTemplate(editor, option.value, template)
          cacheLoopGridPreviewTemplateHistoryId(editor, option.value, option.historyId)
        })
        runtime.setCache(cacheKey, options)
        return options
      })
      .catch((error) => {
        console.error('[WebBuilder] Failed to load loop item template options', error)
        runtime.setCache(cacheKey, [])
        return []
      })
      .finally(() => {
        runtime.deleteCache(promiseKey)
      })

    runtime.setCache(promiseKey, requestPromise)
    return requestPromise
  }

  async function loadPreviewTemplate(
    editor: Editor,
    resourceId: string
  ): Promise<LoopGridPreviewTemplate | null> {
    const normalizedId = `${resourceId ?? ''}`.trim()
    if (!normalizedId) return null
    const runtime = getEditorRuntime(editor)
    const cacheKey = `loopGridPreviewTemplate:${normalizedId}`
    const promiseKey = `loopGridPreviewTemplatePromise:${normalizedId}`
    const cachedTemplate = runtime.getCache<LoopGridPreviewTemplate>(cacheKey)
    const pendingTemplate = runtime.getCache<Promise<LoopGridPreviewTemplate | null>>(promiseKey)
    if (cachedTemplate) return cachedTemplate
    if (pendingTemplate) return pendingTemplate

    const requestPromise = adapters.templates
      .loadDraft({
        resourceId: Number(normalizedId),
        resourceType: LOOP_ITEM_RESOURCE_TYPE
      })
      .then((page) => {
        const template = buildLoopGridPreviewTemplateFromPage(page)
        if (template) {
          runtime.setCache(cacheKey, template)
        }
        return template
      })
      .then(async (template) => {
        if (template) return template
        const mappedHistoryId = `${
          runtime.getCache<string>(`loopGridPreviewTemplateHistoryId:${normalizedId}`) ??
          normalizedId
        }`
        const historyId = Number(mappedHistoryId)
        if (!Number.isFinite(historyId) || historyId <= 0) return null
        const detail = await adapters.templates.loadHistoryDetail(historyId)
        const historyTemplate = buildLoopGridPreviewTemplateFromPage(detail)
        if (historyTemplate) {
          runtime.setCache(cacheKey, historyTemplate)
        }
        return historyTemplate
      })
      .catch((error) => {
        console.error('[WebBuilder] Failed to load loop grid preview template', error)
        return null
      })
      .finally(() => {
        runtime.deleteCache(promiseKey)
      })

    runtime.setCache(promiseKey, requestPromise)
    return requestPromise
  }

  async function loadCategoryPreviewData(
    schema: LoopGridComponentSchema
  ): Promise<LoopGridPreviewData> {
    const loopItemType = normalizeLoopItemType(schema.loopItemType)
    const raw =
      loopItemType === 'productCategory'
        ? await adapters.productCategories.loadList({})
        : loopItemType === 'mediaCategory'
          ? await adapters.mediaCategories.loadList()
          : await adapters.postCategories.loadList()
    const allItems = flattenPreviewCategories(unwrapListResult(raw))
    const filteredItems = filterPreviewCategoryLoopItems(allItems, schema)
    const pageSize = Math.max(1, Number(schema.layout.itemsPerPage || 6) || 6)
    const pageNo = Math.max(1, Number(schema.filterState.currentPage || 1) || 1)
    const offset = (pageNo - 1) * pageSize

    return {
      items: filteredItems
        .slice(offset, offset + pageSize)
        .map((item) => transformCategoryPreviewRecord(item, loopItemType, schema)),
      pageNo,
      total: filteredItems.length,
      totalPages: Math.max(1, Math.ceil(filteredItems.length / pageSize))
    }
  }

  async function loadContextPreviewData(
    schema: LoopGridComponentSchema
  ): Promise<LoopGridPreviewData> {
    const loopItemType = normalizeLoopItemType(schema.loopItemType)
    const contextCollection = normalizeContextCollection(schema.query.contextCollection)
    const categoryId = Number(firstCsvValue(schema.query.category))
    if (!Number.isFinite(categoryId) || categoryId <= 0) {
      return {
        items: buildContextLoopSampleData(loopItemType, contextCollection),
        pageNo: 1,
        total: 1,
        totalPages: 1
      }
    }

    const content = await adapters.context.loadProductCategoryContent(categoryId)
    let records: LoopGridRecord[] = []
    if (loopItemType === 'productCategoryFaq') {
      const faqCategoryId = Number(content?.faqCategoryId)
      if (Number.isFinite(faqCategoryId) && faqCategoryId > 0) {
        records = unwrapListResult(await adapters.context.loadFaqItems())
          .filter(
            (item) => Number(item?.categoryId) === faqCategoryId && Number(item?.status ?? 1) === 1
          )
          .sort((a, b) => {
            const sortA = Number(a?.sort ?? 0)
            const sortB = Number(b?.sort ?? 0)
            if (sortA !== sortB) return sortA - sortB
            return Number(a?.id ?? 0) - Number(b?.id ?? 0)
          })
          .map(transformFaqContextRecord)
      }
    } else {
      const listKey = contextCollection || 'applicationPosts'
      records = (Array.isArray(content?.[listKey]) ? content[listKey] : []).map((item) =>
        transformCategoryPostContextRecord(item)
      )
    }

    const pageSize = Math.max(1, Number(schema.layout.itemsPerPage || 6) || 6)
    const pageNo = Math.max(1, Number(schema.filterState.currentPage || 1) || 1)
    const offset = (pageNo - 1) * pageSize
    return {
      items: records.slice(offset, offset + pageSize),
      pageNo,
      total: records.length,
      totalPages: Math.max(1, Math.ceil(records.length / pageSize))
    }
  }

  async function loadPreviewData(schema: LoopGridComponentSchema): Promise<LoopGridPreviewData> {
    try {
      const loopItemType = normalizeLoopItemType(schema.loopItemType)
      if (isProductCategoryContextLoop(loopItemType, schema.query.contextCollection)) {
        return await loadContextPreviewData(schema)
      }
      if (isCategoryLoopItemType(loopItemType)) {
        return await loadCategoryPreviewData(schema)
      }

      const sourceType = schema.query.sourceType
      const params = buildLoopGridPreviewParams(schema)
      const raw =
        sourceType === 'posts'
          ? await adapters.posts.loadPage(params)
          : sourceType === 'products'
            ? await adapters.products.loadPage(params)
            : await adapters.media.loadPage(params)
      const page = unwrapPageResult(raw)
      const items = page.list.map((item) =>
        sourceType === 'posts'
          ? transformPostPreviewRecord(item)
          : sourceType === 'products'
            ? transformProductPreviewRecord(item)
            : transformMediaPreviewRecord(item)
      )

      return {
        items,
        pageNo: page.pageNo,
        total: page.total,
        totalPages: Math.max(
          1,
          Math.ceil(page.total / Math.max(1, page.pageSize || items.length || 1))
        )
      }
    } catch (error: any) {
      console.error('[WebBuilder] Failed to load loop grid preview data', error)
      return {
        items: [],
        error: error?.message || '真实预览数据加载失败。'
      }
    }
  }

  return {
    loadTemplateOptions,
    loadPreviewTemplate,
    loadPreviewData
  }
}

export const loopGridDataProvider = createLoopGridDataProvider({
  posts: { loadPage: getPostPage },
  products: { loadPage: getSpuPage as any },
  media: { loadPage: getMediaResourcePage },
  templates: {
    loadList: getPagePage,
    loadDraft: getDraft,
    loadHistoryDetail: getHistoryDetail
  },
  postCategories: { loadList: getAllPostCategoryList },
  productCategories: { loadList: getProductCategoryList as any },
  mediaCategories: { loadList: getAllMediaResourceCategoryList },
  context: {
    loadProductCategoryContent: getProductCategoryContent,
    loadFaqItems: getAllFaqItemList
  }
})
