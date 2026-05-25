/**
 * CMS 动态组件编辑器实时预览
 *
 * 当用户拖入 CMS 组件（文章列表、产品列表等）时，
 * 调用后端 API 获取真实数据并渲染到编辑器画布中。
 * 用户同时可通过 GrapesJS 正常编辑样式。
 *
 * 策略：隐藏原始模板网格（data-cms-repeat），在旁边插入预览容器（data-cms-preview）。
 * 这样 GrapesJS 即使将 DOM 变化同步回模型，原始模板（含 data-cms-repeat / data-cms-bind-*）
 * 仍然保留在模型中，发布时 SSG 渲染器可以正常找到并使用模板。
 */

import { getAccessToken } from '@/utils/auth'
import {
  composeDynamicUrl,
  normalizeSiteHref,
  removeDynamicRenderCloneIds
} from '../utils/dynamicRenderPipeline'
import {
  CMS_DYNAMIC_RENDER_CONFIGS as CMS_APIS,
  bindCmsDynamicRenderData,
  buildStaticPostUrl,
  buildStaticProductUrl,
  normalizeCmsDynamicPage,
  readCmsDynamicAttrs,
  type CmsDynamicRenderConfig,
} from '../utils/cmsDynamicRender'
import { getEditorRuntime } from './useEditorRuntime'

// ── 数据获取 ──────────────────────────────────────────────────────

async function fetchItems(
  config: CmsDynamicRenderConfig,
  attrs: Record<string, string>,
  token: string
): Promise<any[]> {
  try {
    const params = config.buildParams(attrs)
    const url = new URL(config.endpoint, window.location.origin)
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v)
    })

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) return []

    const json = await res.json()
    const data = json?.data
    const list = Array.isArray(data) ? data : (data?.list ?? [])
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

async function fetchOne(
  config: CmsDynamicRenderConfig,
  attrs: Record<string, string>,
  token: string
): Promise<any | null> {
  try {
    const params = config.buildParams(attrs)
    if (Object.values(params).every((value) => !value)) {
      return null
    }

    const url = new URL(config.endpoint, window.location.origin)
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v)
    })

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

async function fetchAdminData(
  endpoint: string,
  params: Record<string, string>,
  token: string
): Promise<any | null> {
  try {
    const url = new URL(endpoint, window.location.origin)
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value)
    })
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

interface MenuTreePreviewItem {
  title?: string
  resolvedTitle?: string
  url?: string
  resolvedUrl?: string
  target?: string
  icon?: string
  isVisible?: boolean
  children?: MenuTreePreviewItem[]
}

async function fetchMenuTreeByCode(code: string, token: string): Promise<MenuTreePreviewItem[]> {
  const normalizedCode = code.trim()
  if (!normalizedCode) return []

  try {
    const url = new URL(
      `/admin-api/content/menu/code/${encodeURIComponent(normalizedCode)}`,
      window.location.origin
    )
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) return []

    const json = await res.json()
    const data = json?.data
    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []
    return Array.isArray(items) ? items : []
  } catch {
    return []
  }
}

// ── 数据绑定 ──────────────────────────────────────────────────────

function bindCard(card: Element, data: Record<string, any>): void {
  bindCmsDynamicRenderData(card, data, {
    removeBindingAttrs: false,
    imageStrategy: 'preview-background'
  })
}

function transformCmsListPreviewItem(
  cmsType: string,
  config: CmsDynamicRenderConfig,
  item: any
): Record<string, any> {
  const data = config.transformItem(item)
  if (
    cmsType === 'product-list' ||
    cmsType === 'product-latest' ||
    cmsType === 'product-featured'
  ) {
    const url = buildStaticProductUrl(item)
    data['product.url'] = url
    data['product.buyNowUrl'] = data['product.buyNowUrl'] || url
  }
  if (cmsType === 'post-list' || cmsType === 'cases-list' || cmsType === 'post-latest') {
    data['post.url'] = buildStaticPostUrl(item)
  }
  return data
}

function cleanupMenuTreePreview(componentEl: HTMLElement): void {
  componentEl.querySelectorAll('[data-cms-preview]').forEach((el) => el.remove())
  componentEl.querySelectorAll('[data-cms-hidden]').forEach((el) => {
    ;(el as HTMLElement).style.removeProperty('display')
    el.removeAttribute('data-cms-hidden')
  })
}

function createMenuTreeLink(doc: Document, item: MenuTreePreviewItem): HTMLAnchorElement {
  const link = doc.createElement('a')
  link.className = 'wb-menu-tree-link'
  link.href = normalizeSiteHref(item.resolvedUrl || item.url || '#') || '#'
  link.setAttribute('data-menu-role', 'link')
  if (item.target) link.target = item.target

  const icon = `${item.icon ?? ''}`.trim()
  if (icon) {
    const img = doc.createElement('img')
    img.className = 'wb-menu-tree-icon'
    img.src = icon
    img.alt = `${item.resolvedTitle || item.title || ''}`
    link.appendChild(img)
  }

  const text = doc.createElement('span')
  text.className = 'wb-menu-tree-text'
  text.textContent = `${item.resolvedTitle || item.title || 'Menu Item'}`
  link.appendChild(text)

  return link
}

function createMenuTreeList(
  doc: Document,
  items: MenuTreePreviewItem[],
  level: number
): HTMLUListElement {
  const list = doc.createElement('ul')
  list.className = level === 0 ? 'wb-menu-tree-list' : 'wb-menu-tree-submenu'
  list.setAttribute('data-menu-role', 'list')
  list.setAttribute('data-menu-level', String(level))

  items
    .filter((item) => item?.isVisible !== false)
    .forEach((item) => {
      const children = Array.isArray(item.children)
        ? item.children.filter((child) => child?.isVisible !== false)
        : []
      const li = doc.createElement('li')
      li.className = children.length
        ? 'wb-menu-tree-item is-has-children'
        : 'wb-menu-tree-item'
      li.setAttribute('data-menu-role', 'item')
      li.setAttribute('data-menu-level', String(level))
      li.appendChild(createMenuTreeLink(doc, item))

      if (children.length && level < 2) {
        li.appendChild(createMenuTreeList(doc, children, level + 1))
      }

      list.appendChild(li)
    })

  return list
}

async function injectMenuTreePreview(componentEl: HTMLElement, token: string): Promise<void> {
  cleanupMenuTreePreview(componentEl)

  const code = `${componentEl.getAttribute('data-menu-code') || ''}`.trim()
  const items = await fetchMenuTreeByCode(code, token)
  if (!items.length) return

  const templateNav = componentEl.querySelector('.wb-menu-tree-nav') as HTMLElement | null
  if (!templateNav) return

  const doc = componentEl.ownerDocument
  templateNav.style.display = 'none'
  templateNav.setAttribute('data-cms-hidden', '')

  const previewNav = doc.createElement('nav')
  previewNav.className = templateNav.className || 'wb-menu-tree-nav'
  previewNav.setAttribute('data-menu-role', 'root')
  previewNav.setAttribute('data-cms-preview', '')
  previewNav.appendChild(createMenuTreeList(doc, items, 0))
  templateNav.parentNode?.insertBefore(previewNav, templateNav.nextSibling)
}

function cleanupProductFeaturedPreview(componentEl: HTMLElement): void {
  componentEl.querySelectorAll('[data-cms-preview-wrapper]').forEach((el) => el.remove())
  componentEl.querySelectorAll('[data-cms-hidden]').forEach((el) => {
    const htmlEl = el as HTMLElement & { __cmsPreviewOriginalClassName?: string }
    htmlEl.style.removeProperty('display')
    if (typeof htmlEl.__cmsPreviewOriginalClassName === 'string') {
      htmlEl.className = htmlEl.__cmsPreviewOriginalClassName
      delete htmlEl.__cmsPreviewOriginalClassName
    }
    el.removeAttribute('data-cms-hidden')
  })
}

function cleanupProductDetailPreview(componentEl: HTMLElement): void {
  componentEl.querySelectorAll('[data-cms-preview]').forEach((el) => el.remove())
  componentEl.querySelectorAll('[data-cms-hidden]').forEach((el) => {
    ;(el as HTMLElement).style.removeProperty('display')
    el.removeAttribute('data-cms-hidden')
  })
  componentEl.querySelectorAll('[data-cms-preview-bound]').forEach((el) => {
    const previewEl = el as HTMLElement & {
      __cmsPreviewOriginalText?: string
      __cmsPreviewOriginalHtml?: string
      __cmsPreviewOriginalSrc?: string
      __cmsPreviewOriginalBgImage?: string
      __cmsPreviewOriginalHref?: string
      __cmsPreviewOriginalTarget?: string | null
      __cmsPreviewOriginalStyle?: string
    }
    if (previewEl.__cmsPreviewOriginalText !== undefined) {
      el.textContent = previewEl.__cmsPreviewOriginalText
    }
    if (previewEl.__cmsPreviewOriginalHtml !== undefined) {
      ;(el as HTMLElement).innerHTML = previewEl.__cmsPreviewOriginalHtml
    }
    if (previewEl.__cmsPreviewOriginalSrc !== undefined && el.tagName === 'IMG') {
      ;(el as HTMLImageElement).src = previewEl.__cmsPreviewOriginalSrc
    }
    if (previewEl.__cmsPreviewOriginalBgImage !== undefined) {
      ;(el as HTMLElement).style.backgroundImage = previewEl.__cmsPreviewOriginalBgImage
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
    if (previewEl.__cmsPreviewOriginalStyle !== undefined) {
      if (previewEl.__cmsPreviewOriginalStyle) {
        el.setAttribute('style', previewEl.__cmsPreviewOriginalStyle)
      } else {
        el.removeAttribute('style')
      }
    }
    el.removeAttribute('data-cms-preview-bound')
  })
}

function markPreviewBound(el: Element): HTMLElement & {
  __cmsPreviewOriginalText?: string
  __cmsPreviewOriginalHtml?: string
  __cmsPreviewOriginalSrc?: string
  __cmsPreviewOriginalBgImage?: string
  __cmsPreviewOriginalHref?: string
  __cmsPreviewOriginalTarget?: string | null
  __cmsPreviewOriginalStyle?: string
} {
  const previewEl = el as HTMLElement & {
    __cmsPreviewOriginalText?: string
    __cmsPreviewOriginalHtml?: string
    __cmsPreviewOriginalSrc?: string
    __cmsPreviewOriginalBgImage?: string
    __cmsPreviewOriginalHref?: string
    __cmsPreviewOriginalTarget?: string | null
    __cmsPreviewOriginalStyle?: string
  }

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
    previewEl.__cmsPreviewOriginalStyle = el.getAttribute('style') || ''
    previewEl.__cmsPreviewOriginalBgImage = (el as HTMLElement).style.backgroundImage || ''
  }

  el.setAttribute('data-cms-preview-bound', '')
  return previewEl
}

function bindProductDetailStatics(
  componentEl: HTMLElement,
  productData: Record<string, string>
): void {
  componentEl.querySelectorAll('[data-cms-bind]').forEach((el) => {
    const key = el.getAttribute('data-cms-bind') || ''
    if (!(key in productData)) return
    markPreviewBound(el)
    el.textContent = productData[key]
  })

  componentEl.querySelectorAll('[data-cms-bind-src]').forEach((el) => {
    const key = el.getAttribute('data-cms-bind-src') || ''
    const src = productData[key]
    if (!src) return
    markPreviewBound(el)
    if (el.tagName === 'IMG') {
      ;(el as HTMLImageElement).src = src
    } else {
      const htmlEl = el as HTMLElement
      htmlEl.style.backgroundImage = `url('${src}')`
      htmlEl.style.backgroundSize = 'cover'
      htmlEl.style.backgroundPosition = 'center'
      htmlEl.textContent = ''
    }
  })

  componentEl.querySelectorAll('[data-cms-html]').forEach((el) => {
    const key = el.getAttribute('data-cms-html') || ''
    if (!(key in productData)) return
    markPreviewBound(el)
    ;(el as HTMLElement).innerHTML = productData[key] || ''
  })

  componentEl.querySelectorAll('[data-cms-bind-href]').forEach((el) => {
    const key = el.getAttribute('data-cms-bind-href') || ''
    if (!(key in productData)) return
    markPreviewBound(el)
    const template = el.getAttribute('data-cms-bind-href-template') || ''
    ;(el as HTMLAnchorElement).href = composeDynamicUrl(productData[key], template) || '#'
  })

  componentEl.querySelectorAll('[data-cms-bind-target]').forEach((el) => {
    const key = el.getAttribute('data-cms-bind-target') || ''
    if (!(key in productData)) return
    markPreviewBound(el)
    const value = productData[key]
    if (value) el.setAttribute('target', value)
    else el.removeAttribute('target')
  })
  ;['alt', 'content', 'title', 'value', 'action', 'width', 'height', 'datetime', 'style'].forEach(
    (attr) => {
      componentEl.querySelectorAll(`[data-cms-bind-${attr}]`).forEach((el) => {
        const key = el.getAttribute(`data-cms-bind-${attr}`) || ''
        if (!(key in productData)) return
        markPreviewBound(el)
        const value = productData[key]
        if (value) el.setAttribute(attr, value)
        else el.removeAttribute(attr)
      })
    }
  )
}

function bindTechnicalSupportDetailStatics(
  componentEl: HTMLElement,
  mediaData: Record<string, string>
): void {
  componentEl.querySelectorAll('[data-cms-bind]').forEach((el) => {
    const key = el.getAttribute('data-cms-bind') || ''
    if (!(key in mediaData)) return
    markPreviewBound(el)
    el.textContent = mediaData[key]
  })

  componentEl.querySelectorAll('[data-cms-bind-src]').forEach((el) => {
    const key = el.getAttribute('data-cms-bind-src') || ''
    const src = mediaData[key]
    if (!src) return
    markPreviewBound(el)
    if (el.tagName === 'IMG') {
      ;(el as HTMLImageElement).src = src
    }
  })

  componentEl.querySelectorAll('[data-cms-bind-content]').forEach((el) => {
    const key = el.getAttribute('data-cms-bind-content') || ''
    if (!(key in mediaData)) return
    markPreviewBound(el)
    const value = mediaData[key]
    if (value) el.setAttribute('content', value)
    else el.removeAttribute('content')
  })
}

async function injectTechnicalSupportDetailPreview(
  componentEl: HTMLElement,
  token: string
): Promise<void> {
  cleanupProductDetailPreview(componentEl)

  const config = CMS_APIS['technical-support-detail']
  const attrs: Record<string, string> = {}
  Array.from(componentEl.attributes).forEach((attr) => {
    attrs[attr.name] = attr.value
  })

  const media = await fetchOne(config, attrs, token)
  if (!media) return

  bindTechnicalSupportDetailStatics(componentEl, config.transformItem(media))

  const repeatEl = componentEl.querySelector(
    '[data-cms-repeat="item@media.items"]'
  ) as HTMLElement | null
  const items = Array.isArray(media?.items) ? media.items : []
  if (!repeatEl || !items.length) return

  repeatEl.style.display = 'none'
  repeatEl.setAttribute('data-cms-hidden', '')
  insertInlinePreviewNodes(repeatEl, items, (card, item) => {
    bindCard(card, { 'item.url': item?.url || '' })
  })
  componentEl.dispatchEvent(new CustomEvent('wb:technical-support-detail:refresh'))
}

function normalizeColorStyle(colorCode: any): string {
  const value = String(colorCode ?? '').trim()
  return value ? `background:${value};` : ''
}

function buildPropertyOptionsFromSkus(skus: any[]): any[] {
  if (!Array.isArray(skus) || skus.length === 0) return []

  const optionMap = new Map<
    string,
    { propertyId: number | null; propertyName: string; displayType: string; values: any[] }
  >()

  skus.forEach((sku) => {
    const properties = Array.isArray(sku?.properties) ? sku.properties : []
    properties.forEach((property: any) => {
      const propertyId = property?.propertyId ?? null
      const mapKey = propertyId != null ? String(propertyId) : String(property?.propertyName || '')
      if (!mapKey) return

      if (!optionMap.has(mapKey)) {
        optionMap.set(mapKey, {
          propertyId,
          propertyName: property?.propertyName || '',
          displayType: property?.displayType || 'TEXT',
          values: []
        })
      }

      const option = optionMap.get(mapKey)!
      const valueId = property?.valueId ?? null
      const valueKey = valueId != null ? String(valueId) : String(property?.valueName || '')
      if (!valueKey) return
      if (
        option.values.some((value) => String(value?.valueId ?? value?.valueName ?? '') === valueKey)
      ) {
        return
      }

      option.values.push({
        valueId,
        valueName: property?.valueName || '',
        colorCode: property?.colorCode || '',
        colorStyle: normalizeColorStyle(property?.colorCode),
        imageUrl: property?.imageUrl || ''
      })
    })
  })

  return Array.from(optionMap.values())
}

function deriveFileName(url: string): string {
  const value = String(url || '').trim()
  if (!value) return 'Document'
  const cleanUrl = value.split('?')[0] || value
  const fileName = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1)
  if (!fileName) return 'Document'
  try {
    return decodeURIComponent(fileName)
  } catch {
    return fileName
  }
}

function buildFeatureItems(features: any): Array<{ text: string }> {
  if (Array.isArray(features)) {
    return features
      .map((item) => ({ text: String(item?.text ?? item ?? '').trim() }))
      .filter((item) => item.text)
  }
  return String(features || '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((text) => ({ text }))
}

function buildFeaturesText(features: any): string {
  return buildFeatureItems(features)
    .map((feature) => feature.text)
    .join('\n')
}

function formatPreviewPrice(price: any): string {
  if (price == null || price === '') return ''
  const value = Number(price)
  if (!Number.isFinite(value)) return ''
  return `¥${(value / 100).toFixed(2)}`
}

function normalizePreviewDocuments(documents: any[]): any[] {
  if (!Array.isArray(documents)) return []
  return documents
    .filter((document) => document && String(document?.url || '').trim())
    .map((document) => ({
      ...document,
      url: String(document?.url || '').trim(),
      name:
        String(document?.displayName || document?.name || '').trim() ||
        deriveFileName(document?.url || '')
    }))
}

function normalizePreviewSkus(skus: any[]): any[] {
  if (!Array.isArray(skus)) return []
  return skus.map((sku) => {
    const priceFormatted = sku?.priceFormatted || formatPreviewPrice(sku?.price)
    return {
      ...sku,
      price: priceFormatted || (sku?.price == null ? '' : String(sku.price)),
      priceFormatted
    }
  })
}

function normalizeProductDetailPreviewData(product: any): any {
  const normalized = { ...(product || {}) }
  normalized.picUrl = normalized.sliderPicUrls?.[0] || normalized.picUrl || ''
  normalized.priceFormatted = normalized.priceFormatted || formatPreviewPrice(normalized.price)
  normalized.buyNowTarget =
    normalized.buyNowTarget || (normalized.buyNowTargetBlank ? '_blank' : '_self')
  normalized.documents = normalizePreviewDocuments(normalized.documents)
  normalized.features = buildFeatureItems(normalized.features)
  normalized.skus = normalizePreviewSkus(normalized.skus)
  normalized.propertyOptions = Array.isArray(normalized.propertyOptions)
    ? normalized.propertyOptions
    : buildPropertyOptionsFromSkus(normalized.skus)
  normalized.specGroups = buildProductSpecGroups(normalized)
  normalized.specifications = normalized.specGroups.flatMap((group: any) =>
    Array.isArray(group?.specifications) ? group.specifications : []
  )
  normalized.url = normalized.url || buildStaticProductUrl(normalized)
  return normalized
}

function buildProductBreadcrumbs(product: any): any[] {
  const categoryName = String(product?.categoryName || product?.category?.name || '').trim()
  const categoryUrl = normalizeSiteHref(product?.categoryUrl || product?.category?.url)
  const items = [
    { label: 'Home', url: '/' },
    { label: 'Products', url: '/products/' },
    ...(categoryName ? [{ label: categoryName, url: categoryUrl || '/products/' }] : []),
    { label: product?.name || 'Current Product', url: product?.url || buildStaticProductUrl(product) },
  ]

  return items.map((item, index) => ({
    label: item.label,
    url: item.url || '#',
    position: index + 1,
    isCurrent: index === items.length - 1,
    currentClass: index === items.length - 1 ? 'is-current' : '',
    ariaCurrent: index === items.length - 1 ? 'page' : ''
  }))
}

async function loadProductDetailRelatedProducts(product: any, token: string): Promise<any[]> {
  const relatedIds = Array.isArray(product?.relatedProductIds)
    ? product.relatedProductIds
        .map((id: any) => Number(id))
        .filter((id: number) => Number.isFinite(id) && id > 0)
    : []
  const relatedProducts = await fetchSpuListByIds(relatedIds, token)
  return relatedProducts.map((item) => ({
    ...item,
    url: buildStaticProductUrl(item)
  }))
}

type PreviewScope = Record<string, any>

function parseRepeatExpression(value: string): { alias: string; collection: string } | null {
  const normalized = String(value || '').trim()
  if (!normalized) return null
  const atIndex = normalized.indexOf('@')
  if (atIndex > 0) {
    return {
      alias: normalized.slice(0, atIndex).trim(),
      collection: normalized.slice(atIndex + 1).trim()
    }
  }
  return {
    alias: normalized,
    collection: `${normalized}s`
  }
}

function resolveScopeValue(scope: PreviewScope, path: string): any {
  const normalized = String(path || '').trim()
  if (!normalized) return undefined
  if (Object.prototype.hasOwnProperty.call(scope, normalized)) return scope[normalized]

  const parts = normalized.split('.').filter(Boolean)
  if (!parts.length) return undefined
  let current = scope[parts[0]]
  for (const part of parts.slice(1)) {
    if (current == null) return undefined
    current = current[part]
  }
  return current
}

function stringifyPreviewValue(value: any): string {
  if (value == null) return ''
  if (Array.isArray(value)) return value.map(stringifyPreviewValue).filter(Boolean).join(', ')
  return String(value)
}

function getTopLevelRepeatElements(root: Element): HTMLElement[] {
  return Array.from(root.querySelectorAll('[data-cms-repeat]')).filter((el) => {
    const parentRepeat = el.parentElement?.closest('[data-cms-repeat]')
    return !parentRepeat || !root.contains(parentRepeat)
  }) as HTMLElement[]
}

function getTopLevelPreviewRepeatElements(
  root: Element,
  options?: { dynamicOnly?: boolean; excludeWithin?: Element }
): HTMLElement[] {
  return getTopLevelRepeatElements(root).filter((el) => {
    if (options?.excludeWithin?.contains(el)) return false
    if (!options?.dynamicOnly) return true
    return el.getAttribute('data-wb-dynamic') === 'repeat'
  })
}

function filterRepeatItems(
  repeatEl: HTMLElement,
  items: any[],
  scope: PreviewScope,
  alias: string
): any[] {
  const field = String(repeatEl.getAttribute('data-cms-repeat-filter-field') || '').trim()
  const expected = String(repeatEl.getAttribute('data-cms-repeat-filter-value') || '').trim()
  const operator = String(repeatEl.getAttribute('data-cms-repeat-filter-operator') || 'eq').trim()
  if (!field) return items

  return items.filter((item) => {
    const itemScope = { ...scope, [alias]: item }
    const actual = stringifyPreviewValue(resolveScopeValue(itemScope, field)).trim()
    return operator === 'neq' ? actual !== expected : actual === expected
  })
}

function bindPreviewScopeData(root: Element, scope: PreviewScope): void {
  const selectBoundElements = (selector: string): Element[] => {
    const result = Array.from(root.querySelectorAll(selector))
    if ((root as HTMLElement).matches?.(selector)) result.unshift(root)
    return result
  }

  selectBoundElements('[data-cms-bind]').forEach((el) => {
    const key = el.getAttribute('data-cms-bind') || ''
    const value = resolveScopeValue(scope, key)
    if (value !== undefined) el.textContent = stringifyPreviewValue(value)
  })

  selectBoundElements('[data-cms-html]').forEach((el) => {
    const key = el.getAttribute('data-cms-html') || ''
    const value = resolveScopeValue(scope, key)
    if (value !== undefined) (el as HTMLElement).innerHTML = stringifyPreviewValue(value)
  })

  selectBoundElements('[data-cms-bind-src]').forEach((el) => {
    const key = el.getAttribute('data-cms-bind-src') || ''
    const src = stringifyPreviewValue(resolveScopeValue(scope, key))
    if (!src) return
    const htmlEl = el as HTMLElement
    if (htmlEl.tagName === 'IMG') {
      ;(htmlEl as HTMLImageElement).src = src
    } else {
      htmlEl.style.backgroundImage = `url('${src}')`
      htmlEl.style.backgroundSize = 'cover'
      htmlEl.style.backgroundPosition = 'center'
      htmlEl.textContent = ''
    }
  })
  ;[
    'href',
    'alt',
    'content',
    'title',
    'value',
    'action',
    'width',
    'height',
    'datetime',
    'target',
    'style',
    'aria-current',
    'data-product-spec-values'
  ].forEach((attr) => {
    selectBoundElements(`[data-cms-bind-${attr}]`).forEach((el) => {
      const key = el.getAttribute(`data-cms-bind-${attr}`) || ''
      const value = stringifyPreviewValue(resolveScopeValue(scope, key))
      if (value) el.setAttribute(attr, value)
      else el.removeAttribute(attr)
    })
  })

  selectBoundElements('[data-cms-bind-classappend]').forEach((el) => {
    const key = el.getAttribute('data-cms-bind-classappend') || ''
    const value = stringifyPreviewValue(resolveScopeValue(scope, key)).trim()
    if (!value) return
    value
      .split(/\s+/)
      .filter(Boolean)
      .forEach((className) => el.classList.add(className))
  })
}

function cleanupDynamicRepeatPreviews(root: Element): void {
  root.querySelectorAll('[data-wb-dynamic-preview]').forEach((el) => el.remove())
  root.querySelectorAll('[data-wb-dynamic-hidden]').forEach((el) => {
    ;(el as HTMLElement).style.removeProperty('display')
    el.removeAttribute('data-cms-hidden')
    el.removeAttribute('data-wb-dynamic-hidden')
  })
}

function renderDynamicRepeatPreviews(
  root: Element,
  scope: PreviewScope,
  options?: { dynamicOnly?: boolean; excludeWithin?: Element }
): void {
  getTopLevelPreviewRepeatElements(root, options).forEach((repeatEl) => {
    const repeat = parseRepeatExpression(repeatEl.getAttribute('data-cms-repeat') || '')
    if (!repeat) return

    const rawItems = resolveScopeValue(scope, repeat.collection)
    const items = filterRepeatItems(
      repeatEl,
      Array.isArray(rawItems) ? rawItems : [],
      scope,
      repeat.alias
    )
    if (!items.length) return

    repeatEl.style.display = 'none'
    repeatEl.setAttribute('data-cms-hidden', '')
    repeatEl.setAttribute('data-wb-dynamic-hidden', '')

    if (repeatEl.hasAttribute('data-cms-repeat-container') && repeatEl.firstElementChild) {
      const previewEl = repeatEl.cloneNode(false) as HTMLElement
      removeDynamicRenderCloneIds(previewEl)
      previewEl.removeAttribute('data-cms-repeat')
      previewEl.removeAttribute('data-cms-repeat-container')
      previewEl.removeAttribute('data-cms-repeat-filter-field')
      previewEl.removeAttribute('data-cms-repeat-filter-operator')
      previewEl.removeAttribute('data-cms-repeat-filter-value')
      previewEl.removeAttribute('data-cms-hidden')
      previewEl.removeAttribute('data-wb-dynamic-hidden')
      previewEl.setAttribute('data-cms-preview', '')
      previewEl.setAttribute('data-wb-dynamic-preview', '')
      previewEl.style.removeProperty('display')

      const template = repeatEl.firstElementChild
      items.forEach((item) => {
        const card = template.cloneNode(true) as HTMLElement
        removeDynamicRenderCloneIds(card)
        const childScope = { ...scope, [repeat.alias]: item }
        bindPreviewScopeData(card, childScope)
        renderDynamicRepeatPreviews(card, childScope)
        previewEl.appendChild(card)
      })

      repeatEl.parentNode?.insertBefore(previewEl, repeatEl.nextSibling)
      return
    }

    const parent = repeatEl.parentNode
    if (!parent) return

    let anchor: ChildNode = repeatEl
    items.forEach((item) => {
      const card = repeatEl.cloneNode(true) as HTMLElement
      removeDynamicRenderCloneIds(card)
      card.removeAttribute('data-cms-repeat')
      card.removeAttribute('data-cms-repeat-filter-field')
      card.removeAttribute('data-cms-repeat-filter-operator')
      card.removeAttribute('data-cms-repeat-filter-value')
      card.removeAttribute('data-cms-hidden')
      card.removeAttribute('data-wb-dynamic-hidden')
      card.style.removeProperty('display')
      card.setAttribute('data-cms-preview', '')
      card.setAttribute('data-wb-dynamic-preview', '')
      const childScope = { ...scope, [repeat.alias]: item }
      bindPreviewScopeData(card, childScope)
      renderDynamicRepeatPreviews(card, childScope)
      parent.insertBefore(card, anchor.nextSibling)
      anchor = card
    })
  })
}

async function fetchFaqItemsByCategoryId(categoryId: any, token: string): Promise<any[]> {
  const safeCategoryId = Number(categoryId)
  if (!Number.isFinite(safeCategoryId) || safeCategoryId <= 0) return []

  try {
    const url = new URL('/admin-api/content/faq-item/list-all', window.location.origin)
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) return []

    const json = await res.json()
    const list = Array.isArray(json?.data) ? json.data : []
    return list
      .filter(
        (item) => Number(item?.categoryId) === safeCategoryId && Number(item?.status ?? 1) === 1
      )
      .sort((a, b) => {
        const sortA = Number(a?.sort ?? 0)
        const sortB = Number(b?.sort ?? 0)
        if (sortA !== sortB) return sortA - sortB
        return Number(a?.id ?? 0) - Number(b?.id ?? 0)
      })
  } catch {
    return []
  }
}

async function fetchSpuListByIds(ids: number[], token: string): Promise<any[]> {
  const safeIds = Array.from(
    new Set(ids.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))
  )
  if (!safeIds.length) return []

  try {
    const url = new URL('/admin-api/product/spu/list', window.location.origin)
    safeIds.forEach((id) => url.searchParams.append('spuIds', String(id)))
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) return []
    const json = await res.json()
    const list = json?.data
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function insertInlinePreviewNodes(
  repeatEl: HTMLElement,
  itemList: any[],
  bindItem: (card: Element, item: any) => void
): void {
  const parent = repeatEl.parentNode
  if (!parent) return

  let anchor: ChildNode = repeatEl
  itemList.forEach((item) => {
    const card = repeatEl.cloneNode(true) as HTMLElement
    removeDynamicRenderCloneIds(card)
    card.removeAttribute('data-cms-repeat')
    card.removeAttribute('data-cms-hidden')
    card.style.removeProperty('display')
    card.setAttribute('data-cms-preview', '')
    bindItem(card, item)
    parent.insertBefore(card, anchor.nextSibling)
    anchor = card
  })
}

function getProductSpecValue(spec: any): string {
  return String(spec?.value ?? spec?.rawValue ?? spec?.textValue ?? '').trim()
}

function buildProductSpecGroups(product: any): any[] {
  const specs = Array.isArray(product?.specifications) ? product.specifications : []
  const groups = new Map<string, any>()

  specs.forEach((spec: any, index: number) => {
    if (spec?.showInDetail === false) return
    const code = String(spec?.code || spec?.name || `spec-${index}`).trim()
    const label = String(spec?.name || spec?.label || code || '-').trim()
    const value = getProductSpecValue(spec) || '-'
    const groupCode = String(spec?.groupCode || 'general').trim() || 'general'
    const group = groups.get(groupCode) || {
      code: groupCode,
      name: spec?.groupName || groupCode,
      sort: Number(spec?.groupSort ?? spec?.sort ?? 0) || 0,
      specifications: []
    }

    group.specifications.push({
      ...spec,
      code,
      name: label,
      label,
      value,
      valueHtml: String(value).replace(/\r?\n/g, '<br/>'),
      sort: Number(spec?.sort ?? index) || 0
    })
    groups.set(groupCode, group)
  })

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      specifications: [...group.specifications].sort(
        (a, b) =>
          Number(a.sort ?? 0) - Number(b.sort ?? 0) || String(a.name).localeCompare(String(b.name))
      )
    }))
    .sort(
      (a, b) =>
        Number(a.sort ?? 0) - Number(b.sort ?? 0) || String(a.name).localeCompare(String(b.name))
    )
}

function escapePreviewHtml(value: any): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function normalizePreviewSpecifications(specifications: any[]): any[] {
  if (!Array.isArray(specifications)) return []
  return specifications
    .map((spec, index) => {
      const code = String(spec?.code || spec?.name || spec?.label || `spec-${index}`).trim()
      const label = String(spec?.name || spec?.label || code || '—').trim()
      const rawValue = getProductSpecValue(spec) || ''
      const value = rawValue || '—'
      const rawUnit = String(spec?.unit || '').trim()
      // 根据用户规则处理值和单位显示：
      // 1. 如果值是 "—" 或空，不显示单位
      // 2. 如果单位是 "/" 或空，不显示单位
      let displayValue = value
      let displayUnit = rawUnit
      if (value === '—' || !value) {
        displayValue = '—'
        displayUnit = ''
      } else if (rawUnit === '/' || !rawUnit) {
        displayUnit = ''
      }
      const valueWithUnit = displayUnit ? `${displayValue} ${displayUnit}` : displayValue
      return {
        ...spec,
        code,
        name: label,
        label,
        value: displayValue,
        rawValue: String(spec?.rawValue ?? displayValue),
        textValue: String(spec?.textValue ?? displayValue),
        valueHtml: String(spec?.valueHtml || escapePreviewHtml(valueWithUnit)).replace(/\r?\n/g, '<br/>'),
        groupCode: String(spec?.groupCode || 'general').trim() || 'general',
        groupName: String(spec?.groupName || 'General').trim() || 'General',
        unit: displayUnit,
        valueType: String(spec?.valueType || 'TEXT').trim() || 'TEXT',
        sort: Number(spec?.sort ?? index) || 0,
        filterable: spec?.filterable === true,
        showInList: spec?.showInList !== false,
        showInDetail: spec?.showInDetail !== false
      }
    })
    .filter((spec) => spec.code || spec.name || spec.value)
}

function buildPreviewSpecValueMap(specifications: any[]): Record<string, any> {
  return specifications.reduce((acc: Record<string, any>, spec: any) => {
    const code = String(spec?.code || '').trim()
    if (code) acc[code] = spec
    return acc
  }, {})
}

function normalizeDatasheetField(field: any, index = 0): any | null {
  const code = String(field?.code || '').trim()
  if (!code || code.toLowerCase() === 'designation') return null
  return {
    code,
    label: String(field?.label || field?.name || code).trim(),
    unit: String(field?.unit || '').trim(),
    valueType: String(field?.valueType || 'TEXT').trim() || 'TEXT',
    filterable: field?.filterable === true,
    showInList: field?.showInList !== false,
    sort: Number(field?.sort ?? index) || 0
  }
}

function deriveDatasheetFieldsFromProducts(products: any[]): any[] {
  const fieldMap = new Map<string, any>()
  products.forEach((product) => {
    ;(Array.isArray(product?.specifications) ? product.specifications : []).forEach((spec: any, index: number) => {
      const field = normalizeDatasheetField(spec, index)
      if (!field || fieldMap.has(field.code)) return
      fieldMap.set(field.code, field)
    })
  })
  return Array.from(fieldMap.values()).sort(
    (a, b) => Number(a.sort ?? 0) - Number(b.sort ?? 0) || String(a.label).localeCompare(String(b.label))
  )
}

async function fetchDatasheetFieldsForPreview(categoryId: number, token: string): Promise<any[]> {
  if (!Number.isFinite(categoryId) || categoryId <= 0) return []
  const data = await fetchAdminData(
    '/admin-api/product/spec/templates/recommend',
    { categoryId: String(categoryId) },
    token
  )
  const fields = Array.isArray(data?.fields) ? data.fields : []
  return fields
    .map((field: any, index: number) => normalizeDatasheetField(field, index))
    .filter(Boolean)
}

function buildPreviewDatasheetCells(fields: any[], specValueMap: Record<string, any>): any[] {
  return fields.map((field) => {
    const spec = specValueMap[field.code]
    const rawValue = spec?.value || spec?.rawValue || ''
    const value = rawValue || '—'
    const unit = spec?.unit || field.unit || ''
    // 根据用户规则处理值和单位显示：
    // 1. 如果值是 "—" 或空，不显示单位
    // 2. 如果单位是 "/" 或空，不显示单位
    let displayValue = value
    let displayUnit = unit
    if (value === '—' || !value) {
      displayValue = '—'
      displayUnit = ''
    } else if (unit === '/' || !unit) {
      displayUnit = ''
    }
    const displayValueHtml = displayUnit ? `${displayValue} ${displayUnit}` : displayValue
    return {
      code: field.code,
      label: field.label,
      unit: displayUnit,
      valueType: spec?.valueType || field.valueType || 'TEXT',
      filterable: field.filterable === true,
      sort: field.sort,
      value: displayValue,
      rawValue: spec?.rawValue || displayValue,
      numericValue: spec?.numericValue || '',
      minValue: spec?.minValue || '',
      maxValue: spec?.maxValue || '',
      valueHtml: spec?.valueHtml || escapePreviewHtml(displayValueHtml)
    }
  })
}

function normalizeProductListPreviewItem(item: any, datasheetFields: any[]): any {
  const specifications = normalizePreviewSpecifications(item?.specifications)
  const specValueMap = buildPreviewSpecValueMap(specifications)
  const designationSpec = specValueMap.designation
  const datasheetCells = buildPreviewDatasheetCells(datasheetFields, specValueMap)
  return {
    ...item,
    name: item?.name || item?.contents?.[0]?.name || '',
    slug: item?.slug || '',
    brandName: item?.brandName || '',
    categoryName: item?.categoryName || '',
    introduction: item?.introduction || item?.description || '',
    keyword: item?.keyword || '',
    description: item?.detail || item?.description || '',
    picUrl: item?.picUrl || item?.sliderPicUrls?.[0] || '',
    priceFormatted: item?.priceFormatted || formatPreviewPrice(item?.price),
    salesCount: item?.salesCount == null ? '' : String(item.salesCount),
    url: item?.url || buildStaticProductUrl(item),
    datasheetDesignation: designationSpec?.value || item?.name || '',
    specifications,
    specValueMap,
    specValueJson: JSON.stringify(specValueMap),
    datasheetFields,
    datasheetCells,
    datasheetValueMap: datasheetCells.reduce((acc: Record<string, any>, cell: any) => {
      acc[cell.code] = cell
      return acc
    }, {})
  }
}

type PreviewDatasheetSortKey =
  | { type: 'designation' }
  | { type: 'field'; code: string }

function resolvePreviewDatasheetSortKeys(
  attrs: Record<string, string>,
  datasheetFields: any[]
): PreviewDatasheetSortKey[] {
  const sortField = String(attrs['data-sort-field'] || attrs['data-wb-sort-field'] || '').trim()
  const listMode = String(attrs['data-list-mode'] || attrs['data-wb-list-mode'] || '').trim()
  const useDefaultDatasheetSort =
    listMode.toLowerCase() === 'datasheet' && (!sortField || sortField === 'createTime')
  if (!useDefaultDatasheetSort && !sortField.startsWith('datasheet:')) return []
  const requestedCode = useDefaultDatasheetSort
    ? 'first3'
    : sortField.slice('datasheet:'.length).trim()
  if (
    !requestedCode ||
    requestedCode.toLowerCase() === 'first' ||
    requestedCode.toLowerCase() === 'first3'
  ) {
    return [
      { type: 'designation' },
      ...datasheetFields
        .map((field: any) => String(field?.code || '').trim())
        .filter(Boolean)
        .slice(0, 2)
        .map((code) => ({ type: 'field' as const, code }))
    ]
  }
  return [{ type: 'field', code: requestedCode }]
}

function findPreviewDatasheetCell(product: any, code: string): any {
  const normalizedCode = String(code || '').trim()
  if (!normalizedCode) return null
  const valueMap = product?.datasheetValueMap || {}
  const direct =
    valueMap[normalizedCode] ||
    valueMap[normalizedCode.toLowerCase()] ||
    valueMap[normalizedCode.toUpperCase()]
  if (direct) return direct
  return (Array.isArray(product?.datasheetCells) ? product.datasheetCells : []).find(
    (cell: any) => String(cell?.code || '').trim().toLowerCase() === normalizedCode.toLowerCase()
  )
}

function normalizePreviewSortText(value: any): string {
  return String(value ?? '').trim()
}

function readPreviewDatasheetSortText(cell: any): string {
  return normalizePreviewSortText(cell?.value || cell?.rawValue || cell?.textValue || '')
}

function readPreviewDatasheetDesignationSortText(product: any): string {
  return normalizePreviewSortText(product?.datasheetDesignation || product?.name || product?.id || '')
}

function isPreviewDatasheetSortEmpty(value: string): boolean {
  return !value || value === '-' || value === '—'
}

function parsePreviewDatasheetSortNumber(cell: any): number | null {
  const candidates = [
    cell?.numericValue,
    cell?.minValue,
    cell?.maxValue,
    cell?.value,
    cell?.rawValue,
    cell?.textValue
  ]
  for (const candidate of candidates) {
    const match = normalizePreviewSortText(candidate)
      .replace(/,/g, '')
      .match(/-?\d+(?:\.\d+)?/)
    if (!match) continue
    const numberValue = Number(match[0])
    if (Number.isFinite(numberValue)) return numberValue
  }
  return null
}

function sortPreviewProductsByDatasheetField(
  products: any[],
  datasheetFields: any[],
  attrs: Record<string, string>
): any[] {
  const sortKeys = resolvePreviewDatasheetSortKeys(attrs, datasheetFields)
  if (!sortKeys.length) return products
  const asc = String(attrs['data-sort-asc'] || attrs['data-wb-sort-asc'] || 'true') !== 'false'
  return [...products]
    .map((product, index) => ({ product, index }))
    .sort((left, right) => {
      for (const sortKey of sortKeys) {
        const leftCell =
          sortKey.type === 'field' ? findPreviewDatasheetCell(left.product, sortKey.code) : null
        const rightCell =
          sortKey.type === 'field' ? findPreviewDatasheetCell(right.product, sortKey.code) : null
        const leftText =
          sortKey.type === 'designation'
            ? readPreviewDatasheetDesignationSortText(left.product)
            : readPreviewDatasheetSortText(leftCell)
        const rightText =
          sortKey.type === 'designation'
            ? readPreviewDatasheetDesignationSortText(right.product)
            : readPreviewDatasheetSortText(rightCell)
        const leftEmpty = isPreviewDatasheetSortEmpty(leftText)
        const rightEmpty = isPreviewDatasheetSortEmpty(rightText)
        if (leftEmpty && rightEmpty) continue
        if (leftEmpty) return 1
        if (rightEmpty) return -1

        const leftNumber =
          sortKey.type === 'field' ? parsePreviewDatasheetSortNumber(leftCell) : null
        const rightNumber =
          sortKey.type === 'field' ? parsePreviewDatasheetSortNumber(rightCell) : null
        let result = 0
        if (leftNumber != null && rightNumber != null) {
          result = leftNumber - rightNumber
        } else {
          result = leftText.localeCompare(rightText, undefined, {
            numeric: true,
            sensitivity: 'base'
          })
        }
        if (result !== 0) return asc ? result : -result
      }
      return left.index - right.index
    })
    .map(item => item.product)
}

function buildPreviewCategoryUrl(category: any): string {
  const code = String(category?.code || category?.id || '').trim()
  return code ? `/products/${encodeURIComponent(code)}/index.html` : '/products/'
}

function normalizeCategoryPostPreview(item: any): any {
  return {
    ...item,
    name: item?.name || item?.title || '',
    excerpt: item?.excerpt || '',
    image: item?.image || '',
    imageAlt: item?.imageAlt || item?.name || '',
    url: item?.url || buildStaticPostUrl(item),
    typeCode: item?.typeCode || '',
    typeName: item?.typeName || ''
  }
}

function normalizePopularModelPreview(item: any): any {
  return {
    id: item?.id || '',
    name: item?.name || '',
    introduction: item?.introduction || item?.description || '',
    picUrl: item?.picUrl || item?.image || '',
    url: item?.url || buildStaticProductUrl(item)
  }
}

async function buildProductCategoryPreviewScope(
  attrs: Record<string, string>,
  rawItems: any[],
  token: string
): Promise<PreviewScope> {
  const attrCategoryId = Number(attrs['data-category-id'] || attrs['data-wb-category-id'] || 0)
  const firstItemCategoryId = Number(
    rawItems?.[0]?.categoryId || rawItems?.[0]?.categoryIds?.[0] || 0
  )
  const categoryId = Number.isFinite(attrCategoryId) && attrCategoryId > 0
    ? attrCategoryId
    : firstItemCategoryId

  const templateFields = await fetchDatasheetFieldsForPreview(categoryId, token)
  const fallbackProducts = rawItems.map((item) => ({
    ...item,
    specifications: normalizePreviewSpecifications(item?.specifications)
  }))
  const datasheetFields = templateFields.length
    ? templateFields
    : deriveDatasheetFieldsFromProducts(fallbackProducts)
  const products = sortPreviewProductsByDatasheetField(
    rawItems.map((item) => normalizeProductListPreviewItem(item, datasheetFields)),
    datasheetFields,
    attrs
  )

  const [category, content] = await Promise.all([
    categoryId > 0
      ? fetchAdminData('/admin-api/product/category/get', { id: String(categoryId) }, token)
      : Promise.resolve(null),
    categoryId > 0
      ? fetchAdminData('/admin-api/content/product-category-content/get', { categoryId: String(categoryId) }, token)
      : Promise.resolve(null)
  ])
  const faqs = await fetchFaqItemsByCategoryId(content?.faqCategoryId, token)
  const productCategory = {
    id: category?.id || categoryId || '',
    parentId: category?.parentId || '',
    code: category?.code || '',
    name: category?.name || products?.[0]?.categoryName || 'Product Category',
    description: category?.description || '',
    features: category?.features || '',
    featuresHtml: String(category?.features || '').replace(/\r?\n/g, '<br/>'),
    image: category?.picUrl || '',
    picUrl: category?.picUrl || '',
    url: buildPreviewCategoryUrl(category || { id: categoryId }),
    productCount: products.length,
    datasheetFields,
    faqCategoryId: content?.faqCategoryId || '',
    faqs: faqs.map((faq) => ({
      ...faq,
      answerHtml: String(faq?.answerHtml || faq?.answer || '').replace(/\r?\n/g, '<br/>')
    })),
    popularModels: products.slice(0, 6).map(normalizePopularModelPreview),
    applicationPosts: (content?.applicationPosts || []).map(normalizeCategoryPostPreview),
    engineeringPosts: (content?.engineeringPosts || []).map(normalizeCategoryPostPreview),
    challengePosts: (content?.challengePosts || []).map(normalizeCategoryPostPreview)
  }

  return {
    productCategory,
    products,
    datasheetFields,
    breadcrumbs: [
      { label: 'Home', url: '/', position: 1, isCurrent: false, currentClass: '', ariaCurrent: '' },
      {
        label: 'Products',
        url: '/products/',
        position: 2,
        isCurrent: false,
        currentClass: '',
        ariaCurrent: ''
      },
      {
        label: productCategory.name,
        url: productCategory.url,
        position: 3,
        isCurrent: true,
        currentClass: 'is-current',
        ariaCurrent: 'page'
      }
    ]
  }
}

export async function injectProductDetailPreviewData(componentEl: HTMLElement,rawProduct: any,
  token: string): Promise<void> {
  cleanupProductDetailPreview(componentEl)

  const config = CMS_APIS['product-detail']
  if (!rawProduct) return

  const product = normalizeProductDetailPreviewData(rawProduct)
  product.relatedProducts = await loadProductDetailRelatedProducts(product, token)
  product.popularModels = Array.isArray(product.popularModels) && product.popularModels.length
    ? product.popularModels
    : product.relatedProducts
  product.faqs = await fetchFaqItemsByCategoryId(product?.faqCategoryId, token)

  const scope: PreviewScope = {
    product,
    breadcrumbs: buildProductBreadcrumbs(product),
  }
  Object.keys(product)
    .filter((key) => key.startsWith('productMediaCat_'))
    .forEach((key) => {
      scope[key] = product[key]
    })

  bindProductDetailStatics(componentEl, config.transformItem(product))
  renderDynamicRepeatPreviews(componentEl, scope)
  componentEl.dispatchEvent(new CustomEvent('wb:product-detail-v2:refresh'))

  componentEl.querySelectorAll('.pm-gallery-block').forEach((blockEl) => {
    const catId = (blockEl.getAttribute('data-media-category-id') || '').trim()
    if (!catId) return

    const galleries = product?.[`productMediaCat_${catId}`]
    if (!Array.isArray(galleries) || !galleries.length) return

    const repeatKey = `gallery@productMediaCat_${catId}`
    const repeatEl = blockEl.querySelector(`[data-cms-repeat="${repeatKey}"]`) as HTMLElement | null
    if (!repeatEl || repeatEl.hasAttribute('data-cms-hidden')) return

    repeatEl.style.display = 'none'
    repeatEl.setAttribute('data-cms-hidden', '')

    insertInlinePreviewNodes(repeatEl, galleries, (card, gallery) => {
      bindCard(card, {
        'gallery.title': gallery?.title || '',
        'gallery.description': gallery?.description || ''
      })

      const swiperEl = card.querySelector('.pm-gallery-block__carousel') as HTMLElement | null
      const slideRepeatEl = card.querySelector(
        '[data-cms-repeat="item@gallery.items"]'
      ) as HTMLElement | null
      const galleryItems = Array.isArray(gallery?.items) ? gallery.items : []

      if (!swiperEl || !slideRepeatEl) return
      if (!galleryItems.length) {
        swiperEl.style.display = 'none'
        return
      }

      const slideParent = slideRepeatEl.parentNode
      if (!slideParent) return

      let anchor: ChildNode = slideRepeatEl
      galleryItems.forEach((item) => {
        const slide = slideRepeatEl.cloneNode(true) as HTMLElement
        removeDynamicRenderCloneIds(slide)
        slide.removeAttribute('data-cms-repeat')
        slide.removeAttribute('data-cms-hidden')
        slide.style.removeProperty('display')
        bindCard(slide, { 'item.url': item?.url || '' })
        slideParent.insertBefore(slide, anchor.nextSibling)
        anchor = slide
      })
      slideRepeatEl.remove()
    })
  })

  componentEl.querySelectorAll('[data-wb-product-gallery="true"]').forEach((el) => {
    el.dispatchEvent(new CustomEvent('wb:product-gallery:refresh'))
  })
  componentEl.querySelectorAll('.pm-gallery-block').forEach((el) => {
    el.dispatchEvent(new CustomEvent('wb:pm-gallery:refresh'))
  })
}

export async function injectProductDetailPreview(
  componentEl: HTMLElement,
  token: string,
): Promise<void> {
  const config = CMS_APIS['product-detail']
  const attrs: Record<string, string> = {}
  Array.from(componentEl.attributes).forEach((attr) => {
    attrs[attr.name] = attr.value
  })

  const rawProduct = await fetchOne(config, attrs, token)
  await injectProductDetailPreviewData(componentEl, rawProduct, token)
}

async function injectProductFeaturedPreview(
  componentEl: HTMLElement,
  token: string
): Promise<void> {
  cleanupProductFeaturedPreview(componentEl)

  const config = CMS_APIS['product-featured']
  const attrs = readCmsDynamicAttrs(componentEl)

  const repeatEl = componentEl.querySelector('[data-cms-repeat="product"]') as HTMLElement | null
  const templateSlide = repeatEl?.firstElementChild
  if (!repeatEl || !templateSlide) return

  const rawItems = await fetchItems(config, attrs, token)
  if (!rawItems.length) return

  const doc = componentEl.ownerDocument
  const previewEl = doc.createElement('div')
  previewEl.setAttribute('data-cms-preview', '')
  previewEl.setAttribute('data-cms-preview-wrapper', '')
  previewEl.className = repeatEl.className

  const originalClassName = repeatEl.className
  const repeatTrackEl = repeatEl as HTMLElement & {
    __cmsPreviewOriginalClassName?: string
  }
  repeatTrackEl.__cmsPreviewOriginalClassName = originalClassName
  repeatEl.className = originalClassName
    .replace(/\bswiper-wrapper\b/g, ' ')
    .replace(/\bwb-cms-product-featured__track\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  repeatEl.style.display = 'none'
  repeatEl.setAttribute('data-cms-hidden', '')

  rawItems.forEach((item) => {
    const card = templateSlide.cloneNode(true) as Element
    removeDynamicRenderCloneIds(card)
    card.setAttribute('data-cms-preview', '')
    bindCard(card, transformCmsListPreviewItem('product-featured', config, item))
    previewEl.appendChild(card)
  })

  repeatEl.parentNode?.insertBefore(previewEl, repeatEl)
  componentEl.dispatchEvent(new CustomEvent('wb:featured-products:refresh'))
}

// ── 预览注入 ──────────────────────────────────────────────────────

/**
 * WYSIWYG 列表（文章 / 产品）的预览注入通用逻辑。
 *
 * 新模式：[data-cms-repeat] 直接在卡片自身上（卡片是 list 的直接子元素）。
 *   1. 找到 list 下所有 [data-cms-repeat="{repeatKey}"] 直接子元素（卡片）
 *   2. 克隆第一张卡片作为模板
 *   3. 隐藏所有卡片（style.display='none' + data-cms-hidden）
 *   4. 在 list 末尾追加 wrapper（display:contents），内含真实数据卡片
 *   5. wrapper 用 data-cms-preview-wrapper 标记，卡片用 data-cms-preview 标记
 */
async function injectPreviewForWysiwygList(
  componentEl: HTMLElement,
  token: string,
  cmsType: string,
  repeatKey: string
): Promise<void> {
  const config = CMS_APIS[cmsType]
  if (!config) return

  const attrs = readCmsDynamicAttrs(componentEl)

  const listEl =
    (componentEl.querySelector(
      '[data-wb-product-grid], [data-wb-post-grid], .wb-product-list__grid, .wb-post-list__grid, .wb-cases-list__grid'
    ) as HTMLElement | null) || componentEl

  // 找到所有列表容器内的直接子卡片（data-cms-repeat="{repeatKey}"）
  const cards = Array.from(listEl.children).filter(
    (el) => el.getAttribute('data-cms-repeat') === repeatKey
  ) as HTMLElement[]
  if (!cards.length) return

  // 克隆第一张卡片作为模板
  const template = cards[0].cloneNode(true) as Element

  // 获取真实数据
  const rawItems = await fetchItems(config, attrs, token)
  if (!rawItems.length) return

  const productCategoryScope =
    cmsType === 'product-list'
      ? await buildProductCategoryPreviewScope(attrs, rawItems, token)
      : null
  if (productCategoryScope) {
    const root = componentEl.ownerDocument?.body || componentEl
    cleanupDynamicRepeatPreviews(root)
    bindPreviewScopeData(root, productCategoryScope)
    const isDatasheetMode =
      attrs['data-list-mode'] === 'datasheet' ||
      attrs['data-wb-list-mode'] === 'datasheet' ||
      attrs['data-load-all'] === 'true' ||
      attrs['data-wb-load-all'] === 'true'
    if (isDatasheetMode) {
      renderDynamicRepeatPreviews(componentEl, productCategoryScope)
    }
    renderDynamicRepeatPreviews(root, productCategoryScope, {
      dynamicOnly: true,
      excludeWithin: componentEl
    })
    if (isDatasheetMode) return
  }

  const iframeDoc = componentEl.ownerDocument

  // 隐藏所有原始卡片
  cards.forEach((card) => {
    card.style.display = 'none'
    card.setAttribute('data-cms-hidden', '')
  })

  // 移除上一次的预览 wrapper
  const oldWrapper = listEl.querySelector('[data-cms-preview-wrapper]')
  if (oldWrapper) oldWrapper.remove()

  // 创建 wrapper（display:contents 让卡片直接参与 grid 布局）
  const wrapper = iframeDoc.createElement('div')
  wrapper.setAttribute('data-cms-preview-wrapper', '')
  wrapper.style.display = 'contents'

  rawItems.forEach((item) => {
    const card = template.cloneNode(true) as Element
    card.removeAttribute('data-cms-repeat')
    card.removeAttribute('data-cms-hidden')
    removeDynamicRenderCloneIds(card)
    ;(card as HTMLElement).style.removeProperty('display')
    card.setAttribute('data-cms-preview', '')
    bindCard(card, transformCmsListPreviewItem(cmsType, config, item))
    wrapper.appendChild(card)
  })

  const paginationEl = Array.from(componentEl.children).find((el) =>
    el.hasAttribute('data-cms-pagination')
  )

  if (listEl === componentEl && paginationEl) {
    componentEl.insertBefore(wrapper, paginationEl)
  } else {
    listEl.appendChild(wrapper)
  }
}

/**
 * 将真实数据渲染到编辑器画布中的 CMS 组件。
 *
 * **关键**：不直接修改 [data-cms-repeat] 容器的子节点（否则 GrapesJS
 * MutationObserver 会将变更同步回模型，导致模板被破坏、发布时丢失
 * data-cms-repeat / data-cms-bind-* 属性）。
 *
 * 做法：
 *   1. 从 [data-cms-repeat] 中克隆第一张卡片作为模板
 *   2. 隐藏 [data-cms-repeat]（添加 data-cms-hidden 标记 + display:none）
 *   3. 在旁边插入一个 [data-cms-preview] 容器，填入真实数据卡片
 *   4. 发布时 SSG 渲染器会：移除 [data-cms-preview]、恢复 [data-cms-repeat] 可见性
 */
async function injectPreview(componentEl: HTMLElement, token: string): Promise<void> {
  const cmsType = componentEl.getAttribute('data-cms-component')
  if (!cmsType) return

  if (cmsType === 'menu-tree') {
    await injectMenuTreePreview(componentEl, token)
    return
  }

  const config = CMS_APIS[cmsType]
  if (!config) return // media-list 等暂未实现，跳过

  if (cmsType === 'product-detail') {
    await injectProductDetailPreview(componentEl, token)
    return
  }

  if (cmsType === 'technical-support-detail') {
    await injectTechnicalSupportDetailPreview(componentEl, token)
    return
  }

  if (cmsType === 'product-featured') {
    await injectProductFeaturedPreview(componentEl, token)
    return
  }

  // 新版 WYSIWYG 列表（卡片直接作为 grid 子元素）走专用逻辑
  const wysiwygMap: Record<string, string> = {
    'post-list': 'post',
    'cases-list': 'post',
    'post-latest': 'post',
    'product-list': 'product',
    'product-latest': 'product',
    'technical-service-list': 'media',
    'technical-download-list': 'media'
  }
  if (wysiwygMap[cmsType]) {
    return injectPreviewForWysiwygList(componentEl, token, cmsType, wysiwygMap[cmsType])
  }

  // 读取组件配置属性
  const attrs = readCmsDynamicAttrs(componentEl)

  // 找到重复容器（模板网格）
  const repeatEl = componentEl.querySelector('[data-cms-repeat]') as HTMLElement | null
  if (!repeatEl) return

  // 获取第一个子卡片（含 data-cms-bind 绑定）作为模板
  const templateCard = repeatEl.firstElementChild
  if (!templateCard) return
  const template = templateCard.cloneNode(true) as Element

  // 获取真实数据
  const rawItems = await fetchItems(config, attrs, token)
  const filteredItems = normalizeCmsDynamicPage(cmsType, rawItems, attrs).items
  if (!filteredItems.length) return

  const iframeDoc = componentEl.ownerDocument

  // 隐藏原始模板网格（保留在 DOM/模型中供 SSG 使用）
  repeatEl.style.display = 'none'
  repeatEl.setAttribute('data-cms-hidden', '')

  // 移除上一次的预览容器（如属性变化后重新调度）
  const oldPreview = componentEl.querySelector('[data-cms-preview]')
  if (oldPreview) oldPreview.remove()

  // 创建预览容器（继承模板网格的 class 以复用样式）
  const previewEl = iframeDoc.createElement('div')
  previewEl.setAttribute('data-cms-preview', '')
  previewEl.className = repeatEl.className

  filteredItems.forEach((item, index) => {
    const card = template.cloneNode(true) as Element
    removeDynamicRenderCloneIds(card)
    bindCard(card, transformCmsListPreviewItem(cmsType, config, item))
    if (cmsType === 'faq-section') {
      card.setAttribute('data-open', index === 0 ? 'true' : 'false')
    }
    previewEl.appendChild(card)
  })

  // 插入到隐藏的模板网格后面
  repeatEl.parentNode?.insertBefore(previewEl, repeatEl.nextSibling)
}

export const __injectCmsLivePreviewForTest = injectPreview

// ── Composable ────────────────────────────────────────────────────

/**
 * 注册 CMS 动态组件的编辑器实时预览。
 * 在编辑器初始化后调用，自动监听 CMS 组件的添加和配置变化。
 */
export function useCmsLivePreview(grapes: any): void {
  grapes.onInit((editor: any) => {
    const token = getAccessToken() || ''
    if (!token) return
    const runtime = getEditorRuntime(editor)

    function bindComponentPreview(component: any): void {
      if ((component as any).__cmsPreviewBound) return
      ;(component as any).__cmsPreviewBound = true
      component.on('change:attributes', () => {
        if (runtime.isManualLoad) return
        schedule(component, 400)
      })
    }

    /**
     * 带防抖的预览调度：等待 view 渲染完成后再注入数据
     */
    function schedule(component: any, delay = 250): void {
      clearTimeout((component as any)._cmsPreviewTimer)
      ;(component as any)._cmsPreviewTimer = setTimeout(async () => {
        const el = component.getView?.()?.el as HTMLElement | undefined
        if (el) await injectPreview(el, token)
      }, delay)
    }

    function walkAndSchedule(component: any, delay = 250): void {
      if (!component) return

      const cmsType = component.getAttributes?.()?.['data-cms-component']
      if (cmsType && (CMS_APIS[cmsType] || cmsType === 'menu-tree')) {
        bindComponentPreview(component)
        schedule(component, delay)
      }

      const children = component.components?.()?.models ?? []
      children.forEach((child: any) => walkAndSchedule(child, delay))
    }

    runtime.onCmsPreviewRefresh((delay = 450) => {
      const pages = editor.Pages?.getAll?.() || []
      if (pages.length > 0) {
        pages.forEach((page: any) => {
          const main = page.getMainComponent?.()
          if (main) walkAndSchedule(main, delay)
        })
        return
      }

      const wrapper = editor.getWrapper?.()
      if (wrapper) walkAndSchedule(wrapper, delay)
    })

    // 监听组件添加（拖入或加载项目数据时）
    editor.on('component:add', (component: any) => {
      const cmsType = component.getAttributes?.()?.['data-cms-component']
      if (!cmsType || (!CMS_APIS[cmsType] && cmsType !== 'menu-tree')) return

      bindComponentPreview(component)

      // 导入/手动 loadProjectData 阶段不逐个组件预览，等整棵树恢复完成后统一刷新。
      if (runtime.isManualLoad) return

      schedule(component)
    })
  })
}
