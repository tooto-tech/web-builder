/**
 * CMS 产品列表 — WYSIWYG 重构版
 *
 * 拆分为 Product List（列表容器）+ Product Card（可编辑卡片）两个组件。
 * 编辑器 HTML = 发布 HTML，不再需要 publishTemplate。
 *
 * 参照文章列表组件的实现模式。
 */
import type { GrapesEditor } from '../../../../../types/editor'
import {
  PAGINATION_TRAITS,
  PAGINATION_PROPS,
  PAGINATION_ATTRS,
  syncPaginationAttrs,
  registerCmsTypeEntry
} from '@/components/WebBuilder/utils/cmsFactory'
import { getEffectiveTenantId } from '@/utils/auth'
import { initProductCategorySelectTrait } from './categorySelectTrait'
import { PRODUCT_CARD_CSS } from './styles'

export { PRODUCT_CARD_CSS } from './styles'

export const WB_CMS_PRODUCT_LIST_TYPE = 'wb-cms-product-list'
export const WB_CMS_PRODUCT_CARD_TYPE = 'wb-cms-product-card'

const PRODUCT_LOOP_ITEM_TYPE_OPTIONS = [
  { value: 'product', label: '产品循环体' },
  { value: 'productCategory', label: '产品分类循环体' }
]

const CATEGORY_LOOP_MODE_OPTIONS = [
  { value: 'root', label: '一级分类' },
  { value: 'childrenOf', label: '指定父级的下级' },
  { value: 'descendantsOf', label: '指定父级下全部子分类' },
  { value: 'currentChildren', label: '当前分类下级' },
  { value: 'currentDescendants', label: '当前分类全部子分类' }
]

const PRODUCT_LIST_MODE_OPTIONS = [
  { value: 'grid', label: '普通产品列表' },
  { value: 'datasheet', label: 'Datasheet 全量筛选' }
]

const DEFAULT_PRODUCT_CARD_TEMPLATE = `
<div class="wb-product-card">
  <div class="wb-product-card-img-wrap">
    <img class="wb-product-card-img" src="{{product.picUrl}}" alt="{{product.name}}" />
  </div>
  <div class="wb-product-card-body">
    <h4 class="wb-product-card-name">
      <a class="wb-product-card-link" href="{{product.url}}" aria-label="{{product.name}}">{{product.name}}</a>
    </h4>
  </div>
</div>
`

function makeProductListScript() {
  return function (this: any) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const root = this
    const readAttr = function (primary: string, fallback?: string) {
      return String(
        root.getAttribute(primary) || (fallback ? root.getAttribute(fallback) : '') || ''
      ).trim()
    }
    const defaultTemplate = `
<div class="wb-product-card">
  <div class="wb-product-card-img-wrap">
    <img class="wb-product-card-img" src="{{product.picUrl}}" alt="{{product.name}}" />
  </div>
  <div class="wb-product-card-body">
    <h4 class="wb-product-card-name">
      <a class="wb-product-card-link" href="{{product.url}}" aria-label="{{product.name}}">{{product.name}}</a>
    </h4>
  </div>
</div>
`.trim()
    const normalizeSiteHref = function (rawValue: any): string {
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

    if (root._wbProductListCleanup) {
      try {
        root._wbProductListCleanup()
      } catch (_) {
        // noop
      }
    }

    let countEls = Array.from(
      root.querySelectorAll('[data-wb-product-filter-count]')
    ) as HTMLElement[]
    const triggerBtn = root.querySelector('[data-wb-product-filter-trigger]')
    const badgeEl = root.querySelector('[data-wb-product-filter-badge]')
    const backdropEl = root.querySelector('[data-wb-product-filter-backdrop]')
    const drawerEl = root.querySelector('[data-wb-product-filter-drawer]')
    const closeBtn = root.querySelector('[data-wb-product-filter-close]')
    const cancelBtn = root.querySelector('[data-wb-product-filter-cancel]')
    const confirmBtn = root.querySelector('[data-wb-product-filter-confirm]')
    let clearBtns = Array.from(
      root.querySelectorAll('[data-wb-product-filter-clear]')
    ) as HTMLElement[]
    const groupsEl = root.querySelector('[data-wb-product-filter-groups]')
    const templateEl = root.querySelector('script[data-wb-product-card-template]')
    const paginationEl = root.querySelector('[data-cms-pagination]')
    let productGridEl = root.querySelector('[data-wb-product-grid]') as HTMLElement | null
    const datasheetEl = root.querySelector('[data-wb-product-datasheet]') as HTMLElement | null
    const datasheetExportBtn = root.querySelector(
      '[data-wb-product-datasheet-export]'
    ) as HTMLButtonElement | null
    const datasheetSelectAll = root.querySelector(
      '[data-wb-product-datasheet-select-all]'
    ) as HTMLInputElement | null
    const datasheetSelectedCountEls = Array.from(
      root.querySelectorAll('[data-wb-product-datasheet-selected-count]')
    ) as HTMLElement[]

    const paginationMode = readAttr('data-pagination', 'data-wb-pagination') || 'static'
    const pageSize = parseInt(readAttr('data-page-size', 'data-wb-page-size') || '12', 10) || 12
    const maxPages = parseInt(readAttr('data-max-pages', 'data-wb-max-pages') || '10', 10) || 10
    const listMode = readAttr('data-list-mode', 'data-wb-list-mode') || 'grid'
    const isDatasheetMode = listMode === 'datasheet'
    const loadAllProducts =
      isDatasheetMode || readAttr('data-load-all', 'data-wb-load-all') === 'true'
    const baseCategoryId = (() => {
      try {
        const url = new URL(window.location.href)
        const override = String(url.searchParams.get('categoryId') || '').trim()
        if (override) return override
      } catch (_) {
        // noop
      }
      return readAttr('data-category-id', 'data-wb-category-id')
    })()
    const sortField = readAttr('data-sort-field', 'data-wb-sort-field') || 'createTime'
    const sortAsc = String(readAttr('data-sort-asc', 'data-wb-sort-asc') || 'false') === 'true'
    const resolveTenantId = function (): string {
      const readStorageValue = function (storage: Storage | null | undefined, key: string): string {
        if (!storage) return ''

        const raw = String(storage.getItem(key) || '').trim()
        if (!raw) return ''
        if (/^\d+$/.test(raw)) return raw

        try {
          const parsed = JSON.parse(raw)
          if (typeof parsed === 'number' && Number.isFinite(parsed)) return String(parsed)
          if (typeof parsed === 'string' && /^\d+$/.test(parsed.trim())) return parsed.trim()
          if (parsed && typeof parsed === 'object') {
            const candidate = (parsed.value ?? parsed.data ?? parsed.content ?? '')
              .toString()
              .trim()
            if (/^\d+$/.test(candidate)) return candidate
          }
        } catch (_) {
          // noop
        }

        return ''
      }

      const attrTenantId =
        readAttr('data-tenant-id', 'data-wb-tenant-id') ||
        String(
          (root.closest?.('[data-tenant-id]') as HTMLElement | null)?.getAttribute?.(
            'data-tenant-id'
          ) || ''
        ).trim() ||
        String(document.documentElement?.getAttribute?.('data-tenant-id') || '').trim() ||
        String(document.body?.getAttribute?.('data-tenant-id') || '').trim()
      if (attrTenantId) return attrTenantId

      const globalTenantId = String(
        (window as any).__TENANT_ID ??
          (window as any).__WB_TENANT_ID ??
          (window as any).__APP_TENANT_ID ??
          ''
      ).trim()
      if (/^\d+$/.test(globalTenantId)) return globalTenantId

      return (
        readStorageValue(window.sessionStorage, 'visitTenantId') ||
        readStorageValue(window.localStorage, 'visitTenantId') ||
        readStorageValue(window.sessionStorage, 'tenantId') ||
        readStorageValue(window.localStorage, 'tenantId')
      )
    }
    const tenantId = resolveTenantId()
    const runtimeCache = (() => {
      const cacheHost = window as typeof window & {
        __wbProductListRuntime?: {
          categoryTreePromises: Record<
            string,
            | Promise<{ roots: any[]; nodeMap: Record<string, any>; totalProductCount: number }>
            | undefined
          >
        }
      }

      if (!cacheHost.__wbProductListRuntime) {
        cacheHost.__wbProductListRuntime = {
          categoryTreePromises: {}
        }
      }

      return cacheHost.__wbProductListRuntime
    })()

    const readCurrentPage = function () {
      try {
        const url = new URL(window.location.href)
        const raw = url.searchParams.get('page') || url.searchParams.get('pageNo') || '1'
        const page = parseInt(raw, 10)
        return Number.isFinite(page) && page > 0 ? page : 1
      } catch (_) {
        return 1
      }
    }

    const buildPaginationHref = function (page: number) {
      try {
        const url = new URL(window.location.href)
        if (page <= 1) {
          url.searchParams.delete('page')
          url.searchParams.delete('pageNo')
        } else {
          url.searchParams.set('page', String(page))
          url.searchParams.delete('pageNo')
        }
        return `${url.pathname}${url.search}${url.hash}`
      } catch (_) {
        return page > 1 ? `?page=${page}` : window.location.pathname || '#'
      }
    }

    const syncCurrentPageUrl = function (mode: 'push' | 'replace' = 'replace') {
      if (isEditorFrame) return
      try {
        const href = buildPaginationHref(currentPage)
        const method = mode === 'push' ? 'pushState' : 'replaceState'
        window.history?.[method]?.(null, '', href)
      } catch (_) {
        // noop
      }
    }

    let currentPage = readCurrentPage()
    let appliedSelections: string[] = []
    let pendingSelections: string[] = []
    let filteredItems: any[] = []
    let filteredTotal = 0
    let filteredTotalPages = 1
    let filteredRequestToken = 0
    let categoryTree: { roots: any[]; nodeMap: Record<string, any>; totalProductCount: number } = {
      roots: [],
      nodeMap: {},
      totalProductCount: 0
    }
    let groups: Array<{
      id: string
      name: string
      children: Array<{ id: string; name: string; productCount: number }>
    }> = []
    let loadMoreWrap = root.querySelector('.wb-product-list-loadmore')
    let loadMoreBtn = loadMoreWrap?.querySelector?.('.wb-product-list-loadmore__btn') || null

    const isEditorFrame = (() => {
      try {
        const frame = window.frameElement
        return !!(
          frame &&
          frame.classList &&
          (frame.classList.contains('gjs-frame') || frame.classList.contains('gjs-cv-frame'))
        )
      } catch (_) {
        return false
      }
    })()

    const isDesktopFilter = function () {
      try {
        return window.matchMedia('(min-width: 1024px)').matches
      } catch (_) {
        return false
      }
    }

    const ensureDesktopFilterControls = function () {
      const titleEl = root.querySelector('.wb-product-filter__title')
      if (titleEl) titleEl.textContent = loadAllProducts ? 'Filters' : 'Category'

      if (!groupsEl || clearBtns.length > 0) return

      const clearBtn = document.createElement('button')
      clearBtn.type = 'button'
      clearBtn.className = 'wb-product-filter__all-products'
      clearBtn.setAttribute('data-wb-product-filter-clear', '')

      const countSpan = document.createElement('span')
      countSpan.setAttribute('data-wb-product-filter-count', '')
      countSpan.textContent = 'All products'

      clearBtn.appendChild(countSpan)
      groupsEl.parentElement?.insertBefore(clearBtn, groupsEl)
      clearBtns = [clearBtn]
      countEls = Array.from(
        root.querySelectorAll('[data-wb-product-filter-count]')
      ) as HTMLElement[]
    }

    const setCount = function (total: number) {
      const safeTotal = Math.max(0, total || 0)
      const text = isDatasheetMode ? `Total: ${safeTotal}` : `All products (${safeTotal})`
      countEls.forEach((countEl) => {
        countEl.textContent = text
      })
    }

    const syncAllProductsState = function () {
      clearBtns.forEach((button) => {
        button.classList.toggle('is-selected', pendingSelections.length === 0)
      })
    }

    const updateTriggerState = function () {
      if (badgeEl) {
        const activeCount = appliedSelections.length
        badgeEl.textContent = activeCount > 0 ? String(activeCount) : ''
        badgeEl.style.display = activeCount > 0 ? 'inline-flex' : 'none'
      }
      if (triggerBtn) {
        if (appliedSelections.length > 0) triggerBtn.classList.add('is-active')
        else triggerBtn.classList.remove('is-active')
      }
    }

    const openDrawer = function () {
      if (isDesktopFilter()) return
      pendingSelections = appliedSelections.slice()
      syncCheckboxState()
      backdropEl?.classList.add('is-open')
      drawerEl?.classList.add('is-open')
    }

    const closeDrawer = function () {
      backdropEl?.classList.remove('is-open')
      drawerEl?.classList.remove('is-open')
    }

    const getLegacyDirectCards = function (): HTMLElement[] {
      return Array.from(root.children)
        .filter((child): child is HTMLElement => child instanceof HTMLElement)
        .filter((child) => child.classList.contains('wb-product-card'))
    }

    const migrateLegacyCardsToGrid = function () {
      if (!productGridEl) return
      getLegacyDirectCards().forEach((card) => {
        productGridEl?.appendChild(card)
      })
    }

    const ensureProductGrid = function (): HTMLElement {
      if (!productGridEl) {
        productGridEl = document.createElement('div')
        productGridEl.className = 'wb-product-list__grid'
        productGridEl.setAttribute('data-wb-product-grid', '')
        const anchor = templateEl || paginationEl || loadMoreWrap || null
        if (anchor) root.insertBefore(productGridEl, anchor)
        else root.appendChild(productGridEl)
      }

      migrateLegacyCardsToGrid()
      return productGridEl
    }

    const getDirectCards = function (): HTMLElement[] {
      const grid = ensureProductGrid()
      return Array.from(grid.children)
        .filter((child): child is HTMLElement => child instanceof HTMLElement)
        .filter((child) => child.classList.contains('wb-product-card'))
    }

    const getDatasheetRows = function (): HTMLElement[] {
      return Array.from(root.querySelectorAll('[data-wb-product-datasheet-row]')) as HTMLElement[]
    }

    const getFilterItems = function (): HTMLElement[] {
      if (isDatasheetMode && datasheetEl) {
        return getDatasheetRows()
      }
      return getDirectCards()
    }

    const countExistingCards = function (): number {
      return getFilterItems().length
    }

    const readCountText = function (): string {
      const text = String(countEls[0]?.textContent || '').trim()
      return text || `All products (${Math.max(0, countExistingCards())})`
    }

    const initialStaticState = {
      page: currentPage,
      gridHtml: '',
      paginationHtml: '',
      paginationDisplay: paginationEl ? paginationEl.style.display : '',
      loadMoreHtml: loadMoreWrap instanceof HTMLElement ? loadMoreWrap.innerHTML : '',
      loadMoreDisplay: loadMoreWrap instanceof HTMLElement ? loadMoreWrap.style.display : '',
      countText: ''
    }

    const snapshotInitialStaticState = function () {
      const productGrid = ensureProductGrid()
      initialStaticState.gridHtml = productGrid.innerHTML
      initialStaticState.paginationHtml = paginationEl?.innerHTML || ''
      initialStaticState.paginationDisplay = paginationEl ? paginationEl.style.display : ''
      initialStaticState.loadMoreHtml =
        loadMoreWrap instanceof HTMLElement ? loadMoreWrap.innerHTML : ''
      initialStaticState.loadMoreDisplay =
        loadMoreWrap instanceof HTMLElement ? loadMoreWrap.style.display : ''
      initialStaticState.countText = readCountText()
    }

    const restoreInitialStaticState = function () {
      const productGrid = ensureProductGrid()
      productGrid.innerHTML = initialStaticState.gridHtml

      if (paginationEl) {
        paginationEl.innerHTML = initialStaticState.paginationHtml
        paginationEl.style.display = initialStaticState.paginationDisplay
      }

      if (loadMoreWrap instanceof HTMLElement) {
        loadMoreWrap.innerHTML = initialStaticState.loadMoreHtml
        loadMoreWrap.style.display = initialStaticState.loadMoreDisplay
        loadMoreBtn = loadMoreWrap.querySelector(
          '.wb-product-list-loadmore__btn'
        ) as HTMLButtonElement | null
      }

      countEls.forEach((countEl) => {
        countEl.textContent = initialStaticState.countText
      })
    }

    const escapeHtml = function (value: any): string {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    }

    const formatPrice = function (price: any): string {
      if (price == null || price === '') return ''
      const numeric = Number(price)
      if (Number.isNaN(numeric)) return String(price)
      const normalized = numeric > 999 ? numeric / 100 : numeric
      return `$${normalized.toFixed(2)}`
    }

    const getLanguagePrefix = function (): string {
      try {
        const segments = String(window.location.pathname || '/')
          .split('/')
          .map((segment) => segment.trim())
          .filter(Boolean)

        if (!segments.length) return ''

        const first = segments[0]
        const localeLike = /^[a-z]{2}(?:-[a-z]{2})?$/i

        if (localeLike.test(first)) {
          return `/${encodeURIComponent(first)}`
        }
      } catch (_) {
        // noop
      }

      return ''
    }

    const getLanguageValue = function (): string {
      const attrLang = readAttr('data-language', 'data-wb-language')
      if (attrLang) return attrLang
      const htmlLang = String(document.documentElement.lang || '').trim()
      if (htmlLang) return htmlLang
      return getLanguagePrefix().replace(/^\/+/, '')
    }

    const language = getLanguageValue()

    const buildProductUrl = function (item: any): string {
      const slug = String(item?.slug ?? item?.productSlug ?? '').trim()
      const productId = item?.id ?? item?.spuId
      const identifier = slug || (productId == null ? '' : String(productId).trim())
      const canonicalUrl = identifier
        ? `${getLanguagePrefix()}/products/${encodeURIComponent(identifier)}.html`
        : '#'

      const explicitUrl = normalizeSiteHref(item?.url ?? item?.productUrl)
      if (!explicitUrl) return canonicalUrl

      if (/^\/(?:[a-z]{2}(?:-[a-z]{2})?)?\/?products\//i.test(explicitUrl)) {
        return explicitUrl
      }

      return canonicalUrl
    }

    const transformProduct = function (item: any): Record<string, string> {
      return {
        'product.name': item?.name || '',
        'product.picUrl': item?.picUrl || '',
        'product.priceFormatted': formatPrice(item?.price),
        'product.salesCount':
          item?.salesCount != null
            ? `${item.salesCount}${Number(item.salesCount) > 1 ? ' sales' : ' sale'}`
            : '',
        'product.url': buildProductUrl(item)
      }
    }

    const extractCategoryIds = function (item: any): string[] {
      const source = Array.isArray(item?.categoryIds)
        ? item.categoryIds
        : item?.categoryId != null
          ? [item.categoryId]
          : []
      return source.map((id: any) => String(id == null ? '' : id).trim()).filter(Boolean)
    }

    const buildSpecValueMap = function (item: any): Record<string, any> {
      const specs = Array.isArray(item?.specifications) ? item.specifications : []
      const result: Record<string, any> = {}
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
          optionValues: Array.isArray(spec?.optionValues) ? spec.optionValues : []
        }
      })
      return result
    }

    const renderCardHtml = function (item: any): string {
      const template = templateEl?.textContent?.trim() || defaultTemplate
      const transformed = transformProduct(item)
      let html = template
      Object.keys(transformed).forEach((key) => {
        html = html.split(`{{${key}}}`).join(escapeHtml(transformed[key]))
      })
      return html
    }

    const createCardElement = function (item: any): HTMLElement | null {
      const wrapper = document.createElement('div')
      wrapper.innerHTML = renderCardHtml(item)
      const card = wrapper.firstElementChild as HTMLElement | null
      if (!card) return null
      const categoryIds = extractCategoryIds(item)
      if (categoryIds.length > 0) {
        card.setAttribute('data-product-category-ids', categoryIds.join(','))
      }
      if (item?.id != null) {
        card.setAttribute('data-product-id', String(item.id))
      }
      const specValues = buildSpecValueMap(item)
      if (Object.keys(specValues).length > 0) {
        card.setAttribute('data-product-spec-values', JSON.stringify(specValues))
      }
      return card
    }

    const ensureLoadMore = function () {
      if (loadMoreWrap && loadMoreBtn) return
      loadMoreWrap = document.createElement('div')
      loadMoreWrap.className = 'wb-product-list-loadmore'
      loadMoreBtn = document.createElement('button')
      loadMoreBtn.type = 'button'
      loadMoreBtn.className = 'wb-product-list-loadmore__btn'
      loadMoreBtn.textContent = 'Load More'
      loadMoreWrap.appendChild(loadMoreBtn)
      const anchor = templateEl || paginationEl || null
      if (anchor) root.insertBefore(loadMoreWrap, anchor)
      else root.appendChild(loadMoreWrap)
    }

    const removeRenderedCards = function () {
      getDirectCards().forEach((card) => card.remove())
    }

    const getGroupsTotalCount = function (): number {
      const counted = new Set<string>()
      let total = 0

      groups.forEach((group) => {
        group.children.forEach((option) => {
          if (counted.has(option.id)) return
          counted.add(option.id)
          total += Math.max(0, Number(option.productCount || 0))
        })
      })

      return total
    }

    const renderFilteredPagination = function () {
      if (!paginationEl) return
      const boundedPages = Math.max(1, Math.min(filteredTotalPages, maxPages))
      paginationEl.innerHTML = ''
      paginationEl.style.display = boundedPages <= 1 ? 'none' : ''

      for (let page = 1; page <= boundedPages; page += 1) {
        const btn = document.createElement('a')
        btn.href = buildPaginationHref(page)
        btn.className =
          page === currentPage ? 'wb-product-list-page-btn active' : 'wb-product-list-page-btn'
        btn.textContent = String(page)
        if (page === currentPage) {
          btn.setAttribute('aria-current', 'page')
        }
        btn.addEventListener('click', function (event) {
          if (event.defaultPrevented) return
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
          if ((event as MouseEvent).button !== 0) return
          event.preventDefault()
          currentPage = page
          syncCurrentPageUrl('push')
          void loadFilteredProducts(page, false)
        })
        paginationEl.appendChild(btn)
      }

      syncCurrentPageUrl('replace')
    }

    const renderLoadMore = function () {
      ensureLoadMore()
      if (!loadMoreWrap || !loadMoreBtn) return
      const hasMore = currentPage < filteredTotalPages
      loadMoreWrap.style.display = hasMore ? '' : 'none'
      loadMoreBtn.textContent = hasMore ? 'Load More' : 'Loaded'
      loadMoreBtn.onclick = function () {
        if (!hasMore) return
        void loadFilteredProducts(currentPage + 1, true)
      }
    }

    const render = function () {
      if (!appliedSelections.length) {
        currentPage = initialStaticState.page
        restoreInitialStaticState()
        updateTriggerState()
        syncCheckboxState()
        syncCurrentPageUrl('replace')
        return
      }

      setCount(filteredTotal)
      updateTriggerState()

      removeRenderedCards()
      const productGrid = ensureProductGrid()
      filteredItems.forEach((item) => {
        const card = createCardElement(item)
        if (!card) return
        productGrid.appendChild(card)
      })

      if (paginationMode === 'static') {
        renderFilteredPagination()
        loadMoreWrap && (loadMoreWrap.style.display = 'none')
      } else if (paginationMode === 'loadmore') {
        paginationEl && (paginationEl.style.display = 'none')
        renderLoadMore()
      } else {
        currentPage = 1
        paginationEl && (paginationEl.style.display = 'none')
        loadMoreWrap && (loadMoreWrap.style.display = 'none')
      }

      syncCheckboxState()
      syncCurrentPageUrl('replace')
    }

    const syncCheckboxState = function () {
      if (!groupsEl) return
      const selectedSet = new Set(pendingSelections)
      groupsEl.querySelectorAll('input[type="checkbox"][data-filter-id]').forEach((input) => {
        const checkbox = input as HTMLInputElement
        checkbox.checked = selectedSet.has(checkbox.getAttribute('data-filter-id') || '')
      })
      syncAllProductsState()
    }

    const renderGroups = function () {
      if (!groupsEl) return
      if (!groups.length) {
        groupsEl.innerHTML = '<p class="wb-product-filter__empty">No filter options available.</p>'
        if (triggerBtn) triggerBtn.style.display = 'none'
        return
      }

      if (triggerBtn) triggerBtn.style.display = ''
      groupsEl.innerHTML = ''

      groups.forEach((group) => {
        const section = document.createElement('section')
        section.className = 'wb-product-filter__group'

        const header = document.createElement('button')
        header.type = 'button'
        header.className = 'wb-product-filter__group-header'

        const title = document.createElement('span')
        title.className = 'wb-product-filter__group-title'
        title.textContent = group.name

        const toggle = document.createElement('span')
        toggle.className = 'wb-product-filter__group-toggle'
        toggle.textContent = '−'

        header.appendChild(title)
        header.appendChild(toggle)
        header.addEventListener('click', function () {
          section.classList.toggle('is-collapsed')
          toggle.textContent = section.classList.contains('is-collapsed') ? '+' : '−'
        })

        const options = document.createElement('div')
        options.className = 'wb-product-filter__group-options'

        group.children.forEach((option) => {
          const label = document.createElement('label')
          label.className = 'wb-product-filter__option'

          const input = document.createElement('input')
          input.type = 'checkbox'
          input.value = option.id
          input.setAttribute('data-filter-id', option.id)

          const text = document.createElement('span')
          const optionCount = Number(option.productCount || 0)
          text.textContent =
            optionCount != null && optionCount > 0 ? `${option.name} (${optionCount})` : option.name

          input.addEventListener('change', function () {
            const value = input.getAttribute('data-filter-id') || ''
            if (!value) return
            if (input.checked) {
              if (!pendingSelections.includes(value)) pendingSelections.push(value)
            } else {
              pendingSelections = pendingSelections.filter((item) => item !== value)
            }

            if (isDesktopFilter()) {
              void applySelections(pendingSelections)
            }
          })

          label.appendChild(input)
          label.appendChild(text)
          options.appendChild(label)
        })

        section.appendChild(header)
        section.appendChild(options)
        groupsEl.appendChild(section)
      })

      syncCheckboxState()
    }

    const normalizeCategoryList = function (
      payload: any[]
    ): Array<{ id: string; parentId: string; name: string; productCount: number }> {
      return payload
        .map((item) => ({
          id: String(item?.id ?? item?.categoryId ?? '').trim(),
          parentId: String(item?.parentId ?? '').trim(),
          name: String(item?.name ?? item?.categoryName ?? '').trim(),
          productCount: Math.max(0, Number(item?.productCount ?? 0) || 0)
        }))
        .filter((item) => item.id && item.name)
    }

    const buildCategoryTree = function (
      items: Array<{ id: string; parentId: string; name: string; productCount: number }>
    ) {
      const nodeMap: Record<string, any> = {}
      const roots: any[] = []

      items.forEach((item) => {
        nodeMap[item.id] = nodeMap[item.id] || {
          id: item.id,
          parentId: item.parentId,
          name: item.name,
          productCount: item.productCount,
          children: []
        }
        nodeMap[item.id].parentId = item.parentId
        nodeMap[item.id].name = item.name
        nodeMap[item.id].productCount = item.productCount
      })

      Object.keys(nodeMap).forEach((id) => {
        const node = nodeMap[id]
        if (node.parentId && nodeMap[node.parentId]) {
          nodeMap[node.parentId].children.push(node)
        } else {
          roots.push(node)
        }
      })

      return { roots, nodeMap }
    }

    const buildFilterGroups = function (categoryTree: {
      roots: any[]
      nodeMap: Record<string, any>
    }) {
      const pickChildren = function (node: any) {
        return (node?.children || []).map((child: any) => ({
          id: child.id,
          name: child.name,
          productCount: Math.max(0, Number(child?.productCount ?? 0) || 0)
        }))
      }

      const mapNodesToGroups = function (nodes: any[]) {
        return nodes
          .map((node: any) => {
            const directChildren = Array.isArray(node?.children)
              ? node.children.filter(Boolean)
              : []
            const childHasChildren = directChildren.some(
              (child: any) => Array.isArray(child?.children) && child.children.length > 0
            )

            if (!directChildren.length) return null

            if (!childHasChildren) {
              return {
                id: node.id,
                name: node.name,
                children: pickChildren(node)
              }
            }

            return directChildren.map((child: any) => ({
              id: child.id,
              name: child.name,
              children: pickChildren(child)
            }))
          })
          .flat()
          .filter((group: any) => group && group.children.length > 0)
      }

      if (baseCategoryId && categoryTree.nodeMap[baseCategoryId]) {
        const node = categoryTree.nodeMap[baseCategoryId]
        const secondLevelNodes = (() => {
          const children = Array.isArray(node?.children) ? node.children.filter(Boolean) : []
          if (!children.length) return [node]

          const childHasChildren = children.some(
            (child: any) => Array.isArray(child?.children) && child.children.length > 0
          )

          return childHasChildren ? children : [node]
        })()

        return mapNodesToGroups(secondLevelNodes)
      }

      return mapNodesToGroups(categoryTree.roots)
    }

    const fetchJson = async function (endpoint: string, params: Record<string, string>) {
      const url = new URL(endpoint, window.location.origin)
      Object.keys(params).forEach((key) => {
        const value = params[key]
        if (value != null && value !== '') url.searchParams.set(key, value)
      })

      const headers: Record<string, string> = {}
      if (tenantId) headers['tenant-id'] = tenantId

      const res = await fetch(url.toString(), { headers })
      if (!res.ok) {
        throw new Error(`${endpoint} -> ${res.status}`)
      }

      const json = await res.json()
      return json?.data !== undefined ? json.data : json
    }

    const fetchCategoryTree = async function () {
      const cacheKey = `${tenantId || 'default'}::${language || 'default'}::${baseCategoryId || 'all'}`
      if (runtimeCache.categoryTreePromises[cacheKey]) {
        return runtimeCache.categoryTreePromises[cacheKey]
      }

      runtimeCache.categoryTreePromises[cacheKey] = (async () => {
        const payload = await fetchJson('/app-api/product/category/list-with-product-count', {
          ...(language ? { language } : {}),
          ...(baseCategoryId ? { categoryId: baseCategoryId } : {})
        })
        const rawList = Array.isArray(payload) ? payload : payload?.list || []
        const normalized = normalizeCategoryList(Array.isArray(rawList) ? rawList : [])
        if (normalized.length > 0) {
          const tree = buildCategoryTree(normalized)
          return {
            ...tree,
            totalProductCount: Math.max(0, Number(payload?.totalProductCount ?? 0) || 0)
          }
        }
        return {
          roots: [],
          nodeMap: {},
          totalProductCount: Math.max(0, Number(payload?.totalProductCount ?? 0) || 0)
        }
      })().catch((error) => {
        delete runtimeCache.categoryTreePromises[cacheKey]
        throw error
      })

      return runtimeCache.categoryTreePromises[cacheKey]
    }

    const fetchProductPage = async function (
      pageNo: number,
      fetchSize: number,
      selectedIds?: string[]
    ) {
      const normalizedSortField =
        sortField === 'price' || sortField === 'salesCount' ? String(sortField) : ''
      const payload = await fetchJson('/app-api/product/spu/page', {
        pageNo: String(pageNo),
        pageSize: String(fetchSize),
        ...(language ? { language } : {}),
        ...(selectedIds && selectedIds.length === 1 ? { categoryId: selectedIds[0] } : {}),
        ...(selectedIds && selectedIds.length > 1 ? { categoryIds: selectedIds.join(',') } : {}),
        ...(normalizedSortField ? { sortField: normalizedSortField } : {}),
        sortAsc: String(sortAsc)
      })
      const list = Array.isArray(payload) ? payload : payload?.list || []
      const total = Number(payload?.total ?? payload?.totalCount ?? list.length ?? 0) || 0
      const totalPages =
        Number(
          payload?.pages ??
            payload?.totalPages ??
            (fetchSize > 0 ? Math.ceil(total / fetchSize) : 1)
        ) || 1

      return {
        list: Array.isArray(list) ? list : [],
        total,
        totalPages
      }
    }

    const loadFilteredProducts = async function (pageNo: number, append: boolean) {
      const requestToken = filteredRequestToken + 1
      filteredRequestToken = requestToken

      try {
        const page = await fetchProductPage(pageNo, pageSize, appliedSelections)
        if (filteredRequestToken !== requestToken) return

        currentPage = pageNo
        filteredTotal = page.total
        filteredTotalPages = Math.max(page.totalPages || 1, 1)
        filteredItems =
          append && paginationMode === 'loadmore'
            ? filteredItems.concat(Array.isArray(page.list) ? page.list : [])
            : Array.isArray(page.list)
              ? page.list
              : []
        render()
      } catch (_) {
        if (filteredRequestToken !== requestToken) return
        currentPage = pageNo
        filteredItems = []
        filteredTotal = 0
        filteredTotalPages = 1
        render()
      }
    }

    const applySelections = async function (selections: string[]) {
      const nextSelections = selections.slice()

      if (!nextSelections.length) {
        appliedSelections = []
        currentPage = initialStaticState.page
        filteredItems = []
        filteredTotal = 0
        filteredTotalPages = 1
        render()
        closeDrawer()
        return
      }

      appliedSelections = nextSelections
      filteredItems = []
      filteredTotal = 0
      filteredTotalPages = 1
      await loadFilteredProducts(1, false)
      closeDrawer()
    }

    const handleConfirm = async function () {
      await applySelections(pendingSelections)
    }

    const handleClear = function () {
      pendingSelections = []
      syncCheckboxState()

      if (isDesktopFilter()) {
        appliedSelections = []
        render()
      }
    }

    const handleCancel = function () {
      pendingSelections = appliedSelections.slice()
      syncCheckboxState()
      closeDrawer()
    }

    const onBackdropClick = function () {
      void handleCancel()
    }

    const onKeydown = function (event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeDrawer()
      }
    }

    const onPopstate = function () {
      currentPage = readCurrentPage()
      if (appliedSelections.length > 0) {
        void loadFilteredProducts(currentPage, false)
        return
      }
      render()
    }

    const onBreakpointChange = function () {
      if (isDesktopFilter()) {
        closeDrawer()
        pendingSelections = appliedSelections.slice()
        syncCheckboxState()
      }
    }

    const readLocalSpecValues = function (card: HTMLElement): Record<string, any> {
      const raw = String(card.getAttribute('data-product-spec-values') || '').trim()
      if (!raw) return {}
      try {
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed === 'object' ? parsed : {}
      } catch (_) {
        return {}
      }
    }

    const toFiniteNumber = function (value: any): number | undefined {
      if (value == null || value === '') return undefined
      const numeric = Number(String(value).replace(/[^\d.+-]/g, ''))
      return Number.isFinite(numeric) ? numeric : undefined
    }

    const getSpecBounds = function (spec: any): { min?: number; max?: number } {
      const min = toFiniteNumber(spec?.minValue)
      const max = toFiniteNumber(spec?.maxValue)
      const numeric = toFiniteNumber(spec?.numericValue)
      const valueNumber = toFiniteNumber(spec?.value ?? spec?.rawValue ?? spec?.textValue)
      const fallback = numeric ?? valueNumber
      return {
        min: min ?? fallback,
        max: max ?? fallback ?? min
      }
    }

    const getSpecTextValues = function (spec: any): string[] {
      const values = Array.isArray(spec?.optionValues) ? spec.optionValues : []
      const raw = String(spec?.value ?? spec?.rawValue ?? spec?.textValue ?? '').trim()
      const fromRaw = raw
        ? raw
            .split(/[,;|/]+/)
            .map((item) => item.trim())
            .filter(Boolean)
        : []
      return Array.from(
        new Set(
          values
            .concat(fromRaw)
            .map((item: any) => String(item).trim())
            .filter(Boolean)
        )
      )
    }

    const getLocalFilterState = function () {
      const ranges: Record<string, { min?: number; max?: number }> = {}
      const options: Record<string, string[]> = {}

      root
        .querySelectorAll('input[data-spec-filter-code][data-spec-filter-bound]')
        .forEach((input) => {
          const el = input as HTMLInputElement
          const code = String(el.getAttribute('data-spec-filter-code') || '').trim()
          const bound = String(el.getAttribute('data-spec-filter-bound') || '').trim()
          if (!code) return
          const value = toFiniteNumber(el.value)
          if (value == null) return
          ranges[code] = ranges[code] || {}
          if (bound === 'max') ranges[code].max = value
          else ranges[code].min = value
        })

      root
        .querySelectorAll('input[type="checkbox"][data-spec-filter-code][data-spec-filter-value]')
        .forEach((input) => {
          const el = input as HTMLInputElement
          if (!el.checked) return
          const code = String(el.getAttribute('data-spec-filter-code') || '').trim()
          const value = String(el.getAttribute('data-spec-filter-value') || '').trim()
          if (!code || !value) return
          options[code] = options[code] || []
          options[code].push(value)
        })

      return { ranges, options }
    }

    const countLocalActiveFilters = function (state: {
      ranges: Record<string, { min?: number; max?: number }>
      options: Record<string, string[]>
    }): number {
      const rangeCount = Object.values(state.ranges).filter(
        (range) => range.min != null || range.max != null
      ).length
      const optionCount = Object.values(state.options).filter((values) => values.length > 0).length
      return rangeCount + optionCount
    }

    const matchesLocalFilters = function (
      card: HTMLElement,
      state: {
        ranges: Record<string, { min?: number; max?: number }>
        options: Record<string, string[]>
      }
    ): boolean {
      const specs = readLocalSpecValues(card)

      for (const code of Object.keys(state.ranges)) {
        const range = state.ranges[code]
        if (range.min == null && range.max == null) continue
        const spec = specs[code]
        if (!spec) return false
        const bounds = getSpecBounds(spec)
        if (bounds.min == null && bounds.max == null) return false
        const itemMin = bounds.min ?? bounds.max
        const itemMax = bounds.max ?? bounds.min
        if (range.min != null && itemMax != null && itemMax < range.min) return false
        if (range.max != null && itemMin != null && itemMin > range.max) return false
      }

      for (const code of Object.keys(state.options)) {
        const selected = state.options[code]
        if (!selected.length) continue
        const spec = specs[code]
        if (!spec) return false
        const values = getSpecTextValues(spec)
        if (!values.some((value) => selected.includes(value))) return false
      }

      return true
    }

    const getVisibleDatasheetRows = function (): HTMLElement[] {
      return getDatasheetRows().filter((row) => !row.hidden && row.style.display !== 'none')
    }

    const getDatasheetRowCheckbox = function (row: HTMLElement): HTMLInputElement | null {
      return row.querySelector('[data-wb-product-datasheet-select-row]') as HTMLInputElement | null
    }

    const updateDatasheetSelection = function () {
      if (!datasheetEl) return
      const rows = getVisibleDatasheetRows()
      const selectedRows = rows.filter((row) => !!getDatasheetRowCheckbox(row)?.checked)
      const selectedCount = selectedRows.length
      getDatasheetRows().forEach((row) => {
        row.classList.toggle('is-selected', !!getDatasheetRowCheckbox(row)?.checked)
      })
      datasheetSelectedCountEls.forEach((el) => {
        el.textContent = String(selectedCount)
      })
      if (datasheetExportBtn) {
        datasheetExportBtn.disabled = selectedCount === 0
        datasheetExportBtn.textContent = selectedCount > 0 ? `Export (${selectedCount})` : 'Export'
      }
      if (datasheetSelectAll) {
        datasheetSelectAll.checked = rows.length > 0 && selectedCount === rows.length
        datasheetSelectAll.indeterminate = selectedCount > 0 && selectedCount < rows.length
      }
    }

    const applyLocalSpecFilters = function () {
      const state = getLocalFilterState()
      const activeCount = countLocalActiveFilters(state)
      let visibleCount = 0

      getFilterItems().forEach((item) => {
        const visible = matchesLocalFilters(item, state)
        item.hidden = !visible
        item.style.display = visible ? '' : 'none'
        if (visible) visibleCount += 1
      })

      setCount(visibleCount)
      if (badgeEl) {
        badgeEl.textContent = activeCount > 0 ? String(activeCount) : ''
        badgeEl.style.display = activeCount > 0 ? 'inline-flex' : 'none'
      }
      if (triggerBtn) {
        triggerBtn.classList.toggle('is-active', activeCount > 0)
      }
      updateDatasheetFilterSummaries()
      updateDatasheetSelection()
    }

    const clearLocalSpecFilters = function () {
      root.querySelectorAll('input[data-spec-filter-code]').forEach((input) => {
        const el = input as HTMLInputElement
        if (el.type === 'checkbox') el.checked = false
        else el.value = ''
      })
      closeDatasheetFilterPanels()
      applyLocalSpecFilters()
    }

    const closeDatasheetFilterPanels = function (except?: HTMLElement | null) {
      root
        .querySelectorAll('[data-wb-product-datasheet-filter-control].is-open')
        .forEach((control) => {
          if (except && control === except) return
          control.classList.remove('is-open')
        })
    }

    const getControlInputs = function (control: Element | null): HTMLInputElement[] {
      if (!control) return []
      return Array.from(control.querySelectorAll('input[data-spec-filter-code]')) as HTMLInputElement[]
    }

    const updateDatasheetFilterSummaries = function () {
      root.querySelectorAll('[data-wb-product-datasheet-filter-control]').forEach((control) => {
        const summary = control.querySelector('[data-wb-product-datasheet-filter-summary]')
        const label = String(control.getAttribute('data-wb-product-datasheet-filter-label') || '').trim()
        const inputs = getControlInputs(control)
        const checked = inputs
          .filter((input) => input.type === 'checkbox' && input.checked)
          .map((input) => String(input.getAttribute('data-spec-filter-value') || input.value || '').trim())
          .filter(Boolean)
        const minInput = inputs.find(
          (input) => input.getAttribute('data-spec-filter-bound') === 'min'
        )
        const maxInput = inputs.find(
          (input) => input.getAttribute('data-spec-filter-bound') === 'max'
        )
        const minValue = String(minInput?.value || '').trim()
        const maxValue = String(maxInput?.value || '').trim()
        const rangeValue =
          minValue || maxValue ? `${minValue || 'Min'} - ${maxValue || 'Max'}` : ''
        const value = checked.length > 0 ? checked.join(', ') : rangeValue
        if (summary) {
          summary.textContent = value ? `${label}: ${value}` : label
        }
        control.classList.toggle('has-value', !!value)
      })
    }

    const escapeCsvValue = function (value: string): string {
      const normalized = String(value || '')
        .replace(/\s+/g, ' ')
        .trim()
      return /[",\n]/.test(normalized) ? `"${normalized.replace(/"/g, '""')}"` : normalized
    }

    const exportDatasheetSelection = function () {
      const rows = getVisibleDatasheetRows().filter(
        (row) => !!getDatasheetRowCheckbox(row)?.checked
      )
      if (!rows.length) return
      const headerCells = Array.from(
        root.querySelectorAll('[data-wb-product-datasheet-header-cell]')
      ) as HTMLElement[]
      const headers = headerCells
        .map((cell) => String(cell.textContent || '').trim())
        .filter(Boolean)
      const lines = [headers.map(escapeCsvValue).join(',')]
      rows.forEach((row) => {
        const valueCells = Array.from(
          row.querySelectorAll('[data-wb-product-datasheet-cell]')
        ) as HTMLElement[]
        const values = valueCells
          .filter(
            (cell) => !cell.classList.contains('wb-product-datasheet__checkbox')
          )
          .map((cell) => String(cell.textContent || '').trim())
        lines.push(values.map(escapeCsvValue).join(','))
      })
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'datasheet.csv'
      document.body.appendChild(link)
      link.click()
      setTimeout(function () {
        URL.revokeObjectURL(link.href)
        link.remove()
      }, 0)
    }

    const initDatasheetSelection = function (): (() => void) | null {
      if (!datasheetEl) return null
      const onChange = function (event: Event) {
        const target = event.target as HTMLInputElement | null
        if (!target) return
        if (target.matches('[data-wb-product-datasheet-select-all]')) {
          const checked = target.checked
          getVisibleDatasheetRows().forEach((row) => {
            const checkbox = getDatasheetRowCheckbox(row)
            if (checkbox) checkbox.checked = checked
          })
        }
        updateDatasheetSelection()
      }
      const onExport = function () {
        exportDatasheetSelection()
      }
      datasheetEl.addEventListener('change', onChange)
      datasheetExportBtn?.addEventListener('click', onExport)
      updateDatasheetSelection()
      return function () {
        datasheetEl.removeEventListener('change', onChange)
        datasheetExportBtn?.removeEventListener('click', onExport)
      }
    }

    const initLocalSpecFiltering = function (): () => void {
      if (paginationEl) paginationEl.style.display = 'none'
      if (loadMoreWrap instanceof HTMLElement) loadMoreWrap.style.display = 'none'
      const inputs = Array.from(
        root.querySelectorAll('input[data-spec-filter-code]')
      ) as HTMLInputElement[]
      const toggles = Array.from(
        root.querySelectorAll('[data-wb-product-datasheet-filter-toggle]')
      ) as HTMLElement[]
      const applyButtons = Array.from(
        root.querySelectorAll('[data-wb-product-datasheet-filter-apply]')
      ) as HTMLElement[]
      const resetButtons = Array.from(
        root.querySelectorAll('[data-wb-product-datasheet-filter-reset]')
      ) as HTMLElement[]
      const headerEntries = (
        Array.from(root.querySelectorAll('.wb-product-filter__group-header')) as HTMLElement[]
      ).map((header) => {
        const handler = function () {
          const section = header.closest('.wb-product-filter__group')
          const toggle = header.querySelector('.wb-product-filter__group-toggle')
          section?.classList.toggle('is-collapsed')
          if (toggle) {
            toggle.textContent = section?.classList.contains('is-collapsed') ? '+' : '−'
          }
        }
        header.addEventListener('click', handler)
        return { header, handler }
      })
      inputs.forEach((input) => {
        const handler = function () {
          if (input.type === 'checkbox' && input.checked) {
            const control = input.closest('[data-wb-product-datasheet-filter-control]')
            getControlInputs(control)
              .filter((item) => item !== input && item.type === 'checkbox')
              .forEach((item) => {
                item.checked = false
              })
          }
          applyLocalSpecFilters()
        }
        ;(input as any).__wbDatasheetFilterHandler = handler
        input.addEventListener('input', handler)
        input.addEventListener('change', handler)
      })
      toggles.forEach((toggle) => {
        const handler = function (event: Event) {
          event.preventDefault()
          event.stopPropagation()
          const control = toggle.closest(
            '[data-wb-product-datasheet-filter-control]'
          ) as HTMLElement | null
          if (!control) return
          const willOpen = !control.classList.contains('is-open')
          closeDatasheetFilterPanels(control)
          control.classList.toggle('is-open', willOpen)
        }
        ;(toggle as any).__wbDatasheetFilterToggleHandler = handler
        toggle.addEventListener('click', handler)
      })
      applyButtons.forEach((button) => {
        const handler = function (event: Event) {
          event.preventDefault()
          applyLocalSpecFilters()
          closeDatasheetFilterPanels()
        }
        ;(button as any).__wbDatasheetFilterApplyHandler = handler
        button.addEventListener('click', handler)
      })
      resetButtons.forEach((button) => {
        const handler = function (event: Event) {
          event.preventDefault()
          const control = button.closest('[data-wb-product-datasheet-filter-control]')
          getControlInputs(control).forEach((input) => {
            if (input.type === 'checkbox') input.checked = false
            else input.value = ''
          })
          applyLocalSpecFilters()
        }
        ;(button as any).__wbDatasheetFilterResetHandler = handler
        button.addEventListener('click', handler)
      })
      const onDocumentClick = function (event: Event) {
        const target = event.target as Node | null
        if (!target || root.contains(target)) {
          const controlTarget =
            target instanceof Element
              ? target.closest('[data-wb-product-datasheet-filter-control]')
              : null
          if (controlTarget) return
        }
        closeDatasheetFilterPanels()
      }
      document.addEventListener('click', onDocumentClick)
      applyLocalSpecFilters()
      return function () {
        inputs.forEach((input) => {
          const handler = (input as any).__wbDatasheetFilterHandler
          input.removeEventListener('input', handler || applyLocalSpecFilters)
          input.removeEventListener('change', handler || applyLocalSpecFilters)
        })
        toggles.forEach((toggle) => {
          toggle.removeEventListener('click', (toggle as any).__wbDatasheetFilterToggleHandler)
        })
        applyButtons.forEach((button) => {
          button.removeEventListener('click', (button as any).__wbDatasheetFilterApplyHandler)
        })
        resetButtons.forEach((button) => {
          button.removeEventListener('click', (button as any).__wbDatasheetFilterResetHandler)
        })
        document.removeEventListener('click', onDocumentClick)
        headerEntries.forEach(({ header, handler }) => {
          header.removeEventListener('click', handler)
        })
      }
    }

    const handleConfirmClick = async function () {
      if (loadAllProducts) {
        applyLocalSpecFilters()
        closeDrawer()
        return
      }
      await handleConfirm()
    }

    const handleClearClick = function () {
      if (loadAllProducts) {
        clearLocalSpecFilters()
        return
      }
      handleClear()
    }

    ensureDesktopFilterControls()
    ensureProductGrid()
    snapshotInitialStaticState()

    triggerBtn?.addEventListener('click', openDrawer)
    closeBtn?.addEventListener('click', handleCancel)
    cancelBtn?.addEventListener('click', handleCancel)
    confirmBtn?.addEventListener('click', handleConfirmClick)
    clearBtns.forEach((button) => button.addEventListener('click', handleClearClick))
    backdropEl?.addEventListener('click', onBackdropClick)
    document.addEventListener('keydown', onKeydown)
    window.addEventListener('popstate', onPopstate)
    window.addEventListener('resize', onBreakpointChange)

    updateTriggerState()

    const localFilterCleanup = loadAllProducts ? initLocalSpecFiltering() : null
    const datasheetSelectionCleanup = isDatasheetMode ? initDatasheetSelection() : null

    if (loadAllProducts) {
      root._wbProductListCleanup = function () {
        triggerBtn?.removeEventListener('click', openDrawer)
        closeBtn?.removeEventListener('click', handleCancel)
        cancelBtn?.removeEventListener('click', handleCancel)
        confirmBtn?.removeEventListener('click', handleConfirmClick)
        clearBtns.forEach((button) => button.removeEventListener('click', handleClearClick))
        backdropEl?.removeEventListener('click', onBackdropClick)
        document.removeEventListener('keydown', onKeydown)
        window.removeEventListener('popstate', onPopstate)
        window.removeEventListener('resize', onBreakpointChange)
        localFilterCleanup?.()
        datasheetSelectionCleanup?.()
      }
      return
    }

    fetchCategoryTree()
      .then((tree) => {
        if (!tree) return
        categoryTree = tree
        groups = buildFilterGroups(categoryTree)

        if (groups.length > 0) {
          renderGroups()
          const totalCount =
            Math.max(0, Number(categoryTree.totalProductCount || 0)) || getGroupsTotalCount()
          setCount(totalCount)
          initialStaticState.countText = readCountText()
        } else if (groupsEl) {
          groupsEl.innerHTML =
            '<p class="wb-product-filter__empty">Filters are unavailable right now.</p>'
          if (triggerBtn) triggerBtn.style.display = 'none'
        }
      })
      .catch(() => {
        if (groupsEl) {
          groupsEl.innerHTML =
            '<p class="wb-product-filter__empty">Filters are unavailable right now.</p>'
          if (triggerBtn) triggerBtn.style.display = 'none'
        }
      })

    root._wbProductListCleanup = function () {
      triggerBtn?.removeEventListener('click', openDrawer)
      closeBtn?.removeEventListener('click', handleCancel)
      cancelBtn?.removeEventListener('click', handleCancel)
      confirmBtn?.removeEventListener('click', handleConfirmClick)
      clearBtns.forEach((button) => button.removeEventListener('click', handleClearClick))
      backdropEl?.removeEventListener('click', onBackdropClick)
      document.removeEventListener('keydown', onKeydown)
      window.removeEventListener('popstate', onPopstate)
      window.removeEventListener('resize', onBreakpointChange)
    }
  }
}

export function registerCmsProductListComponents(editor: GrapesEditor): void {
  const domComponents = editor?.DomComponents
  if (!domComponents) return

  if (!domComponents.getType(WB_CMS_PRODUCT_CARD_TYPE)) {
    domComponents.addType(WB_CMS_PRODUCT_CARD_TYPE, {
      isComponent: (el: HTMLElement) =>
        el?.getAttribute?.('data-wb-component') === 'cms-product-card'
          ? { type: WB_CMS_PRODUCT_CARD_TYPE }
          : false,

      model: {
        defaults: {
          name: '产品卡片',
          tagName: 'div',
          draggable: '[data-wb-product-grid]',
          droppable: true,
          selectable: true,
          editable: false,
          stylable: true,
          styles: PRODUCT_CARD_CSS,
          attributes: {
            'data-wb-component': 'cms-product-card',
            'data-cms-repeat': 'product',
            'data-cms-bind-data-product-spec-values': 'product.specValueJson',
            class: 'wb-product-card'
          },
          traits: [],
          components: [
            {
              tagName: 'div',
              attributes: { class: 'wb-product-card-img-wrap' },
              components: [
                {
                  tagName: 'img',
                  attributes: {
                    class: 'wb-product-card-img',
                    'data-cms-bind-src': 'product.picUrl',
                    'data-cms-bind-alt': 'product.name',
                    src: 'https://placehold.co/400x400?text=Product',
                    alt: 'product'
                  }
                }
              ]
            },
            {
              tagName: 'div',
              attributes: { class: 'wb-product-card-body' },
              components: [
                {
                  tagName: 'h4',
                  attributes: { class: 'wb-product-card-name' },
                  components: [
                    {
                      tagName: 'a',
                      attributes: {
                        class: 'wb-product-card-link',
                        href: '#',
                        'data-cms-bind': 'product.name',
                        'data-cms-bind-href': 'product.url',
                        'data-cms-bind-aria-label': 'product.name'
                      },
                      content: 'Black Masterbatch'
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    })
  }

  if (!domComponents.getType(WB_CMS_PRODUCT_LIST_TYPE)) {
    domComponents.addType(WB_CMS_PRODUCT_LIST_TYPE, {
      isComponent: (el: HTMLElement) => {
        if (el?.getAttribute?.('data-wb-component') !== 'cms-product-list') return false
        const listMode = el.getAttribute('data-list-mode') || el.getAttribute('data-wb-list-mode')
        return listMode === 'datasheet' ? false : { type: WB_CMS_PRODUCT_LIST_TYPE }
      },

      model: {
        defaults: {
          name: '产品列表',
          tagName: 'div',
          draggable: '*',
          droppable: false,
          selectable: true,
          editable: false,
          stylable: true,
          styles: PRODUCT_CARD_CSS,
          attributes: {
            'data-wb-component': 'cms-product-list',
            'data-cms-component': 'product-list',
            'data-wb-instance-id': '',
            'data-wb-category-id': '',
            'data-wb-sort-field': 'createTime',
            'data-wb-sort-asc': 'false',
            'data-wb-page-size': '12',
            'data-wb-pagination': 'static',
            'data-wb-max-pages': '10',
            'data-wb-list-mode': 'grid',
            'data-wb-load-all': 'false',
            'data-wb-tenant-id': `${getEffectiveTenantId() || ''}`,
            'data-tenant-id': `${getEffectiveTenantId() || ''}`,
            'data-category-id': '',
            'data-sort-field': 'createTime',
            'data-sort-asc': 'false',
            'data-list-mode': 'grid',
            'data-load-all': 'false',
            'data-loop-item-type': 'product',
            'data-loop-item-template-resource-id': '',
            'data-category-loop-mode': 'root',
            'data-category-parent-id': '',
            'data-category-click-target': 'productList',
            class: 'wb-product-list',
            ...PAGINATION_ATTRS
          },
          style: {
            display: 'grid',
            'grid-template-columns': '220px minmax(0, 1fr)',
            'column-gap': '20px',
            'row-gap': '72px'
          },
          cmsCategoryId: '',
          cmsSortField: 'createTime',
          cmsSortAsc: false,
          cmsLoopItemType: 'product',
          cmsLoopItemTemplateResourceId: '',
          cmsCategoryLoopMode: 'root',
          cmsCategoryParentId: '',
          cmsCategoryClickTarget: 'productList',
          cmsListMode: 'grid',
          ...PAGINATION_PROPS,
          traits: [
            {
              type: 'select',
              label: '产品分类',
              name: 'cmsCategoryId',
              changeProp: true,
              options: [{ value: '', label: '全部产品' }]
            },
            {
              type: 'select',
              label: '循环体类型',
              name: 'cmsLoopItemType',
              changeProp: true,
              options: PRODUCT_LOOP_ITEM_TYPE_OPTIONS
            },
            {
              type: 'select',
              label: '列表模式',
              name: 'cmsListMode',
              changeProp: true,
              options: PRODUCT_LIST_MODE_OPTIONS
            },
            {
              type: 'loop-item-template-select',
              label: '循环体资源ID',
              name: 'cmsLoopItemTemplateResourceId',
              changeProp: true
            },
            {
              type: 'select',
              label: '分类循环内容',
              name: 'cmsCategoryLoopMode',
              changeProp: true,
              options: CATEGORY_LOOP_MODE_OPTIONS
            },
            {
              type: 'text',
              label: '指定父级ID',
              name: 'cmsCategoryParentId',
              changeProp: true,
              placeholder: 'childrenOf/descendantsOf 使用'
            },
            {
              type: 'select',
              label: '分类点击效果',
              name: 'cmsCategoryClickTarget',
              changeProp: true,
              options: [
                { value: 'productList', label: '进入产品列表' },
                { value: 'categoryList', label: '进入下一级分类列表' }
              ]
            },
            {
              type: 'select',
              label: '排序字段',
              name: 'cmsSortField',
              changeProp: true,
              options: [
                { value: 'createTime', label: '创建时间' },
                { value: 'price', label: '价格' },
                { value: 'salesCount', label: '销量' }
              ]
            },
            { type: 'checkbox', label: '升序排列', name: 'cmsSortAsc', changeProp: true },
          ...PAGINATION_TRAITS
          ],
          components: [
            {
              tagName: 'h1',
              draggable: false,
              droppable: false,
              editable: true,
              attributes: { class: 'wb-product-datasheet-page-title' },
              content: 'Datasheet'
            },
            {
              tagName: 'div',
              draggable: false,
              droppable: false,
              selectable: false,
              editable: false,
              copyable: false,
              removable: false,
              attributes: { class: 'wb-product-list__toolbar' },
              components: [
                {
                  tagName: 'span',
                  attributes: {
                    class: 'wb-product-list__count',
                    'data-wb-product-filter-count': ''
                  },
                  content: 'All products'
                },
                {
                  tagName: 'button',
                  selectable: false,
                  hoverable: false,
                  draggable: false,
                  copyable: false,
                  removable: false,
                  layerable: false,
                  attributes: {
                    type: 'button',
                    class: 'wb-product-list__filter-btn',
                    'data-wb-product-filter-trigger': ''
                  },
                  components: [
                    {
                      tagName: 'span',
                      attributes: { class: 'wb-product-list__filter-icon' },
                      content:
                        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="14.2939453125" height="10.16943359375" viewBox="0 0 14.2939453125 10.16943359375"><path d="M13.669434,1.6586914L6.7163897,1.6587628C6.4373689,0.67719728,5.5408416,6.4465263e-13,4.5203896,6.4465263e-13C3.4999375,-7.6293884e-7,2.6034105,0.6771965,2.3243899,1.6587628L0.62438983,1.6587628C0.27945042,1.6590985,0,1.9388211,0,2.2837613C0,2.6287014,0.27945024,2.9084256,0.62438983,2.9087627L2.3243899,2.9087627C2.6034105,3.8903272,3.4999375,4.5675244,4.5203896,4.5675244C5.5408416,4.5675244,6.4373689,3.8903272,6.7163897,2.9087627L13.669434,2.9086914C14.014374,2.9083529,14.293945,2.6286316,14.293945,2.2836914C14.293945,1.9387512,14.014372,1.6590271,13.669434,1.6586914ZM4.5203896,3.3177624C3.9491978,3.3183148,3.4857583,2.8556211,3.4853897,2.2844296C3.4850221,1.7132367,3.9478636,1.2499462,4.5190568,1.2497616C5.0902491,1.2495785,5.55339,1.7125698,5.55339,2.2837627C5.5528398,2.8542066,5.0908332,3.3166606,4.5203896,3.3177624ZM13.666992,7.2607422L10.739746,7.2607422C10.460726,6.2791772,9.5643969,5.6020508,8.5439453,5.6020508C7.5234938,5.6020508,6.6271667,6.2791772,6.3481445,7.2607422L0.625,7.2607422C0.27982187,7.2607422,0,7.5405641,0,7.8857422C0,8.2309208,0.27982187,8.5107422,0.625,8.5107422L2.4863281,8.5107422L6.3481445,8.5107422C6.6271648,9.4923077,7.5234938,10.169434,8.5439453,10.169434C9.5643988,10.169434,10.460726,9.4923077,10.739746,8.5107422L13.666992,8.5107422C14.01217,8.5107422,14.291992,8.2309208,14.291992,7.8857422C14.291992,7.5405641,14.012171,7.2607422,13.666992,7.2607422ZM8.5439453,8.9187012C7.9726238,8.9192533,7.5089731,8.4563332,7.5087891,7.8850098C7.508605,7.3136868,7.9721346,6.850647,8.543457,6.8508301C9.1147795,6.8510151,9.5777006,7.3144193,9.5771484,7.8857422C9.5765972,8.4560242,9.1142273,8.9181519,8.5439453,8.9187012Z" fill="#121821" fill-opacity="1" style="mix-blend-mode:passthrough"/></svg>'
                    },
                    { tagName: 'span', content: 'Filter' },
                    {
                      tagName: 'span',
                      attributes: {
                        class: 'wb-product-list__filter-badge',
                        'data-wb-product-filter-badge': ''
                      }
                    }
                  ]
                }
              ]
            },
            {
              tagName: 'div',
              draggable: false,
              droppable: false,
              selectable: false,
              editable: false,
              copyable: false,
              removable: false,
              attributes: {
                class: 'wb-product-filter-backdrop',
                'data-wb-product-filter-backdrop': ''
              }
            },
            {
              tagName: 'aside',
              draggable: false,
              droppable: false,
              selectable: false,
              editable: false,
              copyable: false,
              removable: false,
              attributes: {
                class: 'wb-product-filter-drawer',
                'data-wb-product-filter-drawer': ''
              },
              components: [
                {
                  tagName: 'div',
                  attributes: { class: 'wb-product-filter__header' },
                  components: [
                    {
                      tagName: 'h3',
                      attributes: { class: 'wb-product-filter__title' },
                      content: 'Category'
                    },
                    {
                      tagName: 'button',
                      selectable: false,
                      hoverable: false,
                      draggable: false,
                      copyable: false,
                      removable: false,
                      layerable: false,
                      attributes: {
                        type: 'button',
                        class: 'wb-product-filter__close',
                        'data-wb-product-filter-close': '',
                        'aria-label': '关闭筛选'
                      },
                      content: '×'
                    }
                  ]
                },
                {
                  tagName: 'div',
                  attributes: { class: 'wb-product-filter__body' },
                  components: [
                    {
                      tagName: 'button',
                      selectable: false,
                      hoverable: false,
                      draggable: false,
                      copyable: false,
                      removable: false,
                      layerable: false,
                      attributes: {
                        type: 'button',
                        class: 'wb-product-filter__all-products',
                        'data-wb-product-filter-clear': ''
                      },
                      components: [
                        {
                          tagName: 'span',
                          content: 'All products'
                        }
                      ]
                    },
                    {
                      tagName: 'div',
                      attributes: {
                        class: 'wb-product-filter__groups',
                        'data-wb-product-filter-groups': ''
                      },
                      components: [
                        {
                          tagName: 'section',
                          attributes: { class: 'wb-product-filter__group' },
                          components: [
                            {
                              tagName: 'button',
                              attributes: {
                                type: 'button',
                                class: 'wb-product-filter__group-header'
                              },
                              components: [
                                {
                                  tagName: 'span',
                                  attributes: { class: 'wb-product-filter__group-title' },
                                  content: 'Subcategories'
                                },
                                {
                                  tagName: 'span',
                                  attributes: { class: 'wb-product-filter__group-toggle' },
                                  content: '−'
                                }
                              ]
                            },
                            {
                              tagName: 'div',
                              attributes: { class: 'wb-product-filter__group-options' },
                              components: [
                                {
                                  tagName: 'label',
                                  attributes: { class: 'wb-product-filter__option' },
                                  components: [
                                    {
                                      tagName: 'input',
                                      attributes: { type: 'checkbox', checked: true }
                                    },
                                    { tagName: 'span', content: 'Option A' }
                                  ]
                                },
                                {
                                  tagName: 'label',
                                  attributes: { class: 'wb-product-filter__option' },
                                  components: [
                                    {
                                      tagName: 'input',
                                      attributes: { type: 'checkbox' }
                                    },
                                    { tagName: 'span', content: 'Option B' }
                                  ]
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  tagName: 'div',
                  attributes: { class: 'wb-product-filter__footer' },
                  components: [
                    {
                      tagName: 'button',
                      selectable: false,
                      hoverable: false,
                      draggable: false,
                      copyable: false,
                      removable: false,
                      layerable: false,
                      attributes: {
                        type: 'button',
                        class: 'wb-product-filter__footer-btn',
                        'data-wb-product-filter-cancel': ''
                      },
                      content: 'Cancel'
                    },
                    {
                      tagName: 'button',
                      selectable: false,
                      hoverable: false,
                      draggable: false,
                      copyable: false,
                      removable: false,
                      layerable: false,
                      attributes: {
                        type: 'button',
                        class:
                          'wb-product-filter__footer-btn wb-product-filter__footer-btn--primary',
                        'data-wb-product-filter-confirm': ''
                      },
                      content: 'Confirm'
                    }
                  ]
                }
              ]
            },
            {
              tagName: 'div',
              draggable: false,
              droppable: `[data-gjs-type="${WB_CMS_PRODUCT_CARD_TYPE}"], [data-wb-component="cms-product-card"]`,
              selectable: false,
              editable: false,
              copyable: false,
              removable: false,
              attributes: {
                class: 'wb-product-list__grid',
                'data-wb-product-grid': ''
              },
              components: [{ type: WB_CMS_PRODUCT_CARD_TYPE }]
            },
            {
              tagName: 'div',
              draggable: false,
              droppable: false,
              selectable: false,
              editable: false,
              copyable: false,
              removable: false,
              attributes: {
                class: 'wb-product-datasheet',
                'data-wb-product-datasheet': '',
                style: '--wb-datasheet-field-count: 5;'
              },
              components: [
                {
                  tagName: 'div',
                  attributes: { class: 'wb-product-datasheet__summary' },
                  components: [
                    {
                      tagName: 'div',
                      components: [
                        {
                          tagName: 'h2',
                          attributes: { class: 'wb-product-datasheet__title' },
                          content: 'Search Results'
                        },
                        {
                          tagName: 'div',
                          attributes: { class: 'wb-product-datasheet__meta' },
                          components: [
                            {
                              tagName: 'span',
                              attributes: { 'data-wb-product-filter-count': '' },
                              content: 'All products'
                            },
                            { tagName: 'span', content: '|' },
                            {
                              tagName: 'span',
                              components: [
                                { tagName: 'span', content: 'Selected: ' },
                                {
                                  tagName: 'span',
                                  attributes: {
                                    class: 'wb-product-datasheet__selected',
                                    'data-wb-product-datasheet-selected-count': ''
                                  },
                                  content: '0'
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    },
                    {
                      tagName: 'button',
                      selectable: false,
                      hoverable: false,
                      draggable: false,
                      copyable: false,
                      removable: false,
                      layerable: false,
                      attributes: {
                        type: 'button',
                        class: 'wb-product-datasheet__export',
                        'data-wb-product-datasheet-export': ''
                      },
                      content: 'Export'
                    }
                  ]
                },
                {
                  tagName: 'div',
                  attributes: { class: 'wb-product-datasheet__table' },
                  components: [
                    {
                      tagName: 'div',
                      attributes: { class: 'wb-product-datasheet__header' },
                      components: [
                        {
                          tagName: 'label',
                          attributes: {
                            class: 'wb-product-datasheet__cell wb-product-datasheet__checkbox',
                            'data-wb-product-datasheet-header-cell': ''
                          },
                          components: [
                            {
                              tagName: 'input',
                              attributes: {
                                type: 'checkbox',
                                'data-wb-product-datasheet-select-all': ''
                              }
                            }
                          ]
                        },
                        {
                          tagName: 'div',
                          attributes: {
                            class: 'wb-product-datasheet__cell',
                            'data-wb-product-datasheet-header-cell': ''
                          },
                          content: 'Designation'
                        },
                        {
                          tagName: 'div',
                          attributes: {
                            class: 'wb-product-datasheet__cell',
                            'data-cms-repeat': 'field@datasheetFields',
                            'data-wb-product-datasheet-header-cell': '',
                            'data-cms-bind': 'field.label'
                          },
                          content: 'Field'
                        }
                      ]
                    },
                    {
                      tagName: 'div',
                      attributes: { class: 'wb-product-datasheet__body' },
                      components: [
                        {
                          tagName: 'div',
                          attributes: {
                            class: 'wb-product-datasheet__row',
                            'data-cms-repeat': 'product',
                            'data-wb-product-datasheet-row': '',
                            'data-cms-bind-data-product-spec-values': 'product.specValueJson'
                          },
                          components: [
                            {
                              tagName: 'label',
                              attributes: {
                                class: 'wb-product-datasheet__cell wb-product-datasheet__checkbox',
                                'data-wb-product-datasheet-cell': ''
                              },
                              components: [
                                {
                                  tagName: 'input',
                                  attributes: {
                                    type: 'checkbox',
                                    'data-wb-product-datasheet-select-row': '',
                                    'data-cms-bind-value': 'product.id'
                                  }
                                }
                              ]
                            },
                            {
                              tagName: 'div',
                              attributes: {
                                class: 'wb-product-datasheet__cell',
                                'data-wb-product-datasheet-cell': ''
                              },
                              components: [
                                {
                                  tagName: 'a',
                                  attributes: {
                                    class: 'wb-product-datasheet__designation-link',
                                    href: '#',
                                    'data-cms-bind': 'product.datasheetDesignation',
                                    'data-cms-bind-href': 'product.url'
                                  },
                                  content: 'LR605-2RSR'
                                }
                              ]
                            },
                            {
                              tagName: 'div',
                              attributes: {
                                class: 'wb-product-datasheet__cell',
                                'data-cms-repeat': 'cell@product.datasheetCells',
                                'data-wb-product-datasheet-cell': '',
                                'data-cms-bind': 'cell.value'
                              },
                              content: '-'
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              tagName: 'script',
              draggable: false,
              droppable: false,
              selectable: false,
              editable: false,
              copyable: false,
              removable: false,
              attributes: {
                type: 'text/html',
                'data-wb-product-card-template': ''
              },
              content: DEFAULT_PRODUCT_CARD_TEMPLATE.trim()
            },
            {
              tagName: 'nav',
              draggable: false,
              droppable: false,
              selectable: false,
              editable: false,
              copyable: false,
              removable: false,
              attributes: { 'data-cms-pagination': '', class: 'wb-product-list-pagination' },
              components: [
                {
                  tagName: 'span',
                  attributes: { class: 'wb-product-list-page-btn active' },
                  content: '1'
                },
                {
                  tagName: 'span',
                  attributes: { class: 'wb-product-list-page-btn' },
                  content: '2'
                },
                {
                  tagName: 'span',
                  attributes: { class: 'wb-product-list-page-btn' },
                  content: '3'
                },
                {
                  tagName: 'span',
                  attributes: { class: 'wb-product-list-page-btn' },
                  content: '下一页 »'
                }
              ]
            }
          ],
          script: makeProductListScript(),
          'script-export': makeProductListScript()
        },

        init(this: any) {
          this.on(
            'change:cmsCategoryId change:cmsSortField change:cmsSortAsc change:cmsLoopItemType change:cmsLoopItemTemplateResourceId change:cmsCategoryLoopMode change:cmsCategoryParentId change:cmsCategoryClickTarget change:cmsListMode change:cmsPageSize change:cmsPagination change:cmsMaxPages',
            this._syncAttrs
          )
          this._syncAttrs()
          void initProductCategorySelectTrait(this, { allLabel: '全部产品' })
        },

        _syncAttrs(this: any) {
          const categoryId = this.get('cmsCategoryId') || ''
          const sortField = this.get('cmsSortField') || 'createTime'
          const sortAsc = String(this.get('cmsSortAsc') ?? false)
          const loopItemType = this.get('cmsLoopItemType') || 'product'
          const listMode = this.get('cmsListMode') || 'grid'
          const loadAll = listMode === 'datasheet'
          const tenantId = String(getEffectiveTenantId() || '')
          const paginationAttrs = syncPaginationAttrs(this)
          if (loadAll) {
            paginationAttrs['data-page-size'] = '9999'
            paginationAttrs['data-pagination'] = 'none'
            paginationAttrs['data-max-pages'] = '1'
          }
          this.addAttributes({
            'data-cms-component': 'product-list',
            'data-wb-instance-id': String(this.getId?.() || this.cid || ''),
            'data-wb-category-id': String(categoryId),
            'data-wb-sort-field': String(sortField),
            'data-wb-sort-asc': String(sortAsc),
            'data-wb-page-size': String(paginationAttrs['data-page-size'] || '12'),
            'data-wb-pagination': String(paginationAttrs['data-pagination'] || 'static'),
            'data-wb-max-pages': String(paginationAttrs['data-max-pages'] || '10'),
            'data-wb-list-mode': String(listMode),
            'data-wb-load-all': String(loadAll),
            'data-wb-tenant-id': tenantId,
            'data-tenant-id': tenantId,
            'data-category-id': categoryId,
            'data-sort-field': sortField,
            'data-sort-asc': sortAsc,
            'data-list-mode': String(listMode),
            'data-load-all': String(loadAll),
            'data-loop-item-type': String(loopItemType),
            'data-loop-item-template-resource-id': String(
              this.get('cmsLoopItemTemplateResourceId') || ''
            ),
            'data-category-loop-mode': String(this.get('cmsCategoryLoopMode') || 'root'),
            'data-category-parent-id': String(this.get('cmsCategoryParentId') || ''),
            'data-category-click-target': String(
              this.get('cmsCategoryClickTarget') || 'productList'
            ),
            ...paginationAttrs
          })
        }
      }
    })
  }

  // 注册到 cmsTypeRegistry，使 fixCmsComponentsHtml 能同步模型属性（data-category-id 等）到发布 HTML
  registerCmsTypeEntry({
    dataCmsComponent: 'product-list',
    dataWbComponent: 'cms-product-list',
    publishTemplate: '', // dynamicPublish 模式不使用
    dynamicPublish: true
  })
}
