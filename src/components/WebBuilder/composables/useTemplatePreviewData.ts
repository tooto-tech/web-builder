/**
 * 详情模板（TEMP_POST_DETAIL 等）的预览数据注入。
 *
 * 使用方式：用户在"模板设置"里选中一篇文章，当前页面的 `custom.wbPreviewResourceId`
 * 会被写入；本 composable 监听它的变化，向画布中所有 `data-cms-bind*` /
 * `data-cms-repeat` 节点注入真实文章数据。
 *
 * 注入策略对齐 `useCmsLivePreview`：
 *   - 静态字段直接修改 DOM（会被 `data-cms-preview-bound` 标记，方便还原）；
 *   - repeat 容器被隐藏，紧挨着插入 `data-cms-preview` 预览节点；
 * 预览节点永远只存在于 iframe DOM 里，不会写回 GrapesJS 模型，因此不会被保存或导出。
 */
import { watch } from 'vue'
import type { Ref } from 'vue'
import { getAccessToken } from '@/utils/auth'
import { getLoopItemType } from '@/components/WebBuilder/config/templateSharedResources'
import { getPrimaryContentPageFromEditor } from '@/components/WebBuilder/utils/pageSettings'
import { injectProductDetailPreviewData } from './useCmsLivePreview'
import { getEditorRuntime } from './useEditorRuntime'

const POST_DETAIL_ENDPOINT = '/admin-api/content/post/get'
const PRODUCT_DETAIL_ENDPOINT = '/admin-api/product/spu/get-detail'
const MEDIA_DETAIL_ENDPOINT = '/admin-api/content/media-resource/get-detail'
const PRODUCT_CATEGORY_CONTENT_ENDPOINT = '/admin-api/content/product-category-content/get'
const FAQ_ITEM_LIST_ENDPOINT = '/admin-api/content/faq-item/list-all'

let activeTemplatePreviewLanguage = ''

interface PostPreviewData {
  'post.name': string
  'post.excerpt': string
  'post.content': string
  'post.publishTime': string
  'post.image': string
  'post.imageAlt': string
  'post.url': string
  'post.author': string
  'post.metaKeywords': string
  'post.metaDescription': string
  'prevPost.name': string
  'prevPost.url': string
  'nextPost.name': string
  'nextPost.url': string
}

interface RelatedPostData {
  'relatedPost.name': string
  'relatedPost.excerpt': string
  'relatedPost.publishTime': string
  'relatedPost.image': string
  'relatedPost.imageAlt': string
  'relatedPost.url': string
}

interface TocItemData {
  'tocItem.text': string
  'tocItem.href': string
  'tocItem.level': string
}

interface BreadcrumbData {
  'breadcrumb.label': string
  'breadcrumb.url': string
  'breadcrumb.position': string
  'breadcrumb.isCurrent': string
  'breadcrumb.currentClass': string
  'breadcrumb.ariaCurrent': string
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

function buildStaticPostUrl(item: any): string {
  if (!item) return '#'
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
  if (!identifier || !typeCode) return '#'
  return `/en/post/${encodeURIComponent(typeCode)}/${encodeURIComponent(identifier)}.html`
}

function formatDateTime(value: any, format = 'yyyy-MM-dd'): string {
  if (value == null || value === '') return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const map: Record<string, string> = {
    yyyy: String(date.getFullYear()),
    MM: String(date.getMonth() + 1).padStart(2, '0'),
    dd: String(date.getDate()).padStart(2, '0'),
    HH: String(date.getHours()).padStart(2, '0'),
    mm: String(date.getMinutes()).padStart(2, '0'),
    ss: String(date.getSeconds()).padStart(2, '0')
  }
  return format.replace(/yyyy|MM|dd|HH|mm|ss/g, (token) => map[token] ?? token)
}

async function fetchJson(
  endpoint: string,
  params: Record<string, string>,
  token: string
): Promise<any | null> {
  try {
    const url = new URL(endpoint, window.location.origin)
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v)
    })
    if (activeTemplatePreviewLanguage && !url.searchParams.has('language')) {
      url.searchParams.set('language', activeTemplatePreviewLanguage)
    }
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data ?? null
  } catch {
    return null
  }
}

function transformPost(post: any): PostPreviewData {
  const content = post?.contents?.[0] || {}
  const publishTime = post?.publishTime || post?.createTime || ''
  return {
    'post.name': content.name || post?.name || '',
    'post.excerpt': content.excerpt || post?.excerpt || '',
    'post.content': content.content || post?.content || '',
    'post.publishTime': publishTime ? formatDateTime(publishTime) : '',
    'post.image': post?.image || '',
    'post.imageAlt': post?.imageAlt || content.name || '',
    'post.url': buildStaticPostUrl(post),
    'post.author': post?.author || post?.creatorNickname || post?.creator || '',
    'post.metaKeywords': content.metaKeywords || '',
    'post.metaDescription': content.metaDescription || '',
    'prevPost.name': '',
    'prevPost.url': '',
    'nextPost.name': '',
    'nextPost.url': ''
  }
}

function transformRelatedPost(item: any): RelatedPostData {
  const content = item?.contents?.[0] || {}
  const publishTime = item?.publishTime || item?.createTime || ''
  return {
    'relatedPost.name': content.name || item?.name || '',
    'relatedPost.excerpt': content.excerpt || item?.excerpt || '',
    'relatedPost.publishTime': publishTime ? formatDateTime(publishTime) : '',
    'relatedPost.image': item?.image || '',
    'relatedPost.imageAlt': item?.imageAlt || content.name || '',
    'relatedPost.url': buildStaticPostUrl(item)
  }
}

function buildPostBreadcrumbs(post: any, staticData: PostPreviewData): BreadcrumbData[] {
  const content = post?.contents?.[0] || {}
  const categoryName =
    post?.typeName ||
    post?.categoryName ||
    post?.category?.name ||
    content?.typeName ||
    content?.categoryName ||
    ''
  const typeCode = String(post?.typeCode || content?.typeCode || '').trim()
  const categoryUrl =
    normalizeSiteHref(post?.categoryUrl || post?.typeUrl) ||
    (typeCode ? `/en/post/${encodeURIComponent(typeCode)}/` : '')
  const items = [
    { label: 'Home', url: '/' },
    ...(categoryName ? [{ label: categoryName, url: categoryUrl || '#' }] : []),
    { label: staticData['post.name'] || 'Current Post', url: staticData['post.url'] || '#' }
  ]

  return items.map((item, index) => ({
    'breadcrumb.label': item.label,
    'breadcrumb.url': item.url || '#',
    'breadcrumb.position': String(index + 1),
    'breadcrumb.isCurrent': String(index === items.length - 1),
    'breadcrumb.currentClass': index === items.length - 1 ? 'is-current' : '',
    'breadcrumb.ariaCurrent': index === items.length - 1 ? 'page' : ''
  }))
}

function transformLoopProduct(product: any): Record<string, string> {
  const featuresText = Array.isArray(product?.features)
    ? product.features
        .map((item: any) => String(item?.text ?? item ?? '').trim())
        .filter(Boolean)
        .join('\n')
    : String(product?.features || '')
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean)
        .join('\n')

  return {
    'product.id': product?.id == null ? '' : String(product.id),
    'product.name': product?.name || '',
    'product.slug': product?.slug || product?.productSlug || '',
    'product.brandName': product?.brandName || '',
    'product.categoryName': product?.categoryName || '',
    'product.introduction': product?.introduction || product?.brief || '',
    'product.featuresText': featuresText,
    'product.keyword': product?.keyword || '',
    'product.description': product?.description || '',
    'product.picUrl': product?.sliderPicUrls?.[0] || product?.picUrl || '',
    'product.price': product?.price == null ? '' : String(product.price),
    'product.marketPrice': product?.marketPrice == null ? '' : String(product.marketPrice),
    'product.priceFormatted':
      product?.price != null ? `¥${(Number(product.price) / 100).toFixed(2)}` : '',
    'product.stock': product?.stock == null ? '' : String(product.stock),
    'product.salesCount': product?.salesCount == null ? '' : String(product.salesCount),
    'product.url': buildStaticProductUrl(product),
    'product.buyNowUrl': product?.buyNowUrl || buildStaticProductUrl(product),
    'product.buyNowTarget': product?.buyNowTargetBlank ? '_blank' : '_self'
  }
}

function buildStaticProductUrl(item: any): string {
  const slug = String(item?.slug ?? item?.productSlug ?? '').trim()
  const productId = item?.id ?? item?.spuId
  const identifier = slug || (productId == null ? '' : String(productId).trim())
  return identifier ? `/products/${encodeURIComponent(identifier)}.html` : '#'
}

function transformLoopMedia(media: any): Record<string, string> {
  const content = media?.contents?.[0] || {}
  const publishTime = media?.publishTime || media?.createTime || ''
  return {
    'media.id': media?.id == null ? '' : String(media.id),
    'media.title': media?.title || content?.title || '',
    'media.description': media?.description || content?.description || '',
    'media.slug': media?.slug || content?.slug || '',
    'media.type': media?.type || '',
    'media.url': media?.url || '#',
    'media.coverUrl': media?.coverUrl || '',
    'media.altText': media?.altText || media?.title || content?.title || '',
    'media.categoryCode': media?.categoryCode || '',
    'media.detailUrl': buildStaticMediaUrl(media),
    'media.publishTime': publishTime ? formatDateTime(publishTime) : '',
    'media.seoTitle': content?.seoTitle || media?.title || '',
    'media.seoDescription': content?.seoDescription || media?.description || '',
    'media.seoKeywords': content?.seoKeywords || ''
  }
}

function buildStaticMediaUrl(item: any): string {
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

function transformLoopFaq(faq: any): Record<string, string> {
  const answer = String(faq?.answer || '')
  return {
    'faq.id': faq?.id == null ? '' : String(faq.id),
    'faq.question': faq?.question || '',
    'faq.answer': answer,
    'faq.answerHtml': String(faq?.answerHtml || answer).replace(/\r?\n/g, '<br/>')
  }
}

function isProductCategoryContextLoopItemType(loopItemType: string): boolean {
  return loopItemType === 'productCategoryFaq'
}

function buildMediaBreadcrumbs(media: any, data: Record<string, string>): BreadcrumbData[] {
  const categoryName =
    media?.categoryName ||
    media?.category?.name ||
    media?.contents?.[0]?.categoryName ||
    media?.categoryCode ||
    ''
  const categoryCode = String(media?.categoryCode || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
  const categoryUrl =
    normalizeSiteHref(media?.categoryUrl || media?.category?.url) ||
    (categoryCode ? `/${categoryCode}/` : '')
  const items = [
    { label: 'Home', url: '/' },
    ...(categoryName ? [{ label: categoryName, url: categoryUrl || '#' }] : []),
    { label: data['media.title'] || 'Current Media', url: data['media.detailUrl'] || '#' }
  ]

  return items.map((item, index) => ({
    'breadcrumb.label': item.label,
    'breadcrumb.url': item.url || '#',
    'breadcrumb.position': String(index + 1),
    'breadcrumb.isCurrent': String(index === items.length - 1),
    'breadcrumb.currentClass': index === items.length - 1 ? 'is-current' : '',
    'breadcrumb.ariaCurrent': index === items.length - 1 ? 'page' : ''
  }))
}

function deriveTocFromContent(html: string): TocItemData[] {
  if (!html) return []

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  const headings = Array.from(doc.querySelectorAll('h2, h3'))
  return headings
    .map((heading, index) => {
      const text = (heading.textContent || '').trim()
      const id = heading.getAttribute('id') || `toc-${index + 1}`
      const level = Number(heading.tagName.replace(/[^0-9]/g, '')) || 2
      return {
        'tocItem.text': text,
        'tocItem.href': `#${id}`,
        'tocItem.level': String(level)
      }
    })
    .filter((item) => item['tocItem.text'])
}

/* ───────────── DOM 绑定（与 useCmsLivePreview 约定一致） ───────────── */

type PreviewBoundEl = HTMLElement & {
  __cmsPreviewOriginalText?: string
  __cmsPreviewOriginalHtml?: string
  __cmsPreviewOriginalSrc?: string
  __cmsPreviewOriginalHref?: string
  __cmsPreviewOriginalTarget?: string | null
  __cmsPreviewOriginalAlt?: string
  __cmsPreviewOriginalStyle?: string
  __cmsPreviewOriginalBgImage?: string
  __cmsPreviewOriginalContent?: string
}

function markPreviewBound(el: Element): PreviewBoundEl {
  const previewEl = el as PreviewBoundEl
  if (!el.hasAttribute('data-cms-preview-bound')) {
    previewEl.__cmsPreviewOriginalText = el.textContent ?? ''
    previewEl.__cmsPreviewOriginalHtml = (el as HTMLElement).innerHTML
    if (el.tagName === 'IMG') {
      previewEl.__cmsPreviewOriginalSrc = (el as HTMLImageElement).getAttribute('src') || ''
    }
    if (el instanceof HTMLAnchorElement) {
      previewEl.__cmsPreviewOriginalHref = el.getAttribute('href') || ''
    }
    previewEl.__cmsPreviewOriginalTarget = el.getAttribute('target')
    previewEl.__cmsPreviewOriginalAlt = el.getAttribute('alt') || ''
    previewEl.__cmsPreviewOriginalStyle = el.getAttribute('style') || ''
    previewEl.__cmsPreviewOriginalBgImage = (el as HTMLElement).style.backgroundImage || ''
    previewEl.__cmsPreviewOriginalContent = el.getAttribute('content') || ''
  }
  el.setAttribute('data-cms-preview-bound', '')
  return previewEl
}

function cleanupPreview(rootEl: HTMLElement): void {
  rootEl.querySelectorAll('[data-cms-preview]').forEach((el) => el.remove())
  rootEl.querySelectorAll('[data-cms-hidden]').forEach((el) => {
    ;(el as HTMLElement).style.removeProperty('display')
    el.removeAttribute('data-cms-hidden')
  })
  rootEl.querySelectorAll('[data-cms-preview-bound]').forEach((el) => {
    const previewEl = el as PreviewBoundEl
    if (previewEl.__cmsPreviewOriginalText !== undefined) {
      el.textContent = previewEl.__cmsPreviewOriginalText
    }
    if (previewEl.__cmsPreviewOriginalHtml !== undefined) {
      ;(el as HTMLElement).innerHTML = previewEl.__cmsPreviewOriginalHtml
    }
    if (previewEl.__cmsPreviewOriginalSrc !== undefined && el.tagName === 'IMG') {
      ;(el as HTMLImageElement).src = previewEl.__cmsPreviewOriginalSrc
    }
    if (previewEl.__cmsPreviewOriginalHref !== undefined && el instanceof HTMLAnchorElement) {
      el.href = previewEl.__cmsPreviewOriginalHref
    }
    if (previewEl.__cmsPreviewOriginalTarget !== undefined) {
      if (previewEl.__cmsPreviewOriginalTarget) {
        el.setAttribute('target', previewEl.__cmsPreviewOriginalTarget)
      } else {
        el.removeAttribute('target')
      }
    }
    if (previewEl.__cmsPreviewOriginalAlt !== undefined) {
      if (previewEl.__cmsPreviewOriginalAlt) {
        el.setAttribute('alt', previewEl.__cmsPreviewOriginalAlt)
      } else {
        el.removeAttribute('alt')
      }
    }
    if (previewEl.__cmsPreviewOriginalStyle !== undefined) {
      if (previewEl.__cmsPreviewOriginalStyle) {
        el.setAttribute('style', previewEl.__cmsPreviewOriginalStyle)
      } else {
        el.removeAttribute('style')
      }
    }
    if (previewEl.__cmsPreviewOriginalBgImage !== undefined) {
      ;(el as HTMLElement).style.backgroundImage = previewEl.__cmsPreviewOriginalBgImage
    }
    if (previewEl.__cmsPreviewOriginalContent !== undefined) {
      if (previewEl.__cmsPreviewOriginalContent) {
        el.setAttribute('content', previewEl.__cmsPreviewOriginalContent)
      } else {
        el.removeAttribute('content')
      }
    }
    el.removeAttribute('data-cms-preview-bound')
  })
}

function bindStaticFields(rootEl: HTMLElement, data: Record<string, string>): void {
  rootEl.querySelectorAll('[data-cms-bind]').forEach((el) => {
    const key = el.getAttribute('data-cms-bind') || ''
    if (!(key in data)) return
    markPreviewBound(el)
    el.textContent = data[key]
  })

  rootEl.querySelectorAll('[data-cms-html]').forEach((el) => {
    const key = el.getAttribute('data-cms-html') || ''
    if (!(key in data)) return
    markPreviewBound(el)
    ;(el as HTMLElement).innerHTML = data[key] || ''
  })

  rootEl.querySelectorAll('[data-cms-bind-src]').forEach((el) => {
    const key = el.getAttribute('data-cms-bind-src') || ''
    const src = data[key]
    if (!src) return
    markPreviewBound(el)
    if (el.tagName === 'IMG') {
      ;(el as HTMLImageElement).src = src
    } else {
      const htmlEl = el as HTMLElement
      htmlEl.style.backgroundImage = `url('${src}')`
      htmlEl.style.backgroundSize = 'cover'
      htmlEl.style.backgroundPosition = 'center'
    }
  })

  rootEl.querySelectorAll('[data-cms-bind-alt]').forEach((el) => {
    const key = el.getAttribute('data-cms-bind-alt') || ''
    if (!(key in data)) return
    markPreviewBound(el)
    el.setAttribute('alt', data[key] || '')
  })

  rootEl.querySelectorAll('[data-cms-bind-href]').forEach((el) => {
    const key = el.getAttribute('data-cms-bind-href') || ''
    if (!(key in data)) return
    markPreviewBound(el)
    const template = el.getAttribute('data-cms-bind-href-template') || ''
    const href = composeDynamicUrl(data[key], template)
    if (el instanceof HTMLAnchorElement) {
      el.href = href || '#'
    } else {
      el.setAttribute('href', href || '#')
    }
  })

  rootEl.querySelectorAll('[data-cms-bind-content]').forEach((el) => {
    const key = el.getAttribute('data-cms-bind-content') || ''
    if (!(key in data)) return
    markPreviewBound(el)
    const value = data[key]
    if (value) el.setAttribute('content', value)
    else el.removeAttribute('content')
  })
}

function getComponentList(component: any): any[] {
  const children = component?.components?.()
  if (Array.isArray(children)) return children
  if (Array.isArray(children?.models)) return children.models
  return []
}

function walkComponents(component: any, visit: (component: any) => void): void {
  if (!component) return
  visit(component)
  getComponentList(component).forEach((child) => walkComponents(child, visit))
}

function getPreviewRootComponents(editor: any): any[] {
  const roots: any[] = []
  const selectedPageRoot = editor?.Pages?.getSelected?.()?.getMainComponent?.()
  const wrapper = editor?.getWrapper?.()
  if (selectedPageRoot) roots.push(selectedPageRoot)
  if (wrapper && wrapper !== selectedPageRoot) roots.push(wrapper)
  return roots
}

function getComponentDynamicKind(component: any): string {
  const attrs = component?.getAttributes?.() || {}
  return `${attrs['data-wb-dynamic'] || ''}`.trim()
}

function bindTextLikeElement(el: HTMLElement, value: string): void {
  markPreviewBound(el)
  el.textContent = value
}

function bindHtmlElement(el: HTMLElement, value: string): void {
  markPreviewBound(el)
  el.innerHTML = value || ''
}

function bindImageElement(el: HTMLElement, src: string, alt?: string): void {
  if (!src && !alt) return
  markPreviewBound(el)
  if (src) {
    if (el.tagName === 'IMG') {
      ;(el as HTMLImageElement).src = src
    } else {
      el.style.backgroundImage = `url('${src}')`
      el.style.backgroundSize = 'cover'
      el.style.backgroundPosition = 'center'
    }
  }
  if (alt != null) el.setAttribute('alt', alt)
}

function bindLinkElement(el: HTMLElement, href: string, text?: string): void {
  markPreviewBound(el)
  if (href) el.setAttribute('href', href)
  if (text != null) el.textContent = text
}

function composeDynamicUrl(value: unknown, template?: string | null): string {
  const raw = String(value ?? '')
  const tpl = String(template ?? '').trim()
  if (!tpl) return raw
  if (tpl.includes('{{encoded}}')) return tpl.replaceAll('{{encoded}}', encodeURIComponent(raw))
  if (tpl.includes('{{value}}')) return tpl.replaceAll('{{value}}', raw)
  return `${tpl}${raw}`
}

function bindDynamicFieldModels(editor: any, data: Record<string, string>): void {
  const roots = getPreviewRootComponents(editor)
  if (!roots.length) return

  const visited = new Set<any>()
  roots.forEach((root) => {
    walkComponents(root, (component) => {
      if (!component || visited.has(component)) return
      visited.add(component)
      const kind = getComponentDynamicKind(component)
      if (!kind) return
      const el = component.getView?.()?.el as HTMLElement | undefined
      if (!el) return

      if (kind === 'text' || kind === 'datetime') {
        const field =
          `${component.get?.('dynField') || component.getAttributes?.()?.['data-cms-bind'] || ''}`.trim()
        if (field in data) bindTextLikeElement(el, data[field])
        if (kind === 'datetime' && field in data) el.setAttribute('datetime', data[field])
        return
      }

      if (kind === 'html') {
        const field =
          `${component.get?.('dynField') || component.getAttributes?.()?.['data-cms-html'] || ''}`.trim()
        if (field in data) bindHtmlElement(el, data[field])
        return
      }

      if (kind === 'image') {
        const srcField =
          `${component.get?.('dynSrcField') || component.getAttributes?.()?.['data-cms-bind-src'] || ''}`.trim()
        const altField =
          `${component.get?.('dynAltField') || component.getAttributes?.()?.['data-cms-bind-alt'] || ''}`.trim()
        bindImageElement(
          el,
          srcField in data ? data[srcField] : '',
          altField in data ? data[altField] : undefined
        )
        return
      }

      if (kind === 'link') {
        const hrefField =
          `${component.get?.('dynHrefField') || component.getAttributes?.()?.['data-cms-bind-href'] || ''}`.trim()
        const hrefTemplate =
          `${component.get?.('dynHrefTemplate') || component.getAttributes?.()?.['data-cms-bind-href-template'] || ''}`.trim()
        const textField =
          `${component.get?.('dynTextField') || component.getAttributes?.()?.['data-cms-bind'] || ''}`.trim()
        bindLinkElement(
          el,
          hrefField in data ? composeDynamicUrl(data[hrefField], hrefTemplate) : '',
          textField in data ? data[textField] : undefined
        )
      }
    })
  })
}

function bindCard(card: Element, data: Record<string, string>): void {
  const selectBoundElements = (selector: string): Element[] => {
    const result = Array.from(card.querySelectorAll(selector))
    if ((card as HTMLElement).matches?.(selector)) {
      result.unshift(card)
    }
    return result
  }

  selectBoundElements('[data-cms-bind]').forEach((el) => {
    const key = el.getAttribute('data-cms-bind') || ''
    if (!(key in data)) return
    el.textContent = data[key]
  })

  selectBoundElements('[data-cms-html]').forEach((el) => {
    const key = el.getAttribute('data-cms-html') || ''
    if (!(key in data)) return
    ;(el as HTMLElement).innerHTML = data[key] || ''
  })

  selectBoundElements('[data-cms-bind-src]').forEach((el) => {
    const key = el.getAttribute('data-cms-bind-src') || ''
    const src = data[key]
    if (!src) return
    if (el.tagName === 'IMG') {
      ;(el as HTMLImageElement).src = src
    } else {
      const htmlEl = el as HTMLElement
      htmlEl.style.backgroundImage = `url('${src}')`
      htmlEl.style.backgroundSize = 'cover'
      htmlEl.style.backgroundPosition = 'center'
    }
  })

  selectBoundElements('[data-cms-bind-alt]').forEach((el) => {
    const key = el.getAttribute('data-cms-bind-alt') || ''
    if (!(key in data)) return
    el.setAttribute('alt', data[key] || '')
  })

  selectBoundElements('[data-cms-bind-href]').forEach((el) => {
    const key = el.getAttribute('data-cms-bind-href') || ''
    if (!(key in data)) return
    const template = el.getAttribute('data-cms-bind-href-template') || ''
    const href = composeDynamicUrl(data[key], template)
    if (el instanceof HTMLAnchorElement) {
      el.href = href || '#'
    } else {
      el.setAttribute('href', href || '#')
    }
  })

  selectBoundElements('[data-cms-bind-aria-current]').forEach((el) => {
    const key = el.getAttribute('data-cms-bind-aria-current') || ''
    if (!(key in data)) return
    if (data[key]) el.setAttribute('aria-current', data[key])
    else el.removeAttribute('aria-current')
  })

  selectBoundElements('[data-cms-bind-title]').forEach((el) => {
    const key = el.getAttribute('data-cms-bind-title') || ''
    if (!(key in data)) return
    if (data[key]) el.setAttribute('title', data[key])
    else el.removeAttribute('title')
  })

  selectBoundElements('[data-cms-bind-classappend]').forEach((el) => {
    const key = el.getAttribute('data-cms-bind-classappend') || ''
    if (!(key in data) || !data[key]) return
    data[key]
      .split(/\s+/)
      .filter(Boolean)
      .forEach((className) => el.classList.add(className))
  })
}

function insertInlinePreviewNodes(
  repeatEl: HTMLElement,
  items: Array<Record<string, string>>
): void {
  const parent = repeatEl.parentNode
  if (!parent) return

  let anchor: ChildNode = repeatEl
  items.forEach((data) => {
    const card = repeatEl.cloneNode(true) as HTMLElement
    card.removeAttribute('data-cms-repeat')
    card.removeAttribute('data-cms-hidden')
    card.style.removeProperty('display')
    card.setAttribute('data-cms-preview', '')
    card.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'))
    card.removeAttribute('id')
    bindCard(card, data)
    parent.insertBefore(card, anchor.nextSibling)
    anchor = card
  })
}

function injectRepeat(
  rootEl: HTMLElement,
  repeatKey: string,
  items: Array<Record<string, string>>
): void {
  if (!items.length) return
  const repeatEls = Array.from(
    rootEl.querySelectorAll(`[data-cms-repeat="${repeatKey}"]`)
  ) as HTMLElement[]
  repeatEls.forEach((repeatEl) => {
    repeatEl.style.display = 'none'
    repeatEl.setAttribute('data-cms-hidden', '')
    insertInlinePreviewNodes(repeatEl, items)
  })
}

/* ───────────── 画布根节点查找 ───────────── */

function getCanvasBody(editor: any): HTMLElement | null {
  try {
    const body = editor?.Canvas?.getBody?.() as HTMLElement | undefined
    if (body) return body
    const doc =
      (editor?.Canvas?.getDocument?.() as Document | undefined) ||
      (editor?.Canvas?.getFrameEl?.()?.contentDocument as Document | undefined)
    return (doc?.body as HTMLElement) || null
  } catch {
    return null
  }
}

/* ───────────── 核心注入流程 ───────────── */

/**
 * 兼容两种后端响应形态：
 *   1. `{ ...post }` —— 旧的 PostVO 直返形式
 *   2. `{ post, relatedPosts, isEditingPublished }` —— 新的 PostDetailVO 包装形式
 */
function unwrapPostResponse(raw: any): { post: any | null; relatedPosts: any[] } {
  if (!raw) return { post: null, relatedPosts: [] }
  if (raw?.post && typeof raw.post === 'object') {
    return {
      post: raw.post,
      relatedPosts: Array.isArray(raw.relatedPosts) ? raw.relatedPosts : []
    }
  }
  return {
    post: raw,
    relatedPosts: Array.isArray(raw?.relatedPosts) ? raw.relatedPosts : []
  }
}

async function injectPostDetailPreview(editor: any, postId: number, token: string): Promise<void> {
  const body = getCanvasBody(editor)
  if (!body) return

  cleanupPreview(body)

  const raw = await fetchJson(POST_DETAIL_ENDPOINT, { id: String(postId) }, token)
  const { post, relatedPosts: responseRelated } = unwrapPostResponse(raw)
  if (!post) return

  const staticData = transformPost(post)
  bindStaticFields(body, staticData as unknown as Record<string, string>)
  bindDynamicFieldModels(editor, staticData as unknown as Record<string, string>)

  injectRepeat(
    body,
    'breadcrumb@breadcrumbs',
    buildPostBreadcrumbs(post, staticData).map((item) => item as unknown as Record<string, string>)
  )

  let related: any[] = responseRelated
  if (!related.length && Array.isArray(post?.relatedPostIds) && post.relatedPostIds.length) {
    const ids: number[] = post.relatedPostIds
      .map((rid: any) => Number(rid))
      .filter((rid: number) => Number.isFinite(rid) && rid > 0)
      .slice(0, 6)
    const fetched = await Promise.all(
      ids.map((rid) => fetchJson(POST_DETAIL_ENDPOINT, { id: String(rid) }, token))
    )
    related = fetched
      .map((item) => unwrapPostResponse(item).post)
      .filter((item): item is any => !!item)
  }

  if (related.length) {
    injectRepeat(
      body,
      'relatedPost@relatedPosts',
      related
        .slice(0, 6)
        .map((item) => transformRelatedPost(item) as unknown as Record<string, string>)
    )
  }

  const tocItems = deriveTocFromContent(staticData['post.content'])
  if (tocItems.length) {
    injectRepeat(
      body,
      'tocItem@tocItems',
      tocItems.map((item) => item as unknown as Record<string, string>)
    )
  }
}

async function injectLoopItemPreview(
  editor: any,
  loopItemType: string,
  previewId: number,
  token: string
): Promise<void> {
  const body = getCanvasBody(editor)
  if (!body) return

  cleanupPreview(body)

  if (loopItemType === 'post') {
    const raw = await fetchJson(POST_DETAIL_ENDPOINT, { id: String(previewId) }, token)
    const { post } = unwrapPostResponse(raw)
    if (!post) return
    const data = transformPost(post) as unknown as Record<string, string>
    bindStaticFields(body, data)
    bindDynamicFieldModels(editor, data)
    return
  }

  if (loopItemType === 'product') {
    const product = await fetchJson(PRODUCT_DETAIL_ENDPOINT, { id: String(previewId) }, token)
    if (!product) return
    const data = transformLoopProduct(product)
    bindStaticFields(body, data)
    bindDynamicFieldModels(editor, data)
    return
  }

  if (isProductCategoryContextLoopItemType(loopItemType)) {
    const content = await fetchJson(
      PRODUCT_CATEGORY_CONTENT_ENDPOINT,
      { categoryId: String(previewId) },
      token
    )
    if (!content) return

    let data: Record<string, string> | null = null
    const faqCategoryId = Number(content?.faqCategoryId)
    if (Number.isFinite(faqCategoryId) && faqCategoryId > 0) {
      const faqItems = await fetchJson(FAQ_ITEM_LIST_ENDPOINT, {}, token)
      const faq = (Array.isArray(faqItems) ? faqItems : [])
        .filter(
          (item) => Number(item?.categoryId) === faqCategoryId && Number(item?.status ?? 1) === 1
        )
        .sort((a, b) => {
          const sortA = Number(a?.sort ?? 0)
          const sortB = Number(b?.sort ?? 0)
          if (sortA !== sortB) return sortA - sortB
          return Number(a?.id ?? 0) - Number(b?.id ?? 0)
        })[0]
      if (faq) {
        data = transformLoopFaq(faq)
      }
    }

    if (!data) return
    bindStaticFields(body, data)
    bindDynamicFieldModels(editor, data)
    return
  }

  if (loopItemType === 'media') {
    const media = await fetchJson(MEDIA_DETAIL_ENDPOINT, { id: String(previewId) }, token)
    if (!media) return
    const data = transformLoopMedia(media)
    bindStaticFields(body, data)
    bindDynamicFieldModels(editor, data)
  }
}

async function injectMediaDetailPreview(
  editor: any,
  mediaId: number,
  token: string
): Promise<void> {
  const body = getCanvasBody(editor)
  if (!body) return

  cleanupPreview(body)

  const media = await fetchJson(MEDIA_DETAIL_ENDPOINT, { id: String(mediaId) }, token)
  if (!media) return
  const data = transformLoopMedia(media)
  bindStaticFields(body, data)
  bindDynamicFieldModels(editor, data)
  injectRepeat(
    body,
    'breadcrumb@breadcrumbs',
    buildMediaBreadcrumbs(media, data).map((item) => item as unknown as Record<string, string>)
  )
}

async function injectProductDetailTemplatePreview(
  editor: any,
  productId: number,
  token: string
): Promise<void> {
  const body = getCanvasBody(editor)
  if (!body) return

  cleanupPreview(body)

  const product = await fetchJson(PRODUCT_DETAIL_ENDPOINT, { id: String(productId) }, token)
  if (!product) return
  await injectProductDetailPreviewData(body, product, token, activeTemplatePreviewLanguage)
  bindDynamicFieldModels(editor, transformLoopProduct(product))
}

/* ───────────── Composable 入口 ───────────── */

export interface UseTemplatePreviewDataOptions {
  grapes: any
  /** 当前选中页面（content 页）的响应式引用 */
  getSelectedPage: () => any
  /** 当前资源类型（TEMP_POST_DETAIL 等） */
  resourceType: Ref<string | null | undefined>
  /** 当前资源扩展元数据，例如 TEMP_LOOP_ITEM 的 loopItemType */
  resourceExtJson?: Ref<string | null | undefined>
  /** 编辑器是否就绪（true 时才注入预览） */
  isEditorReady: Ref<boolean>
}

/**
 * 启用详情模板预览数据注入。
 *
 * 监听选中页 `custom.wbPreviewResourceId` 的变化，自动清理和重新绑定画布。
 * 调用者需要保证 `getSelectedPage()` 能返回当前编辑中的内容页（非 header / footer）。
 */
export function useTemplatePreviewData(options: UseTemplatePreviewDataOptions): void {
  const { grapes, getSelectedPage, resourceType, resourceExtJson, isEditorReady } = options

  grapes.onInit((editor: any) => {
    const runtime = getEditorRuntime(editor)
    const refreshPreview = () => {
      const body = getCanvasBody(editor)
      if (!body) return
      cleanupPreview(body)
      activeTemplatePreviewLanguage = runtime.getPreviewLanguage()

      if (!isEditorReady.value) return
      const type = `${resourceType.value ?? ''}`.trim()
      const loopItemType =
        type === 'TEMP_LOOP_ITEM' ? getLoopItemType(resourceExtJson?.value) || '' : ''
      if (
        type !== 'TEMP_POST_DETAIL' &&
        type !== 'TEMP_MEDIA_DETAIL' &&
        type !== 'TEMP_PRODUCT_DETAIL' &&
        type !== 'TEMP_LOOP_ITEM'
      )
        return

      const page = getSelectedPage() || getPrimaryContentPageFromEditor(editor)
      const custom = page?.get?.('custom') ?? page?.custom ?? {}
      const rawId = custom?.wbPreviewResourceId
      const previewId = Number(rawId)
      if (!Number.isFinite(previewId) || previewId <= 0) return

      const token = getAccessToken() || ''
      if (!token) return

      if (type === 'TEMP_LOOP_ITEM') {
        void injectLoopItemPreview(editor, loopItemType, previewId, token)
        return
      }

      if (type === 'TEMP_PRODUCT_DETAIL') {
        void injectProductDetailTemplatePreview(editor, previewId, token)
        return
      }

      if (type === 'TEMP_MEDIA_DETAIL') {
        void injectMediaDetailPreview(editor, previewId, token)
        return
      }

      void injectPostDetailPreview(editor, previewId, token)
    }

    // 监听页面 custom 变化（保存"模板设置"时触发）
    editor.on('page:select page:update', () => {
      setTimeout(refreshPreview, 200)
    })

    // 画布加载完成后重新注入（切换模板/页面时 DOM 会被重建）
    editor.on('canvas:frame:load', () => {
      setTimeout(refreshPreview, 400)
    })

    // 监听资源类型和就绪状态变化
    watch(
      [resourceType, isEditorReady, ...(resourceExtJson ? [resourceExtJson] : [])],
      () => {
        setTimeout(refreshPreview, 200)
      },
      { immediate: true }
    )

    // 暴露手动刷新入口，供模板设置保存后主动调用
    runtime.onTemplatePreviewRefresh(() => {
      setTimeout(refreshPreview, 100)
    })
  })
}
