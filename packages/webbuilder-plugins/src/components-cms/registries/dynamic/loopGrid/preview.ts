import {
  DEFAULT_LOOP_GRID_SCHEMA,
  type FilterState,
  type LoopGridComponentSchema,
  type LoopGridRecord,
  type LoopGridTemplateDefinition
} from './types.js'
import {
  LOOP_GRID_NEXT_ICON,
  LOOP_GRID_PAGINATION_STYLE,
  LOOP_GRID_PREV_ICON
} from './paginationStyles.js'

export interface LoopGridPreviewTemplate {
  html: string
  label?: string
  css?: string
}

type LoopGridPreviewFieldMap = Record<string, unknown>

export interface LoopGridPreviewData {
  items: LoopGridRecord[]
  pageNo?: number
  total?: number
  totalPages?: number
  loading?: boolean
  error?: string
}

const TEMPLATE_REGISTRY: Record<string, LoopGridTemplateDefinition> = {
  'post-card': { id: 'post-card', label: 'Post Card', kind: 'item', accentColor: '#1d4ed8' },
  'product-card': {
    id: 'product-card',
    label: 'Product Card',
    kind: 'item',
    accentColor: '#0f766e'
  },
  'taxonomy-card': {
    id: 'taxonomy-card',
    label: 'Taxonomy Card',
    kind: 'item',
    accentColor: '#7c3aed'
  },
  'minimal-card': {
    id: 'minimal-card',
    label: 'Minimal Card',
    kind: 'item',
    accentColor: '#475569'
  },
  'empty-default': {
    id: 'empty-default',
    label: 'Default Empty',
    kind: 'empty',
    accentColor: '#64748b'
  }
}

function applyFilterState(items: LoopGridRecord[], filterState: FilterState): LoopGridRecord[] {
  let nextItems = [...items]
  const taxonomyFilters = [...filterState.taxonomy, ...filterState.category, ...filterState.tag]
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

  if (taxonomyFilters.length > 0) {
    nextItems = nextItems.filter((item) =>
      taxonomyFilters.some((filter) => `${item.taxonomy ?? ''}`.toLowerCase().includes(filter))
    )
  }

  const search = `${filterState.search ?? ''}`.trim().toLowerCase()
  if (search) {
    nextItems = nextItems.filter((item) =>
      [item.title, item.subtitle, item.excerpt].some((field) =>
        `${field ?? ''}`.toLowerCase().includes(search)
      )
    )
  }

  return nextItems
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function resolveTemplateLabel(templateId: string): string {
  return TEMPLATE_REGISTRY[templateId]?.label ?? (templateId || 'Template')
}

function getRecordValue(record: LoopGridRecord, field: string): unknown {
  const fields = (record as any).fields as LoopGridPreviewFieldMap | undefined
  if (fields && Object.prototype.hasOwnProperty.call(fields, field)) {
    return fields[field]
  }
  const key = field.split('.').pop() || field
  if (key === 'name') return record.title
  if (key === 'title') return record.title
  if (key === 'introduction' || key === 'description' || key === 'excerpt') return record.excerpt
  if (key === 'picUrl' || key === 'coverUrl' || key === 'image') return record.image
  if (key === 'url' || key === 'detailUrl' || key === 'buyNowUrl') return record.href
  if (key === 'priceFormatted') return record.price
  if (key === 'categoryName' || key === 'typeName' || key === 'type') return record.taxonomy
  if (key === 'publishTime' || key === 'createTime') return record.meta
  return (record as any)[key] ?? ''
}

function composeDynamicUrl(value: unknown, template?: string | null): string {
  const raw = String(value ?? '')
  const tpl = String(template ?? '').trim()
  if (!tpl) return raw
  if (tpl.includes('{{encoded}}')) return tpl.replace(/\{\{encoded\}\}/g, encodeURIComponent(raw))
  if (tpl.includes('{{value}}')) return tpl.replace(/\{\{value\}\}/g, raw)
  return `${tpl}${raw}`
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseNumber(
  value: unknown,
  fallback: number,
  options?: { min?: number; max?: number }
): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  if (options?.min !== undefined && numeric < options.min) return options.min
  if (options?.max !== undefined && numeric > options.max) return options.max
  return numeric
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

function normalizeDynamicImageElement(el: Element, doc: Document): Element {
  if (el.tagName === 'IMG') return el
  const image = doc.createElement('img')
  Array.from(el.attributes).forEach((attr) => image.setAttribute(attr.name, attr.value))
  image.setAttribute('alt', el.getAttribute('alt') || '')
  el.parentNode?.replaceChild(image, el)
  return image
}

function normalizeDynamicImages(root: Element, doc: Document): Element {
  let nextRoot = root
  const matches = [
    ...(root.matches('[data-wb-dynamic="image"]') ? [root] : []),
    ...Array.from(root.querySelectorAll('[data-wb-dynamic="image"]'))
  ]
  matches.forEach((el) => {
    const normalized = normalizeDynamicImageElement(el, doc)
    if (el === nextRoot) nextRoot = normalized
  })
  return nextRoot
}

function renderCustomTemplate(
  template: LoopGridPreviewTemplate,
  record: LoopGridRecord,
  suffix: string
): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(template.html, 'text/html')
  let rootEl = doc.body.firstElementChild as HTMLElement | null
  if (!rootEl) return renderCard(record, 'minimal-card')
  rootEl = normalizeDynamicImages(rootEl, doc) as HTMLElement
  rootEl = normalizeDynamicLinks(rootEl, doc) as HTMLElement
  const root = rootEl

  const idMap = uniquifyLoopItemIds(root, suffix)
  rewriteIdReferences(root, idMap)
  root.removeAttribute('data-cms-repeat')
  root.querySelectorAll('[data-cms-repeat]').forEach((el) => el.removeAttribute('data-cms-repeat'))

  const selectBoundElements = (selector: string) => [
    ...(root.matches(selector) ? [root] : []),
    ...Array.from(root.querySelectorAll(selector))
  ]

  selectBoundElements('[data-cms-bind]').forEach((el) => {
    const field = el.getAttribute('data-cms-bind') || ''
    el.textContent = String(getRecordValue(record, field) ?? '')
  })
  selectBoundElements('[data-cms-html]').forEach((el) => {
    const field = el.getAttribute('data-cms-html') || ''
    el.innerHTML = String(getRecordValue(record, field) ?? '')
  })
  selectBoundElements('[data-cms-bind-src]').forEach((el) => {
    const field = el.getAttribute('data-cms-bind-src') || ''
    const value = getRecordValue(record, field)
    if (value) el.setAttribute('src', String(value))
  })
  selectBoundElements('[data-cms-bind-href]').forEach((el) => {
    const field = el.getAttribute('data-cms-bind-href') || ''
    const template = el.getAttribute('data-cms-bind-href-template') || ''
    const value = getRecordValue(record, field)
    if (value) el.setAttribute('href', composeDynamicUrl(value, template))
  })
  selectBoundElements('[data-cms-bind-alt]').forEach((el) => {
    const field = el.getAttribute('data-cms-bind-alt') || ''
    el.setAttribute('alt', String(getRecordValue(record, field) ?? ''))
  })

  root.setAttribute('data-wb-loop-grid-preview-item', '')
  const css = template.css ? rewriteCssIds(template.css, idMap) : ''
  return `${css ? `<style data-wb-loop-item-preview-style>${css}</style>` : ''}${root.outerHTML}`
}

function renderCard(record: LoopGridRecord, templateId: string): string {
  const accent = TEMPLATE_REGISTRY[templateId]?.accentColor ?? '#1d4ed8'
  const taxonomy = escapeHtml(record.taxonomy || 'Unassigned')
  const badge = record.badge
    ? `<span class="wb-loop-grid-card__badge">${escapeHtml(record.badge)}</span>`
    : ''

  if (templateId === 'minimal-card') {
    return `
      <article class="wb-loop-grid-card wb-loop-grid-card--minimal" style="--wb-loop-grid-accent:${accent}">
        <div class="wb-loop-grid-card__meta">${taxonomy}</div>
        <h4 class="wb-loop-grid-card__title">${escapeHtml(record.title)}</h4>
        <p class="wb-loop-grid-card__excerpt">${escapeHtml(record.excerpt)}</p>
      </article>
    `
  }

  if (templateId === 'product-card') {
    return `
      <article class="wb-loop-grid-card wb-loop-grid-card--product" style="--wb-loop-grid-accent:${accent}">
        <div class="wb-loop-grid-card__meta-row">
          <span class="wb-loop-grid-card__meta">${taxonomy}</span>
          ${badge}
        </div>
        <h4 class="wb-loop-grid-card__title">${escapeHtml(record.title)}</h4>
        <p class="wb-loop-grid-card__subtitle">${escapeHtml(record.subtitle)}</p>
        <p class="wb-loop-grid-card__excerpt">${escapeHtml(record.excerpt)}</p>
        <div class="wb-loop-grid-card__footer">
          <span class="wb-loop-grid-card__price">${escapeHtml(record.price || '$0.00')}</span>
          <span class="wb-loop-grid-card__action">View</span>
        </div>
      </article>
    `
  }

  if (templateId === 'taxonomy-card') {
    return `
      <article class="wb-loop-grid-card wb-loop-grid-card--taxonomy" style="--wb-loop-grid-accent:${accent}">
        <div class="wb-loop-grid-card__meta">${taxonomy}</div>
        <h4 class="wb-loop-grid-card__title">${escapeHtml(record.title)}</h4>
        <p class="wb-loop-grid-card__excerpt">${escapeHtml(record.excerpt)}</p>
        <div class="wb-loop-grid-card__footer"><span class="wb-loop-grid-card__action">Open Archive</span></div>
      </article>
    `
  }

  return `
    <article class="wb-loop-grid-card" style="--wb-loop-grid-accent:${accent}">
      <div class="wb-loop-grid-card__meta-row">
        <span class="wb-loop-grid-card__meta">${taxonomy}</span>
        ${badge}
      </div>
      <h4 class="wb-loop-grid-card__title">${escapeHtml(record.title)}</h4>
      <p class="wb-loop-grid-card__subtitle">${escapeHtml(record.subtitle)}</p>
      <p class="wb-loop-grid-card__excerpt">${escapeHtml(record.excerpt)}</p>
      <div class="wb-loop-grid-card__footer">
        <span>${escapeHtml(record.meta)}</span>
        <span class="wb-loop-grid-card__action">Read More</span>
      </div>
    </article>
  `
}

function buildLoopGridPageHref(page: number): string {
  return page > 1 ? `page/${page}.html` : './'
}

function buildPagination(
  totalPages: number,
  currentPage: number,
  mode: LoopGridComponentSchema['pagination']['mode']
): string {
  if (mode === 'none' || totalPages <= 1) return ''

  const buttons = Array.from({ length: totalPages }, (_, index) => {
    const page = index + 1
    const active = page === currentPage ? ' active' : ''
    return `<a class="wb-loop-grid-pagination__number${active}" href="${buildLoopGridPageHref(page)}" data-wb-loop-grid-page="${page}"${page === currentPage ? ' aria-current="page"' : ''}>${page}</a>`
  }).join('')

  const prev =
    currentPage > 1
      ? `<a class="wb-loop-grid-pagination__btn" href="${buildLoopGridPageHref(currentPage - 1)}" data-wb-loop-grid-page="${currentPage - 1}" aria-label="上一页">${LOOP_GRID_PREV_ICON}</a>`
      : ''
  const next =
    currentPage < totalPages
      ? `<a class="wb-loop-grid-pagination__btn" href="${buildLoopGridPageHref(currentPage + 1)}" data-wb-loop-grid-page="${currentPage + 1}" aria-label="下一页">${LOOP_GRID_NEXT_ICON}</a>`
      : ''

  return `${LOOP_GRID_PAGINATION_STYLE}<nav class="wb-loop-grid-pagination" data-cms-pagination>${prev}${buttons}${next}</nav>`
}

function isProductCategoryContextLoopType(schema: LoopGridComponentSchema): boolean {
  return (
    schema.loopItemType === 'productCategoryFaq' ||
    (schema.loopItemType === 'post' && !!`${schema.query.contextCollection ?? ''}`.trim())
  )
}

function renderLoopGridMissingTemplate(schema: LoopGridComponentSchema): string {
  const selectedTemplate =
    `${schema.loopItemTemplateResourceId || schema.itemTemplateId || ''}`.trim()
  return `
    <div class="wb-loop-grid-empty" data-wb-loop-grid-missing-template>
      <strong>Loop Item Template not loaded</strong>
      <p>${selectedTemplate ? `Selected template ID: ${escapeHtml(selectedTemplate)}` : 'Please select a loop item template.'}</p>
    </div>
  `
}

export function renderLoopGridPreview(
  schemaInput: LoopGridComponentSchema,
  itemTemplate?: LoopGridPreviewTemplate | null,
  previewData?: LoopGridPreviewData | null
): string {
  const schema = {
    ...DEFAULT_LOOP_GRID_SCHEMA,
    ...schemaInput
  }

  if (previewData?.loading) {
    return `
      <div class="wb-loop-grid-render" data-wb-loop-grid-render>
        <div class="wb-loop-grid-empty">
          <strong>Loading loop data...</strong>
          <p>正在读取真实数据用于预览。</p>
        </div>
      </div>
    `
  }

  if (previewData?.error) {
    return `
      <div class="wb-loop-grid-render" data-wb-loop-grid-render>
        <div class="wb-loop-grid-empty">
          <strong>Loop data preview failed</strong>
          <p>${escapeHtml(previewData.error)}</p>
        </div>
      </div>
    `
  }

  const resolvedItems = applyFilterState(previewData?.items || [], schema.filterState)
  const currentPage = Math.max(1, previewData?.pageNo || schema.filterState.currentPage || 1)
  const perPage = Math.max(1, schema.layout.itemsPerPage || 1)
  const totalPages = Math.max(
    1,
    previewData?.totalPages || Math.ceil((previewData?.total || resolvedItems.length) / perPage)
  )
  const normalizedPage = Math.min(currentPage, totalPages)
  const itemOffset = (normalizedPage - 1) * perPage
  const pagedItems = resolvedItems.slice(0, perPage)

  if (pagedItems.length === 0) {
    return `
      <div class="wb-loop-grid-render" data-wb-loop-grid-render>
        <div class="wb-loop-grid-empty">
          <strong>${escapeHtml(itemTemplate?.label || resolveTemplateLabel(schema.emptyTemplateId || 'empty-default'))}</strong>
          <p>${escapeHtml(schema.emptyState.nothingFoundText)}</p>
        </div>
      </div>
    `
  }

  if (!itemTemplate?.html && schema.loopItemTemplateResourceId) {
    return renderLoopGridMissingTemplate(schema)
  }

  const cards = pagedItems
    .map((item, index) => {
      if (itemTemplate?.html) {
        return renderCustomTemplate(
          itemTemplate,
          item,
          `${schema.gridId || schema.loopItemTemplateResourceId || schema.itemTemplateId}-preview-${itemOffset + index + 1}`
        )
      }
      return renderCard(item, schema.itemTemplateId)
    })
    .join('')
  const isCarousel = !!schema.layout.loopCarousel
  const scrollSnap = isCarousel || !!schema.layout.horizontalScroll
  const carouselItemWidth = parseNumber(schema.layout.carouselItemWidth, 360, {
    min: 160,
    max: 960
  })
  const mobileScrollItemWidth = parseNumber(schema.layout.scrollItemWidth, 320, {
    min: 160,
    max: 720
  })
  const arrowPosition = parseNumber(schema.layout.carouselArrowPosition, 50, {
    min: 0,
    max: 100
  })
  const trackStyle = [
    'display:grid',
    `grid-template-columns:repeat(${schema.layout.columns}, minmax(0, 1fr))`,
    `column-gap:${schema.layout.columnGap}px`,
    `row-gap:${schema.layout.rowGap}px`,
    scrollSnap ? `--wb-loop-grid-carousel-item-width:${carouselItemWidth}px` : '',
    scrollSnap ? `--wb-loop-grid-mobile-item-width:${mobileScrollItemWidth}px` : '',
    scrollSnap ? 'grid-template-columns:none' : '',
    scrollSnap ? 'grid-auto-flow:column' : '',
    isCarousel
      ? 'grid-auto-columns:min(var(--wb-loop-grid-carousel-item-width), 86vw)'
      : '',
    !isCarousel && schema.layout.horizontalScroll
      ? 'grid-auto-columns:min(var(--wb-loop-grid-mobile-item-width), 86vw)'
      : '',
    scrollSnap ? 'overflow-x:auto' : '',
    scrollSnap ? 'overflow-y:hidden' : '',
    scrollSnap ? '-webkit-overflow-scrolling:touch' : '',
    scrollSnap ? 'scroll-snap-type:x mandatory' : '',
    isCarousel
      ? 'scroll-padding-inline:calc((100% - min(var(--wb-loop-grid-carousel-item-width), 86vw)) / 2)'
      : '',
    !isCarousel && schema.layout.horizontalScroll
      ? 'scroll-padding-inline:calc((100% - min(var(--wb-loop-grid-mobile-item-width), 86vw)) / 2)'
      : ''
  ]
    .filter(Boolean)
    .join(';')

  return `
    <div class="wb-loop-grid-render" data-wb-loop-grid-render data-wb-loop-item-template-id="${escapeHtml(schema.loopItemTemplateResourceId || schema.itemTemplateId)}">
      ${
        isCarousel
          ? `<div class="wb-loop-grid-carousel-shell" style="--wb-loop-grid-carousel-arrow-y:${arrowPosition}%">
              <button type="button" class="wb-loop-grid-carousel-arrow wb-loop-grid-carousel-arrow--prev" data-wb-loop-carousel-prev aria-label="Previous">${LOOP_GRID_PREV_ICON}</button>`
          : ''
      }
      <div class="wb-loop-grid-cards" ${scrollSnap ? 'data-wb-loop-carousel-track' : ''} style="${trackStyle};">
        ${cards}
      </div>
      ${
        isCarousel
          ? `<button type="button" class="wb-loop-grid-carousel-arrow wb-loop-grid-carousel-arrow--next" data-wb-loop-carousel-next aria-label="Next">${LOOP_GRID_NEXT_ICON}</button>
            </div>`
          : ''
      }
      ${buildPagination(
        totalPages,
        normalizedPage,
        isProductCategoryContextLoopType(schema) ? 'none' : schema.pagination.mode
      )}
    </div>
  `
}

export function mergeFilterState(
  currentFilterState: FilterState,
  incomingFilterState?: Partial<FilterState>
): FilterState {
  return {
    ...currentFilterState,
    ...(incomingFilterState || {}),
    taxonomy: incomingFilterState?.taxonomy ?? currentFilterState.taxonomy,
    tag: incomingFilterState?.tag ?? currentFilterState.tag,
    category: incomingFilterState?.category ?? currentFilterState.category,
    author: incomingFilterState?.author ?? currentFilterState.author,
    currentPage: incomingFilterState?.currentPage ?? 1
  }
}
