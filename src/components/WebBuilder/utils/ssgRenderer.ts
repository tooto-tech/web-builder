/**
 * SSG 渲染器
 *
 * 发布时调用：扫描 HTML 中的 CMS 动态组件，调用 API 获取数据，
 * 将卡片模板重复渲染为真实内容后返回最终 HTML。
 *
 * 支持的组件类型（data-cms-component 值）：
 *   post-list / post-latest   → /admin-api/promotion/article/page
 *   product-list / product-latest → /admin-api/product/spu/page
 *
 * 同时向下兼容旧的 [data-wb-component="blog-list"] 格式。
 */

import { CASES_LIST_CSS } from '../components/registries/dynamic/cms/post/list'
import { POST_CARD_CSS } from '../components/registries/dynamic/cms/post/styles'
import { TECHNICAL_SUPPORT_DETAIL_STYLES } from '../components/registries/dynamic/cms/media/technicalSupportDetail'
import { PRODUCT_DETAIL_STYLES } from '../components/registries/dynamic/cms/product/detail.styles'
import { PRODUCT_DETAIL_V2_STYLES } from '../components/registries/dynamic/cms/product/detailV2.styles'
import {
  LOOP_GRID_NEXT_ICON,
  LOOP_GRID_PAGINATION_CSS,
  LOOP_GRID_PREV_ICON
} from '../components/registries/dynamic/loopGrid/paginationStyles'
import {
  composePlaceholderUrl,
  removeDynamicRenderCloneIds
} from './dynamicRenderPipeline'
import {
  CMS_DYNAMIC_RENDER_CONFIGS,
  bindCmsDynamicRenderData,
  buildCmsDynamicRequest,
  buildProductSpecValueMap,
  buildStaticPostUrl,
  buildStaticProductUrl,
  normalizeCmsDynamicPage,
  readCmsDynamicAttrs,
} from './cmsDynamicRender'

// ── 工具函数 ────────────────────────────────────────────────────

/** 按 "." 分隔的路径从对象中取值，支持 "data.list"、"records" 等 */
function getByPath(obj: any, path: string): any {
  if (!path) return obj
  return path.split('.').reduce((acc, key) => acc?.[key], obj)
}

/** 将 [field] 占位符替换为实际值 */
function applyLinkPattern(pattern: string, item: Record<string, any>): string {
  return pattern.replace(/\[([^\]]+)\]/g, (_, key) => {
    const val = getByPath(item, key)
    return val !== undefined && val !== null ? encodeURIComponent(String(val)) : ''
  })
}

/** 格式化日期值 */
function formatDate(value: any): string {
  if (!value) return ''
  try {
    return new Date(value).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch {
    return String(value)
  }
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function pickPostField(content: any, item: any, contentKey: string, itemKey: string): string {
  if (content && content[contentKey] != null) return String(content[contentKey])
  if (item && item[itemKey] != null) return String(item[itemKey])
  return ''
}

function transformPostLatestItem(item: any): Record<string, any> {
  const content = item?.contents?.[0] || null
  const title = pickPostField(content, item, 'name', 'name')

  return {
    'post.id': item?.id == null ? '' : String(item.id),
    'post.name': title,
    'post.slug': pickPostField(content, item, 'slug', 'slug'),
    'post.image': item?.image == null ? '' : String(item.image),
    'post.imageAlt': item?.imageAlt != null ? String(item.imageAlt) : title,
    'post.excerpt': pickPostField(content, item, 'excerpt', 'excerpt'),
    'post.content': content?.content || content?.contentHtml || '',
    'post.publishTime': formatDate(item?.publishTime || item?.createTime || content?.publishTime),
    'post.typeCode': item?.typeCode || '',
    'post.typeName': item?.typeName || '',
    'post.views': item?.views == null ? '' : String(item.views),
    'post.author': item?.author || item?.authorName || '',
    'post.metaKeywords': content?.metaKeywords || content?.keywords || '',
    'post.metaDescription': content?.metaDescription || content?.description || '',
    'post.url': buildStaticPostUrl(item),
    'post.categoryIds': item?.categoryIds || [],
    'post.categoryNames': item?.categoryNames || [],
    'post.tagIds': item?.tagIds || [],
    'post.tagNames': item?.tagNames || []
  }
}

// ── 旧版卡片渲染（blog-list 兼容）────────────────────────────────

/**
 * 将卡片模板 HTML 中的 [data-ssg-field] 元素替换为实际数据
 */
function renderCardTemplate(templateEl: Element, item: Record<string, any>): Element {
  const card = templateEl.cloneNode(true) as Element
  removeElementIds(card)

  const fields = card.querySelectorAll('[data-ssg-field]')
  fields.forEach((field) => {
    const fieldName = field.getAttribute('data-ssg-field') || ''
    const format = field.getAttribute('data-ssg-format') || 'text'
    const value = getByPath(item, fieldName)
    const strVal = value !== undefined && value !== null ? String(value) : ''

    // 清理编辑器专用属性和样式
    field.removeAttribute('data-wb-component')
    field.removeAttribute('data-ssg-field')
    field.removeAttribute('data-ssg-format')
    // 移除编辑器内的蓝色占位样式（保留用户自定义样式）
    const cls = field.getAttribute('class') || ''
    if (cls.trim() === '') field.removeAttribute('class')

    switch (format) {
      case 'text':
        field.textContent = strVal
        break

      case 'html':
        field.innerHTML = strVal
        break

      case 'image': {
        const img = field.ownerDocument.createElement('img')
        img.src = strVal
        img.alt = ''
        // 继承外层的 style / class
        const style = field.getAttribute('style')
        if (style) img.setAttribute('style', style)
        const imgCls = field.getAttribute('class')
        if (imgCls) img.setAttribute('class', imgCls)
        field.parentNode?.replaceChild(img, field)
        break
      }

      case 'date':
        field.textContent = formatDate(value)
        break

      case 'link': {
        // 将该元素自身替换为 <a href="...">（保留内部子节点）
        const a = field.ownerDocument.createElement('a')
        a.href = strVal
        a.innerHTML = field.innerHTML || strVal
        const style = field.getAttribute('style')
        if (style) a.setAttribute('style', style)
        field.parentNode?.replaceChild(a, field)
        break
      }
    }
  })

  return card
}

// ── API 请求 ────────────────────────────────────────────────────

interface FetchOptions {
  pageSize: number
  sortBy: string
  token: string
}

async function fetchListData(endpoint: string, opts: FetchOptions): Promise<any> {
  const url = new URL(endpoint, window.location.origin)
  url.searchParams.set('pageNo', '1')
  url.searchParams.set('pageSize', String(opts.pageSize))
  if (opts.sortBy && opts.sortBy !== 'default') {
    url.searchParams.set('sortBy', opts.sortBy)
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.token}`
    }
  })

  if (!res.ok) {
    throw new Error(`SSG API 请求失败: ${endpoint} → ${res.status} ${res.statusText}`)
  }

  const json = await res.json()
  // 兼容标准响应格式 { code, data } 或直接返回数据
  return json?.data !== undefined ? json.data : json
}

async function fetchAdminJson(
  endpoint: string,
  params: Record<string, string>,
  token: string
): Promise<any> {
  const url = new URL(endpoint, window.location.origin)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '') url.searchParams.set(key, value)
  })

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) {
    throw new Error(`${endpoint} → ${res.status} ${res.statusText}`)
  }

  const json = await res.json()
  return json?.data !== undefined ? json.data : json
}

async function fetchCmsDynamicPageForSsg(
  cmsType: string,
  el: Element,
  token: string,
  paramsOverride?: Record<string, string>
) {
  const attrs = readCmsDynamicAttrs(el)
  const request = buildCmsDynamicRequest(cmsType, attrs)
  const params = paramsOverride ?? request.params
  const rawData = await fetchAdminJson(request.endpoint, params, token)
  return normalizeCmsDynamicPage(cmsType, rawData, { ...attrs, ...params })
}

async function fetchPostTags(
  token: string,
  options: { categoryId?: string; typeId?: string } = {}
): Promise<Array<{ id: string; name: string }>> {
  const categoryId = String(options.categoryId || '').trim()
  const typeId = String(options.typeId || '').trim()
  const endpoints = categoryId
    ? [
        `/admin-api/content/post-tag/list?categoryId=${encodeURIComponent(categoryId)}`,
        '/admin-api/content/post-tag/list',
        '/admin-api/content/post-tag/list-all'
      ]
    : typeId
      ? [
          `/admin-api/content/post-tag/list?typeId=${encodeURIComponent(typeId)}`,
          '/admin-api/content/post-tag/list',
          '/admin-api/content/post-tag/list-all'
        ]
      : ['/admin-api/content/post-tag/list', '/admin-api/content/post-tag/list-all']

  for (const endpoint of endpoints) {
    try {
      const url = new URL(endpoint, window.location.origin)
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) continue

      const json = await res.json()
      const data = json?.data !== undefined ? json.data : json
      const rawList = Array.isArray(data) ? data : (data?.list ?? [])
      if (!Array.isArray(rawList)) continue

      if (rawList.length === 0) {
        if (categoryId) return []
        continue
      }

      return rawList
        .map((item) => ({
          id: String(item?.id ?? '').trim(),
          name: String(item?.name ?? item?.tagName ?? item?.title ?? '').trim()
        }))
        .filter((item) => item.id && item.name)
    } catch {
      // 尝试下一个兼容接口
    }
  }

  return []
}

function renderPostTagFilter(
  filterBar: Element,
  tags: Array<{ id: string; name: string }>,
  selectionMode: string
) {
  if (!tags.length) {
    return
  }

  const doc = filterBar.ownerDocument
  filterBar.innerHTML = ''
  filterBar.classList.add('is-active')

  if (selectionMode === 'multi-none') {
    tags.forEach((tag) => {
      const label = doc.createElement('label')
      label.setAttribute('class', 'wb-post-list-tag-check')
      label.setAttribute('data-tag-id', tag.id)

      const text = doc.createElement('span')
      text.setAttribute('class', 'wb-post-list-tag-text')
      text.textContent = tag.name

      const input = doc.createElement('input')
      input.setAttribute('type', 'checkbox')
      input.setAttribute('class', 'wb-post-list-tag-checkbox')
      input.setAttribute('data-tag-id', tag.id)

      label.appendChild(text)
      label.appendChild(input)
      filterBar.appendChild(label)
    })
    return
  }

  ;[{ id: '', name: 'ALL' }, ...tags].forEach((tag) => {
    const button = doc.createElement('button')
    button.setAttribute('type', 'button')
    button.setAttribute('class', `wb-post-list-tag-btn${tag.id ? '' : ' is-selected'}`)
    button.setAttribute('data-tag-id', tag.id)
    button.textContent = tag.name
    filterBar.appendChild(button)
  })
}

async function fetchPostCategoryFilterTree(
  token: string,
  options: { typeCode?: string; typeId?: string; showEmptyCategories?: string; language?: string } = {}
): Promise<any[]> {
  const params: Record<string, string> = {}
  const typeCode = String(options.typeCode || '').trim()
  const typeId = String(options.typeId || '').trim()
  const showEmptyCategories = String(options.showEmptyCategories || '').trim()
  const language = String(options.language || '').trim()
  if (typeCode) params.typeCode = typeCode
  if (typeId) params.typeId = typeId
  if (showEmptyCategories) params.showEmptyCategories = showEmptyCategories
  if (language) params.language = language
  const data = await fetchAdminJson('/admin-api/content/post-category/filter-tree', params, token)
  return Array.isArray(data) ? data : []
}

const POST_CATEGORY_OPTION_CLASS = 'wb-post-category-filter__option'

function stripByPrefix(value: unknown): string {
  return String(value || '')
    .trim()
    .replace(/^by\s+/i, '')
    .trim()
}

function resolveCurrentPostCategoryCode(): string {
  if (typeof window === 'undefined') return ''
  const match = window.location.pathname.match(/\/post-category\/([^/]+)(?:\/|$)/)
  return match ? decodeURIComponent(match[1] || '').trim() : ''
}

function resolveCurrentLanguageSegment(doc?: Document): string {
  const htmlLang = String(doc?.documentElement?.getAttribute('data-language') || doc?.documentElement?.lang || '').trim()
  if (htmlLang) return htmlLang
  if (typeof window === 'undefined') return 'en'
  const segment = String(window.location.pathname.split('/')[1] || '').trim()
  return /^[a-z]{2}(?:[-_][a-z]{2})?$/i.test(segment) ? segment : 'en'
}

function buildPostCategoryOptionClass(active: boolean): string {
  return active ? `${POST_CATEGORY_OPTION_CLASS} is-active` : POST_CATEGORY_OPTION_CLASS
}

function buildPostCategoryActiveClass(active: boolean): string {
  return active ? 'is-active' : ''
}

function resolvePostCategoryFilterAllCount(groups: any[]): string {
  const groupCounts = groups
    .map((group) => Number(group?.count))
    .filter((count) => Number.isFinite(count) && count > 0)
  if (groupCounts.length) return String(Math.max(...groupCounts))

  const firstChildren = Array.isArray(groups?.[0]?.children) ? groups[0].children : []
  const childTotal = firstChildren.reduce((sum: number, child: any) => {
    const count = Number(child?.count)
    return Number.isFinite(count) && count > 0 ? sum + count : sum
  }, 0)
  return String(childTotal)
}

function ensurePostCategoryGroupTitleMarkup(groupEl: HTMLElement, doc: Document) {
  if (groupEl.querySelector('[data-cms-bind="filterGroup.titlePrefix"]')) return
  const nameEl = groupEl.querySelector('[data-cms-bind="filterGroup.name"]') as HTMLElement | null
  if (!nameEl || !nameEl.parentNode) return

  nameEl.setAttribute('data-cms-bind', 'filterGroup.titleText')
  nameEl.classList.add('wb-post-category-filter__group-name')

  const prefixEl = doc.createElement('span')
  prefixEl.className = 'wb-post-category-filter__group-prefix'
  prefixEl.setAttribute('data-cms-bind', 'filterGroup.titlePrefix')
  prefixEl.textContent = 'By'
  nameEl.parentNode.insertBefore(prefixEl, nameEl)
  nameEl.parentNode.insertBefore(doc.createTextNode(' '), nameEl)
}

function ensurePostCategoryOptionMarkup(optionEl: HTMLElement, doc: Document) {
  optionEl.classList.add(POST_CATEGORY_OPTION_CLASS)
  if (!optionEl.hasAttribute('data-cms-bind-class')) {
    optionEl.setAttribute('data-cms-bind-classappend', 'filterOption.activeClassName')
  }
  if (!optionEl.querySelector('.wb-post-category-filter__option-check')) {
    const checkEl = doc.createElement('span')
    checkEl.className = 'wb-post-category-filter__option-check'
    checkEl.setAttribute('aria-hidden', 'true')
    optionEl.insertBefore(checkEl, optionEl.firstChild)
  }
}

async function renderPostCategoryFilterComponent(
  cmsEl: Element,
  token: string,
  errors: string[]
): Promise<void> {
  const groupTemplateEl = cmsEl.querySelector(
    '[data-cms-repeat^="filterGroup@"]'
  ) as HTMLElement | null
  if (!groupTemplateEl || !groupTemplateEl.parentElement) {
    errors.push('[post-category-filter] 未找到分类分组模板')
    return
  }

  const typeCode = String(cmsEl.getAttribute('data-type-code') || 'insights').trim()
  const language = resolveCurrentLanguageSegment(cmsEl.ownerDocument)
  const languagePrefix = `/${encodeURIComponent(language)}`
  const buildTypeArchiveUrl = () =>
    typeCode ? `${languagePrefix}/post/${encodeURIComponent(typeCode)}/index.html` : '#'
  const buildCategoryArchiveUrl = (code: unknown) => {
    const normalizedCode = String(code || '').trim()
    return normalizedCode
      ? `${languagePrefix}/post-category/${encodeURIComponent(normalizedCode)}/index.html`
      : '#'
  }
  const currentCategoryCode = resolveCurrentPostCategoryCode()

  let groups: any[] = []
  try {
    groups = await fetchPostCategoryFilterTree(token, {
      typeCode,
      typeId: cmsEl.getAttribute('data-type-id') || '',
      showEmptyCategories: cmsEl.getAttribute('data-show-empty-categories') || 'false',
      language
    })
  } catch (err: any) {
    errors.push(`[post-category-filter] 分类筛选数据获取失败: ${err?.message || err}`)
    return
  }

  const doc = cmsEl.ownerDocument
  const groupParent = groupTemplateEl.parentElement
  const groupTemplate = groupTemplateEl.cloneNode(true) as HTMLElement
  groupTemplateEl.remove()

  groups.forEach((group) => {
    const groupEl = groupTemplate.cloneNode(true) as HTMLElement
    ensurePostCategoryGroupTitleMarkup(groupEl, doc)
    const optionTemplateEl = groupEl.querySelector(
      '[data-cms-repeat^="filterOption@"]'
    ) as HTMLElement | null
    const optionParent = optionTemplateEl?.parentElement || null
    const optionTemplate = optionTemplateEl?.cloneNode(true) as HTMLElement | null
    optionTemplateEl?.remove()
    groupEl.removeAttribute('data-cms-repeat')

    bindCmsCard(
      groupEl,
      {
        'filterGroup.id': group?.id == null ? '' : String(group.id),
        'filterGroup.parentId': group?.parentId == null ? '' : String(group.parentId),
        'filterGroup.name': String(group?.name || ''),
        'filterGroup.titlePrefix': String(group?.titlePrefix || 'By'),
        'filterGroup.titleText': stripByPrefix(group?.titleText || group?.name),
        'filterGroup.code': String(group?.code || ''),
        'filterGroup.count': group?.count == null ? '0' : String(group.count)
      },
      doc
    )

    if (optionParent && optionTemplate) {
      const children = Array.isArray(group?.children) ? group.children : []
      children.forEach((option: any) => {
        const optionEl = optionTemplate.cloneNode(true) as HTMLElement
        const optionCode = String(option?.code || '').trim()
        const active =
          Boolean(option?.active) ||
          Boolean(currentCategoryCode && optionCode === currentCategoryCode)
        ensurePostCategoryOptionMarkup(optionEl, doc)
        optionEl.removeAttribute('data-cms-repeat')
        bindCmsCard(
          optionEl,
          {
            'filterOption.id': option?.id == null ? '' : String(option.id),
            'filterOption.parentId': option?.parentId == null ? '' : String(option.parentId),
            'filterOption.name': String(option?.name || ''),
            'filterOption.code': String(option?.code || ''),
            'filterOption.count': option?.count == null ? '0' : String(option.count),
            'filterOption.url': String(option?.url || buildCategoryArchiveUrl(option?.code)),
            'filterOption.className': String(
              option?.className || buildPostCategoryOptionClass(active)
            ),
            'filterOption.activeClassName': String(
              option?.activeClassName || buildPostCategoryActiveClass(active)
            )
          },
          doc
        )
        optionParent.appendChild(optionEl)
      })
    }

    groupParent.appendChild(groupEl)
  })

  cmsEl.querySelector('.wb-cms-editor-header')?.remove()
  bindCmsCard(
    cmsEl,
    {
      postCategoryFilterAllUrl: buildTypeArchiveUrl(),
      postCategoryFilterAllCount: resolvePostCategoryFilterAllCount(groups)
    },
    doc
  )
  ;[
    'data-cms-component',
    'data-wb-component',
    'data-wb-instance-id',
    'data-wb-post-category-filter',
    'data-type-code',
    'data-type-id',
    'data-show-empty-categories'
  ].forEach((attr) => cmsEl.removeAttribute(attr))
}

function renderStaticPagination(
  navEl: Element,
  options: {
    pageNo: number
    totalPages: number
    maxPages: number
    defaultClassName?: string
  }
) {
  const { pageNo, totalPages, maxPages, defaultClassName = '' } = options
  const boundedTotalPages = Math.max(1, Math.min(totalPages, maxPages))
  const classSource =
    Array.from(navEl.children)
      .find((child) => child.getAttribute('class')?.trim())
      ?.getAttribute('class') || defaultClassName
  const baseClasses = classSource
    .split(/\s+/)
    .filter(Boolean)
    .filter((cls) => cls !== 'active')
    .join(' ')
  const buildHref = (page: number) => (page > 1 ? `?page=${page}` : '?page=1')
  const useLoopGridIcons = navEl.classList.contains('wb-loop-grid-pagination')

  navEl.innerHTML = ''

  if (useLoopGridIcons && pageNo > 1) {
    const prev = navEl.ownerDocument.createElement('a')
    prev.innerHTML = LOOP_GRID_PREV_ICON
    prev.setAttribute('href', buildHref(pageNo - 1))
    if (baseClasses) prev.setAttribute('class', baseClasses)
    prev.setAttribute('aria-label', '上一页')
    navEl.appendChild(prev)
  }

  for (let page = 1; page <= boundedTotalPages; page += 1) {
    const link = navEl.ownerDocument.createElement('a')
    link.textContent = String(page)
    link.setAttribute('href', buildHref(page))
    const className = [baseClasses, page === pageNo ? 'active' : ''].filter(Boolean).join(' ')
    if (className) link.setAttribute('class', className)
    if (page === pageNo) link.setAttribute('aria-current', 'page')
    navEl.appendChild(link)
  }

  if (boundedTotalPages < totalPages) {
    const ellipsis = navEl.ownerDocument.createElement('span')
    ellipsis.textContent = '...'
    if (baseClasses) ellipsis.setAttribute('class', baseClasses)
    navEl.appendChild(ellipsis)
  }

  if (pageNo < totalPages) {
    const next = navEl.ownerDocument.createElement('a')
    if (useLoopGridIcons) {
      next.innerHTML = LOOP_GRID_NEXT_ICON
      next.setAttribute('aria-label', '下一页')
    } else {
      next.textContent = '下一页 »'
    }
    next.setAttribute('href', buildHref(pageNo + 1))
    if (baseClasses) next.setAttribute('class', baseClasses)
    navEl.appendChild(next)
  }
}

function ensureStaticPaginationNav(cmsEl: Element, cmsType: string, doc: Document): Element | null {
  let navEl = cmsEl.querySelector('[data-cms-pagination]')
  if (navEl) return navEl

  if (!['post-list', 'cases-list', 'product-list'].includes(cmsType)) return null

  navEl = doc.createElement('nav')
  navEl.setAttribute('data-cms-pagination', '')
  navEl.setAttribute(
    'class',
    cmsType === 'product-list' ? 'wb-product-list-pagination' : 'wb-post-list-pagination'
  )
  cmsEl.appendChild(navEl)
  return navEl
}

// ── CMS 组件配置 ──────────────────────────────────────────────────

interface CmsSsgConfig {
  cmsType: string
  endpoint: string
  buildParams: (el: Element) => Record<string, string>
  transformItem: (item: any) => Record<string, string>
}

const createCmsSsgConfig = (cmsType: string): CmsSsgConfig => {
  const config = CMS_DYNAMIC_RENDER_CONFIGS[cmsType]
  if (!config) throw new Error(`Missing CMS dynamic render config for "${cmsType}"`)
  return {
    cmsType,
    endpoint: config.endpoint,
    buildParams: (el) => config.buildParams(readCmsDynamicAttrs(el)),
    transformItem: config.transformItem,
  }
}

const CMS_SSG_APIS: Record<string, CmsSsgConfig> = {
  'post-list': createCmsSsgConfig('post-list'),
  'cases-list': createCmsSsgConfig('cases-list'),
  'post-latest': createCmsSsgConfig('post-latest'),
  'product-list': createCmsSsgConfig('product-list'),
  'product-latest': createCmsSsgConfig('product-latest'),
  'faq-section': createCmsSsgConfig('faq-section'),
  'product-featured': createCmsSsgConfig('product-featured'),
  'media-list': createCmsSsgConfig('media-list'),
  'technical-service-list': createCmsSsgConfig('technical-service-list'),
  'technical-download-list': createCmsSsgConfig('technical-download-list'),
}

// ── CMS 数据绑定（SSG 版，生成静态 HTML）─────────────────────────

/**
 * 当 data-cms-repeat 被编辑器实时预览破坏后的 fallback 卡片模板。
 * 结构与当前 CMS registry 中的预览卡片一致。
 */
const FALLBACK_CARD_TEMPLATES: Record<string, string> = {
  'post-list': `<div class="wb-cms-preview-card">
    <img data-cms-bind-src="post.image" src="" alt="" class="wb-cms-preview-card-img" style="width:100%;object-fit:cover;">
    <div class="wb-cms-preview-card-body">
      <div class="wb-cms-preview-card-title" data-cms-bind="post.name"></div>
      <div class="wb-cms-preview-card-excerpt" data-cms-bind="post.excerpt"></div>
      <a class="wb-cms-preview-card-link" data-cms-bind-href="post.url" href="#">阅读更多 →</a>
    </div>
  </div>`,

  'cases-list': `<div class="wb-post-card wb-cases-card">
    <div class="wb-post-card-img-wrap">
      <img class="wb-post-card-img" data-cms-bind-src="post.image" data-cms-bind-alt="post.name" src="" alt="">
    </div>
    <div class="wb-post-card-body">
      <h4 class="wb-post-card-title" data-cms-bind="post.name"></h4>
      <a class="wb-post-card-link" data-cms-bind-href="post.url" href="#">View More</a>
    </div>
  </div>`,

  'post-latest': `<div class="wb-cms-preview-card">
    <img data-cms-bind-src="post.image" src="" alt="" class="wb-cms-preview-card-img" style="width:100%;object-fit:cover;">
    <div class="wb-cms-preview-card-body">
      <div class="wb-cms-preview-card-title" data-cms-bind="post.name"></div>
      <div class="wb-cms-preview-card-excerpt" data-cms-bind="post.excerpt"></div>
      <a class="wb-cms-preview-card-link" data-cms-bind-href="post.url" href="#">阅读更多 →</a>
    </div>
  </div>`,

  'product-list': `<div class="wb-cms-preview-card">
    <img data-cms-bind-src="product.picUrl" src="" alt="" class="wb-cms-preview-card-img" style="width:100%;object-fit:cover;">
    <div class="wb-cms-preview-card-body">
      <div class="wb-cms-preview-card-title" data-cms-bind="product.name"></div>
      <a class="wb-cms-preview-card-link" data-cms-bind-href="product.url" href="#">Details \u00A0\u2192</a>
    </div>
  </div>`,

  'product-latest': `<div class="wb-cms-preview-card">
    <img data-cms-bind-src="product.picUrl" src="" alt="" class="wb-cms-preview-card-img" style="width:100%;object-fit:cover;">
    <div class="wb-cms-preview-card-body">
      <div class="wb-cms-preview-card-title" data-cms-bind="product.name"></div>
      <a class="wb-cms-preview-card-link" data-cms-bind-href="product.url" href="#">Details \u00A0\u2192</a>
    </div>
  </div>`,

  'product-featured': `<div class="swiper-slide wb-cms-product-featured__slide">
    <a class="wb-cms-product-featured__card" data-cms-bind-href="product.url" href="#">
      <div class="wb-cms-product-featured__media">
        <img class="wb-cms-product-featured__image" data-cms-bind-src="product.picUrl" data-cms-bind-alt="product.name" src="" alt="">
      </div>
      <div class="wb-cms-product-featured__body">
        <h3 class="wb-cms-product-featured__name" data-cms-bind="product.name"></h3>
      </div>
    </a>
  </div>`
}

/**
 * 将数据绑定到卡片 DOM，并将 data-cms-bind-src 的 <div> 替换为 <img>（更利于 SEO）
 */
function normalizeDynamicLinkElement(el: Element, doc: Document): Element {
  if (el.tagName === 'A') return el
  const link = doc.createElement('a')
  Array.from(el.attributes).forEach((attr) => link.setAttribute(attr.name, attr.value))
  link.setAttribute('href', el.getAttribute('href') || '#')
  while (el.firstChild) link.appendChild(el.firstChild)
  el.parentNode?.replaceChild(link, el)
  return link
}

function normalizeDynamicLinks(root: Element, doc: Document): Element {
  let nextRoot = root
  const matches = [
    ...(root.matches('[data-wb-dynamic="link"], [data-cms-bind-href]') ? [root] : []),
    ...Array.from(root.querySelectorAll('[data-wb-dynamic="link"], [data-cms-bind-href]'))
  ]
  matches.forEach((el) => {
    const normalized = normalizeDynamicLinkElement(el, doc)
    if (el === nextRoot) nextRoot = normalized
  })
  return nextRoot
}

function bindCmsCard(card: Element, data: Record<string, string>, doc: Document): Element {
  return bindCmsDynamicRenderData(card, data, {
    doc,
    removeBindingAttrs: true,
    normalizeDynamicElements: true,
    imageStrategy: 'seo-img'
  })
}

function findPostLatestCards(cmsEl: Element): HTMLElement[] {
  return Array.from(cmsEl.children).filter((child): child is HTMLElement => {
    const el = child as HTMLElement
    return (
      el.getAttribute('data-wb-component') === 'cms-post-latest-card' ||
      el.classList.contains('wb-post-latest__item')
    )
  })
}

function cleanupPostLatestAttrs(cmsEl: Element, cards: HTMLElement[]): void {
  cmsEl.querySelector('.wb-cms-editor-header')?.remove()

  Array.from(cmsEl.attributes).forEach((attr) => {
    const name = attr.name
    if (name === 'data-cms-component') return
    if (
      name.startsWith('data-wb-') ||
      name.startsWith('data-ssg-') ||
      name.startsWith('data-cms-') ||
      ['data-limit', 'data-type', 'data-resource-type'].includes(name)
    ) {
      cmsEl.removeAttribute(name)
    }
  })

  cards.forEach((card) => {
    ;[
      'data-wb-component',
      'data-post-id',
      'data-show-date',
      'data-show-title',
      'data-show-excerpt',
      'data-link-text'
    ].forEach((attr) => card.removeAttribute(attr))
  })
}

function setPostLatestText(card: Element, selector: string, value: unknown): void {
  const el = card.querySelector(selector)
  if (el) el.textContent = String(value ?? '')
}

function applyPostLatestCardData(card: Element, data: Record<string, any>): void {
  const image = card.querySelector('.wb-post-latest__image') as HTMLImageElement | null
  if (image) {
    image.setAttribute('src', String(data['post.image'] ?? ''))
    image.setAttribute('alt', String(data['post.imageAlt'] ?? ''))
  }

  const titleLink = card.querySelector('.wb-post-latest__title-link') as HTMLAnchorElement | null
  if (titleLink) {
    titleLink.textContent = String(data['post.name'] ?? '')
    titleLink.setAttribute('href', String(data['post.url'] || '#'))
  } else {
    setPostLatestText(card, '.wb-post-latest__title', data['post.name'])
  }

  setPostLatestText(card, '.wb-post-latest__date', data['post.publishTime'])
  setPostLatestText(card, '.wb-post-latest__desc', data['post.excerpt'])
}

async function renderSelectedPostLatestCards(
  cmsEl: Element,
  token: string,
  errors: string[]
): Promise<boolean> {
  const cards = findPostLatestCards(cmsEl)
  const selectedCards = cards
    .map((card) => ({ card, postId: String(card.getAttribute('data-post-id') || '').trim() }))
    .filter((item) => item.postId)

  if (selectedCards.length === 0) return false

  for (const { card, postId } of selectedCards) {
    try {
      const response = await fetchAdminJson('/admin-api/content/post/get', { id: postId }, token)
      const post = response?.post || response
      if (post) {
        applyPostLatestCardData(card, transformPostLatestItem(post))
      }
    } catch (err: any) {
      errors.push(`[post-latest] 文章 ${postId} 数据获取失败: ${err?.message || err}`)
    }
  }

  cleanupPostLatestAttrs(cmsEl, cards)
  return true
}

function escapeFaqHtml(text: string): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildFaqSectionItemsHtml(items: any[], classPrefix = 'wb-cms-faq-section'): string {
  return items
    .map((item, index) => {
      const question = escapeFaqHtml(String(item?.question || ''))
      const answerHtml = String(item?.answer || '').replace(/\r?\n/g, '<br/>')
      const openValue = index === 0 ? 'true' : 'false'

      return `
        <div class="${classPrefix}__item" data-open="${openValue}">
          <button class="${classPrefix}__summary" type="button">
            <span class="${classPrefix}__question">${question}</span>
            <span class="${classPrefix}__icon" aria-hidden="true"></span>
          </button>
          <div class="${classPrefix}__answer">${answerHtml}</div>
        </div>
      `.trim()
    })
    .join('')
}

function buildRuntimeCardTemplate(card: Element): string {
  const clone = normalizeDynamicLinks(card.cloneNode(true) as HTMLElement, card.ownerDocument)

  clone.removeAttribute('data-cms-repeat')
  clone.removeAttribute('id')
  clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'))

  clone.querySelectorAll('[data-cms-bind]').forEach((bindEl) => {
    const field = bindEl.getAttribute('data-cms-bind') || ''
    bindEl.textContent = field ? `{{${field}}}` : ''
    bindEl.removeAttribute('data-cms-bind')
  })

  clone.querySelectorAll('[data-cms-bind-src]').forEach((bindEl) => {
    const field = bindEl.getAttribute('data-cms-bind-src') || ''
    bindEl.setAttribute('src', field ? `{{${field}}}` : '')
    bindEl.removeAttribute('data-cms-bind-src')
  })

  clone.querySelectorAll('[data-cms-bind-alt]').forEach((bindEl) => {
    const field = bindEl.getAttribute('data-cms-bind-alt') || ''
    bindEl.setAttribute('alt', field ? `{{${field}}}` : '')
    bindEl.removeAttribute('data-cms-bind-alt')
  })

  clone.querySelectorAll('[data-cms-bind-href]').forEach((bindEl) => {
    const field = bindEl.getAttribute('data-cms-bind-href') || ''
    const template = bindEl.getAttribute('data-cms-bind-href-template') || ''
    bindEl.setAttribute('href', field ? composePlaceholderUrl(field, template) : '#')
    bindEl.removeAttribute('data-cms-bind-href')
    bindEl.removeAttribute('data-cms-bind-href-template')
  })

  clone.querySelectorAll('[data-cms-bind-target]').forEach((bindEl) => {
    const field = bindEl.getAttribute('data-cms-bind-target') || ''
    if (field) bindEl.setAttribute('target', `{{${field}}}`)
    else bindEl.removeAttribute('target')
    bindEl.removeAttribute('data-cms-bind-target')
  })

  clone.querySelectorAll('[data-cms-bind-style]').forEach((bindEl) => {
    const field = bindEl.getAttribute('data-cms-bind-style') || ''
    if (field) bindEl.setAttribute('style', `{{${field}}}`)
    else bindEl.removeAttribute('style')
    bindEl.removeAttribute('data-cms-bind-style')
  })

  clone.querySelectorAll('[data-cms-bind-data-product-spec-values]').forEach((bindEl) => {
    const field = bindEl.getAttribute('data-cms-bind-data-product-spec-values') || ''
    if (field) bindEl.setAttribute('data-product-spec-values', `{{${field}}}`)
    else bindEl.removeAttribute('data-product-spec-values')
    bindEl.removeAttribute('data-cms-bind-data-product-spec-values')
  })

  clone.querySelectorAll('[data-cms-html]').forEach((bindEl) => {
    const field = bindEl.getAttribute('data-cms-html') || ''
    ;(bindEl as HTMLElement).innerHTML = field ? `{{${field}}}` : ''
    bindEl.removeAttribute('data-cms-html')
  })

  return clone.outerHTML
}

function decorateProductCard(card: Element, item: any): void {
  const categoryIds = Array.isArray(item?.categoryIds)
    ? item.categoryIds
    : item?.categoryId != null
      ? [item.categoryId]
      : []

  if (categoryIds.length > 0) {
    card.setAttribute(
      'data-product-category-ids',
      categoryIds
        .map((id: any) => String(id ?? '').trim())
        .filter(Boolean)
        .join(',')
    )
  }

  if (item?.id != null) {
    card.setAttribute('data-product-id', String(item.id))
  }

  const specValueMap = buildProductSpecValueMap(item)
  if (Object.keys(specValueMap).length > 0) {
    card.setAttribute('data-product-spec-values', JSON.stringify(specValueMap))
  }
}

function syncProductListToolbar(cmsEl: Element, total: number): void {
  const countEls = cmsEl.querySelectorAll('[data-wb-product-filter-count]')
  countEls.forEach((countEl) => {
    countEl.textContent = `All products (${Math.max(0, total || 0)})`
  })
}

function toFiniteNumber(value: any): number | undefined {
  if (value == null || value === '') return undefined
  const numeric = Number(String(value).replace(/[^\d.+-]/g, ''))
  return Number.isFinite(numeric) ? numeric : undefined
}

function getSpecDisplayValue(spec: any): string {
  return String(spec?.value ?? spec?.rawValue ?? spec?.textValue ?? '').trim()
}

function isSpecNumeric(spec: any): boolean {
  const type = String(spec?.valueType || '').toUpperCase()
  return (
    type === 'NUMBER' ||
    type === 'RANGE' ||
    toFiniteNumber(spec?.numericValue) != null ||
    toFiniteNumber(spec?.minValue) != null ||
    toFiniteNumber(spec?.maxValue) != null
  )
}

function renderProductSpecFilters(cmsEl: Element, items: any[]): void {
  const groupsEl = cmsEl.querySelector('[data-wb-product-filter-groups]')
  if (!groupsEl) return

  const groups = new Map<
    string,
    {
      code: string
      name: string
      sort: number
      fields: Map<
        string,
        {
          code: string
          label: string
          unit: string
          valueType: string
          sort: number
          numeric: boolean
          min?: number
          max?: number
          options: Map<string, number>
        }
      >
    }
  >()

  items.forEach((item) => {
    const specs = Array.isArray(item?.specifications) ? item.specifications : []
    specs.forEach((spec: any) => {
      if (!spec?.filterable) return
      const code = String(spec?.code || spec?.name || '').trim()
      if (!code) return
      const value = getSpecDisplayValue(spec)
      if (!value && !Array.isArray(spec?.optionValues)) return

      const groupCode = String(spec?.groupCode || 'general').trim() || 'general'
      const group = groups.get(groupCode) || {
        code: groupCode,
        name: spec?.groupName || groupCode,
        sort: Number(spec?.groupSort ?? 0) || 0,
        fields: new Map()
      }
      const field = group.fields.get(code) || {
        code,
        label: spec?.label || spec?.name || code,
        unit: spec?.unit || '',
        valueType: spec?.valueType || 'TEXT',
        sort: Number(spec?.sort ?? 0) || 0,
        numeric: isSpecNumeric(spec),
        options: new Map<string, number>()
      }

      if (field.numeric) {
        const min =
          toFiniteNumber(spec?.minValue) ??
          toFiniteNumber(spec?.numericValue) ??
          toFiniteNumber(value)
        const max = toFiniteNumber(spec?.maxValue) ?? toFiniteNumber(spec?.numericValue) ?? min
        if (min != null) field.min = field.min == null ? min : Math.min(field.min, min)
        if (max != null) field.max = field.max == null ? max : Math.max(field.max, max)
      } else {
        const optionValues = Array.isArray(spec?.optionValues)
          ? spec.optionValues
          : value
              .split(/[,;|/]+/)
              .map((part: string) => part.trim())
              .filter(Boolean)
        optionValues.forEach((option: any) => {
          const key = String(option || '').trim()
          if (!key) return
          field.options.set(key, (field.options.get(key) || 0) + 1)
        })
      }

      group.fields.set(code, field)
      groups.set(groupCode, group)
    })
  })

  const orderedGroups = Array.from(groups.values())
    .map((group) => ({
      ...group,
      fields: Array.from(group.fields.values()).sort(
        (a, b) => a.sort - b.sort || a.label.localeCompare(b.label)
      )
    }))
    .filter((group) => group.fields.length > 0)
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name))

  if (!orderedGroups.length) {
    groupsEl.innerHTML = '<p class="wb-product-filter__empty">No filter options available.</p>'
    return
  }

  groupsEl.innerHTML = orderedGroups
    .map((group) => {
      const fieldsHtml = group.fields
        .map((field) => {
          if (field.numeric) {
            const suffix = field.unit ? ` (${escapeHtml(field.unit)})` : ''
            return `
              <div class="wb-product-filter__range" data-spec-filter-control="${escapeHtml(field.code)}">
                <span class="wb-product-filter__range-title">${escapeHtml(field.label)}${suffix}</span>
                <div class="wb-product-filter__range-fields">
                  <input type="number" inputmode="decimal" data-spec-filter-code="${escapeHtml(field.code)}" data-spec-filter-bound="min" placeholder="${field.min == null ? 'Min' : escapeHtml(field.min)}" />
                  <span>–</span>
                  <input type="number" inputmode="decimal" data-spec-filter-code="${escapeHtml(field.code)}" data-spec-filter-bound="max" placeholder="${field.max == null ? 'Max' : escapeHtml(field.max)}" />
                </div>
              </div>
            `
          }

          const options = Array.from(field.options.entries())
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .slice(0, 24)
          if (!options.length) return ''
          return `
            <div class="wb-product-filter__spec-options" data-spec-filter-control="${escapeHtml(field.code)}">
              <div class="wb-product-filter__range-title">${escapeHtml(field.label)}</div>
              ${options
                .map(
                  ([option, count]) => `
                    <label class="wb-product-filter__option">
                      <input type="checkbox" data-spec-filter-code="${escapeHtml(field.code)}" data-spec-filter-value="${escapeHtml(option)}" />
                      <span>${escapeHtml(option)} (${count})</span>
                    </label>
                  `
                )
                .join('')}
            </div>
          `
        })
        .join('')

      return `
        <section class="wb-product-filter__group" data-spec-filter-group="${escapeHtml(group.code)}">
          <button type="button" class="wb-product-filter__group-header">
            <span class="wb-product-filter__group-title">${escapeHtml(group.name)}</span>
            <span class="wb-product-filter__group-toggle">−</span>
          </button>
          <div class="wb-product-filter__group-options">${fieldsHtml}</div>
        </section>
      `
    })
    .join('')
}

function collectDatasheetFields(items: any[]): Array<{
  code: string
  label: string
  unit: string
  valueType: string
  sort: number
}> {
  const fieldMap = new Map<
    string,
    { code: string; label: string; unit: string; valueType: string; sort: number }
  >()
  items.forEach((item) => {
    const specs = Array.isArray(item?.specifications) ? item.specifications : []
    specs.forEach((spec: any) => {
      const code = String(spec?.code || spec?.name || '').trim()
      if (!code || code.toLowerCase() === 'designation' || !spec?.showInList) return
      if (fieldMap.has(code)) return
      fieldMap.set(code, {
        code,
        label: spec?.label || spec?.name || code,
        unit: spec?.unit || '',
        valueType: spec?.valueType || 'TEXT',
        sort: Number(spec?.sort ?? 0) || 0
      })
    })
  })
  return Array.from(fieldMap.values()).sort(
    (a, b) => a.sort - b.sort || a.label.localeCompare(b.label)
  )
}

function buildSpecMap(item: any): Map<string, any> {
  const specs = Array.isArray(item?.specifications) ? item.specifications : []
  const map = new Map<string, any>()
  specs.forEach((spec: any) => {
    const code = String(spec?.code || spec?.name || '').trim()
    if (code) map.set(code, spec)
  })
  return map
}

function getDatasheetDesignation(item: any, specMap: Map<string, any>): string {
  const designation = specMap.get('designation')
  return String(
    designation?.value ||
      designation?.rawValue ||
      designation?.textValue ||
      item?.name ||
      item?.id ||
      ''
  ).trim()
}

type DatasheetSsgSortKey =
  | { type: 'designation' }
  | { type: 'field'; code: string }

function resolveDatasheetSsgSortKeys(
  cmsEl: Element,
  fields: Array<{ code: string }>
): DatasheetSsgSortKey[] {
  const sortField = String(
    cmsEl.getAttribute('data-sort-field') || cmsEl.getAttribute('data-wb-sort-field') || ''
  ).trim()
  const listMode = String(cmsEl.getAttribute('data-list-mode') || '').trim()
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
      ...fields
        .map((field) => String(field?.code || '').trim())
        .filter(Boolean)
        .slice(0, 2)
        .map((code) => ({ type: 'field' as const, code }))
    ]
  }
  return [{ type: 'field', code: requestedCode }]
}

function readDatasheetSsgSortText(spec: any): string {
  return String(spec?.value || spec?.rawValue || spec?.textValue || '').trim()
}

function isDatasheetSsgSortEmpty(value: string): boolean {
  return !value || value === '-' || value === '—'
}

function parseDatasheetSsgSortNumber(spec: any): number | null {
  const candidates = [spec?.numericValue, spec?.minValue, spec?.maxValue, spec?.value, spec?.rawValue]
  for (const candidate of candidates) {
    const match = String(candidate ?? '')
      .trim()
      .replace(/,/g, '')
      .match(/-?\d+(?:\.\d+)?/)
    if (!match) continue
    const value = Number(match[0])
    if (Number.isFinite(value)) return value
  }
  return null
}

function sortDatasheetSsgItems(
  cmsEl: Element,
  items: any[],
  fields: Array<{ code: string }>
): any[] {
  const sortKeys = resolveDatasheetSsgSortKeys(cmsEl, fields)
  if (!sortKeys.length) return items
  const asc = String(cmsEl.getAttribute('data-sort-asc') || 'true') !== 'false'
  return [...items]
    .map((item, index) => {
      const specMap = buildSpecMap(item)
      return {
        item,
        index,
        sortValues: sortKeys.map((sortKey) => {
          const spec = sortKey.type === 'field' ? specMap.get(sortKey.code) : null
          return {
            text:
              sortKey.type === 'designation'
                ? getDatasheetDesignation(item, specMap)
                : readDatasheetSsgSortText(spec),
            number: sortKey.type === 'field' ? parseDatasheetSsgSortNumber(spec) : null
          }
        })
      }
    })
    .sort((left, right) => {
      for (let index = 0; index < sortKeys.length; index += 1) {
        const leftValue = left.sortValues[index]
        const rightValue = right.sortValues[index]
        const leftText = String(leftValue?.text || '').trim()
        const rightText = String(rightValue?.text || '').trim()
        const leftEmpty = isDatasheetSsgSortEmpty(leftText)
        const rightEmpty = isDatasheetSsgSortEmpty(rightText)
        if (leftEmpty && rightEmpty) continue
        if (leftEmpty) return 1
        if (rightEmpty) return -1

        let result = 0
        if (leftValue?.number != null && rightValue?.number != null) {
          result = leftValue.number - rightValue.number
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
    .map((entry) => entry.item)
}

function renderProductDatasheetTable(cmsEl: Element, items: any[]): void {
  const datasheetEl = cmsEl.querySelector('[data-wb-product-datasheet]') as HTMLElement | null
  const headerEl = cmsEl.querySelector('.wb-product-datasheet__header')
  const bodyEl = cmsEl.querySelector('.wb-product-datasheet__body')
  if (!datasheetEl || !headerEl || !bodyEl) return

  const fields = collectDatasheetFields(items)
  const sortedItems = sortDatasheetSsgItems(cmsEl, items, fields)
  datasheetEl.style.setProperty('--wb-datasheet-field-count', String(Math.max(fields.length, 1)))
  headerEl.innerHTML = `
    <label class="wb-product-datasheet__cell wb-product-datasheet__checkbox" data-wb-product-datasheet-header-cell>
      <input type="checkbox" data-wb-product-datasheet-select-all />
    </label>
    <div class="wb-product-datasheet__cell" data-wb-product-datasheet-header-cell>Designation</div>
    ${fields
      .map(
        (field) =>
          `<div class="wb-product-datasheet__cell" data-wb-product-datasheet-header-cell>${escapeHtml(field.label)}</div>`
      )
      .join('')}
  `
  bodyEl.innerHTML = sortedItems
    .map((item) => {
      const specMap = buildSpecMap(item)
      const designation = getDatasheetDesignation(item, specMap)
      const url = buildStaticProductUrl(item)
      const specJson = escapeHtml(JSON.stringify(buildProductSpecValueMap(item)))
      const cells = fields
        .map((field) => {
          const spec = specMap.get(field.code)
          const rawValue = getSpecDisplayValue(spec) || ''
          const value = rawValue || '—'
          const unit = field.unit || ''
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
          const displayText = displayUnit ? `${displayValue} ${displayUnit}` : displayValue
          return `<div class="wb-product-datasheet__cell" data-wb-product-datasheet-cell>${escapeHtml(displayText)}</div>`
        })
        .join('')
      return `
        <div class="wb-product-datasheet__row" data-wb-product-datasheet-row data-product-spec-values="${specJson}">
          <label class="wb-product-datasheet__cell wb-product-datasheet__checkbox" data-wb-product-datasheet-cell>
            <input type="checkbox" value="${escapeHtml(item?.id ?? '')}" data-wb-product-datasheet-select-row />
          </label>
          <div class="wb-product-datasheet__cell" data-wb-product-datasheet-cell>
            <a class="wb-product-datasheet__designation-link" href="${escapeHtml(url)}">${escapeHtml(designation)}</a>
          </div>
          ${cells}
        </div>
      `
    })
    .join('')
}

type LoopGridSourceType = 'posts' | 'products' | 'media'

interface LoopGridSchema {
  gridId?: string
  loopItemType?: string
  loopItemTemplateResourceId?: string
  itemTemplateId?: string
  emptyTemplateId?: string
  providerKey?: string
  query?: {
    sourceType?: LoopGridSourceType
    include?: unknown[]
    exclude?: unknown[]
    category?: unknown[]
    tag?: unknown[]
    taxonomy?: unknown[]
    author?: unknown[]
    orderBy?: string
    order?: string
  }
  layout?: {
    columns?: number
    itemsPerPage?: number
    columnGap?: number
    rowGap?: number
    loopCarousel?: boolean
    carouselItemWidth?: number
    carouselArrowPosition?: number
  }
  responsiveLayout?: Record<
    string,
    {
      columns?: number
      columnGap?: number
      rowGap?: number
      mediaQuery?: string
      horizontalScroll?: boolean
      scrollItemWidth?: number
    }
  >
  pagination?: {
    mode?: string
    pageLimit?: number
  }
  emptyState?: {
    nothingFoundText?: string
  }
}

interface LoopItemTemplate {
  html: string
  css: string
}

const LOOP_GRID_SOURCE_CONFIG: Record<LoopGridSourceType, CmsSsgConfig> = {
  posts: CMS_SSG_APIS['post-list'],
  products: CMS_SSG_APIS['product-list'],
  media: CMS_SSG_APIS['media-list']
}

type LoopGridPublishRenderOwner = 'backend-template' | 'frontend-ssg'

export const LOOP_GRID_PUBLISH_RENDER_OWNER: LoopGridPublishRenderOwner = 'backend-template'

function shouldRenderLoopGridInFrontendSsg(): boolean {
  // Loop Grid must publish as a backend-rendered CMS template. Rendering it here
  // turns the loop body into one static preview card and drops real pagination.
  return LOOP_GRID_PUBLISH_RENDER_OWNER === 'frontend-ssg'
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

function parseLoopGridSchema(el: Element): LoopGridSchema {
  const encoded = `${el.getAttribute('data-wb-loop-grid-schema') || ''}`.trim()
  if (!encoded) return {}
  try {
    return JSON.parse(decodeURIComponent(encoded))
  } catch {
    try {
      return JSON.parse(encoded)
    } catch {
      return {}
    }
  }
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
  if (!source) return ''
  const doc = new DOMParser().parseFromString(source, 'text/html')
  return Array.from(doc.querySelectorAll('style'))
    .map((style) => style.textContent || '')
    .filter(Boolean)
    .join('\n')
}

function extractLoopItemTemplateFromHtml(html: string): string {
  const source = `${html ?? ''}`.trim()
  if (!source) return ''
  const doc = new DOMParser().parseFromString(source, 'text/html')
  const root = doc.querySelector('[data-wb-loop-item-root]')
  if (root) return root.outerHTML
  const bodyChildren = Array.from(doc.body.children)
  if (bodyChildren.length === 1) return bodyChildren[0]?.outerHTML || ''
  return wrapLoopItemChildrenHtml(bodyChildren.map((child) => child.outerHTML).join(''))
}

function buildLoopItemTemplateFromPage(page: any): LoopItemTemplate | null {
  const schemaJson = `${page?.schemaJson ?? ''}`.trim()
  if (schemaJson) {
    try {
      const projectData = JSON.parse(schemaJson)
      const html = extractLoopItemTemplateFromProjectData(projectData)
      if (html) return { html, css: extractCssFromProjectData(projectData) }
    } catch {
      // fallback to persisted HTML below
    }
  }

  const htmlSource = page?.htmlContentInit || page?.htmlContentFull || ''
  const html = extractLoopItemTemplateFromHtml(htmlSource)
  if (!html) return null
  return { html, css: extractCssFromHtml(htmlSource) }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function sanitizeIdSuffix(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'item'
}

function uniquifyLoopItemIds(root: Element, suffix: string): Record<string, string> {
  const idMap: Record<string, string> = {}
  const elements = [
    ...(root.hasAttribute('id') ? [root] : []),
    ...Array.from(root.querySelectorAll('[id]'))
  ]

  elements.forEach((el) => {
    const id = `${el.getAttribute('id') || ''}`.trim()
    if (!id) return
    const nextId = `${id}-${sanitizeIdSuffix(suffix)}`
    idMap[id] = nextId
    el.setAttribute('id', nextId)
  })

  return idMap
}

function removeElementIds(root: Element): void {
  removeDynamicRenderCloneIds(root)
}

function rewriteIdReferences(root: Element, idMap: Record<string, string>): void {
  const rewriteTokenList = (value: string) =>
    value
      .split(/\s+/)
      .map((token) => idMap[token] || token)
      .join(' ')
  const elements = [root, ...Array.from(root.querySelectorAll('*'))]

  elements.forEach((el) => {
    ;['for', 'aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns', 'list'].forEach(
      (attr) => {
        const value = el.getAttribute(attr)
        if (value) el.setAttribute(attr, rewriteTokenList(value))
      }
    )
    ;['href', 'xlink:href', 'data-bs-target', 'data-target'].forEach((attr) => {
      const value = el.getAttribute(attr)
      if (!value?.startsWith('#')) return
      const nextId = idMap[value.slice(1)]
      if (nextId) el.setAttribute(attr, `#${nextId}`)
    })
  })
}

function rewriteCssIds(css: string, idMap: Record<string, string>): string {
  return Object.entries(idMap).reduce((nextCss, [oldId, newId]) => {
    if (!oldId || !newId) return nextCss
    return nextCss.replace(new RegExp(`#${escapeRegExp(oldId)}(?![-_a-zA-Z0-9])`, 'g'), `#${newId}`)
  }, css)
}

async function fetchLoopItemTemplate(
  resourceId: string,
  token: string
): Promise<LoopItemTemplate | null> {
  if (!resourceId) return null

  try {
    const draft = await fetchAdminJson(
      '/admin-api/cms/page/get',
      {
        resourceId,
        resourceType: 'TEMP_LOOP_ITEM'
      },
      token
    )
    const template = buildLoopItemTemplateFromPage(draft)
    if (template?.html) return template
  } catch {
    // Some older references stored a history id in the same field.
  }

  const historyId = Number(resourceId)
  if (!Number.isFinite(historyId) || historyId <= 0) return null

  try {
    const history = await fetchAdminJson(
      '/admin-api/cms/page/history/detail',
      {
        id: String(historyId)
      },
      token
    )
    return buildLoopItemTemplateFromPage(history)
  } catch {
    return null
  }
}

function getLoopGridSourceType(el: Element, schema: LoopGridSchema): LoopGridSourceType {
  const sourceType =
    `${schema.query?.sourceType || el.getAttribute('data-wb-source-type') || 'posts'}`.trim()
  if (sourceType === 'products' || sourceType === 'media') return sourceType
  return 'posts'
}

function buildLoopGridParams(
  el: Element,
  schema: LoopGridSchema,
  sourceType: LoopGridSourceType
): Record<string, string> {
  const config = LOOP_GRID_SOURCE_CONFIG[sourceType]
  const params = config.buildParams(el)
  params.pageNo = '1'
  params.pageSize = String(
    schema.layout?.itemsPerPage || el.getAttribute('data-page-size') || params.pageSize || '6'
  )

  const firstCategory = Array.isArray(schema.query?.category) ? schema.query?.category?.[0] : ''
  if (firstCategory != null && `${firstCategory}`.trim()) {
    params.categoryId = `${firstCategory}`.trim()
  }

  const firstTag = Array.isArray(schema.query?.tag) ? schema.query?.tag?.[0] : ''
  if (sourceType === 'posts' && firstTag != null && `${firstTag}`.trim()) {
    params.tagId = `${firstTag}`.trim()
  }

  return params
}

function createLoopGridEmptyEl(doc: Document, message: string): Element {
  const empty = doc.createElement('div')
  empty.setAttribute('class', 'wb-loop-grid-empty')
  empty.textContent = message || 'Nothing found.'
  return empty
}

function buildLoopGridPageHref(page: number): string {
  return page > 1 ? `page/${page}.html` : './'
}

function normalizeLoopGridMediaQuery(value: unknown): string {
  const raw = `${value ?? ''}`.trim()
  if (!raw) return ''
  if (raw.startsWith('(') || raw.startsWith('not ') || raw.startsWith('only ')) return raw
  if (raw.includes(':')) return raw
  return `(max-width: ${raw})`
}

function getLoopGridDeviceFallbackMediaQuery(deviceId: string): string {
  const normalized = `${deviceId ?? ''}`.trim().toLowerCase()
  if (normalized.includes('mobile')) return '(max-width: 767px)'
  if (normalized.includes('tablet')) return '(max-width: 1024px)'
  return ''
}

function parseLoopGridBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1'
}

function buildLoopGridResponsiveStyle(
  schema: LoopGridSchema,
  gridSelector: string,
  rootSelector: string
): string {
  const rules = Object.entries(schema.responsiveLayout || {})
    .map(([deviceId, config]) => {
      const mediaQuery =
        normalizeLoopGridMediaQuery(config?.mediaQuery) ||
        getLoopGridDeviceFallbackMediaQuery(deviceId)
      if (!mediaQuery) return ''
      const declarations = [
        !parseLoopGridBoolean(schema.layout?.loopCarousel) && config.columns !== undefined
          ? `grid-template-columns:repeat(${Math.max(1, Number(config.columns) || 1)},minmax(0,1fr)) !important`
          : '',
        config.columnGap !== undefined
          ? `column-gap:${Math.max(0, Number(config.columnGap) || 0)}px !important`
          : '',
        config.rowGap !== undefined
          ? `row-gap:${Math.max(0, Number(config.rowGap) || 0)}px !important`
          : ''
      ].filter(Boolean)
      if (parseLoopGridBoolean(config.horizontalScroll)) {
        const itemWidth = Math.min(720, Math.max(160, Number(config.scrollItemWidth) || 320))
        declarations.push(
          `--wb-loop-grid-mobile-item-width:${itemWidth}px`,
          'grid-template-columns:none !important',
          'grid-auto-flow:column !important',
          'grid-auto-columns:min(var(--wb-loop-grid-mobile-item-width),86vw) !important',
          'overflow-x:auto !important',
          'overflow-y:hidden !important',
          '-webkit-overflow-scrolling:touch',
          'scroll-snap-type:x mandatory',
          'scroll-padding-inline:calc((100% - min(var(--wb-loop-grid-mobile-item-width),86vw)) / 2)'
        )
      }
      const rootDeclarations = parseLoopGridBoolean(config.horizontalScroll)
        ? `${rootSelector},.wb-loop-grid{contain:layout;overflow-x:visible!important}`
        : ''
      return declarations.length
        ? `@media ${mediaQuery}{${rootDeclarations}${gridSelector}{${declarations.join(';')}}${gridSelector}>*{scroll-snap-align:center;scroll-snap-stop:normal}}`
        : ''
    })
    .filter(Boolean)

  return rules.length ? `<style data-wb-loop-grid-responsive-style>${rules.join('\n')}</style>` : ''
}

function normalizeLoopGridPaginationMode(
  mode: unknown
): 'none' | 'numbers' | 'prevNext' | 'loadMore' | 'infiniteScroll' {
  const normalized = `${mode ?? ''}`.trim()
  if (normalized === 'none') return 'none'
  if (normalized === 'prevNext') return 'prevNext'
  if (normalized === 'loadMore' || normalized === 'loadmore') return 'loadMore'
  if (normalized === 'infiniteScroll') return 'infiniteScroll'
  return 'numbers'
}

function resolveLoopGridTotalPages(pageData: {
  totalPages: number
  total: number
  pageSize: number
  items: any[]
}): number {
  const explicitTotalPages = Number(pageData.totalPages || 0)
  if (Number.isFinite(explicitTotalPages) && explicitTotalPages > 0) return explicitTotalPages

  const total = Number(pageData.total || 0)
  const pageSize = Number(pageData.pageSize || 0)
  if (Number.isFinite(total) && total > 0 && Number.isFinite(pageSize) && pageSize > 0) {
    return Math.max(1, Math.ceil(total / pageSize))
  }

  return pageData.items.length > 0 ? 1 : 0
}

function renderLoopGridPagination(
  doc: Document,
  options: {
    pageNo: number
    totalPages: number
    pageLimit: number
  }
): Element {
  const nav = doc.createElement('nav')
  nav.setAttribute('class', 'wb-loop-grid-pagination')
  nav.setAttribute('data-cms-pagination', '')
  nav.setAttribute('aria-label', 'Loop grid pagination')

  const currentPage = Math.max(1, Number(options.pageNo || 1) || 1)
  const totalPages = Math.max(1, Number(options.totalPages || 1) || 1)
  const pageLimit = Math.max(1, Number(options.pageLimit || 8) || 8)
  const visiblePages = Math.min(totalPages, pageLimit)

  if (currentPage > 1) {
    const prev = doc.createElement('a')
    prev.innerHTML = LOOP_GRID_PREV_ICON
    prev.setAttribute('href', buildLoopGridPageHref(currentPage - 1))
    prev.setAttribute('class', 'wb-loop-grid-pagination__btn')
    prev.setAttribute('aria-label', '上一页')
    nav.appendChild(prev)
  }

  for (let page = 1; page <= visiblePages; page += 1) {
    const link = doc.createElement('a')
    link.textContent = String(page)
    link.setAttribute('href', buildLoopGridPageHref(page))
    link.setAttribute(
      'class',
      `wb-loop-grid-pagination__number${page === currentPage ? ' active' : ''}`
    )
    if (page === currentPage) link.setAttribute('aria-current', 'page')
    nav.appendChild(link)
  }

  if (visiblePages < totalPages) {
    const ellipsis = doc.createElement('span')
    ellipsis.textContent = '...'
    ellipsis.setAttribute('class', 'wb-loop-grid-pagination__hint')
    nav.appendChild(ellipsis)
  }

  if (currentPage < totalPages) {
    const next = doc.createElement('a')
    next.innerHTML = LOOP_GRID_NEXT_ICON
    next.setAttribute('href', buildLoopGridPageHref(currentPage + 1))
    next.setAttribute('class', 'wb-loop-grid-pagination__btn')
    next.setAttribute('aria-label', '下一页')
    nav.appendChild(next)
  }

  return nav
}

function replaceLoopGridPagination(target: Element, nav: Element): void {
  const existing = target.querySelector(':scope > .wb-loop-grid-pagination')
  if (existing) {
    existing.replaceWith(nav)
  } else {
    target.appendChild(nav)
  }
}

async function renderLoopGridComponents(
  doc: Document,
  token: string,
  errors: string[]
): Promise<Element[]> {
  const loopGridEls = Array.from(
    doc.querySelectorAll(
      '.wb-loop-grid, [data-wb-loop-grid-schema], [data-cms-component="loop-grid"], [data-wb-component="loop-grid"]'
    )
  )
  if (!shouldRenderLoopGridInFrontendSsg()) {
    return loopGridEls
  }
  const renderedEls: Element[] = []

  for (const loopGridEl of loopGridEls) {
    const schema = parseLoopGridSchema(loopGridEl)
    const sourceType = getLoopGridSourceType(loopGridEl, schema)
    const config = LOOP_GRID_SOURCE_CONFIG[sourceType]
    const templateResourceId =
      `${loopGridEl.getAttribute('data-loop-item-template-resource-id') || schema.loopItemTemplateResourceId || loopGridEl.getAttribute('data-wb-item-template-id') || schema.itemTemplateId || ''}`.trim()

    if (!templateResourceId) {
      errors.push('[loop-grid] 缺少 Loop Item Template，已跳过')
      continue
    }

    const template = await fetchLoopItemTemplate(templateResourceId, token)
    if (!template?.html) {
      errors.push(`[loop-grid] Loop Item Template ${templateResourceId} 加载失败，已跳过`)
      continue
    }

    let pageData: ReturnType<typeof normalizeCmsDynamicPage>
    try {
      pageData = await fetchCmsDynamicPageForSsg(
        config.cmsType,
        loopGridEl,
        token,
        buildLoopGridParams(loopGridEl, schema, sourceType)
      )
    } catch (err: any) {
      errors.push(`[loop-grid] 数据获取失败: ${err?.message || err}`)
      continue
    }

    const columns = Math.max(1, Number(schema.layout?.columns || 3) || 3)
    const columnGap = Math.max(0, Number(schema.layout?.columnGap || 24) || 24)
    const rowGap = Math.max(0, Number(schema.layout?.rowGap || 24) || 24)
    const grid = doc.createElement('div')
    const gridId = schema.gridId || `loop-grid-${templateResourceId || 'items'}`
    loopGridEl.setAttribute('data-wb-grid-id', gridId)
    grid.setAttribute('class', 'wb-loop-grid-cards')
    grid.setAttribute('data-wb-loop-grid-cards', gridId)
    grid.setAttribute(
      'style',
      `display:grid;grid-template-columns:repeat(${columns},minmax(0,1fr));column-gap:${columnGap}px;row-gap:${rowGap}px;`
    )

    const templateDoc = new DOMParser().parseFromString(template.html, 'text/html')
    const templateEl = templateDoc.body.firstElementChild
    if (!templateEl) {
      errors.push(`[loop-grid] Loop Item Template ${templateResourceId} 内容为空，已跳过`)
      continue
    }

    const itemCss: string[] = []

    pageData.items.forEach((item, index) => {
      let card = templateEl.cloneNode(true) as Element
      const idMap = uniquifyLoopItemIds(
        card,
        `${schema.gridId || templateResourceId}-loop-${index + 1}`
      )
      rewriteIdReferences(card, idMap)
      if (template.css) itemCss.push(rewriteCssIds(template.css, idMap))
      card.removeAttribute('data-cms-repeat')
      card = bindCmsCard(card, config.transformItem(item), doc)
      if (sourceType === 'products') decorateProductCard(card, item)
      card.removeAttribute('data-wb-component')
      grid.appendChild(card)
    })

    loopGridEl.innerHTML = ''
    if (itemCss.length) {
      const style = doc.createElement('style')
      style.setAttribute('data-wb-loop-item-template-style', templateResourceId)
      style.textContent = itemCss.join('\n')
      loopGridEl.appendChild(style)
    }
    const paginationStyle = doc.createElement('style')
    paginationStyle.setAttribute('data-wb-loop-grid-pagination-style', '')
    paginationStyle.textContent = LOOP_GRID_PAGINATION_CSS
    loopGridEl.appendChild(paginationStyle)
    const responsiveStyle = buildLoopGridResponsiveStyle(
      schema,
      `[data-wb-loop-grid-cards="${gridId}"]`,
      `[data-wb-grid-id="${gridId}"]`
    )
    if (responsiveStyle) {
      const responsiveDoc = new DOMParser().parseFromString(responsiveStyle, 'text/html')
      const style = responsiveDoc.body.firstElementChild
      if (style) loopGridEl.appendChild(doc.importNode(style, true))
    }
    loopGridEl.appendChild(grid)

    if (!pageData.items.length) {
      grid.appendChild(
        createLoopGridEmptyEl(doc, schema.emptyState?.nothingFoundText || 'Nothing found.')
      )
    }

    const paginationMode = normalizeLoopGridPaginationMode(
      schema.pagination?.mode || loopGridEl.getAttribute('data-wb-pagination')
    )
    const totalPages = resolveLoopGridTotalPages(pageData)

    if (paginationMode === 'numbers') {
      replaceLoopGridPagination(
        loopGridEl,
        renderLoopGridPagination(doc, {
          pageNo: pageData.pageNo,
          totalPages,
          pageLimit: Number(schema.pagination?.pageLimit || 8) || 8
        })
      )
    } else if (paginationMode === 'prevNext') {
      const nav = doc.createElement('nav')
      nav.setAttribute('class', 'wb-loop-grid-pagination')
      nav.setAttribute('data-cms-pagination', '')
      nav.setAttribute('aria-label', 'Loop grid pagination')
      const currentPage = Math.max(1, Number(pageData.pageNo || 1) || 1)
      const normalizedTotalPages = Math.max(1, totalPages || 1)
      const prev = doc.createElement('a')
      prev.innerHTML = LOOP_GRID_PREV_ICON
      prev.setAttribute('href', buildLoopGridPageHref(Math.max(1, currentPage - 1)))
      prev.setAttribute('class', 'wb-loop-grid-pagination__btn')
      prev.setAttribute('aria-label', '上一页')
      const summary = doc.createElement('span')
      summary.textContent = `Page ${currentPage} / ${normalizedTotalPages}`
      summary.setAttribute('class', 'wb-loop-grid-pagination__summary')
      const next = doc.createElement('a')
      next.innerHTML = LOOP_GRID_NEXT_ICON
      next.setAttribute(
        'href',
        buildLoopGridPageHref(Math.min(normalizedTotalPages, currentPage + 1))
      )
      next.setAttribute('class', 'wb-loop-grid-pagination__btn')
      next.setAttribute('aria-label', '下一页')
      nav.appendChild(prev)
      nav.appendChild(summary)
      nav.appendChild(next)
      replaceLoopGridPagination(loopGridEl, nav)
    } else if (paginationMode === 'loadMore') {
      const nav = doc.createElement('nav')
      nav.setAttribute('class', 'wb-loop-grid-pagination')
      nav.setAttribute('data-cms-pagination', '')
      const next = doc.createElement('a')
      next.textContent = 'Load More'
      next.setAttribute(
        'href',
        buildLoopGridPageHref(Math.max(2, Number(pageData.pageNo || 1) + 1))
      )
      next.setAttribute('class', 'wb-loop-grid-pagination__btn')
      nav.appendChild(next)
      if (Math.max(1, totalPages || 1) > 1) {
        replaceLoopGridPagination(loopGridEl, nav)
      }
    }

    const attrsToRemove = Array.from(loopGridEl.attributes)
      .map((attr) => attr.name)
      .filter(
        (name) =>
          name.startsWith('data-wb-') ||
          name.startsWith('data-loop-item-') ||
          name.startsWith('data-cms-')
      )
    attrsToRemove.forEach((name) => loopGridEl.removeAttribute(name))
    renderedEls.push(loopGridEl)
  }

  return renderedEls
}

async function repairEmptyLoopGridPaginations(
  doc: Document,
  token: string,
  errors: string[]
): Promise<void> {
  if (!shouldRenderLoopGridInFrontendSsg()) return

  const emptyNavs = Array.from(doc.querySelectorAll('.wb-loop-grid-pagination')).filter(
    (nav) => nav.children.length === 0
  )

  for (const nav of emptyNavs) {
    const loopGridEl = nav.closest(
      '.wb-loop-grid, [data-wb-loop-grid-schema], [data-cms-component="loop-grid"], [data-wb-component="loop-grid"]'
    )
    if (!loopGridEl) continue

    const schema = parseLoopGridSchema(loopGridEl)
    const paginationMode = normalizeLoopGridPaginationMode(
      schema.pagination?.mode || loopGridEl.getAttribute('data-wb-pagination')
    )
    if (paginationMode === 'none') continue

    const sourceType = getLoopGridSourceType(loopGridEl, schema)
    const config = LOOP_GRID_SOURCE_CONFIG[sourceType]

    try {
      const pageData = await fetchCmsDynamicPageForSsg(
        config.cmsType,
        loopGridEl,
        token,
        buildLoopGridParams(loopGridEl, schema, sourceType)
      )
      const totalPages = resolveLoopGridTotalPages(pageData)
      const nextNav = renderLoopGridPagination(doc, {
        pageNo: pageData.pageNo,
        totalPages,
        pageLimit: Number(schema.pagination?.pageLimit || 8) || 8
      })
      nav.replaceWith(nextNav)
    } catch (err: any) {
      errors.push(`[loop-grid] 空分页修复失败: ${err?.message || err}`)
    }
  }
}

// ── 主入口 ────────────────────────────────────────────────────────

export interface SsgRenderResult {
  html: string
  errors: string[]
}

/**
 * 清理编辑器实时预览产生的临时元素，保留所有 data-cms-* 属性。
 *
 * 用于发布时：editor.getHtml() 的输出可能包含实时预览注入的 DOM 元素，
 * 此函数仅清理这些临时元素，输出干净的模板 HTML 供后端渲染引擎使用。
 *
 * 清理内容：
 *   - [data-cms-preview] — 实时预览容器（含真实数据卡片），移除
 *   - [data-cms-hidden]  — 被隐藏的模板网格，恢复可见性
 *   - .wb-cms-editor-header — 编辑器提示头，移除
 *
 * 保留内容（供后端 Thymeleaf 渲染引擎使用）：
 *   - data-cms-component, data-cms-repeat, data-cms-bind-*, data-cms-pagination 等所有模板标记
 *   - data-category-id, data-page-size, data-pagination 等配置属性
 */
export function cleanEditorArtifacts(htmlStr: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlStr, 'text/html')

  // 移除实时预览容器（useCmsLivePreview 注入的 [data-cms-preview] 元素）
  doc.querySelectorAll('[data-cms-preview]').forEach((el) => el.remove())
  // 移除新版文章列表的预览 wrapper
  doc.querySelectorAll('[data-cms-preview-wrapper]').forEach((el) => el.remove())

  // 恢复被隐藏的模板网格（useCmsLivePreview 添加的 data-cms-hidden + display:none）
  doc.querySelectorAll('[data-cms-hidden]').forEach((el) => {
    ;(el as HTMLElement).style.removeProperty('display')
    el.removeAttribute('data-cms-hidden')
  })

  // 移除编辑器专用提示头（仅在编辑器中显示）
  doc
    .querySelectorAll(
      '.wb-cms-editor-header, .wb-cms-latest-header, .wb-cms-media-list-header, .wb-cms-mcat-header, .wb-cms-media-detail-header, .wb-cms-prod-list-header, .wb-cms-prod-latest-header, .wb-cms-prod-detail-header, .wb-cms-detail-header, .wb-cms-search-header'
    )
    .forEach((el) => el.remove())

  // Swiper 会在编辑器/预览运行时写入 transform、transition 和 active 类。
  // 如果这些运行时状态被 editor.getHtml() 导出，发布页会从错误偏移开始初始化。
  doc.querySelectorAll('.swiper').forEach((el) => {
    el.classList.remove(
      'swiper-initialized',
      'swiper-horizontal',
      'swiper-vertical',
      'swiper-backface-hidden',
      'swiper-watch-progress'
    )
  })

  doc.querySelectorAll('.swiper-wrapper').forEach((el) => {
    const target = el as HTMLElement
    target.style.removeProperty('transform')
    target.style.removeProperty('transition-duration')
    target.style.removeProperty('transition-delay')
  })

  doc.querySelectorAll('.swiper-slide').forEach((el) => {
    const target = el as HTMLElement
    target.classList.remove(
      'swiper-slide-active',
      'swiper-slide-next',
      'swiper-slide-prev',
      'swiper-slide-visible',
      'swiper-slide-fully-visible'
    )
    target.style.removeProperty('transform')
    target.style.removeProperty('transition-duration')
    target.style.removeProperty('transition-delay')
    target.style.removeProperty('width')
    target.style.removeProperty('margin-right')
    target.style.removeProperty('margin-left')
  })

  doc.querySelectorAll('.swiper-pagination-bullet').forEach((el) => {
    el.classList.remove('swiper-pagination-bullet-active')
    el.removeAttribute('aria-current')
  })

  ensureBreadcrumbTemplates(doc)

  // 输出 HTML（保留原始结构）
  const isFullDocument = htmlStr.trim().toLowerCase().startsWith('<!doctype')
  return isFullDocument ? `<!DOCTYPE html>\n${doc.documentElement.outerHTML}` : doc.body.innerHTML
}

function ensureBreadcrumbTemplates(doc: Document): void {
  doc
    .querySelectorAll<HTMLElement>('[data-wb-dynamic="breadcrumb"], .wb-cms-dynamic-breadcrumb')
    .forEach((nav) => {
      nav.classList.add('wb-cms-dynamic-breadcrumb')
      if (!String(nav.getAttribute('aria-label') || '').trim()) {
        nav.setAttribute('aria-label', 'Breadcrumb')
      }

      let list = nav.querySelector<HTMLElement>('.wb-cms-dynamic-breadcrumb__list')
      if (!list) {
        list = doc.createElement('ol')
        list.className = 'wb-cms-dynamic-breadcrumb__list'
        nav.appendChild(list)
      }
      if (list.getAttribute('data-cms-repeat') === 'breadcrumb@breadcrumbs') {
        list.removeAttribute('data-cms-repeat')
      }

      let item = list.querySelector<HTMLElement>('[data-cms-repeat="breadcrumb@breadcrumbs"]')
      if (!item) {
        item = doc.createElement('li')
        list.appendChild(item)
      }
      item.classList.add('wb-cms-dynamic-breadcrumb__item')
      item.setAttribute('data-wb-dynamic', 'repeat-item')
      item.setAttribute('data-cms-repeat', 'breadcrumb@breadcrumbs')
      item.setAttribute('data-cms-bind-classappend', 'breadcrumb.currentClass')

      let link = item.querySelector<HTMLAnchorElement>('.wb-cms-dynamic-breadcrumb__link')
      if (!link) {
        link = doc.createElement('a')
        item.prepend(link)
      }
      link.classList.add('wb-cms-dynamic-breadcrumb__link')
      link.setAttribute('href', '#')
      link.setAttribute('data-cms-bind', 'breadcrumb.label')
      link.setAttribute('data-cms-bind-href', 'breadcrumb.url')
      link.setAttribute('data-cms-bind-title', 'breadcrumb.label')
      link.setAttribute('data-cms-bind-aria-current', 'breadcrumb.ariaCurrent')
      if (!String(link.textContent || '').trim()) {
        link.textContent = 'Breadcrumb'
      }

      if (!item.querySelector('.wb-cms-dynamic-breadcrumb__separator')) {
        const separator = doc.createElement('span')
        separator.className = 'wb-cms-dynamic-breadcrumb__separator'
        separator.setAttribute('aria-hidden', 'true')
        separator.textContent = '/'
        item.appendChild(separator)
      }
    })
}

/**
 * 扫描 HTML 中所有 CMS 动态组件并完成 SSG 渲染。
 *
 * 处理：
 *   - [data-cms-component] — 新版 CMS 组件（post-list、product-list 等）
 *   - [data-wb-component="blog-list"] — 旧版博客列表（向下兼容）
 *
 * @param htmlStr  原始 HTML 字符串（完整文档或 body 片段均可）
 * @param token    当前用户 access token（Bearer token，不含 "Bearer " 前缀）
 */
export async function renderSsgComponents(
  htmlStr: string,
  token: string
): Promise<SsgRenderResult> {
  const errors: string[] = []
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlStr, 'text/html')

  // ── 0. 清理编辑器实时预览产生的临时元素 ─────────────────────────
  //   编辑器 live preview 会：
  //     - 隐藏 [data-cms-repeat] 模板网格（添加 data-cms-hidden + display:none）
  //     - 插入 [data-cms-preview] 容器显示真实数据
  //     - 新版文章列表还会插入 [data-cms-preview-wrapper]
  //   发布时需要恢复模板网格、移除预览容器，以便正常 SSG 渲染。
  doc.querySelectorAll('[data-cms-preview]').forEach((el) => el.remove())
  doc.querySelectorAll('[data-cms-preview-wrapper]').forEach((el) => el.remove())
  doc.querySelectorAll('[data-cms-hidden]').forEach((el) => {
    ;(el as HTMLElement).style.removeProperty('display')
    el.removeAttribute('data-cms-hidden')
  })

  const renderedLoopGridEls = await renderLoopGridComponents(doc, token, errors)
  await repairEmptyLoopGridPaginations(doc, token, errors)

  // ── 1. 处理新版 CMS 组件 ──────────────────────────────────────
  //   优先匹配 [data-cms-component]；对于旧 schema 可能缺失该属性，
  //   则通过 [data-wb-component] 反推 cmsType。
  const WB_TO_CMS: Record<string, string> = {
    'cms-post-list': 'post-list',
    'cms-cases-list': 'cases-list',
    'cms-post-latest': 'post-latest',
    'cms-product-list': 'product-list',
    'cms-product-latest': 'product-latest',
    'cms-product-featured': 'product-featured',
    'cms-media-list': 'media-list',
    'cms-technical-service-list': 'technical-service-list',
    'cms-technical-download-list': 'technical-download-list',
    'cms-media-latest': 'media-latest',
    'cms-media-detail': 'media-detail',
    'cms-technical-support-detail': 'technical-support-detail',
    'cms-post-detail': 'post-detail',
    'cms-post-category-filter': 'post-category-filter',
    'cms-product-detail': 'product-detail',
    'cms-product-detail-v2': 'product-detail',
    'cms-faq-section': 'faq-section'
  }

  // 收集所有 CMS 组件元素（去重）
  const cmsElSet = new Set<Element>()
  doc.querySelectorAll('[data-cms-component]').forEach((el) => cmsElSet.add(el))
  renderedLoopGridEls.forEach((el) => cmsElSet.delete(el))
  // 兼容旧 schema：通过 data-wb-component 补充
  doc.querySelectorAll('[data-wb-component]').forEach((el) => {
    const wbType = el.getAttribute('data-wb-component')!
    if (WB_TO_CMS[wbType] && !el.hasAttribute('data-cms-component')) {
      el.setAttribute('data-cms-component', WB_TO_CMS[wbType])
      cmsElSet.add(el)
    }
  })
  const cmsEls = Array.from(cmsElSet)

  for (const cmsEl of cmsEls) {
    const cmsType = cmsEl.getAttribute('data-cms-component')!
    const config = CMS_SSG_APIS[cmsType]

    if (cmsType === 'post-category-filter') {
      await renderPostCategoryFilterComponent(cmsEl, token, errors)
      continue
    }

    if (!config) {
      // detail/search 等未接入 SSG 的组件暂时跳过
      // 移除编辑器 header 即可
      cmsEl.querySelector('.wb-cms-editor-header')?.remove()
      continue
    }

    if (cmsType === 'post-latest' && (await renderSelectedPostLatestCards(cmsEl, token, errors))) {
      continue
    }

    const ensureProductGrid = (): Element | null => {
      if (cmsType !== 'product-list') return null

      let grid = cmsEl.querySelector('[data-wb-product-grid], .wb-product-list__grid')
      if (!grid) {
        grid = doc.createElement('div')
        grid.setAttribute('class', 'wb-product-list__grid')
        grid.setAttribute('data-wb-product-grid', '')
        const anchor =
          cmsEl.querySelector('script[data-wb-product-card-template]') ||
          cmsEl.querySelector('[data-cms-pagination]') ||
          null
        if (anchor) cmsEl.insertBefore(grid, anchor)
        else cmsEl.appendChild(grid)
      }

      Array.from(cmsEl.children)
        .filter((child) => child.classList.contains('wb-product-card'))
        .forEach((card) => grid?.appendChild(card))

      return grid
    }

    const productGridEl = ensureProductGrid()

    const ensurePostGrid = (): Element | null => {
      if (cmsType !== 'post-list' && cmsType !== 'cases-list') return null

      if (cmsType === 'cases-list') {
        cmsEl.classList.add('wb-cases-list')
        cmsEl.classList.remove('wb-cases-list-grid', 'wb-post-list-grid')
      }
      if (cmsType === 'post-list') {
        cmsEl.classList.add('wb-post-list')
        cmsEl.classList.remove('wb-post-list-grid')
      }

      let grid = cmsEl.querySelector(
        '[data-wb-post-grid], .wb-cases-list__grid, .wb-post-list__grid'
      )
      if (!grid && (cmsType === 'post-list' || cmsType === 'cases-list')) {
        grid = doc.createElement('div')
        grid.setAttribute('class', 'wb-post-list__grid')
        grid.setAttribute('data-wb-post-grid', '')
      } else if (grid && (cmsType === 'post-list' || cmsType === 'cases-list')) {
        grid.setAttribute('class', 'wb-post-list__grid')
        grid.setAttribute('data-wb-post-grid', '')
      }
      if (grid && grid.parentElement !== cmsEl) {
        const anchor =
          cmsEl.querySelector('[data-cms-pagination]') ||
          cmsEl.querySelector('script[data-post-list-card-template]') ||
          null
        if (anchor) cmsEl.insertBefore(grid, anchor)
        else cmsEl.appendChild(grid)
      } else if (grid && cmsEl.querySelector('[data-cms-pagination]')) {
        const pagination = cmsEl.querySelector('[data-cms-pagination]')
        if (
          pagination &&
          grid.compareDocumentPosition(pagination) & Node.DOCUMENT_POSITION_PRECEDING
        ) {
          cmsEl.insertBefore(grid, pagination)
        }
      }

      if (grid) {
        Array.from(cmsEl.children)
          .filter((child) => child.classList.contains('wb-post-card'))
          .forEach((card) => grid?.appendChild(card))
      }

      return grid
    }

    const postGridEl = ensurePostGrid()

    // 找到重复容器（data-cms-repeat），或使用 fallback
    let repeatEl = cmsEl.querySelector('[data-cms-repeat]')
    let template: Element
    // 新模式标记：卡片本身带 data-cms-repeat 且是 cmsEl 的直接子元素。
    // 如果节点显式标记为 repeat-container，则说明它是 grid/list 容器，不能按卡片本身处理。
    const isProductCardTemplate =
      cmsType === 'product-list' &&
      repeatEl !== null &&
      repeatEl.classList.contains('wb-product-card')
    const isPostCardTemplate =
      (cmsType === 'post-list' || cmsType === 'cases-list') &&
      repeatEl !== null &&
      repeatEl.classList.contains('wb-post-card')
    const isDirectCardMode =
      repeatEl !== null &&
      (repeatEl.parentElement === cmsEl || isProductCardTemplate || isPostCardTemplate) &&
      !repeatEl.hasAttribute('data-cms-repeat-container')

    if (isDirectCardMode && repeatEl) {
      // 新模式：repeatEl 是卡片自身，template = 卡片自身
      template = repeatEl.cloneNode(true) as Element
      template.removeAttribute('data-cms-repeat')
    } else if (repeatEl && repeatEl.firstElementChild) {
      // 旧模式：从模板卡片克隆
      template = repeatEl.firstElementChild.cloneNode(true) as Element
    } else {
      // Fallback 路径：模板被编辑器实时预览破坏，使用默认卡片模板
      const fallbackHtml = FALLBACK_CARD_TEMPLATES[cmsType]
      if (!fallbackHtml) {
        errors.push(`[${cmsType}] 未找到 data-cms-repeat 容器且无 fallback 模板，已跳过`)
        continue
      }

      // 找到或创建 grid 容器
      if (!repeatEl) {
        // 尝试按新结构找到 grid 容器
        repeatEl = postGridEl || productGridEl || cmsEl.querySelector('[class*="preview-grid"]')
        if (!repeatEl) {
          // 使用第一个子 div 或创建新容器
          repeatEl = cmsEl.querySelector('div') || doc.createElement('div')
          if (!repeatEl.parentNode) cmsEl.appendChild(repeatEl)
        }
      }

      // 解析 fallback 模板为 DOM 元素
      const tmpDoc = new DOMParser().parseFromString(fallbackHtml, 'text/html')
      template = tmpDoc.body.firstElementChild!
    }

    // 请求 API
    let items: any[] = []
    let pageNo = 1
    let totalPages = 0
    let totalItems = 0
    try {
      const dynamicPage = await fetchCmsDynamicPageForSsg(cmsType, cmsEl, token)
      items = dynamicPage.items
      pageNo = dynamicPage.pageNo
      totalPages = dynamicPage.totalPages
      totalItems = dynamicPage.total
    } catch (err: any) {
      errors.push(`[${cmsType}] 数据获取失败: ${err?.message || err}`)
    }

    const productListMode =
      cmsType === 'product-list'
        ? cmsEl.getAttribute('data-list-mode') || cmsEl.getAttribute('data-wb-list-mode') || 'grid'
        : ''
    const productListDatasheet = cmsType === 'product-list' && productListMode === 'datasheet'
    const productListLoadAll =
      cmsType === 'product-list' &&
      (productListDatasheet ||
        cmsEl.getAttribute('data-load-all') === 'true' ||
        cmsEl.getAttribute('data-wb-load-all') === 'true')
    const paginationMode = productListLoadAll
      ? 'none'
      : cmsEl.getAttribute('data-pagination') || 'static'
    const paginationNav = cmsEl
      .querySelector('[data-cms-pagination]')
      ?.cloneNode(true) as Element | null
    const runtimeTemplateEl =
      cmsType === 'product-list'
        ? (cmsEl.querySelector('script[data-wb-product-card-template]') as HTMLElement | null)
        : null

    if (
      (cmsType === 'post-list' || cmsType === 'cases-list') &&
      cmsEl.getAttribute('data-enable-tag-filter') === 'true'
    ) {
      const filterBar = cmsEl.querySelector('[data-post-list-tag-filter]')
      if (filterBar) {
        const tags = await fetchPostTags(token, {
          categoryId: cmsEl.getAttribute('data-category-id') || ''
        })
        renderPostTagFilter(
          filterBar,
          tags,
          cmsEl.getAttribute('data-tag-selection-mode') === 'multi-none'
            ? 'multi-none'
            : 'single-all'
        )
      }
    }

    if (runtimeTemplateEl) {
      runtimeTemplateEl.textContent = buildRuntimeCardTemplate(template)
    }

    // FAQ：直接生成最终 HTML，绕过通用模板克隆链
    if (cmsType === 'faq-section') {
      const faqListEl =
        (repeatEl as HTMLElement | null) ??
        (cmsEl.querySelector('.wb-faq-section__list') as HTMLElement | null) ??
        (cmsEl.querySelector('.wb-cms-faq-section__list') as HTMLElement | null)

      if (faqListEl) {
        const faqClassPrefix =
          cmsEl.classList.contains('wb-faq-section') ||
          faqListEl.classList.contains('wb-faq-section__list')
            ? 'wb-faq-section'
            : 'wb-cms-faq-section'
        faqListEl.innerHTML = buildFaqSectionItemsHtml(items, faqClassPrefix)
        faqListEl.removeAttribute('data-cms-repeat')
      }
    } else if (isDirectCardMode) {
      const cardParent = productGridEl || postGridEl || cmsEl
      const directCards = Array.from(cardParent.children).filter(
        (child) =>
          child.getAttribute('data-cms-repeat') ||
          child.classList.contains('wb-product-card') ||
          child.classList.contains('wb-post-card')
      )
      directCards.forEach((child) => child.remove())

      items.forEach((item) => {
        let card = template.cloneNode(true) as Element
        removeElementIds(card)
        card = bindCmsCard(card, config.transformItem(item), doc)
        if (cmsType === 'product-list') {
          decorateProductCard(card, item)
        }
        // 清理编辑器专用属性
        card.removeAttribute('data-wb-component')
        cardParent.appendChild(card)
      })
      if (
        paginationMode === 'static' &&
        !cmsEl.querySelector('[data-cms-pagination]') &&
        paginationNav
      ) {
        cmsEl.appendChild(paginationNav)
      }
    } else {
      repeatEl!.innerHTML = ''
      items.forEach((item) => {
        let card = template.cloneNode(true) as Element
        removeElementIds(card)
        card = bindCmsCard(card, config.transformItem(item), doc)
        if (cmsType === 'product-list') {
          decorateProductCard(card, item)
        }
        repeatEl!.appendChild(card)
      })
    }

    if (cmsType === 'product-list') {
      syncProductListToolbar(cmsEl, totalItems || items.length)
      if (productListLoadAll) {
        if (productListDatasheet) {
          renderProductDatasheetTable(cmsEl, items)
        }
        renderProductSpecFilters(cmsEl, items)
      }
    }

    if (paginationMode === 'static') {
      const navTarget = ensureStaticPaginationNav(cmsEl, cmsType, doc)
      if (navTarget) {
        ;(navTarget as HTMLElement).style.removeProperty('display')
        const maxPages = parseInt(cmsEl.getAttribute('data-max-pages') || '10', 10) || 10
        renderStaticPagination(navTarget, {
          pageNo,
          totalPages,
          maxPages,
          defaultClassName:
            cmsType === 'product-list' ? 'wb-product-list-page-btn' : 'wb-post-list-page-btn'
        })
      }
    }

    // 移除编辑器专用元素
    cmsEl.querySelector('.wb-cms-editor-header')?.remove()
    if (paginationMode === 'none' || paginationMode === 'loadmore') {
      cmsEl.querySelector('[data-cms-pagination]')?.remove()
    }

    // 清理所有编辑器 / SSG 专用的 data-* 属性，输出干净 HTML
    // 包括：data-cms-*、data-wb-*、data-ssg-*，以及特定配置属性
    const attrsToRemove: string[] = []
    for (let i = 0; i < cmsEl.attributes.length; i++) {
      const name = cmsEl.attributes[i].name
      const keepCategoryAttr = name === 'data-category-id'
      const keepLegacyProductCategoryAttr =
        cmsType === 'product-list' && name === 'data-wb-category-id'
      const keepProductRuntimeAttr =
        cmsType === 'product-list' &&
        [
          'data-page-size',
          'data-category-id',
          'data-sort-field',
          'data-sort-asc',
          'data-pagination',
          'data-max-pages',
          'data-list-mode',
          'data-load-all',
          'data-tenant-id'
        ].includes(name)
      const keepPostListRuntimeAttr =
        (cmsType === 'post-list' || cmsType === 'cases-list') &&
        [
          'data-page-size',
          'data-category-id',
          'data-pagination',
          'data-max-pages',
          'data-enable-tag-filter',
          'data-tag-selection-mode'
        ].includes(name)
      if (
        !keepCategoryAttr &&
        !keepLegacyProductCategoryAttr &&
        !keepPostListRuntimeAttr &&
        ((name.startsWith('data-cms-') && name !== 'data-cms-component') ||
          name.startsWith('data-wb-') ||
          name.startsWith('data-ssg-') ||
          (!keepProductRuntimeAttr &&
            [
              'data-page-size',
              'data-limit',
              'data-category-id',
              'data-sort-field',
              'data-sort-asc',
              'data-pagination',
              'data-max-pages',
              'data-list-mode',
              'data-load-all',
              'data-type',
              'data-resource-type'
            ].includes(name)))
      ) {
        attrsToRemove.push(name)
      }
    }
    attrsToRemove.forEach((attr) => cmsEl.removeAttribute(attr))
    // 清理 repeat 容器上的属性（旧模式）
    if (!isDirectCardMode && repeatEl) {
      repeatEl.removeAttribute('data-cms-repeat')
    }
  }

  // ── 2. 向下兼容旧版 blog-list ─────────────────────────────────
  const blogLists = Array.from(doc.querySelectorAll('[data-wb-component="blog-list"]'))

  for (const listEl of blogLists) {
    const endpoint = listEl.getAttribute('data-ssg-endpoint')?.trim()
    if (!endpoint) {
      errors.push('博客列表组件缺少 API 接口路径，已跳过')
      continue
    }

    const itemsPath = listEl.getAttribute('data-ssg-items-path') || 'list'
    const pageSize = parseInt(listEl.getAttribute('data-ssg-page-size') || '10', 10)
    const sortBy = listEl.getAttribute('data-ssg-sort-by') || 'default'
    const linkField = listEl.getAttribute('data-ssg-link-field') || ''
    const linkPattern = listEl.getAttribute('data-ssg-link-pattern') || ''

    // 提取卡片模板（排除编辑器提示头）
    const templateChildren = Array.from(listEl.children).filter(
      (el) => !el.classList.contains('wb-blog-list-editor-header')
    )

    if (templateChildren.length === 0) {
      errors.push(`博客列表 (${endpoint}) 没有卡片模板内容，已跳过`)
      continue
    }

    // 克隆卡片模板容器
    const templateFragment = doc.createElement('div')
    templateChildren.forEach((child) => templateFragment.appendChild(child.cloneNode(true)))

    let items: Record<string, any>[] = []
    try {
      const rawData = await fetchListData(endpoint, { pageSize, sortBy, token })
      items = getByPath(rawData, itemsPath) || []
      if (!Array.isArray(items)) {
        errors.push(`博客列表 (${endpoint}) 数据路径 "${itemsPath}" 未返回数组，已跳过`)
        continue
      }
    } catch (err: any) {
      errors.push(`博客列表 (${endpoint}) 数据获取失败: ${err?.message || err}`)
      continue
    }

    // 清空列表，重新填充
    listEl.innerHTML = ''

    // 清理 SSG 配置属性
    listEl.removeAttribute('data-ssg-endpoint')
    listEl.removeAttribute('data-ssg-items-path')
    listEl.removeAttribute('data-ssg-page-size')
    listEl.removeAttribute('data-ssg-sort-by')
    listEl.removeAttribute('data-ssg-link-field')
    listEl.removeAttribute('data-ssg-link-pattern')

    // 渲染每条数据
    for (const item of items) {
      const renderedCard = renderCardTemplate(templateFragment, item)

      if (linkField && linkPattern && getByPath(item, linkField) !== undefined) {
        const href = applyLinkPattern(linkPattern, item)
        const wrapper = doc.createElement('a')
        wrapper.href = href
        wrapper.style.cssText = 'display:block;text-decoration:none;color:inherit;'
        wrapper.innerHTML = renderedCard.innerHTML
        listEl.appendChild(wrapper)
      } else {
        listEl.innerHTML += renderedCard.innerHTML
      }
    }
  }

  // ── 3. 注入新版文章卡片的 class CSS（如果有新模式 post-list 组件）──
  const hasNewPostList = cmsEls.some((el) => {
    const repeat = el.querySelector('[data-cms-repeat]')
    return Boolean((repeat && repeat.parentElement === el) || el.querySelector('.wb-post-card'))
  })
  if (hasNewPostList && !doc.getElementById('wb-post-card-styles')) {
    const style = doc.createElement('style')
    style.id = 'wb-post-card-styles'
    style.textContent = POST_CARD_CSS
    doc.head.appendChild(style)
  }

  if (doc.querySelector('.wb-cases-list') && !doc.getElementById('wb-cases-list-styles')) {
    const style = doc.createElement('style')
    style.id = 'wb-cases-list-styles'
    style.textContent = CASES_LIST_CSS
    doc.head.appendChild(style)
  }

  if (doc.querySelector('.wb-product-detail') && !doc.getElementById('wb-product-detail-styles')) {
    const style = doc.createElement('style')
    style.id = 'wb-product-detail-styles'
    style.textContent = PRODUCT_DETAIL_STYLES
    doc.head.appendChild(style)
  }

  if (
    doc.querySelector('.wb-product-detail-v2') &&
    !doc.getElementById('wb-product-detail-v2-styles')
  ) {
    const style = doc.createElement('style')
    style.id = 'wb-product-detail-v2-styles'
    style.textContent = PRODUCT_DETAIL_V2_STYLES
    doc.head.appendChild(style)
  }

  if (
    doc.querySelector('.wb-tech-support-detail') &&
    !doc.getElementById('wb-tech-support-detail-styles')
  ) {
    const style = doc.createElement('style')
    style.id = 'wb-tech-support-detail-styles'
    style.textContent = TECHNICAL_SUPPORT_DETAIL_STYLES
    doc.head.appendChild(style)
  }

  // 输出最终 HTML（保留原始结构：完整文档 or 片段）
  const isFullDocument = htmlStr.trim().toLowerCase().startsWith('<!doctype')
  const html = isFullDocument
    ? `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`
    : doc.body.innerHTML

  return { html, errors }
}
