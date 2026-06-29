import type { Editor } from 'grapesjs'

import {
  LOOP_GRID_NEXT_ICON,
  LOOP_GRID_PAGINATION_SCRIPT,
  LOOP_GRID_PAGINATION_STYLE,
  LOOP_GRID_PREV_ICON,
} from './paginationStyles.js'
import {
  DEFAULT_LOOP_GRID_SCHEMA,
  encodeLoopGridSchema,
  parseCsvList,
  parseNumber,
  type LoopGridComponentSchema,
} from './types.js'

export const WB_LOOP_GRID_TYPE = 'wb-loop-grid'

const LOOP_GRID_CSS = `
  [data-wb-component="loop-grid"]{display:block;width:100%;min-height:180px;}
  .wb-loop-grid{display:block;width:100%;overflow-x:visible;}
  .wb-loop-grid__grid{display:grid;width:100%;align-items:stretch;}
  .wb-loop-grid__item{display:flex;flex-direction:column;min-width:0;}
  .wb-loop-grid__fallback-card{gap:10px;color:#0f172a;}
  .wb-loop-grid__fallback-media{aspect-ratio:4/3;width:100%;object-fit:cover;background:#f3f4f6;}
  .wb-loop-grid__fallback-title{margin:0;color:#041038;font-size:20px;line-height:1.2;font-weight:700;}
  .wb-loop-grid__fallback-text{margin:0;color:#4b5563;font-size:14px;line-height:1.6;}
  .wb-loop-grid__fallback-link{color:#264faa;text-decoration:none;font-weight:700;}
`

const escapeAttr = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const normalizeLoopItemType = (value: unknown): string => {
  const raw = String(value ?? '').trim()
  return raw || DEFAULT_LOOP_GRID_SCHEMA.loopItemType
}

const resolveCmsComponentType = (loopItemType: string): string => {
  if (loopItemType === 'product' || loopItemType === 'productCategory') return 'product-list'
  if (loopItemType === 'media' || loopItemType === 'mediaCategory') return 'media-list'
  if (loopItemType === 'productCategoryFaq') return 'product-category-faq'
  return 'post-list'
}

const resolvePaginationMode = (value: unknown): 'none' | 'numbers' =>
  String(value ?? '').trim() === 'none' ? 'none' : 'numbers'

const resolveFallbackBindings = (loopItemType: string) => {
  if (loopItemType === 'product' || loopItemType === 'productCategory') {
    return {
      prefix: 'product',
      title: 'Product title',
      excerpt: 'Product description',
      image: 'https://dummyimage.com/640x480/f3f4f6/0f172a&text=Product',
    }
  }

  if (loopItemType === 'media' || loopItemType === 'mediaCategory') {
    return {
      prefix: 'media',
      title: 'Media title',
      excerpt: 'Media description',
      image: 'https://dummyimage.com/640x480/f3f4f6/0f172a&text=Media',
    }
  }

  return {
    prefix: 'post',
    title: 'Post title',
    excerpt: 'Post excerpt',
    image: 'https://dummyimage.com/640x480/f3f4f6/0f172a&text=Post',
  }
}

const renderFallbackLoopItem = (loopItemType: string): string => {
  const bindings = resolveFallbackBindings(loopItemType)
  return `
    <article class="wb-loop-grid__item wb-loop-grid__fallback-card">
      <img class="wb-loop-grid__fallback-media" src="${escapeAttr(bindings.image)}" alt="" data-cms-bind-src="${bindings.prefix}.image" data-cms-bind-alt="${bindings.prefix}.name">
      <h3 class="wb-loop-grid__fallback-title" data-cms-bind="${bindings.prefix}.name">${escapeAttr(bindings.title)}</h3>
      <p class="wb-loop-grid__fallback-text" data-cms-bind="${bindings.prefix}.description">${escapeAttr(bindings.excerpt)}</p>
      <a class="wb-loop-grid__fallback-link" href="#" data-cms-bind-href="${bindings.prefix}.url">Learn more</a>
    </article>
  `
}

const buildLoopGridStyle = (schema: LoopGridComponentSchema): string => {
  const columns = parseNumber(schema.layout.columns, DEFAULT_LOOP_GRID_SCHEMA.layout.columns, {
    min: 1,
    max: 6,
  })
  const columnGap = parseNumber(
    schema.layout.columnGap,
    DEFAULT_LOOP_GRID_SCHEMA.layout.columnGap,
    { min: 0, max: 120 }
  )
  const rowGap = parseNumber(schema.layout.rowGap, DEFAULT_LOOP_GRID_SCHEMA.layout.rowGap, {
    min: 0,
    max: 120,
  })

  return [
    `grid-template-columns:repeat(${columns},minmax(0,1fr))`,
    `column-gap:${columnGap}px`,
    `row-gap:${rowGap}px`,
  ].join(';')
}

const buildLoopGridSchema = (model: any): LoopGridComponentSchema => {
  const attrs = model.getAttributes?.() || {}
  const loopItemType = normalizeLoopItemType(
    model.get?.('loopItemType') ?? attrs['data-loop-item-type']
  )
  const itemsPerPage = parseNumber(
    model.get?.('itemsPerPage') ?? attrs['data-page-size'] ?? attrs['data-wb-page-size'],
    DEFAULT_LOOP_GRID_SCHEMA.layout.itemsPerPage,
    { min: 1, max: 60 }
  )

  return {
    ...DEFAULT_LOOP_GRID_SCHEMA,
    gridId: String(
      model.get?.('gridId') ??
        attrs['data-wb-grid-id'] ??
        model.getId?.() ??
        model.cid ??
        DEFAULT_LOOP_GRID_SCHEMA.gridId
    ),
    filterKey: String(model.get?.('filterKey') ?? attrs['data-wb-filter-key'] ?? ''),
    providerKey: String(
      model.get?.('providerKey') ??
        attrs['data-wb-provider-key'] ??
        DEFAULT_LOOP_GRID_SCHEMA.providerKey
    ),
    itemTemplateId: String(
      model.get?.('itemTemplateId') ??
        attrs['data-wb-item-template-id'] ??
        DEFAULT_LOOP_GRID_SCHEMA.itemTemplateId
    ),
    loopItemType,
    loopItemTemplateResourceId: String(
      model.get?.('loopItemTemplateResourceId') ??
        attrs['data-loop-item-template-resource-id'] ??
        ''
    ),
    query: {
      ...DEFAULT_LOOP_GRID_SCHEMA.query,
      category: parseCsvList(
        model.get?.('categoryFilter') ??
          attrs['data-category-id'] ??
          attrs['data-wb-category-id'] ??
          ''
      ),
      orderBy: String(model.get?.('orderBy') ?? attrs['data-wb-sort-field'] ?? 'date') as any,
      order:
        model.get?.('order') ??
        (attrs['data-wb-sort-asc'] === 'true' || attrs['data-sort-asc'] === 'true'
          ? 'asc'
          : DEFAULT_LOOP_GRID_SCHEMA.query.order),
    },
    layout: {
      ...DEFAULT_LOOP_GRID_SCHEMA.layout,
      columns: parseNumber(model.get?.('columns'), DEFAULT_LOOP_GRID_SCHEMA.layout.columns, {
        min: 1,
        max: 6,
      }),
      itemsPerPage,
      columnGap: parseNumber(
        model.get?.('columnGap'),
        DEFAULT_LOOP_GRID_SCHEMA.layout.columnGap,
        { min: 0, max: 120 }
      ),
      rowGap: parseNumber(model.get?.('rowGap'), DEFAULT_LOOP_GRID_SCHEMA.layout.rowGap, {
        min: 0,
        max: 120,
      }),
    },
    pagination: {
      ...DEFAULT_LOOP_GRID_SCHEMA.pagination,
      mode: resolvePaginationMode(
        model.get?.('paginationType') ?? attrs['data-pagination'] ?? attrs['data-wb-pagination']
      ),
      pageLimit: parseNumber(
        model.get?.('pageLimit') ?? attrs['data-max-pages'] ?? attrs['data-wb-max-pages'],
        DEFAULT_LOOP_GRID_SCHEMA.pagination.pageLimit,
        { min: 1, max: 50 }
      ),
    },
  }
}

const buildCmsRenderAttrs = (schema: LoopGridComponentSchema): Record<string, string> => {
  const loopItemType = normalizeLoopItemType(schema.loopItemType)
  const cmsComponent = resolveCmsComponentType(loopItemType)
  const categoryId = schema.query.category[0] || ''

  return {
    class: 'wb-loop-grid',
    'data-cms-component': cmsComponent,
    'data-page-size': String(schema.layout.itemsPerPage),
    'data-wb-page-size': String(schema.layout.itemsPerPage),
    'data-pagination': resolvePaginationMode(schema.pagination.mode),
    'data-wb-pagination': resolvePaginationMode(schema.pagination.mode),
    'data-max-pages': String(schema.pagination.pageLimit),
    'data-wb-max-pages': String(schema.pagination.pageLimit),
    'data-category-id': categoryId,
    'data-wb-category-id': categoryId,
    'data-loop-item-type': loopItemType,
    'data-loop-item-template-resource-id': schema.loopItemTemplateResourceId,
  }
}

const renderLoopGridPublishHtml = (schema: LoopGridComponentSchema): string => {
  const loopItemType = normalizeLoopItemType(schema.loopItemType)
  const cmsComponent = resolveCmsComponentType(loopItemType)
  const paginationClass =
    cmsComponent === 'product-list'
      ? 'wb-product-list-pagination'
      : cmsComponent === 'media-list'
        ? 'wb-cms-media-pagination'
        : 'wb-post-list-pagination'
  const pageBtnClass =
    cmsComponent === 'product-list'
      ? 'wb-product-list-page-btn'
      : cmsComponent === 'media-list'
        ? 'wb-cms-media-page-btn'
        : 'wb-post-list-page-btn'
  const pagination =
    resolvePaginationMode(schema.pagination.mode) === 'none'
      ? ''
      : `
        ${LOOP_GRID_PAGINATION_STYLE}
        <nav data-cms-pagination class="${paginationClass} wb-loop-grid-pagination">
          <span class="${pageBtnClass} wb-loop-grid-pagination__btn" aria-label="上一页">${LOOP_GRID_PREV_ICON}</span>
          <span class="${pageBtnClass} wb-loop-grid-pagination__number active">1</span>
          <span class="${pageBtnClass} wb-loop-grid-pagination__number">2</span>
          <span class="${pageBtnClass} wb-loop-grid-pagination__number">3</span>
          <span class="${pageBtnClass} wb-loop-grid-pagination__btn" aria-label="下一页">${LOOP_GRID_NEXT_ICON}</span>
        </nav>
        ${LOOP_GRID_PAGINATION_SCRIPT}
      `

  return `
    <div class="wb-loop-grid__grid" data-wb-loop-grid-cards="${escapeAttr(schema.gridId)}" style="${escapeAttr(buildLoopGridStyle(schema))}">
      ${renderFallbackLoopItem(loopItemType)}
    </div>
    ${pagination}
  `
}

export function registerLoopGridPublisherComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_LOOP_GRID_TYPE)) return

  domComponents.addType(WB_LOOP_GRID_TYPE, {
    isComponent: (el: HTMLElement) => {
      if (!el?.getAttribute) return false
      return el.getAttribute('data-wb-component') === 'loop-grid' ||
        el.getAttribute('data-cms-component') === 'loop-grid' ||
        el.classList?.contains('wb-loop-grid')
        ? { type: WB_LOOP_GRID_TYPE }
        : false
    },
    model: {
      defaults: {
        name: 'Loop Grid',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        attributes: {
          'data-wb-component': 'loop-grid',
          'data-cms-component': 'post-list',
          class: 'wb-loop-grid',
        },
        styles: LOOP_GRID_CSS,
        style: {
          width: '100%',
          display: 'block',
        },
      },
      init(this: any) {
        const schema = buildLoopGridSchema(this)
        this.addAttributes({
          ...buildCmsRenderAttrs(schema),
          'data-wb-component': 'loop-grid',
          'data-wb-instance-id': String(this.getId?.() || this.cid || ''),
          'data-wb-loop-grid-version': String(schema.version),
          'data-wb-grid-id': schema.gridId,
          'data-wb-filter-key': schema.filterKey,
          'data-wb-source-type': schema.query.sourceType,
          'data-wb-query-mode': schema.query.queryMode,
          'data-wb-item-template-id': schema.itemTemplateId,
          'data-wb-provider-key': schema.providerKey,
          'data-wb-loop-grid-schema': encodeLoopGridSchema(schema),
        })
      },
      getInnerHTML(this: any) {
        return renderLoopGridPublishHtml(buildLoopGridSchema(this))
      },
    },
  })
}
