/**
 * CMS 组件注册工厂
 * 提供共享的 helpers 和 registerCmsComponent() 工厂函数，
 * 消除 10 个 CMS 组件中大量重复的样板代码。
 */
import { POST_CARD_CSS } from './registries/dynamic/cms/post/styles.js'
import { PRODUCT_CARD_CSS } from './registries/dynamic/cms/product/styles.js'
import { PRODUCT_DETAIL_STYLES } from './registries/dynamic/cms/product/detail.styles.js'
import { PRODUCT_DETAIL_V2_STYLES } from './registries/dynamic/cms/product/detailV2.styles.js'
import {
  LOOP_GRID_NEXT_ICON,
  LOOP_GRID_PREV_ICON
} from './registries/dynamic/loopGrid/paginationStyles.js'
import { composePlaceholderUrl } from './dynamicRenderPipeline.js'

export interface CmsFactoryDataProvider {
  getEffectiveTenantId?: () => string | number | null | undefined
  getRuntimeEndpoints?: () => Partial<CmsRuntimeEndpoints> | null | undefined
  getRuntimeRequestConfig?: () => CmsRuntimeRequestConfig | null | undefined
}

export interface CmsRuntimeEndpoints {
  postPage: string
  mediaPage: string
  productPage: string
  postTagList: string
  postTagListAll: string
  search: string
}

export interface CmsRuntimeRequestConfig {
  headerName?: string | null
  headerValue?: string | number | null
}

let cmsFactoryDataProvider: CmsFactoryDataProvider = {}

export const setCmsFactoryDataProvider = (
  provider: CmsFactoryDataProvider
): (() => void) => {
  const previousProvider = cmsFactoryDataProvider
  cmsFactoryDataProvider = provider
  return () => {
    cmsFactoryDataProvider = previousProvider
  }
}

function getEffectiveTenantId(): string | number | null | undefined {
  return cmsFactoryDataProvider.getEffectiveTenantId?.()
}

function getRuntimeEndpoints(): Partial<CmsRuntimeEndpoints> {
  return cmsFactoryDataProvider.getRuntimeEndpoints?.() ?? {}
}

function getRuntimeEndpoint(key: keyof CmsRuntimeEndpoints): string {
  return `${getRuntimeEndpoints()[key] ?? ''}`.trim()
}

function getRuntimeRequestConfig(): Required<CmsRuntimeRequestConfig> {
  const config = cmsFactoryDataProvider.getRuntimeRequestConfig?.() ?? {}
  return {
    headerName: `${config.headerName ?? ''}`.trim(),
    headerValue: config.headerValue ?? getEffectiveTenantId() ?? ''
  }
}

// ── Loadmore API 端点映射 ──────────────────────────────────────────
const CMS_RUNTIME_API_MAP: Record<
  string,
  { endpoint: keyof CmsRuntimeEndpoints; entity: string }
> = {
  'post-list': { endpoint: 'postPage', entity: 'post' },
  'cases-list': { endpoint: 'postPage', entity: 'post' },
  'media-list': { endpoint: 'mediaPage', entity: 'media' },
  'product-list': { endpoint: 'productPage', entity: 'product' }
}

function normalizeSiteHref(rawValue: any): string {
  let value = String(rawValue ?? '').trim()
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

  if (value.startsWith('./')) value = value.slice(2)
  return `/${value}`
}

function isTruthyFlag(value: unknown): boolean {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
  return ['1', 'true', 'yes', 'on'].includes(normalized)
}

const LOOP_GRID_EXPORT_ATTRS = [
  'data-wb-instance-id',
  'data-wb-loop-grid-version',
  'data-wb-grid-id',
  'data-wb-filter-key',
  'data-wb-source-type',
  'data-wb-query-mode',
  'data-wb-item-template-id',
  'data-wb-pagination',
  'data-wb-provider-key',
  'data-wb-loop-grid-schema',
  'data-wb-page-size',
  'data-wb-max-pages',
  'data-wb-category-id',
  'data-wb-sort-field',
  'data-wb-sort-asc'
]

function hasLoopGridSignature(attrs: Record<string, any>): boolean {
  return (
    attrs['data-wb-component'] === 'loop-grid' ||
    attrs['data-wb-loop-grid-version'] !== undefined ||
    attrs['data-wb-loop-grid-schema'] !== undefined
  )
}

function cleanupLoopGridExportAttrsRecord(
  attrs: Record<string, any>,
  options?: { keepInstanceId?: boolean }
) {
  LOOP_GRID_EXPORT_ATTRS.forEach((attr) => {
    if (options?.keepInstanceId && attr === 'data-wb-instance-id') return
    delete attrs[attr]
  })
}

function cleanupLoopGridExportAttrsElement(el: Element) {
  LOOP_GRID_EXPORT_ATTRS.forEach((attr) => el.removeAttribute(attr))
}

function resolvePaginationClass(dataCmsComponent: string): string {
  if (dataCmsComponent === 'product-list') return 'wb-product-list-pagination'
  if (dataCmsComponent === 'media-list') return 'wb-cms-media-pagination'
  return 'wb-post-list-pagination'
}

function resolvePaginationPageBtnClass(dataCmsComponent: string): string {
  if (dataCmsComponent === 'product-list') return 'wb-product-list-page-btn'
  if (dataCmsComponent === 'media-list') return 'wb-cms-media-page-btn'
  return 'wb-post-list-page-btn'
}

function isLoopGridPaginationNav(nav: Element): boolean {
  return nav.classList.contains('wb-loop-grid-pagination')
}

/** 每种实体类型的数据转换函数（嵌入前端脚本） */
const CMS_TRANSFORM_FN: Record<string, string> = {
  post: `function transform(item) {
      var content = item && item.contents && item.contents[0] || {};
      var explicitUrl = ${normalizeSiteHref.toString()}(
        item && (item.url || item.postUrl || item.detailUrl || item.link)
        || (content && (content.url || content.postUrl || content.detailUrl || content.link))
      );
      var slug = String(item && item.slug || '').trim();
      var typeCode = String(item && item.typeCode || '').trim();
      var postId = item && item.id;
      var identifier = slug || (postId == null ? '' : String(postId).trim());
      return {
        'post.name': item.name || '',
        'post.image': item.image || '',
        'post.excerpt': item.excerpt || '',
        'post.url': explicitUrl || (identifier && typeCode ? ('/en/post/' + encodeURIComponent(typeCode) + '/' + encodeURIComponent(identifier) + '.html') : '#'),
        'post.categoryIds': item.categoryIds || [],
        'post.categoryNames': item.categoryNames || [],
        'post.tagIds': item.tagIds || [],
        'post.tagNames': item.tagNames || []
      };
    }`,
  media: `function transform(item) {
      function formatFileSize(size) {
        var normalized = Number(size);
        if (!isFinite(normalized) || normalized < 0) return '';
        if (normalized === 0) return '0 B';
        var units = ['B', 'KB', 'MB', 'GB'];
        var index = Math.min(Math.floor(Math.log(normalized) / Math.log(1024)), units.length - 1);
        var value = normalized / Math.pow(1024, index);
        var text = value >= 100 ? value.toFixed(0) : value.toFixed(1).replace(/\\.0$/, '');
        return text + ' ' + units[index];
      }
      var mediaUrl = ${normalizeSiteHref.toString()}(
        item && (item.url || item.mediaUrl || item.link)
      );
      var explicitUrl = ${normalizeSiteHref.toString()}(
        item && (item.detailUrl || item.url || item.mediaUrl || item.link)
      );
      var slug = String(item && item.slug || '').trim();
      var categoryCode = String(item && item.categoryCode || '').trim();
      var mediaId = item && item.id;
      var identifier = slug || (mediaId == null ? '' : String(mediaId).trim());
      return {
        'media.title': item.title || '',
        'media.url': mediaUrl || '',
        'media.size': formatFileSize(item && (item.size != null ? item.size : item.fileSize)),
        'media.coverUrl': item.coverUrl || '',
        'media.description': item.description || '',
        'media.detailUrl': explicitUrl || (identifier && categoryCode ? ('/' + resolveLanguage() + '/' + encodeURIComponent(categoryCode) + '/' + encodeURIComponent(identifier) + '.html') : '#')
      };
    }`,
  product: `function transform(item) {
      var slug = String((item && (item.slug || item.productSlug)) || '').trim();
      var productId = item && (item.id != null ? item.id : item.spuId);
      var identifier = slug || (productId == null ? '' : String(productId).trim());
      var canonicalUrl = identifier ? '/products/' + encodeURIComponent(identifier) + '.html' : '#';
      var explicitUrl = ${normalizeSiteHref.toString()}(item && (item.url || item.productUrl));
      return {
        'product.name': item.name || '',
        'product.picUrl': item.picUrl || '',
        'product.priceFormatted': '$' + (item.price / 100).toFixed(2),
        'product.salesCount': (item.salesCount || 0) + ' sold',
        'product.url': (explicitUrl && /^\\/(?:[a-z]{2}(?:-[a-z]{2})?)?\\/?products\\//i.test(explicitUrl))
          ? explicitUrl
          : canonicalUrl
      };
    }`
}

/**
 * 非交互子组件的共享选项（编辑器中不可选中/拖动/复制）。
 * 用于 CMS 组件内部的静态预览元素，防止用户在编辑器中误操作。
 */
export const STATIC_CHILD = {
  selectable: false,
  draggable: false,
  droppable: false,
  hoverable: false,
  layerable: false,
  copyable: false,
  removable: false,
  badgable: false,
  highlightable: false
}

/** 创建非交互的编辑器预览 header 区块 */
export function makePreviewHeader(headerClass: string, content: string): any {
  return { tagName: 'div', ...STATIC_CHILD, attributes: { class: headerClass }, content }
}

/** 创建带 data-cms-repeat 属性的非交互网格容器 */
export function makePreviewGrid(repeatEntity: string, gridClass: string, cards: any[]): any {
  return {
    tagName: 'div',
    ...STATIC_CHILD,
    attributes: {
      'data-cms-repeat': repeatEntity,
      'data-cms-repeat-container': 'true',
      class: gridClass
    },
    components: cards
  }
}

/** 为列表型 CMS 组件创建分页导航 */
export function makePaginationNav(
  paginationClass: string,
  pageBtnClass: string,
  options?: {
    interactiveInEditor?: boolean
  }
): any {
  const interactiveChild = options?.interactiveInEditor
    ? {
        draggable: false,
        droppable: false,
        copyable: false,
        removable: false,
        editable: false
      }
    : STATIC_CHILD

  return {
    tagName: 'nav',
    ...interactiveChild,
    attributes: { 'data-cms-pagination': '', class: paginationClass },
    components: [
      {
        tagName: 'span',
        ...interactiveChild,
        attributes: { class: `${pageBtnClass} active` },
        content: '1'
      },
      { tagName: 'span', ...interactiveChild, attributes: { class: pageBtnClass }, content: '2' },
      { tagName: 'span', ...interactiveChild, attributes: { class: pageBtnClass }, content: '3' },
      {
        tagName: 'span',
        ...interactiveChild,
        attributes: { class: pageBtnClass, 'aria-label': '下一页' },
        content: paginationClass.includes('wb-loop-grid-pagination')
          ? LOOP_GRID_NEXT_ICON
          : '下一页 »'
      }
    ]
  }
}

function ensurePaginationNavElement(
  doc: Document,
  el: HTMLElement,
  dataCmsComponent: string
): HTMLElement | null {
  let paginationNav = el.querySelector('nav[data-cms-pagination]') as HTMLElement | null
  if (paginationNav) return paginationNav

  if (!['post-list', 'cases-list', 'product-list', 'media-list'].includes(dataCmsComponent)) {
    return null
  }

  paginationNav = doc.createElement('nav')
  paginationNav.setAttribute('data-cms-pagination', '')
  paginationNav.setAttribute('class', resolvePaginationClass(dataCmsComponent))
  el.appendChild(paginationNav)
  return paginationNav
}

function ensurePaginationNavFallback(
  doc: Document,
  paginationNav: HTMLElement,
  dataCmsComponent: string
): void {
  if (paginationNav.children.length) return

  const pageBtnClass = resolvePaginationPageBtnClass(dataCmsComponent)
  const useLoopGridIcons = isLoopGridPaginationNav(paginationNav)
  const labels = ['1', '2', '3']

  labels.forEach((label, index) => {
    const item = doc.createElement('span')
    item.setAttribute('class', `${pageBtnClass}${index === 0 ? ' active' : ''}`)
    item.textContent = label
    paginationNav.appendChild(item)
  })

  const next = doc.createElement('span')
  next.setAttribute('class', pageBtnClass)
  next.setAttribute('aria-label', '下一页')
  if (useLoopGridIcons) {
    next.innerHTML = LOOP_GRID_NEXT_ICON
  } else {
    next.textContent = '下一页 »'
  }
  paginationNav.appendChild(next)
}

function ensurePostListRootStructure(
  doc: Document,
  el: HTMLElement,
  dataCmsComponent: string
): HTMLElement | null {
  if (dataCmsComponent !== 'post-list' && dataCmsComponent !== 'cases-list') return null

  const classList = new Set(
    String(el.getAttribute('class') || '')
      .split(/\s+/)
      .filter(Boolean)
      .filter(
        (className) =>
          !['wb-post-list-grid', 'wb-cases-list-grid', 'wb-cases-list__grid'].includes(className)
      )
  )
  classList.add('wb-post-list')
  if (dataCmsComponent === 'cases-list') classList.add('wb-cases-list')
  else classList.delete('wb-cases-list')
  el.setAttribute('class', Array.from(classList).join(' '))

  let grid = el.querySelector(
    '[data-wb-post-grid], .wb-post-list__grid, .wb-cases-list__grid'
  ) as HTMLElement | null
  if (!grid) {
    grid = doc.createElement('div')
    grid.setAttribute('data-wb-post-grid', '')
    grid.setAttribute('class', 'wb-post-list__grid')
  } else {
    const gridClasses = new Set(
      String(grid.getAttribute('class') || '')
        .split(/\s+/)
        .filter(Boolean)
    )
    gridClasses.delete('wb-cases-list__grid')
    gridClasses.delete('wb-post-list-grid')
    gridClasses.delete('wb-cases-list-grid')
    gridClasses.add(
      dataCmsComponent === 'cases-list' ? 'wb-cases-list__grid' : 'wb-post-list__grid'
    )
    grid.setAttribute('data-wb-post-grid', '')
    grid.setAttribute('class', Array.from(gridClasses).join(' '))
  }

  const paginationNav = el.querySelector('nav[data-cms-pagination]')
  const scriptAnchor = el.querySelector(
    'script[data-post-list-card-template], script[data-wb-product-card-template], script.cms-card-tpl'
  )
  if (grid.parentElement !== el) {
    if (paginationNav) el.insertBefore(grid, paginationNav)
    else if (scriptAnchor) el.insertBefore(grid, scriptAnchor)
    else el.appendChild(grid)
  } else if (
    paginationNav &&
    grid.compareDocumentPosition(paginationNav) & Node.DOCUMENT_POSITION_PRECEDING
  ) {
    el.insertBefore(grid, paginationNav)
  } else if (
    !paginationNav &&
    scriptAnchor &&
    grid.compareDocumentPosition(scriptAnchor) & Node.DOCUMENT_POSITION_PRECEDING
  ) {
    el.insertBefore(grid, scriptAnchor)
  }

  Array.from(el.children).forEach((child) => {
    if (child === grid) return
    const childEl = child as HTMLElement
    if (
      childEl.getAttribute('data-cms-repeat') === 'post' ||
      childEl.classList.contains('wb-post-card')
    ) {
      grid?.appendChild(childEl)
    }
  })

  return grid
}

/** 列表型 CMS 组件的共享分页 traits */
export const PAGINATION_TRAITS = [
  { type: 'number', label: '每页数量', name: 'cmsPageSize', changeProp: true, min: 1, max: 50 },
  {
    type: 'select',
    label: '分页模式',
    name: 'cmsPagination',
    changeProp: true,
    options: [
      { value: 'static', label: '静态分页（SEO 最佳）' },
      { value: 'loadmore', label: '加载更多' },
      { value: 'none', label: '不分页' }
    ]
  },
  { type: 'number', label: '最大页数', name: 'cmsMaxPages', changeProp: true, min: 1, max: 100 }
]

/** 列表型 CMS 组件的共享分页 model 默认值 */
export const PAGINATION_PROPS = { cmsPageSize: 12, cmsPagination: 'static', cmsMaxPages: 10 }

/** 列表型 CMS 组件的共享分页默认 attributes */
export const PAGINATION_ATTRS = {
  'data-page-size': '12',
  'data-pagination': 'static',
  'data-max-pages': '10'
}

/** 从 model 提取分页相关的 data attributes */
export function syncPaginationAttrs(model: any): Record<string, string> {
  return {
    'data-page-size': String(model.get('cmsPageSize') || 12),
    'data-pagination': model.get('cmsPagination') || 'static',
    'data-max-pages': String(model.get('cmsMaxPages') || 10)
  }
}

// ── 组件定义 → HTML 转换工具 ──────────────────────────────────────

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

/**
 * 将 GrapesJS 组件定义数组转换为 HTML 字符串。
 * 用于 toHTML() 导出时输出正确的模板 HTML，不受 MutationObserver 污染影响。
 *
 * 对 data-cms-repeat 容器特殊处理：只保留第一个子组件（含 data-cms-bind-* 的模板卡片），
 * 其余预览占位卡片不输出，后端渲染引擎只需要一张模板卡片。
 */
function componentsToHtml(defs: any[]): string {
  if (!defs || defs.length === 0) return ''

  return defs
    .map((def) => {
      if (typeof def === 'string') return def

      const tag = def.tagName || 'div'
      const attrs = { ...(def.attributes || {}) }

      // 将 GrapesJS style 对象也输出到 HTML 的 style 属性中（若 attributes 中没有显式 style）
      if (!attrs.style && def.style && typeof def.style === 'object') {
        attrs.style = Object.entries(def.style)
          .map(([k, v]) => `${k}:${v}`)
          .join(';')
      }

      // 构建 HTML 属性字符串（仅包含 attributes 中的属性，忽略 GrapesJS 模型属性）
      const attrStr = Object.entries(attrs)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${k}="${String(v).replace(/"/g, '&quot;')}"`)
        .join(' ')

      if (VOID_TAGS.has(tag)) {
        return `<${tag}${attrStr ? ' ' + attrStr : ''} />`
      }

      const content = def.content || ''
      let children = def.components
      // data-cms-repeat 容器：只保留第一个子组件（模板卡片）
      if (attrs['data-cms-repeat'] && Array.isArray(children) && children.length > 1) {
        children = [children[0]]
      }
      const childrenHtml = children ? componentsToHtml(children) : ''

      return `<${tag}${attrStr ? ' ' + attrStr : ''}>${content}${childrenHtml}</${tag}>`
    })
    .join('\n')
}

function buildRuntimeCardTemplate(cardEl: Element): string {
  const cardClone = cardEl.cloneNode(true) as HTMLElement

  cardClone.removeAttribute('data-cms-repeat')
  cardClone.removeAttribute('id')
  cardClone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'))

  cardClone.querySelectorAll('[data-cms-bind][data-cms-format]').forEach((bindEl) => {
    const field = bindEl.getAttribute('data-cms-bind') || ''
    const format = bindEl.getAttribute('data-cms-format') || ''
    bindEl.textContent = field ? `{{@format:${field}:${format}}}` : ''
    bindEl.removeAttribute('data-cms-bind')
    bindEl.removeAttribute('data-cms-format')
  })

  cardClone.querySelectorAll('[data-cms-bind]').forEach((bindEl) => {
    const field = bindEl.getAttribute('data-cms-bind') || ''
    bindEl.textContent = field ? `{{${field}}}` : ''
    bindEl.removeAttribute('data-cms-bind')
  })

  cardClone.querySelectorAll('[data-cms-bind-src]').forEach((bindEl) => {
    const field = bindEl.getAttribute('data-cms-bind-src') || ''
    bindEl.setAttribute('src', field ? `{{${field}}}` : '')
    bindEl.removeAttribute('data-cms-bind-src')
  })

  cardClone.querySelectorAll('[data-cms-bind-alt]').forEach((bindEl) => {
    const field = bindEl.getAttribute('data-cms-bind-alt') || ''
    bindEl.setAttribute('alt', field ? `{{${field}}}` : '')
    bindEl.removeAttribute('data-cms-bind-alt')
  })

  cardClone.querySelectorAll('[data-cms-bind-href]').forEach((bindEl) => {
    const field = bindEl.getAttribute('data-cms-bind-href') || ''
    const template = bindEl.getAttribute('data-cms-bind-href-template') || ''
    bindEl.setAttribute('href', field ? composePlaceholderUrl(field, template) : '#')
    bindEl.removeAttribute('data-cms-bind-href')
    bindEl.removeAttribute('data-cms-bind-href-template')
  })

  cardClone.querySelectorAll('[data-cms-bind-target]').forEach((bindEl) => {
    const field = bindEl.getAttribute('data-cms-bind-target') || ''
    if (field) bindEl.setAttribute('target', `{{${field}}}`)
    else bindEl.removeAttribute('target')
    bindEl.removeAttribute('data-cms-bind-target')
  })

  cardClone.querySelectorAll('[data-cms-bind-style]').forEach((bindEl) => {
    const field = bindEl.getAttribute('data-cms-bind-style') || ''
    if (field) bindEl.setAttribute('style', `{{${field}}}`)
    else bindEl.removeAttribute('style')
    bindEl.removeAttribute('data-cms-bind-style')
  })

  cardClone.querySelectorAll('[data-cms-html]').forEach((bindEl) => {
    const field = bindEl.getAttribute('data-cms-html') || ''
    ;(bindEl as HTMLElement).innerHTML = field ? `{{${field}}}` : ''
    bindEl.removeAttribute('data-cms-html')
  })

  return cardClone.outerHTML
}

function buildPostListTagFilterIIFE(config: {
  pageSize: string
  categoryId: string
  postPageEndpoint: string
  postTagListEndpoint: string
  postTagListAllEndpoint: string
  requestConfig: Required<CmsRuntimeRequestConfig>
  selectionMode?: string
}): string {
  const runtimeConfig = JSON.stringify({
    pageSize: config.pageSize,
    categoryId: config.categoryId,
    postPageEndpoint: config.postPageEndpoint,
    postTagListEndpoint: config.postTagListEndpoint,
    postTagListAllEndpoint: config.postTagListAllEndpoint,
    requestHeaderName: config.requestConfig.headerName,
    requestHeaderValue: config.requestConfig.headerValue,
    selectionMode: config.selectionMode || 'single-all'
  })
  return `
(function(){
  var cfg = ${runtimeConfig};
  var comp = document.currentScript.parentElement;
  var filterBar = comp.querySelector('[data-post-list-tag-filter]');
  var cardTplEl = comp.querySelector('script[data-post-list-card-template]');
  var paginationEl = comp.querySelector('.wb-post-list-pagination');
  var listEl = comp.querySelector('[data-wb-post-grid], .wb-cases-list__grid, .wb-post-list__grid') || comp;
  if (!filterBar || !cardTplEl) return;

  var pageSize = parseInt(cfg.pageSize || '12', 10) || 12;
  var selectionMode = String(cfg.selectionMode || 'single-all').toLowerCase() === 'multi-none' ? 'multi-none' : 'single-all';
  var resolvedCategoryId = resolveCategoryId();
  var resolvedLegacyTypeId = resolveLegacyTypeId();
  var currentTagId = '';
  var selectedTagIds = [];
  var currentPage = 1;
  var staticCardsHtml = collectCardHtml();
  var staticPaginationHtml = paginationEl ? paginationEl.innerHTML : '';
  var staticPaginationDisplay = paginationEl ? (paginationEl.style.display || '') : '';
  var tplHtml = cardTplEl.textContent || cardTplEl.innerHTML || '';

  fetchTags();

  function fetchTags() {
    fetchTagList(true)
      .then(function(list){
        if (list.length || resolvedCategoryId || !resolvedLegacyTypeId) return list;
        return fetchTagList(false);
      })
      .then(function(list){
        if (list.length || resolvedCategoryId) return list;
        return fetchTagList('all');
      })
      .then(function(list){
        if (!list.length) {
          if (filterBar.children.length) {
            filterBar.classList.add('is-active');
            return;
          }
          filterBar.remove();
          return;
        }
        renderTagButtons(list);
        filterBar.classList.add('is-active');
      })
      .catch(function(){
        if (filterBar.children.length) {
          filterBar.classList.add('is-active');
          return;
        }
        filterBar.remove();
      });
  }

  function fetchTagList(useTypeId) {
    var path = useTypeId === 'all' ? cfg.postTagListAllEndpoint : cfg.postTagListEndpoint;
    if (!path) return Promise.resolve([]);
    var params = new URLSearchParams();
    if (useTypeId === true) {
      if (resolvedCategoryId) params.set('categoryId', String(resolvedCategoryId));
      else if (resolvedLegacyTypeId) params.set('typeId', String(resolvedLegacyTypeId));
    }
    var qs = params.toString() ? ('?' + params.toString()) : '';
    return fetch(path + qs, { headers: buildHeaders() })
      .then(function(res){ return res.json(); })
      .then(function(json){
        return Array.isArray(json && json.data) ? json.data : [];
      });
  }

  function renderTagButtons(tags) {
    var normalizedTags = tags.map(function(tag){
      return {
        id: tag && tag.id != null ? String(tag.id) : '',
        name: String((tag && tag.name) || '').trim(),
      };
    }).filter(function(tag){ return tag.id && tag.name; });

    if (selectionMode === 'multi-none') {
      if (!normalizedTags.length) {
        filterBar.remove();
        return;
      }
      filterBar.innerHTML = normalizedTags.map(function(tag){
        return '<label class="wb-post-list-tag-check" data-tag-id="' + escAttr(tag.id) + '">'
          + '<span class="wb-post-list-tag-text">' + escHtml(tag.name) + '</span>'
          + '<input type="checkbox" class="wb-post-list-tag-checkbox" data-tag-id="' + escAttr(tag.id) + '" />'
          + '</label>';
      }).join('');

      Array.prototype.forEach.call(filterBar.querySelectorAll('.wb-post-list-tag-checkbox[data-tag-id]'), function(input){
        input.addEventListener('change', function(){
          selectedTagIds = collectSelectedTagIds();
          syncSelectedTag();
          if (!selectedTagIds.length) {
            restoreBaseContent();
            return;
          }
          fetchPosts(1);
        });
      });
      syncSelectedTag();
      return;
    }

    var items = [{ id: '', name: 'ALL' }].concat(normalizedTags);
    filterBar.innerHTML = items.map(function(tag){
      var cls = 'wb-post-list-tag-btn' + (!tag.id ? ' is-selected' : '');
      return '<button type="button" class="' + cls + '" data-tag-id="' + escAttr(tag.id) + '">' + escHtml(tag.name) + '</button>';
    }).join('');

    Array.prototype.forEach.call(filterBar.querySelectorAll('[data-tag-id]'), function(btn){
      btn.addEventListener('click', function(){
        var nextTagId = String(btn.getAttribute('data-tag-id') || '');
        if (nextTagId === currentTagId) return;
        currentTagId = nextTagId;
        syncSelectedTag();
        if (!currentTagId) {
          restoreBaseContent();
          return;
        }
        fetchPosts(1);
      });
    });
  }

  function syncSelectedTag() {
    if (selectionMode === 'multi-none') {
      var selectedMap = {};
      selectedTagIds.forEach(function(tagId){ selectedMap[String(tagId)] = true; });
      Array.prototype.forEach.call(filterBar.querySelectorAll('.wb-post-list-tag-check[data-tag-id]'), function(label){
        var tagId = String(label.getAttribute('data-tag-id') || '');
        var selected = !!selectedMap[tagId];
        label.classList.toggle('is-selected', selected);
      });
      Array.prototype.forEach.call(filterBar.querySelectorAll('.wb-post-list-tag-checkbox[data-tag-id]'), function(input){
        var tagId = String(input.getAttribute('data-tag-id') || '');
        input.checked = !!selectedMap[tagId];
      });
      return;
    }

    Array.prototype.forEach.call(filterBar.querySelectorAll('.wb-post-list-tag-btn'), function(btn){
      var isSelected = String(btn.getAttribute('data-tag-id') || '') === currentTagId;
      btn.classList.toggle('is-selected', isSelected);
    });
  }

  function collectSelectedTagIds() {
    return Array.prototype.slice.call(filterBar.querySelectorAll('.wb-post-list-tag-checkbox[data-tag-id]:checked'))
      .map(function(input){ return String(input.getAttribute('data-tag-id') || ''); })
      .filter(Boolean);
  }

  function restoreStaticContent() {
    clearDynamicCards();
    insertHtml(staticCardsHtml);
    if (paginationEl) {
      paginationEl.innerHTML = staticPaginationHtml;
      paginationEl.style.display = staticPaginationDisplay;
    }
    currentPage = 1;
  }

  function restoreBaseContent() {
    if (resolvedCategoryId || resolvedLegacyTypeId) {
      fetchPosts(1);
      return;
    }
    restoreStaticContent();
  }

  function fetchPosts(pageNo) {
    currentPage = pageNo;
    renderStatus('Loading...');
    if (paginationEl) {
      paginationEl.style.display = 'none';
      paginationEl.innerHTML = '';
    }

    var params = new URLSearchParams();
    params.set('pageNo', String(pageNo));
    params.set('pageSize', String(pageSize));
    if (resolvedCategoryId) params.set('categoryId', String(resolvedCategoryId));
    if (resolvedLegacyTypeId) params.set('typeId', String(resolvedLegacyTypeId));
    if (selectionMode === 'multi-none') {
      if (selectedTagIds.length) params.set('tagIds', selectedTagIds.join(','));
    } else if (currentTagId) {
      params.set('tagIds', String(currentTagId));
    }
    var lang = resolveLanguage();
    if (lang) params.set('language', lang);

    if (!cfg.postPageEndpoint) {
      renderStatus('Dynamic article endpoint is not configured.');
      return;
    }
    fetch(cfg.postPageEndpoint + '?' + params.toString(), { headers: buildHeaders() })
      .then(function(res){ return res.json(); })
      .then(function(json){
        var data = json && json.data;
        var list = Array.isArray(data && data.list) ? data.list : [];
        var total = Number(data && data.total) || 0;
        renderPostList(list);
        renderPagination(total);
      })
      .catch(function(){
        renderStatus('Failed to load articles.');
      });
  }

  function renderPostList(list) {
    clearDynamicCards();
    if (!Array.isArray(list) || !list.length) {
      renderStatus('No articles found.');
      return;
    }
    insertHtml(list.map(function(item){ return renderCard(item); }).join(''));
  }

  function renderPagination(total) {
    if (!paginationEl) return;
    var totalPages = Math.ceil((Number(total) || 0) / pageSize);
    if (totalPages <= 1) {
      if (staticPaginationHtml) {
        paginationEl.innerHTML = staticPaginationHtml;
        paginationEl.style.display = staticPaginationDisplay;
      } else {
        paginationEl.style.display = 'none';
        paginationEl.innerHTML = '';
      }
      return;
    }

    var html = '';
    if (currentPage > 1) {
      html += '<button type="button" class="wb-post-list-page-btn" data-page-no="' + (currentPage - 1) + '" aria-label="上一页">${LOOP_GRID_PREV_ICON}</button>';
    }
    for (var page = 1; page <= totalPages; page++) {
      var activeCls = page === currentPage ? ' active' : '';
      html += '<button type="button" class="wb-post-list-page-btn' + activeCls + '" data-page-no="' + page + '">' + page + '</button>';
    }
    if (currentPage < totalPages) {
      html += '<button type="button" class="wb-post-list-page-btn" data-page-no="' + (currentPage + 1) + '" aria-label="下一页">${LOOP_GRID_NEXT_ICON}</button>';
    }

    paginationEl.innerHTML = html;
    paginationEl.style.display = '';
    Array.prototype.forEach.call(paginationEl.querySelectorAll('[data-page-no]'), function(btn){
      btn.addEventListener('click', function(){
        var pageNo = parseInt(btn.getAttribute('data-page-no') || '1', 10) || 1;
        if (pageNo === currentPage) return;
        fetchPosts(pageNo);
      });
    });
  }

  function renderCard(item) {
    var data = {
      'post.name': String(item && item.name || ''),
      'post.image': String(item && item.image || ''),
      'post.excerpt': String(item && item.excerpt || ''),
      'post.publishTime': item && item.publishTime != null ? item.publishTime : '',
      'post.url': resolvePostUrl(item),
      'post.categoryIds': item && item.categoryIds || [],
      'post.categoryNames': item && item.categoryNames || [],
      'post.tagIds': item && item.tagIds || [],
      'post.tagNames': item && item.tagNames || []
    };
    return renderTemplate(tplHtml, data);
  }

  function resolvePostUrl(item) {
    var content = item && item.contents && item.contents[0] || {};
    var explicitUrl = normalizePostHref(
      item && (item.url || item.postUrl || item.detailUrl || item.link)
      || (content && (content.url || content.postUrl || content.detailUrl || content.link))
      || ''
    );
    if (explicitUrl) return explicitUrl;
    var slug = String(item && item.slug || '').trim();
    var typeCode = String(item && item.typeCode || '').trim();
    if (!slug || !typeCode) return '#';
    var lang = resolveLanguage();
    return '/' + lang + '/post/' + encodeURIComponent(typeCode) + '/' + encodeURIComponent(slug) + '.html';
  }

  function normalizePostHref(rawValue) {
    var value = String(rawValue || '').trim();
    if (!value) return '';
    if (
      value.charAt(0) === '/'
      || value.charAt(0) === '#'
      || /^mailto:/i.test(value)
      || /^tel:/i.test(value)
      || /^https?:\/\//i.test(value)
      || value.indexOf('//') === 0
    ) {
      return value;
    }
    if (value.indexOf('./') === 0) value = value.slice(2);
    return '/' + value;
  }

  function renderTemplate(template, data) {
    return String(template || '')
      .replace(/\\{\\{@format:([^:}]+):([^}]+)\\}\\}/g, function(_, field, format){
        return escHtml(formatDate(data[field], format));
      })
      .replace(/\\{\\{([^}]+)\\}\\}/g, function(_, field){
        return escHtml(data[field] == null ? '' : String(data[field]));
      });
  }

  function formatDate(value, format) {
    if (value == null || value === '') return '';
    var date = null;
    if (Array.isArray(value) && value.length >= 3) {
      date = new Date(Number(value[0]), Number(value[1]) - 1, Number(value[2]), Number(value[3] || 0), Number(value[4] || 0), Number(value[5] || 0));
    } else if (typeof value === 'string' || typeof value === 'number') {
      date = new Date(value);
    }
    if (!date || isNaN(date.getTime())) return String(value);
    var parts = {
      yyyy: String(date.getFullYear()),
      MM: ('0' + (date.getMonth() + 1)).slice(-2),
      dd: ('0' + date.getDate()).slice(-2),
      HH: ('0' + date.getHours()).slice(-2),
      mm: ('0' + date.getMinutes()).slice(-2),
      ss: ('0' + date.getSeconds()).slice(-2),
    };
    return String(format || 'yyyy-MM-dd').replace(/yyyy|MM|dd|HH|mm|ss/g, function(token){
      return parts[token] || token;
    });
  }

  function renderStatus(message) {
    clearDynamicCards();
    insertHtml('<div class="wb-post-list-empty">' + escHtml(message) + '</div>');
  }

  function clearDynamicCards() {
    Array.prototype.slice.call(listEl.children).forEach(function(child){
      if (!child || !child.classList) return;
      if (child.classList.contains('wb-post-card') || child.classList.contains('wb-post-list-empty')) {
        child.remove();
      }
    });
  }

  function collectCardHtml() {
    return Array.prototype.slice.call(listEl.children)
      .filter(function(child){ return child && child.classList && child.classList.contains('wb-post-card'); })
      .map(function(child){ return child.outerHTML; })
      .join('');
  }

  function insertHtml(html) {
    if (!html) return;
    listEl.insertAdjacentHTML('beforeend', html);
  }

  function buildHeaders() {
    var headers = {};
    if (cfg.requestHeaderName && cfg.requestHeaderValue) {
      headers[cfg.requestHeaderName] = String(cfg.requestHeaderValue);
    }
    return headers;
  }

  function resolveCategoryId() {
    try {
      var url = new URL(window.location.href);
      var override = String(url.searchParams.get('categoryId') || '').trim();
      if (override) return override;
    } catch (_) {
      // noop
    }
    return String(cfg.categoryId || '').trim();
  }

  function resolveLegacyTypeId() {
    try {
      var url = new URL(window.location.href);
      var override = String(url.searchParams.get('typeId') || '').trim();
      if (override) return override;
    } catch (_) {
      // noop
    }
    return '';
  }

  function resolveLanguage() {
    var attrLang = String(document.documentElement.getAttribute('lang') || '').trim();
    if (attrLang) return attrLang;
    var seg = String((window.location.pathname || '/').split('/').filter(Boolean)[0] || '').trim();
    return /^[a-z]{2}(?:-[a-z]{2})?$/i.test(seg) ? seg : 'en';
  }

  function escHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escAttr(value) {
    return escHtml(value).replace(/\`/g, '&#96;');
  }
})();`
}

function buildCategoryQueryOverrideIIFE(config: {
  endpoint: string
  paramKey: string
  entity: 'post' | 'media'
  pageSize: string
  requestConfig: Required<CmsRuntimeRequestConfig>
  includeLanguage?: boolean
  initialValue: string
}): string {
  const runtimeConfig = JSON.stringify({
    endpoint: config.endpoint,
    paramKey: config.paramKey,
    entity: config.entity,
    pageSize: config.pageSize,
    requestHeaderName: config.requestConfig.headerName,
    requestHeaderValue: config.requestConfig.headerValue,
    includeLanguage: Boolean(config.includeLanguage),
    initialValue: config.initialValue
  })
  const transformFn = CMS_TRANSFORM_FN[config.entity]
  return `
(function(){
  var cfg = ${runtimeConfig};
  var transform = ${transformFn};
  var comp = document.currentScript.parentElement;
  var tplEl = comp.querySelector('script[data-wb-category-query-template]');
  if (!tplEl) return;

  var activeValue = readActiveValue();
  if (!activeValue || activeValue === String(cfg.initialValue || '').trim()) return;

  var pageSize = parseInt(cfg.pageSize || '12', 10) || 12;
  var listEl = cfg.entity === 'media'
    ? (comp.querySelector('[data-cms-repeat="media"]') || comp)
    : (comp.querySelector('[data-wb-post-grid], .wb-cases-list__grid, .wb-post-list__grid') || comp);
  var paginationEl = comp.querySelector('nav[data-cms-pagination], .wb-post-list-pagination');
  var currentPage = readCurrentPage();
  fetchPage(currentPage);

  function readActiveValue() {
    try {
      var url = new URL(window.location.href);
      return String(url.searchParams.get(cfg.paramKey) || '').trim();
    } catch (_) {
      return '';
    }
  }

  function readCurrentPage() {
    try {
      var url = new URL(window.location.href);
      var raw = url.searchParams.get('page') || url.searchParams.get('pageNo') || '1';
      var page = parseInt(raw, 10);
      return Number.isFinite(page) && page > 0 ? page : 1;
    } catch (_) {
      return 1;
    }
  }

  function buildPageHref(page) {
    try {
      var url = new URL(window.location.href);
      if (page <= 1) {
        url.searchParams.delete('page');
        url.searchParams.delete('pageNo');
      } else {
        url.searchParams.set('page', String(page));
        url.searchParams.delete('pageNo');
      }
      return url.pathname + url.search + url.hash;
    } catch (_) {
      return page > 1 ? ('?page=' + page) : (window.location.pathname || '#');
    }
  }

  function syncPageUrl(page, mode) {
    try {
      var href = buildPageHref(page);
      var method = mode === 'push' ? 'pushState' : 'replaceState';
      window.history && window.history[method] && window.history[method](null, '', href);
    } catch (_) {
      // noop
    }
  }

  function fetchPage(page) {
    currentPage = page;
    renderStatus('Loading...');
    if (paginationEl) {
      paginationEl.innerHTML = '';
      paginationEl.style.display = 'none';
    }

    var params = new URLSearchParams();
    params.set('pageNo', String(page));
    params.set('pageSize', String(pageSize));
    params.set(cfg.paramKey, activeValue);
    var lang = resolveLanguage();
    if (lang && cfg.includeLanguage) {
      params.set('language', lang);
    }

    if (!cfg.endpoint) {
      renderStatus('Dynamic content endpoint is not configured.');
      return;
    }

    fetch(cfg.endpoint + '?' + params.toString(), { headers: buildHeaders() })
      .then(function(res){ return res.json(); })
      .then(function(json){
        var data = json && json.data;
        var list = Array.isArray(data && data.list) ? data.list : [];
        var total = Number(data && data.total) || 0;
        renderList(list);
        renderPagination(total);
      })
      .catch(function(){
        renderStatus('Failed to load content.');
      });
  }

  function renderList(list) {
    if (!Array.isArray(list) || !list.length) {
      renderStatus('No content found.');
      return;
    }
    listEl.innerHTML = list.map(function(item){
      return renderTemplate(tplEl.textContent || tplEl.innerHTML || '', transform(item));
    }).join('');
  }

  function renderPagination(total) {
    if (!paginationEl) return;
    var totalPages = Math.ceil((Number(total) || 0) / pageSize);
    if (totalPages <= 1) {
      paginationEl.innerHTML = '';
      paginationEl.style.display = 'none';
      syncPageUrl(1, 'replace');
      return;
    }

    var html = '';
    if (currentPage > 1) {
      html += '<button type="button" class="wb-post-list-page-btn" data-page-no="' + (currentPage - 1) + '" aria-label="上一页">${LOOP_GRID_PREV_ICON}</button>';
    }
    for (var page = 1; page <= totalPages; page++) {
      var activeCls = page === currentPage ? ' active' : '';
      html += '<button type="button" class="wb-post-list-page-btn' + activeCls + '" data-page-no="' + page + '">' + page + '</button>';
    }
    if (currentPage < totalPages) {
      html += '<button type="button" class="wb-post-list-page-btn" data-page-no="' + (currentPage + 1) + '" aria-label="下一页">${LOOP_GRID_NEXT_ICON}</button>';
    }

    paginationEl.innerHTML = html;
    paginationEl.style.display = '';
    Array.prototype.forEach.call(paginationEl.querySelectorAll('[data-page-no]'), function(btn){
      btn.addEventListener('click', function(){
        var pageNo = parseInt(btn.getAttribute('data-page-no') || '1', 10) || 1;
        if (pageNo === currentPage) return;
        syncPageUrl(pageNo, 'push');
        fetchPage(pageNo);
      });
    });
    syncPageUrl(currentPage, 'replace');
  }

  function renderTemplate(template, data) {
    return String(template || '')
      .replace(/\\{\\{@format:([^:}]+):([^}]+)\\}\\}/g, function(_, field, format){
        return escHtml(formatDate(data[field], format));
      })
      .replace(/\\{\\{([^}]+)\\}\\}/g, function(_, field){
        return escHtml(data[field] == null ? '' : String(data[field]));
      });
  }

  function formatDate(value, format) {
    if (value == null || value === '') return '';
    var date = null;
    if (Array.isArray(value) && value.length >= 3) {
      date = new Date(Number(value[0]), Number(value[1]) - 1, Number(value[2]), Number(value[3] || 0), Number(value[4] || 0), Number(value[5] || 0));
    } else if (typeof value === 'string' || typeof value === 'number') {
      date = new Date(value);
    }
    if (!date || isNaN(date.getTime())) return String(value);
    var parts = {
      yyyy: String(date.getFullYear()),
      MM: ('0' + (date.getMonth() + 1)).slice(-2),
      dd: ('0' + date.getDate()).slice(-2),
      HH: ('0' + date.getHours()).slice(-2),
      mm: ('0' + date.getMinutes()).slice(-2),
      ss: ('0' + date.getSeconds()).slice(-2),
    };
    return String(format || 'yyyy-MM-dd').replace(/yyyy|MM|dd|HH|mm|ss/g, function(token){
      return parts[token] || token;
    });
  }

  function renderStatus(message) {
    listEl.innerHTML = '<div class="wb-post-list-empty">' + escHtml(message) + '</div>';
  }

  function buildHeaders() {
    var headers = {};
    if (cfg.requestHeaderName && cfg.requestHeaderValue) {
      headers[cfg.requestHeaderName] = String(cfg.requestHeaderValue);
    }
    return headers;
  }

  function resolveLanguage() {
    var attrLang = String(document.documentElement.getAttribute('lang') || '').trim();
    if (attrLang) return attrLang;
    var seg = String((window.location.pathname || '/').split('/').filter(Boolean)[0] || '').trim();
    return /^[a-z]{2}(?:-[a-z]{2})?$/i.test(seg) ? seg : 'en';
  }

  function escHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();`
}

/**
 * 构建搜索组件的内联 IIFE 脚本
 * 点击搜索按钮后在当前页面内调用 API 并渲染结果列表
 */
function buildSearchIIFE(
  endpoint: string,
  requestConfig: Required<CmsRuntimeRequestConfig>
): string {
  const runtimeConfig = JSON.stringify({
    endpoint,
    requestHeaderName: requestConfig.headerName,
    requestHeaderValue: requestConfig.headerValue
  })
  return `
(function(){
  var cfg = ${runtimeConfig};
  var PAGE_SIZE = 20;
  var currentPage = 1;
  var currentKeyword = '';
  var comp = document.currentScript.parentElement;
  var qInput = comp.querySelector('.cms-search-q');
  var btn = comp.querySelector('.cms-search-submit');
  var statsEl = comp.querySelector('.cms-search-stats');
  var resultsEl = comp.querySelector('.cms-search-results');
  var pagEl = comp.querySelector('.cms-search-pagination');
  if (!qInput || !btn || !resultsEl) return;

  var LANG = resolveLanguage();
  btn.onclick = function(){ doSearch(1); };
  qInput.addEventListener('keydown', function(e){ if(e.key==='Enter') doSearch(1); });
  hydrateFromUrl();

  function resolveLanguage() {
    var attrLang = (document.documentElement.getAttribute('data-language') || '').trim();
    if (attrLang) return attrLang;
    var htmlLang = (document.documentElement.lang || '').trim();
    if (htmlLang) return htmlLang;
    var seg = (location.pathname.split('/')[1] || '').trim();
    return /^[a-z]{2}(?:[-_][a-z]{2})?$/i.test(seg) ? seg : '';
  }

  function hydrateFromUrl() {
    try {
      var params = new URLSearchParams(window.location.search || '');
      var initialKeyword = (params.get('q') || '').trim();
      if (!initialKeyword) return;
      qInput.value = initialKeyword;
      doSearch(1, { syncUrl: false });
    } catch (e) {
      console.warn('[wb-cms-search] failed to read query params', e);
    }
  }

  function syncUrl(kw) {
    try {
      var url = new URL(window.location.href);
      if (kw) url.searchParams.set('q', kw);
      else url.searchParams.delete('q');
      window.history.replaceState({}, '', url.toString());
    } catch (e) {
      console.warn('[wb-cms-search] failed to sync query params', e);
    }
  }

  function doSearch(pageNo, options) {
    options = options || {};
    var kw = qInput.value.trim();
    if (!kw) return;
    currentKeyword = kw;
    currentPage = pageNo;
    if (options.syncUrl !== false && pageNo === 1) syncUrl(kw);
    resultsEl.innerHTML = '<div style="text-align:center;padding:24px;color:#6b7280;">Searching...</div>';
    if (statsEl) statsEl.textContent = '';
    if (pagEl) pagEl.innerHTML = '';

    var qs = 'keyword=' + encodeURIComponent(kw)
           + '&pageNo=' + pageNo + '&pageSize=' + PAGE_SIZE;
    if (LANG) qs += '&language=' + encodeURIComponent(LANG);
    if (!cfg.endpoint) { showError(); return; }
    fetch(cfg.endpoint + '?' + qs, { headers: buildHeaders() })
      .then(function(r){ return r.json(); })
      .then(function(json){
        if (json.code !== 0 || !json.data) { showError(); return; }
        var list = json.data.list || [];
        var total = json.data.total || 0;
        if (list.length === 0) { showNoResults(); return; }
        if (statsEl) statsEl.textContent = total + ' results found';
        resultsEl.innerHTML = list.map(function(item){ return renderCard(item); }).join('');
        var totalPages = Math.ceil(total / PAGE_SIZE);
        if (totalPages > 1 && pagEl) renderPagination(totalPages);
      })
      .catch(function(e){ console.error(e); showError(); });
  }

  function buildHeaders() {
    var headers = {};
    if (cfg.requestHeaderName && cfg.requestHeaderValue) {
      headers[cfg.requestHeaderName] = String(cfg.requestHeaderValue);
    }
    return headers;
  }

  function showNoResults() {
    resultsEl.innerHTML = '<div style="text-align:center;padding:24px;color:#9ca3af;">No results found.</div>';
    if (statsEl) statsEl.textContent = '0 results found';
  }
  function showError() {
    resultsEl.innerHTML = '<div style="text-align:center;padding:24px;color:#9ca3af;">Search failed, please try again.</div>';
  }

  function renderCard(item) {
    var typeLabel = { post:'Article', product:'Product', media:'Media' };
    var typeBg = { post:'#dbeafe', product:'#dcfce7', media:'#fef3c7' };
    var typeColor = { post:'#1d4ed8', product:'#15803d', media:'#b45309' };
    var img = item.image ? '<img style="width:100px;aspect-ratio:1;;object-fit:contain;border-radius:6px;flex-shrink:0;background:#f3f4f6;" src="' + esc(item.image) + '" alt="" />' : '';
    var time = formatTime(item.publishTime);
    var timeHtml = time ? '<div style="font-size:12px;color:#9ca3af;margin-top:4px;">' + time + '</div>' : '';
    var title = highlight(esc(item.title || ''));
    var desc = highlight(esc(item.description || ''));
    return '<div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:12px;">'
      + '<a href="' + esc(item.url || '#') + '" style="text-decoration:none;color:inherit;display:flex;gap:12px;">'
      + img
      + '<div style="flex:1;min-width:0;">'
      + '<span style="display:inline-block;font-size:11px;font-weight:600;text-transform:uppercase;padding:2px 8px;border-radius:4px;margin-bottom:4px;background:' + (typeBg[item.type]||'#f3f4f6') + ';color:' + (typeColor[item.type]||'#374151') + ';">' + (typeLabel[item.type]||esc(item.type)) + '</span>'
      + '<div style="font-size:15px;font-weight:600;margin-bottom:2px;">' + title + '</div>'
      + '<div style="font-size:13px;color:#6b7280;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + desc + '</div>'
      + timeHtml
      + '</div></a></div>';
  }

  function formatTime(t) {
    if (!t) return '';
    if (typeof t === 'number') {
      var d = new Date(t);
      return d.getFullYear() + '-' + ('0'+(d.getMonth()+1)).slice(-2) + '-' + ('0'+d.getDate()).slice(-2);
    }
    if (Array.isArray(t)) { return t[0]+'-'+('0'+t[1]).slice(-2)+'-'+('0'+t[2]).slice(-2); }
    if (typeof t === 'string') return t.substring(0,10);
    return '';
  }

  function highlight(text) {
    if (!currentKeyword || !text) return text;
    var re = new RegExp('(' + escRe(currentKeyword) + ')', 'gi');
    return text.replace(re, '<span style="color:#dc2626;font-weight:700;">$1</span>');
  }
  function escRe(s) { return s.replace(new RegExp('[.*+?^$' + '{}()|\\\\[\\\\]\\\\\\\\]', 'g'), '\\\\$&'); }

  function renderPagination(totalPages) {
    var prevDis = currentPage <= 1 ? ' disabled' : '';
    var nextDis = currentPage >= totalPages ? ' disabled' : '';
    var btnStyle = 'padding:6px 14px;border:1px solid #d1d5db;background:#fff;border-radius:4px;cursor:pointer;font-size:13px;';
    pagEl.innerHTML = '<button class="cms-search-prev" style="' + btnStyle + '"' + prevDis + '>Prev</button>'
      + '<span style="padding:6px 10px;font-size:13px;color:#6b7280;">' + currentPage + ' / ' + totalPages + '</span>'
      + '<button class="cms-search-next" style="' + btnStyle + '"' + nextDis + '>Next</button>';
    var prevBtn = pagEl.querySelector('.cms-search-prev');
    var nextBtn = pagEl.querySelector('.cms-search-next');
    if (prevBtn) prevBtn.onclick = function(){ doSearch(currentPage - 1); };
    if (nextBtn) nextBtn.onclick = function(){ doSearch(currentPage + 1); };
  }

  function esc(s) { var d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
})();`
}

interface CmsRegistryEntry {
  /** 发布模板 HTML（不含编辑器 header，repeat 容器只含模板卡片） */
  publishTemplate: string
  /** data-cms-component 值，如 'post-list' */
  dataCmsComponent: string
  /** data-wb-component 值，如 'cms-post-list'（GrapesJS 内部用，发布时移除） */
  dataWbComponent: string
  /** 动态发布模式：getInnerHTML 从实时组件树生成，fixCmsComponentsHtml 不替换 innerHTML */
  dynamicPublish?: boolean
}

/** 按 dataCmsComponent 值存储每种 CMS 组件的发布模板 */
const cmsTypeRegistry = new Map<string, CmsRegistryEntry>()

/**
 * 手动注册 CMS 组件到 cmsTypeRegistry（供不走 registerCmsComponent 的组件使用）。
 * 注册后 fixCmsComponentsHtml() 可以正确同步模型属性到发布 HTML。
 */
export function registerCmsTypeEntry(entry: CmsRegistryEntry): void {
  cmsTypeRegistry.set(entry.dataCmsComponent, entry)
}

/**
 * 返回 editor.getHtml({ attributes }) 回调函数。
 * 对 CMS 组件：移除 data-wb-component，确保 data-cms-component 存在。
 */
export function getCmsAttributesCallback(): (
  component: any,
  attrs: Record<string, string>
) => Record<string, string> {
  return (component: any, attrs: Record<string, string>) => {
    if (!attrs['data-cms-component'] && !attrs['data-wb-component']) return attrs

    try {
      component?._syncAttrs?.()
    } catch {
      // 忽略同步异常，继续使用当前 attributes 导出
    }

    const latestAttrs = component?.getAttributes?.() || attrs
    const result = { ...attrs, ...latestAttrs }
    if (result['data-wb-component'] === 'cms-cases-list') {
      result['data-cms-component'] = 'cases-list'
    }

    // 如果有 data-wb-component 但缺少 data-cms-component，从注册表补全
    if (result['data-wb-component'] && !result['data-cms-component']) {
      for (const entry of cmsTypeRegistry.values()) {
        if (entry.dataWbComponent === result['data-wb-component']) {
          result['data-cms-component'] = entry.dataCmsComponent
          break
        }
      }
    }

    if (result['data-cms-component'] === 'product-list') {
      const categoryId = String(
        component?.get?.('cmsCategoryId') ??
          result['data-category-id'] ??
          result['data-wb-category-id'] ??
          ''
      ).trim()
      const sortField =
        String(
          component?.get?.('cmsSortField') ??
            result['data-sort-field'] ??
            result['data-wb-sort-field'] ??
            'createTime'
        ).trim() || 'createTime'
      const sortAsc =
        String(
          component?.get?.('cmsSortAsc') ??
            result['data-sort-asc'] ??
            result['data-wb-sort-asc'] ??
            'false'
        ).trim() || 'false'
      const pageSize =
        String(
          component?.get?.('cmsPageSize') ??
            result['data-page-size'] ??
            result['data-wb-page-size'] ??
            '12'
        ).trim() || '12'
      const pagination =
        String(
          component?.get?.('cmsPagination') ??
            result['data-pagination'] ??
            result['data-wb-pagination'] ??
            'static'
        ).trim() || 'static'
      const maxPages =
        String(
          component?.get?.('cmsMaxPages') ??
            result['data-max-pages'] ??
            result['data-wb-max-pages'] ??
            '10'
        ).trim() || '10'
      const listMode =
        String(
          component?.get?.('cmsListMode') ??
            result['data-list-mode'] ??
            result['data-wb-list-mode'] ??
            'grid'
        ).trim() || 'grid'
      const loadAll =
        listMode === 'datasheet' ||
        result['data-load-all'] === 'true' ||
        result['data-wb-load-all'] === 'true'
          ? 'true'
          : 'false'

      result['data-category-id'] = categoryId
      result['data-wb-category-id'] = categoryId
      result['data-sort-field'] = sortField
      result['data-wb-sort-field'] = sortField
      result['data-sort-asc'] = sortAsc
      result['data-wb-sort-asc'] = sortAsc
      result['data-page-size'] = loadAll === 'true' ? '9999' : pageSize
      result['data-wb-page-size'] = loadAll === 'true' ? '9999' : pageSize
      result['data-pagination'] = loadAll === 'true' ? 'none' : pagination
      result['data-wb-pagination'] = loadAll === 'true' ? 'none' : pagination
      result['data-max-pages'] = loadAll === 'true' ? '1' : maxPages
      result['data-wb-max-pages'] = loadAll === 'true' ? '1' : maxPages
      result['data-list-mode'] = listMode
      result['data-wb-list-mode'] = listMode
      result['data-load-all'] = loadAll
      result['data-wb-load-all'] = loadAll
    }

    if (result['data-cms-component'] === 'faq-section') {
      const categoryId = String(
        component?.get?.('cmsCategoryId') ??
          result['data-category-id'] ??
          result['data-wb-category-id'] ??
          ''
      ).trim()
      const limit =
        String(
          component?.get?.('cmsLimit') ?? result['data-limit'] ?? result['data-wb-limit'] ?? '6'
        ).trim() || '6'

      result['data-category-id'] = categoryId
      result['data-wb-category-id'] = categoryId
      result['data-limit'] = limit
      result['data-wb-limit'] = limit
    }

    if (
      result['data-cms-component'] === 'post-list' ||
      result['data-cms-component'] === 'cases-list'
    ) {
      const isCasesList = result['data-cms-component'] === 'cases-list'
      const categoryId = String(
        component?.get?.('cmsCategoryId') ??
          result['data-category-id'] ??
          result['data-wb-category-id'] ??
          ''
      ).trim()
      const enableTagFilter =
        isTruthyFlag(component?.get?.('cmsEnableTagFilter')) ||
        isTruthyFlag(result['data-enable-tag-filter']) ||
        isTruthyFlag(result['data-enable-tag'])
          ? 'true'
          : 'false'
      const pageSize =
        String(
          component?.get?.('cmsPageSize') ??
            result['data-page-size'] ??
            result['data-wb-page-size'] ??
            '12'
        ).trim() || '12'
      const pagination =
        String(
          component?.get?.('cmsPagination') ??
            result['data-pagination'] ??
            result['data-wb-pagination'] ??
            'static'
        ).trim() || 'static'
      const maxPages =
        String(
          component?.get?.('cmsMaxPages') ??
            result['data-max-pages'] ??
            result['data-wb-max-pages'] ??
            '10'
        ).trim() || '10'
      const typeCode = String(
        component?.get?.('cmsTypeCode') ??
          result['data-type-code'] ??
          result['data-post-type-code'] ??
          ''
      ).trim()
      const selectionModeRaw = String(
        result['data-tag-selection-mode'] ??
          result['data-tag-filter-mode'] ??
          result['data-tag-mode'] ??
          ''
      )
        .trim()
        .toLowerCase()
      const selectionMode =
        selectionModeRaw === 'multi-none' ? 'multi-none' : isCasesList ? 'multi-none' : 'single-all'

      result['data-category-id'] = categoryId
      result['data-wb-category-id'] = categoryId
      result['data-enable-tag-filter'] = enableTagFilter
      result['data-tag-selection-mode'] = selectionMode
      result['data-page-size'] = pageSize
      result['data-wb-page-size'] = pageSize
      result['data-pagination'] = pagination
      result['data-wb-pagination'] = pagination
      result['data-max-pages'] = maxPages
      result['data-wb-max-pages'] = maxPages
      result['data-type-code'] = typeCode
    }

    if (hasLoopGridSignature(result)) {
      cleanupLoopGridExportAttrsRecord(result, { keepInstanceId: true })
    }

    // 移除 GrapesJS 内部属性
    delete result['data-wb-component']

    return result
  }
}

/**
 * 后处理 editor.getHtml() 的输出，确保 CMS 组件的 HTML 包含所有
 * data-cms-* 模板属性供后端渲染引擎使用。
 *
 * 策略：
 *  1. 从编辑器模型树收集所有 CMS 组件的模型属性（_syncAttrs 维护的最新值）
 *  2. 用 DOMParser 解析 HTML
 *  3. 对每个 CMS 组件：设置正确的模型属性 + 替换 innerHTML 为静态发布模板
 *  4. 移除 data-wb-component（GrapesJS 内部用，后端不需要）
 *  5. 清理 live preview 痕迹
 */
export function fixCmsComponentsHtml(htmlStr: string, editor: any): string {
  if (!htmlStr || !editor) return htmlStr

  // Step 1: 从编辑器模型树收集所有 CMS 组件的模型属性
  const cmsModels: Array<{
    id: string
    dataCmsComponent: string
    instanceId: string
    isLoopGrid: boolean
    publishHtml: string
    attributes: Record<string, string>
    props: Record<string, string>
  }> = []

  function walk(component: any): void {
    const attrs = component.getAttributes?.() || {}
    const cmsComp =
      attrs['data-wb-component'] === 'cms-cases-list'
        ? 'cases-list'
        : attrs['data-cms-component'] || ''
    if (cmsComp && (cmsTypeRegistry.has(cmsComp) || cmsComp === 'loop-grid')) {
      try {
        component?._syncAttrs?.()
      } catch {
        // 忽略同步异常，继续使用当前 attributes
      }
      const syncedAttrs = component.getAttributes?.() || attrs
      const id = component.getId?.() || component.get?.('id') || ''
      const instanceId = String(
        syncedAttrs['data-wb-instance-id'] || component.getId?.() || component.cid || ''
      ).trim()
      const isLoopGrid = hasLoopGridSignature(syncedAttrs)
      const publishHtml = isLoopGrid ? String(component.getInnerHTML?.() || '') : ''
      cmsModels.push({
        id,
        dataCmsComponent: cmsComp,
        instanceId,
        isLoopGrid,
        publishHtml,
        attributes: { ...syncedAttrs },
        props: {
          cmsCategoryId: String(component.get?.('cmsCategoryId') ?? '').trim(),
          cmsEnableTagFilter: String(component.get?.('cmsEnableTagFilter') ?? '').trim(),
          cmsLimit: String(component.get?.('cmsLimit') ?? '').trim(),
          cmsSortField: String(component.get?.('cmsSortField') ?? '').trim(),
          cmsSortAsc: String(component.get?.('cmsSortAsc') ?? '').trim(),
          cmsPageSize: String(component.get?.('cmsPageSize') ?? '').trim(),
          cmsPagination: String(component.get?.('cmsPagination') ?? '').trim(),
          cmsMaxPages: String(component.get?.('cmsMaxPages') ?? '').trim(),
          cmsListMode: String(component.get?.('cmsListMode') ?? '').trim(),
          cmsTypeCode: String(component.get?.('cmsTypeCode') ?? '').trim()
        }
      })
    }
    // 递归
    const children = component.components?.()
    if (children && children.length) {
      children.forEach((child: any) => walk(child))
    }
  }

  // 遍历所有页面
  const pages = editor.Pages?.getAll?.() || []
  if (pages.length > 0) {
    pages.forEach((page: any) => {
      const main = page.getMainComponent?.()
      if (main) walk(main)
    })
  } else {
    const wrapper = editor.DomComponents?.getWrapper?.()
    if (wrapper) walk(wrapper)
  }

  // Step 2: 解析 HTML
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlStr, 'text/html')
  const cmsModelTypeCounts = cmsModels.reduce<Record<string, number>>((acc, item) => {
    acc[item.dataCmsComponent] = (acc[item.dataCmsComponent] || 0) + 1
    return acc
  }, {})
  const docCmsTypeCounts = Array.from(doc.querySelectorAll('[data-cms-component]')).reduce<
    Record<string, number>
  >((acc, el) => {
    const type = String(el.getAttribute('data-cms-component') || '').trim()
    if (!type) return acc
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})
  // Step 3: 修复 CMS 组件（通过模型收集到的信息）
  cmsModels.forEach(
    ({ id, dataCmsComponent, instanceId, isLoopGrid, publishHtml, attributes, props }) => {
      const entry = cmsTypeRegistry.get(dataCmsComponent)
      if (!entry && dataCmsComponent !== 'loop-grid') return

      // 通过 ID 或 data-wb-component 或 data-cms-component 匹配 HTML 元素
      let el: HTMLElement | null = null
      if (id) el = doc.getElementById(id)
      if (!el && instanceId) {
        el = doc.querySelector(`[data-wb-instance-id="${CSS.escape(instanceId)}"]`)
      }
      if (
        !el &&
        cmsModelTypeCounts[dataCmsComponent] === 1 &&
        docCmsTypeCounts[dataCmsComponent] === 1
      ) {
        el = doc.querySelector(`[data-cms-component="${dataCmsComponent}"]`)
      }
      if (!el && cmsModelTypeCounts[dataCmsComponent] === 1 && entry) {
        el = doc.querySelector(`[data-wb-component="${entry.dataWbComponent}"]`)
      }
      if (!el && dataCmsComponent === 'loop-grid' && cmsModelTypeCounts[dataCmsComponent] === 1) {
        el = doc.querySelector(
          '[data-wb-component="loop-grid"], .wb-loop-grid, [data-wb-loop-grid-schema]'
        )
      }
      if (!el && dataCmsComponent === 'loop-grid' && cmsModelTypeCounts[dataCmsComponent] === 1) {
        const paginationOnly = doc.querySelector('.wb-loop-grid-pagination') as HTMLElement | null
        if (paginationOnly) {
          const wrapper = doc.createElement('div')
          wrapper.setAttribute('class', 'wb-loop-grid')
          paginationOnly.replaceWith(wrapper)
          wrapper.appendChild(paginationOnly)
          el = wrapper
        }
      }
      if (!el) return

      const mergedAttributes = { ...attributes, 'data-cms-component': dataCmsComponent }
      if (dataCmsComponent === 'product-list') {
        const categoryId =
          props.cmsCategoryId ||
          mergedAttributes['data-category-id'] ||
          mergedAttributes['data-wb-category-id'] ||
          ''
        const sortField =
          props.cmsSortField ||
          mergedAttributes['data-sort-field'] ||
          mergedAttributes['data-wb-sort-field'] ||
          'createTime'
        const sortAsc =
          props.cmsSortAsc ||
          mergedAttributes['data-sort-asc'] ||
          mergedAttributes['data-wb-sort-asc'] ||
          'false'
        const pageSize =
          props.cmsPageSize ||
          mergedAttributes['data-page-size'] ||
          mergedAttributes['data-wb-page-size'] ||
          '12'
        const pagination =
          props.cmsPagination ||
          mergedAttributes['data-pagination'] ||
          mergedAttributes['data-wb-pagination'] ||
          'static'
        const maxPages =
          props.cmsMaxPages ||
          mergedAttributes['data-max-pages'] ||
          mergedAttributes['data-wb-max-pages'] ||
          '10'
        const listMode =
          props.cmsListMode ||
          mergedAttributes['data-list-mode'] ||
          mergedAttributes['data-wb-list-mode'] ||
          'grid'
        const loadAll =
          listMode === 'datasheet' ||
          mergedAttributes['data-load-all'] === 'true' ||
          mergedAttributes['data-wb-load-all'] === 'true'
            ? 'true'
            : 'false'

        mergedAttributes['data-category-id'] = categoryId
        mergedAttributes['data-wb-category-id'] = categoryId
        mergedAttributes['data-sort-field'] = sortField
        mergedAttributes['data-wb-sort-field'] = sortField
        mergedAttributes['data-sort-asc'] = sortAsc
        mergedAttributes['data-wb-sort-asc'] = sortAsc
        mergedAttributes['data-page-size'] = loadAll === 'true' ? '9999' : pageSize
        mergedAttributes['data-wb-page-size'] = loadAll === 'true' ? '9999' : pageSize
        mergedAttributes['data-pagination'] = loadAll === 'true' ? 'none' : pagination
        mergedAttributes['data-wb-pagination'] = loadAll === 'true' ? 'none' : pagination
        mergedAttributes['data-max-pages'] = loadAll === 'true' ? '1' : maxPages
        mergedAttributes['data-wb-max-pages'] = loadAll === 'true' ? '1' : maxPages
        mergedAttributes['data-list-mode'] = listMode
        mergedAttributes['data-wb-list-mode'] = listMode
        mergedAttributes['data-load-all'] = loadAll
        mergedAttributes['data-wb-load-all'] = loadAll
      }

      if (dataCmsComponent === 'faq-section') {
        const categoryId =
          props.cmsCategoryId ||
          mergedAttributes['data-category-id'] ||
          mergedAttributes['data-wb-category-id'] ||
          ''
        const limit =
          props.cmsLimit ||
          mergedAttributes['data-limit'] ||
          mergedAttributes['data-wb-limit'] ||
          '6'

        mergedAttributes['data-category-id'] = categoryId
        mergedAttributes['data-wb-category-id'] = categoryId
        mergedAttributes['data-limit'] = limit
        mergedAttributes['data-wb-limit'] = limit
      }

      if (dataCmsComponent === 'post-list' || dataCmsComponent === 'cases-list') {
        const isCasesList = dataCmsComponent === 'cases-list'
        const categoryId =
          props.cmsCategoryId ||
          mergedAttributes['data-category-id'] ||
          mergedAttributes['data-wb-category-id'] ||
          ''
        const enableTagFilter =
          isTruthyFlag(props.cmsEnableTagFilter) ||
          isTruthyFlag(mergedAttributes['data-enable-tag-filter']) ||
          isTruthyFlag(mergedAttributes['data-enable-tag'])
            ? 'true'
            : 'false'
        const pageSize =
          props.cmsPageSize ||
          mergedAttributes['data-page-size'] ||
          mergedAttributes['data-wb-page-size'] ||
          '12'
        const pagination =
          props.cmsPagination ||
          mergedAttributes['data-pagination'] ||
          mergedAttributes['data-wb-pagination'] ||
          'static'
        const maxPages =
          props.cmsMaxPages ||
          mergedAttributes['data-max-pages'] ||
          mergedAttributes['data-wb-max-pages'] ||
          '10'
        const typeCode =
          props.cmsTypeCode ||
          mergedAttributes['data-type-code'] ||
          mergedAttributes['data-post-type-code'] ||
          ''
        const selectionModeRaw = String(
          mergedAttributes['data-tag-selection-mode'] ||
            mergedAttributes['data-tag-filter-mode'] ||
            mergedAttributes['data-tag-mode'] ||
            ''
        )
          .trim()
          .toLowerCase()
        const selectionMode =
          selectionModeRaw === 'multi-none'
            ? 'multi-none'
            : isCasesList
              ? 'multi-none'
              : 'single-all'

        mergedAttributes['data-category-id'] = categoryId
        mergedAttributes['data-wb-category-id'] = categoryId
        mergedAttributes['data-enable-tag-filter'] = enableTagFilter
        mergedAttributes['data-tag-selection-mode'] = selectionMode
        mergedAttributes['data-page-size'] = pageSize
        mergedAttributes['data-wb-page-size'] = pageSize
        mergedAttributes['data-pagination'] = pagination
        mergedAttributes['data-wb-pagination'] = pagination
        mergedAttributes['data-max-pages'] = maxPages
        mergedAttributes['data-wb-max-pages'] = maxPages
        mergedAttributes['data-type-code'] = typeCode
      }

      // 写入模型属性（包含 data-cms-component, data-category-id, data-page-size 等）
      for (const [key, value] of Object.entries(mergedAttributes)) {
        const keepEmptyAttr = key === 'data-category-id'
        if (value !== undefined && value !== null && (value !== '' || keepEmptyAttr)) {
          el.setAttribute(key, String(value))
        } else {
          el.removeAttribute(key)
        }
      }
      // 确保 data-cms-component 存在
      el.setAttribute('data-cms-component', dataCmsComponent)

      if (isLoopGrid && publishHtml) {
        el.innerHTML = publishHtml
      }

      const postListGrid = ensurePostListRootStructure(doc, el, dataCmsComponent)

      if (dataCmsComponent === 'product-list' || dataCmsComponent === 'search') {
        const requestConfig = getRuntimeRequestConfig()
        if (requestConfig.headerName) {
          el.setAttribute('data-wb-request-header-name', requestConfig.headerName)
        }
        if (requestConfig.headerValue !== undefined && requestConfig.headerValue !== null && requestConfig.headerValue !== '') {
          el.setAttribute('data-wb-request-header-value', String(requestConfig.headerValue))
        }

        if (dataCmsComponent === 'product-list') {
          const runtimeTemplateEl = el.querySelector('script[data-wb-product-card-template]')
          const templateCard = el.querySelector('[data-cms-repeat="product"]')
          if (runtimeTemplateEl && templateCard) {
            runtimeTemplateEl.textContent = buildRuntimeCardTemplate(templateCard)
          }
        }
      }

      // dynamicPublish 模式：innerHTML 已由 getInnerHTML 动态生成，不替换
      if (entry && !entry.dynamicPublish && !isLoopGrid) {
        // 替换 innerHTML 为静态发布模板
        el.innerHTML = entry.publishTemplate
      }

      if (dataCmsComponent === 'post-list' || dataCmsComponent === 'cases-list') {
        const isCasesList = dataCmsComponent === 'cases-list'
        const enableTagFilter =
          String(mergedAttributes['data-enable-tag-filter'] || '').trim() === 'true'
        const existingFilterBar = el.querySelector('[data-post-list-tag-filter]')
        if (!enableTagFilter) {
          existingFilterBar?.remove()
        } else {
          let filterBar = existingFilterBar as HTMLElement | null
          if (!filterBar) {
            filterBar = doc.createElement('div')
            filterBar.setAttribute('class', 'wb-post-list-tag-filter')
            filterBar.setAttribute('data-post-list-tag-filter', 'true')
            el.insertBefore(filterBar, el.firstChild)
          }

          const templateCard =
            postListGrid?.querySelector('[data-cms-repeat="post"]') ||
            el.querySelector(
              '[data-wb-post-grid] [data-cms-repeat="post"], .wb-cases-list__grid [data-cms-repeat="post"], .wb-post-list__grid [data-cms-repeat="post"]'
            ) ||
            Array.from(el.children).find((child) => child.classList.contains('wb-post-card'))
          if (templateCard) {
            const tplScript = doc.createElement('script')
            tplScript.setAttribute('type', 'text/html')
            tplScript.setAttribute('data-post-list-card-template', 'true')
            tplScript.textContent = buildRuntimeCardTemplate(templateCard)
            el.appendChild(tplScript)

            const iifeScript = doc.createElement('script')
            iifeScript.textContent = buildPostListTagFilterIIFE({
              pageSize: String(mergedAttributes['data-page-size'] || '12'),
              categoryId: String(mergedAttributes['data-category-id'] || ''),
              postPageEndpoint: getRuntimeEndpoint('postPage'),
              postTagListEndpoint: getRuntimeEndpoint('postTagList'),
              postTagListAllEndpoint: getRuntimeEndpoint('postTagListAll'),
              requestConfig: getRuntimeRequestConfig(),
              selectionMode: String(
                mergedAttributes['data-tag-selection-mode'] ||
                  (isCasesList ? 'multi-none' : 'single-all')
              )
            })
            el.appendChild(iifeScript)
          }
        }
      }

      if (
        dataCmsComponent === 'post-list' ||
        dataCmsComponent === 'cases-list' ||
        dataCmsComponent === 'media-list'
      ) {
        const loopItemType = String(mergedAttributes['data-loop-item-type'] || '').trim()
        const isCategoryLoop = ['postCategory', 'mediaCategory'].includes(loopItemType)
        const queryTemplateCard = isCategoryLoop
          ? null
          : dataCmsComponent === 'media-list'
            ? el.querySelector('.wb-cms-media-grid [data-cms-repeat="media"]') ||
              el.querySelector('[data-cms-repeat="media"] > *')
            : postListGrid?.querySelector('[data-cms-repeat="post"]') ||
              el.querySelector(
                '[data-wb-post-grid] [data-cms-repeat="post"], .wb-cases-list__grid [data-cms-repeat="post"], .wb-post-list__grid [data-cms-repeat="post"]'
              ) ||
              Array.from(el.children).find((child) => child.classList.contains('wb-post-card'))

        if (queryTemplateCard) {
          const tplScript = doc.createElement('script')
          tplScript.setAttribute('type', 'text/html')
          tplScript.setAttribute('data-wb-category-query-template', 'true')
          tplScript.textContent = buildRuntimeCardTemplate(queryTemplateCard)
          el.appendChild(tplScript)

          const iifeScript = doc.createElement('script')
          iifeScript.textContent = buildCategoryQueryOverrideIIFE({
            endpoint:
              dataCmsComponent === 'media-list'
                ? getRuntimeEndpoint('mediaPage')
                : getRuntimeEndpoint('postPage'),
            paramKey: 'categoryId',
            entity: dataCmsComponent === 'media-list' ? 'media' : 'post',
            pageSize: String(mergedAttributes['data-page-size'] || '12'),
            requestConfig: getRuntimeRequestConfig(),
            includeLanguage: true,
            initialValue: String(mergedAttributes['data-category-id'] || '')
          })
          el.appendChild(iifeScript)

        }
      }

      // search 组件：注入内联 AJAX 搜索 IIFE 脚本
      if (dataCmsComponent === 'search') {
        const iifeScript = doc.createElement('script')
        iifeScript.textContent = buildSearchIIFE(
          getRuntimeEndpoint('search'),
          getRuntimeRequestConfig()
        )
        el.appendChild(iifeScript)
      }

      // Step 3b: 根据 data-pagination 属性处理分页导航
      const paginationMode = mergedAttributes['data-pagination'] || 'static'
      const paginationNav =
        paginationMode === 'static'
          ? ensurePaginationNavElement(doc, el, dataCmsComponent)
          : el.querySelector('nav[data-cms-pagination]')

      if (paginationMode === 'none') {
        // none 模式：移除分页导航
        if (paginationNav) paginationNav.remove()
      } else if (paginationMode === 'loadmore') {
        // loadmore 模式：移除分页导航，注入卡片模板 + 按钮 + IIFE 脚本
        if (paginationNav) paginationNav.remove()

        const shouldUseLegacyLoadMore = dataCmsComponent !== 'product-list'
        const apiInfo = shouldUseLegacyLoadMore ? CMS_RUNTIME_API_MAP[dataCmsComponent] : undefined
        if (apiInfo) {
          // 提取卡片模板：Loop Grid 保留自己的循环体，普通组件从注册模板中取第一张卡片。
          const tplDoc = isLoopGrid
            ? null
            : new DOMParser().parseFromString(entry?.publishTemplate || '', 'text/html')
          const repeatContainer = isLoopGrid
            ? el.querySelector('[data-cms-repeat]')
            : tplDoc?.querySelector('[data-cms-repeat]')
          const listGrid = isLoopGrid ? repeatContainer?.parentElement : repeatContainer
          const gridClass = listGrid?.getAttribute('class') || ''
          const templateCard = isLoopGrid ? repeatContainer : repeatContainer?.children?.[0]

          let cardTplHtml = ''
          if (templateCard) {
            const cardClone = templateCard.cloneNode(true) as HTMLElement
            cardClone.removeAttribute('id')
            cardClone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'))
            // 将 data-cms-bind* 属性转为 {{field}} 占位符
            cardClone.querySelectorAll('[data-cms-bind]').forEach((bindEl) => {
              const field = bindEl.getAttribute('data-cms-bind') || ''
              bindEl.textContent = `{{${field}}}`
              bindEl.removeAttribute('data-cms-bind')
            })
            cardClone.querySelectorAll('[data-cms-bind-src]').forEach((bindEl) => {
              const field = bindEl.getAttribute('data-cms-bind-src') || ''
              bindEl.setAttribute('src', `{{${field}}}`)
              bindEl.removeAttribute('data-cms-bind-src')
            })
            cardClone.querySelectorAll('[data-cms-bind-href]').forEach((bindEl) => {
              const field = bindEl.getAttribute('data-cms-bind-href') || ''
              const template = bindEl.getAttribute('data-cms-bind-href-template') || ''
              bindEl.setAttribute('href', composePlaceholderUrl(field, template))
              bindEl.removeAttribute('data-cms-bind-href')
              bindEl.removeAttribute('data-cms-bind-href-template')
            })
            cardTplHtml = cardClone.outerHTML
          }

          // 构建筛选参数
          const params: Record<string, string> = {}
          if (mergedAttributes['data-category-id']) {
            params.categoryId = mergedAttributes['data-category-id']
          }
          if (mergedAttributes['data-resource-type']) {
            if (apiInfo.entity === 'media') params.type = mergedAttributes['data-resource-type']
            else params.resourceType = mergedAttributes['data-resource-type']
          }
          if (mergedAttributes['data-sort-field'])
            params.sortingField = mergedAttributes['data-sort-field']
          if (mergedAttributes['data-sort-asc']) params.asc = mergedAttributes['data-sort-asc']

          const pageSize = mergedAttributes['data-page-size'] || '12'
          const transformFn =
            CMS_TRANSFORM_FN[apiInfo.entity] || 'function transform(item){return item;}'
          const requestConfig = getRuntimeRequestConfig()

          // 注入卡片模板 script
          const tplScript = doc.createElement('script')
          tplScript.setAttribute('type', 'text/html')
          tplScript.setAttribute('class', 'cms-card-tpl')
          tplScript.textContent = cardTplHtml
          el.appendChild(tplScript)

          // 注入加载更多按钮
          const loadMoreWrap = doc.createElement('div')
          loadMoreWrap.setAttribute('class', 'cms-loadmore-wrap')
          loadMoreWrap.setAttribute('style', 'text-align:center;padding:20px 0;')
          loadMoreWrap.innerHTML =
            '<button class="cms-loadmore-btn" style="padding:10px 32px;cursor:pointer;border:1px solid #ddd;background:#fff;border-radius:4px;font-size:14px;">Load More</button>'
          el.appendChild(loadMoreWrap)

          // 注入 IIFE 脚本
          const iifeScript = doc.createElement('script')
          iifeScript.textContent = `
(function(){
  var cfg = {
    endpoint: '${getRuntimeEndpoint(apiInfo.endpoint)}',
    pageSize: ${pageSize},
    params: ${JSON.stringify(params)},
    gridClass: '${gridClass.split(' ')[0]}',
    requestHeaderName: ${JSON.stringify(requestConfig.headerName)},
    requestHeaderValue: ${JSON.stringify(requestConfig.headerValue)}
  };
  var currentPage = 2;
  var comp = document.currentScript.parentElement;
  var grid = comp.querySelector('.' + cfg.gridClass);
  var tpl = comp.querySelector('script.cms-card-tpl');
  var wrap = comp.querySelector('.cms-loadmore-wrap');
  var btn = comp.querySelector('.cms-loadmore-btn');
  if (!grid || !tpl || !btn) return;
  var tplHtml = tpl.textContent || tpl.innerHTML;
  var language = resolveLanguage();

  ${transformFn}

  function resolveLanguage() {
    var attrLang = (document.documentElement.getAttribute('data-language') || '').trim();
    if (attrLang) return attrLang;
    var htmlLang = (document.documentElement.lang || '').trim();
    if (htmlLang) return htmlLang;
    var seg = (location.pathname.split('/')[1] || '').trim();
    return /^[a-z]{2}(?:[-_][a-z]{2})?$/i.test(seg) ? seg : '';
  }
  
  function escHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // URL 字段不做 HTML 实体转义（仅用于 href/src 属性，已经过 encodeURIComponent 处理）
  var URL_FIELDS = { 'post.image': true, 'post.url': true, 'media.url': true, 'media.coverUrl': true, 'media.detailUrl': true, 'product.picUrl': true, 'product.url': true };


  function renderCard(item) {
    var d = transform(item);
    var html = tplHtml;
    for (var k in d) {
      var v = d[k] == null ? '' : d[k];
      html = html.split('{{' + k + '}}').join(URL_FIELDS[k] ? v : escHtml(v));
    }
    return html;
  }

  btn.onclick = function() {
    btn.disabled = true;
    btn.textContent = 'Loading...';
    var qs = 'pageNo=' + currentPage + '&pageSize=' + cfg.pageSize;
    if (language) qs += '&language=' + encodeURIComponent(language);
    for (var k in cfg.params) {
      if (cfg.params[k]) qs += '&' + k + '=' + encodeURIComponent(cfg.params[k]);
    }
    if (!cfg.endpoint) return;
    fetch(cfg.endpoint + '?' + qs, { headers: buildHeaders() })
      .then(function(r){ return r.json(); })
      .then(function(json){
        var list = (json.data && json.data.list) || [];
        var total = (json.data && json.data.total) || 0;
        list.forEach(function(item){
          grid.insertAdjacentHTML('beforeend', renderCard(item));
        });
        currentPage++;
        btn.disabled = false;
        btn.textContent = 'Load More';
        if (currentPage * cfg.pageSize >= total + cfg.pageSize) {
          wrap.style.display = 'none';
        }
      })
      .catch(function(){
        btn.disabled = false;
        btn.textContent = 'Load More';
      });
  };

  function buildHeaders() {
    var headers = {};
    if (cfg.requestHeaderName && cfg.requestHeaderValue) {
      headers[cfg.requestHeaderName] = String(cfg.requestHeaderValue);
    }
    return headers;
  }
})();`
          el.appendChild(iifeScript)
        }
      }
      if (paginationMode === 'static' && paginationNav) {
        ensurePaginationNavFallback(doc, paginationNav as HTMLElement, dataCmsComponent)
      }
      // static 模式（默认）：保留 nav[data-cms-pagination]，SSG 会按总页数重写

      // 移除 GrapesJS 内部属性（后端不需要）
      el.removeAttribute('data-wb-component')
      if (isLoopGrid) {
        cleanupLoopGridExportAttrsElement(el)
      }
    }
  )

  // Step 4: 全局清理 — 即使模型收集失败，也尝试按 data-wb-component 匹配修复
  doc.querySelectorAll('[data-wb-component]').forEach((el) => {
    const wbComp = el.getAttribute('data-wb-component') || ''
    // 从注册表中按 dataWbComponent 查找
    for (const entry of cmsTypeRegistry.values()) {
      if (entry.dataWbComponent === wbComp) {
        const existingCmsComponent = el.getAttribute('data-cms-component') || ''
        const effectiveCmsComponent = cmsTypeRegistry.has(existingCmsComponent)
          ? existingCmsComponent
          : entry.dataCmsComponent
        el.setAttribute('data-cms-component', effectiveCmsComponent)
        if (effectiveCmsComponent === 'product-list' || effectiveCmsComponent === 'search') {
          const requestConfig = getRuntimeRequestConfig()
          if (requestConfig.headerName) {
            el.setAttribute('data-wb-request-header-name', requestConfig.headerName)
          }
          if (requestConfig.headerValue !== '') {
            el.setAttribute('data-wb-request-header-value', String(requestConfig.headerValue))
          }

          if (effectiveCmsComponent === 'product-list') {
            const runtimeTemplateEl = el.querySelector('script[data-wb-product-card-template]')
            const templateCard = el.querySelector('[data-cms-repeat="product"]')
            if (runtimeTemplateEl && templateCard) {
              runtimeTemplateEl.textContent = buildRuntimeCardTemplate(templateCard)
            }
          }
        }
        if (!entry.dynamicPublish) {
          el.innerHTML = entry.publishTemplate
        }
        ensurePostListRootStructure(doc, el as HTMLElement, effectiveCmsComponent)
        // search 组件：注入内联 AJAX 搜索 IIFE 脚本
        if (effectiveCmsComponent === 'search') {
          const iifeScript = doc.createElement('script')
          iifeScript.textContent = buildSearchIIFE(
            getRuntimeEndpoint('search'),
            getRuntimeRequestConfig()
          )
          el.appendChild(iifeScript)
        }
        // 全局清理的 pagination 模式处理（从 el 自身的 data-pagination 属性读取）
        const pMode = el.getAttribute('data-pagination') || 'static'
        if (pMode === 'none' || pMode === 'loadmore') {
          el.querySelector('nav[data-cms-pagination]')?.remove()
        } else if (pMode === 'static') {
          const paginationNav = ensurePaginationNavElement(
            doc,
            el as HTMLElement,
            effectiveCmsComponent
          )
          if (paginationNav) {
            ensurePaginationNavFallback(doc, paginationNav, effectiveCmsComponent)
          }
        }
        el.removeAttribute('data-wb-component')
        break
      }
    }
  })

  // Step 5: 清理 live preview 痕迹
  doc.querySelectorAll('[data-wb-loop-grid-version], [data-wb-loop-grid-schema]').forEach((el) => {
    cleanupLoopGridExportAttrsElement(el)
    el.removeAttribute('data-wb-component')
  })
  doc.querySelectorAll('[data-cms-preview]').forEach((el) => el.remove())
  doc.querySelectorAll('[data-cms-preview-wrapper]').forEach((el) => el.remove())
  doc.querySelectorAll('[data-cms-hidden]').forEach((el) => {
    ;(el as HTMLElement).style.removeProperty('display')
    el.removeAttribute('data-cms-hidden')
  })
  doc
    .querySelectorAll(
      '.wb-cms-editor-header, .wb-cms-latest-header, .wb-cms-detail-header, .wb-cms-search-header'
    )
    .forEach((el) => el.remove())

  // Step 6: 如果有新版文章卡片（class 驱动样式），注入 CSS 到 <head>
  if (doc.querySelector('.wb-post-card') && !doc.getElementById('wb-post-card-styles')) {
    const style = doc.createElement('style')
    style.id = 'wb-post-card-styles'
    style.textContent = POST_CARD_CSS
    doc.head.appendChild(style)
  }

  // Step 7: 如果有新版产品卡片（class 驱动样式），注入 CSS 到 <head>
  if (doc.querySelector('.wb-product-card') && !doc.getElementById('wb-product-card-styles')) {
    const style = doc.createElement('style')
    style.id = 'wb-product-card-styles'
    style.textContent = PRODUCT_CARD_CSS
    doc.head.appendChild(style)
  }

  // Step 8: 如果有产品详情组件（class 驱动样式），注入 CSS 到 <head>
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

  // 输出
  const isFullDocument = htmlStr.trim().toLowerCase().startsWith('<!doctype')
  return isFullDocument ? `<!DOCTYPE html>\n${doc.documentElement.outerHTML}` : doc.body.innerHTML
}

// ── 组件配置接口 ──────────────────────────────────────────────────

export interface CmsComponentConfig {
  /** GrapesJS 组件类型标识，如 'wb-cms-post-list' */
  type: string
  /** data-wb-component 属性值，如 'cms-post-list' */
  dataWbComponent: string
  /** data-cms-component 属性值（供后端渲染引擎识别） */
  dataCmsComponent: string
  /** 编辑器中显示的组件名称 */
  name: string
  /** injectStyleOnce 的去重 key（styles 非空时必填） */
  styleKey?: string
  /** 要注入的组件 CSS（可选，仅用于 hover 等伪类效果；视觉样式应通过组件 style 属性设置） */
  styles?: string
  /** 根元素的额外默认 HTML attributes */
  defaultAttributes?: Record<string, string>
  /** 根元素的默认 style（GrapesJS style 对象，覆盖默认的 display:block;width:100%） */
  defaultStyle?: Record<string, string>
  /** 额外的 model props（trait 驱动的属性）及默认值 */
  defaultProps?: Record<string, any>
  /** Trait 定义列表 */
  traits: any[]
  /** 编辑器预览子组件定义 */
  components: any[]
  /** 根据 model 返回需要同步到 HTML attributes 的键值对 */
  syncAttrs: (model: any) => Record<string, string>
  /** 需要监听 change 事件的 model prop 名称列表 */
  watchProps: string[]
  /** 发布模板从 components 的哪个索引开始（默认 1，跳过编辑器 header） */
  publishStartIndex?: number
  /** 组件 model 初始化后的扩展逻辑 */
  onModelInit?: (model: any, editor: any) => void
  /** 是否允许向组件根节点拖入子组件 */
  droppable?: boolean
  /** 组件脚本（运行于画布 iframe / 发布页面） */
  script?: any
  /** 导出脚本（默认等于 script） */
  scriptExport?: any
  /** 传递给组件脚本的 props 列表 */
  scriptProps?: string[]
  /** 自定义发布模板 HTML（若提供则跳过自动生成，用于需要与编辑器组件结构不同的场景） */
  publishTemplate?: string
  /**
   * 启用动态发布模式。适用于子组件含用户可配置属性的组件（如产品详情的 pm-*-block）。
   * 开启后：
   * - toJSON 保留 components（用户修改的子组件状态可持久化）
   * - getInnerHTML 从实时组件树生成（输出反映用户配置）
   * - fixCmsComponentsHtml 不替换 innerHTML（保留动态输出）
   */
  dynamicPublish?: boolean
}

/**
 * 向 GrapesJS 注册一个 CMS 组件类型。
 * 统一处理：样式注入、isComponent 识别、init/_syncAttrs 事件绑定、toHTML 导出。
 */
export function registerCmsComponent(editor: any, config: CmsComponentConfig): void {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(config.type)) return

  // 发布模板 HTML：优先使用自定义模板，否则从组件定义自动生成
  const startIdx = config.publishStartIndex ?? 1
  const publishTemplate =
    config.publishTemplate ?? componentsToHtml(config.components.slice(startIdx))

  // 注册到全局表，供 fixCmsComponentsHtml() 发布时使用
  cmsTypeRegistry.set(config.dataCmsComponent, {
    publishTemplate,
    dataCmsComponent: config.dataCmsComponent,
    dataWbComponent: config.dataWbComponent,
    dynamicPublish: config.dynamicPublish
  })

  domComponents.addType(config.type, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === config.dataWbComponent
        ? { type: config.type }
        : false,

    model: {
      defaults: {
        name: config.name,
        tagName: 'div',
        draggable: '*',
        droppable: config.droppable ?? false,
        selectable: true,
        editable: false,
        stylable: true,
        attributes: {
          'data-wb-component': config.dataWbComponent,
          'data-cms-component': config.dataCmsComponent,
          ...config.defaultAttributes
        },
        style: config.defaultStyle ?? { display: 'block', width: '100%' },
        styles: config.styles,
        script: config.script,
        'script-export': config.scriptExport ?? config.script,
        'script-props': config.scriptProps,
        ...config.defaultProps,
        traits: config.traits,
        components: config.components
      },

      init(this: any) {
        const eventStr = config.watchProps.map((p) => `change:${p}`).join(' ')
        if (eventStr) {
          this.on(eventStr, this._syncAttrs)
        }
        this._syncAttrs()
        config.onModelInit?.(this, editor)
      },

      _syncAttrs(this: any) {
        this.addAttributes({
          // 始终确保 data-cms-component 存在（旧 schema 可能缺失此属性）
          'data-cms-component': config.dataCmsComponent,
          'data-wb-instance-id': String(this.getId?.() || this.cid || ''),
          ...config.syncAttrs(this)
        })
      },

      /**
       * 覆盖 toJSON()：
       * - 默认模式：不序列化 components（静态子组件，从 defaults 恢复，避免 MutationObserver 污染）
       * - dynamicPublish 模式：保留 components（子组件含用户可配置状态，需要持久化）
       */
      toJSON(this: any, opts: any) {
        // 调用父类 toJSON（含 attributes、自定义 props 等）
        const baseType = domComponents.getType('default')
        const obj = baseType.model.prototype.toJSON.call(this, opts)
        if (!config.dynamicPublish) {
          // 不序列化子组件 — 始终从 defaults 恢复
          delete obj.components
        }
        return obj
      },

      /**
       * 覆盖 getInnerHTML()：
       * - 默认模式：输出静态发布模板，绕过 MutationObserver 污染
       * - dynamicPublish 模式：从实时组件树生成，反映用户对子组件的配置修改
       */
      getInnerHTML(this: any) {
        if (config.dynamicPublish) {
          const children = this.components()
          if (!children || children.length <= startIdx) return ''
          const parts: string[] = []
          for (let i = startIdx; i < children.length; i++) {
            parts.push(children.at(i).toHTML())
          }
          return parts.join('\n')
        }
        return publishTemplate
      }
    }
  })
}
