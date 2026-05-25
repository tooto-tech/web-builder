import {
  LOOP_ITEM_TYPE_LABELS,
  type LoopItemType
} from '@/components/WebBuilder/config/templateSharedResources'
import {
  createLoopGridId,
  DEFAULT_LOOP_GRID_SCHEMA,
  LOOP_GRID_SCHEMA_VERSION,
  parseCsvList,
  parseNumber,
  type FilterState,
  type LayoutConfig,
  type LoopGridComponentSchema,
  type PaginationConfig,
  type QueryConfig,
  type ResponsiveLayoutConfig
} from './types'

export const LOOP_GRID_MOBILE_SCROLL_DEVICE_ID = 'mobile'
export const DEFAULT_LOOP_GRID_MOBILE_SCROLL_ITEM_WIDTH = 320
export const DEFAULT_LOOP_GRID_CAROUSEL_ITEM_WIDTH = 360
export const DEFAULT_LOOP_GRID_CAROUSEL_ARROW_POSITION = 50

const PRODUCT_CATEGORY_CONTEXT_LOOP_TYPES = new Set<LoopItemType>(['productCategoryFaq'])

const PRODUCT_CATEGORY_CONTEXT_POST_COLLECTION_OPTIONS = [
  { value: '', label: 'None / normal list' },
  { value: 'applicationPosts', label: 'Application articles' },
  { value: 'engineeringPosts', label: 'Engineering articles' },
  { value: 'challengePosts', label: 'Challenges articles' }
] as const

type ProductCategoryContextPostCollection =
  (typeof PRODUCT_CATEGORY_CONTEXT_POST_COLLECTION_OPTIONS)[number]['value']

export interface LoopGridSchemaModelAdapter {
  get(key: string): unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export function parseBoolean(value: unknown): boolean {
  if (value === true || value === 'true' || value === 1 || value === '1') return true
  return false
}

export function encodeLoopGridSchema(schema: LoopGridComponentSchema): string {
  return encodeURIComponent(JSON.stringify(schema))
}

function decodeLoopGridSchemaJson(value: string): unknown {
  const raw = `${value ?? ''}`.trim()
  if (!raw) throw new Error('Invalid loop grid schema JSON')

  try {
    return JSON.parse(decodeURIComponent(raw))
  } catch {
    try {
      return JSON.parse(raw)
    } catch {
      throw new Error('Invalid loop grid schema JSON')
    }
  }
}

export function parsePersistedLoopGridSchema(value: unknown): Partial<LoopGridComponentSchema> {
  const raw = `${value ?? ''}`.trim()
  if (!raw) return {}

  try {
    const parsed = decodeLoopGridSchemaJson(raw)
    return isRecord(parsed) ? (parsed as Partial<LoopGridComponentSchema>) : {}
  } catch {
    return {}
  }
}

export function parseLoopGridSchema(value: string): LoopGridComponentSchema {
  const parsed = decodeLoopGridSchemaJson(value)
  validateLoopGridSchema(parsed)
  return normalizeLoopGridSchema(parsed)
}

export function validateLoopGridSchema(value: unknown): asserts value is LoopGridComponentSchema {
  if (!isRecord(value)) throw new Error('Loop grid schema must be an object')
  if (value.type !== 'loop-grid') throw new Error('Loop grid schema type is required')
  if (value.version !== LOOP_GRID_SCHEMA_VERSION)
    throw new Error('Loop grid schema version is required')

  const requiredFields = [
    'gridId',
    'filterKey',
    'itemTemplateId',
    'loopItemType',
    'loopItemTemplateResourceId',
    'providerKey',
    'query',
    'layout',
    'pagination',
    'emptyState',
    'filterState',
    'advanced'
  ] as const

  requiredFields.forEach((field) => {
    if (value[field] === undefined || value[field] === null) {
      throw new Error(`Loop grid schema ${field} is required`)
    }
  })

  if (!isRecord(value.query)) throw new Error('Loop grid schema query is required')
  if (!isRecord(value.layout)) throw new Error('Loop grid schema layout is required')
  if (!isRecord(value.pagination)) throw new Error('Loop grid schema pagination is required')
  if (!isRecord(value.emptyState)) throw new Error('Loop grid schema emptyState is required')
  if (!isRecord(value.filterState)) throw new Error('Loop grid schema filterState is required')
  if (!isRecord(value.advanced)) throw new Error('Loop grid schema advanced is required')
}

function normalizeLoopItemType(value: unknown): LoopItemType {
  const raw = String(value ?? '').trim()
  return Object.prototype.hasOwnProperty.call(LOOP_ITEM_TYPE_LABELS, raw)
    ? (raw as LoopItemType)
    : 'post'
}

export function normalizeContextCollection(value: unknown): ProductCategoryContextPostCollection {
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

export function normalizeLoopGridDeviceId(value: unknown): string {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
  return normalized || 'desktop'
}

export function normalizeLoopGridMediaQuery(value: unknown): string {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  if (raw.startsWith('(') || raw.startsWith('not ') || raw.startsWith('only ')) return raw
  if (raw.includes(':')) return raw
  return `(max-width: ${raw})`
}

export function isLoopGridDesktopDevice(deviceId: string): boolean {
  return !deviceId || deviceId === 'desktop'
}

export function getLoopGridDeviceFallbackMediaQuery(deviceId: string): string {
  if (deviceId.includes('mobile')) return '(max-width: 767px)'
  if (deviceId.includes('tablet')) return '(max-width: 1024px)'
  return ''
}

export function normalizeResponsiveLayoutConfig(
  value: unknown
): Record<string, ResponsiveLayoutConfig> {
  const source = isRecord(value) ? value : {}
  return Object.entries(source).reduce<Record<string, ResponsiveLayoutConfig>>(
    (acc, [rawDeviceId, rawConfig]) => {
      const deviceId = normalizeLoopGridDeviceId(rawDeviceId)
      if (isLoopGridDesktopDevice(deviceId) || !isRecord(rawConfig)) return acc

      const nextConfig: ResponsiveLayoutConfig = {}
      if (rawConfig.columns !== undefined) {
        nextConfig.columns = parseNumber(
          rawConfig.columns,
          DEFAULT_LOOP_GRID_SCHEMA.layout.columns,
          {
            min: 1,
            max: 6
          }
        )
      }
      if (rawConfig.columnGap !== undefined) {
        nextConfig.columnGap = parseNumber(
          rawConfig.columnGap,
          DEFAULT_LOOP_GRID_SCHEMA.layout.columnGap,
          {
            min: 0,
            max: 120
          }
        )
      }
      if (rawConfig.rowGap !== undefined) {
        nextConfig.rowGap = parseNumber(rawConfig.rowGap, DEFAULT_LOOP_GRID_SCHEMA.layout.rowGap, {
          min: 0,
          max: 120
        })
      }
      if (parseBoolean(rawConfig.horizontalScroll)) {
        nextConfig.horizontalScroll = true
        nextConfig.scrollItemWidth = parseNumber(
          rawConfig.scrollItemWidth,
          DEFAULT_LOOP_GRID_MOBILE_SCROLL_ITEM_WIDTH,
          {
            min: 160,
            max: 720
          }
        )
      }
      const mediaQuery =
        normalizeLoopGridMediaQuery(rawConfig.mediaQuery) ||
        getLoopGridDeviceFallbackMediaQuery(deviceId)
      if (mediaQuery) nextConfig.mediaQuery = mediaQuery

      if (
        nextConfig.columns !== undefined ||
        nextConfig.columnGap !== undefined ||
        nextConfig.rowGap !== undefined ||
        nextConfig.horizontalScroll
      ) {
        acc[deviceId] = nextConfig
      }
      return acc
    },
    {}
  )
}

function normalizeQueryConfig(value: unknown, loopItemType: LoopItemType): QueryConfig {
  const source = isRecord(value) ? value : {}
  const contextCollection = normalizeContextCollection(source.contextCollection)

  return {
    sourceType: resolveSourceType(loopItemType, contextCollection),
    queryMode: 'manual',
    category: Array.isArray(source.category)
      ? source.category.map(String)
      : parseCsvList(source.category),
    contextCollection,
    orderBy: String(
      source.orderBy || DEFAULT_LOOP_GRID_SCHEMA.query.orderBy
    ) as QueryConfig['orderBy'],
    order: source.order === 'asc' ? 'asc' : 'desc'
  }
}

function normalizeLayoutConfig(value: unknown): LayoutConfig {
  const source = isRecord(value) ? value : {}
  return {
    columns: parseSchemaNumber(source.columns, DEFAULT_LOOP_GRID_SCHEMA.layout.columns, {
      min: 1,
      max: 6
    }),
    itemsPerPage: parseSchemaNumber(
      source.itemsPerPage,
      DEFAULT_LOOP_GRID_SCHEMA.layout.itemsPerPage,
      {
        min: 1,
        max: 48
      }
    ),
    columnGap: parseSchemaNumber(source.columnGap, DEFAULT_LOOP_GRID_SCHEMA.layout.columnGap, {
      min: 0,
      max: 120
    }),
    rowGap: parseSchemaNumber(source.rowGap, DEFAULT_LOOP_GRID_SCHEMA.layout.rowGap, {
      min: 0,
      max: 120
    }),
    loopCarousel: parseBoolean(source.loopCarousel),
    carouselItemWidth: parseSchemaNumber(
      source.carouselItemWidth,
      DEFAULT_LOOP_GRID_CAROUSEL_ITEM_WIDTH,
      {
        min: 160,
        max: 960
      }
    ),
    carouselArrowPosition: parseSchemaNumber(
      source.carouselArrowPosition,
      DEFAULT_LOOP_GRID_CAROUSEL_ARROW_POSITION,
      {
        min: 0,
        max: 100
      }
    )
  }
}

function normalizePaginationConfig(value: unknown): PaginationConfig {
  const source = isRecord(value) ? value : {}
  return {
    mode: source.mode === 'none' ? 'none' : DEFAULT_LOOP_GRID_SCHEMA.pagination.mode,
    pageLimit: parseSchemaNumber(source.pageLimit, DEFAULT_LOOP_GRID_SCHEMA.pagination.pageLimit, {
      min: 1,
      max: 99
    })
  }
}

function normalizeFilterState(value: unknown): FilterState {
  const source = isRecord(value) ? value : {}
  return {
    taxonomy: Array.isArray(source.taxonomy)
      ? source.taxonomy.map(String)
      : parseCsvList(source.taxonomy),
    tag: Array.isArray(source.tag) ? source.tag.map(String) : parseCsvList(source.tag),
    category: Array.isArray(source.category)
      ? source.category.map(String)
      : parseCsvList(source.category),
    author: Array.isArray(source.author) ? source.author.map(String) : parseCsvList(source.author),
    search: String(source.search || ''),
    currentPage: parseSchemaNumber(
      source.currentPage,
      DEFAULT_LOOP_GRID_SCHEMA.filterState.currentPage,
      {
        min: 1,
        max: 99
      }
    ),
    extras: isRecord(source.extras) ? source.extras : {}
  }
}

function normalizeHostRenderMode(
  value: unknown
): LoopGridComponentSchema['advanced']['hostRenderMode'] {
  if (value === 'ssr' || value === 'client') return value
  return DEFAULT_LOOP_GRID_SCHEMA.advanced.hostRenderMode
}

export function normalizeLoopGridSchema(value: unknown): LoopGridComponentSchema {
  const source = isRecord(value) ? value : {}
  const loopItemType = normalizeLoopItemType(source.loopItemType)
  const layout = normalizeLayoutConfig(source.layout)
  const responsiveLayout = normalizeResponsiveLayoutConfig(source.responsiveLayout)

  const schema: LoopGridComponentSchema = {
    type: 'loop-grid',
    version: LOOP_GRID_SCHEMA_VERSION,
    gridId: String(source.gridId || DEFAULT_LOOP_GRID_SCHEMA.gridId),
    filterKey: String(source.filterKey || DEFAULT_LOOP_GRID_SCHEMA.filterKey),
    itemTemplateId: String(source.itemTemplateId || DEFAULT_LOOP_GRID_SCHEMA.itemTemplateId),
    loopItemType,
    loopItemTemplateResourceId: String(
      source.loopItemTemplateResourceId || DEFAULT_LOOP_GRID_SCHEMA.loopItemTemplateResourceId
    ),
    emptyTemplateId: String(
      source.emptyTemplateId || DEFAULT_LOOP_GRID_SCHEMA.emptyTemplateId || ''
    ),
    providerKey: String(source.providerKey || DEFAULT_LOOP_GRID_SCHEMA.providerKey),
    query: normalizeQueryConfig(source.query, loopItemType),
    layout,
    pagination: normalizePaginationConfig(source.pagination),
    emptyState: {
      nothingFoundText: String(
        isRecord(source.emptyState)
          ? source.emptyState.nothingFoundText ||
              DEFAULT_LOOP_GRID_SCHEMA.emptyState.nothingFoundText
          : DEFAULT_LOOP_GRID_SCHEMA.emptyState.nothingFoundText
      )
    },
    filterState: normalizeFilterState(source.filterState),
    advanced: {
      hostRenderMode: normalizeHostRenderMode(
        isRecord(source.advanced) ? source.advanced.hostRenderMode : undefined
      )
    }
  }

  if (Object.keys(responsiveLayout).length > 0) {
    schema.responsiveLayout = responsiveLayout
  }

  return schema
}

export function buildLoopGridSchema(model: LoopGridSchemaModelAdapter): LoopGridComponentSchema {
  const loopItemType = normalizeLoopItemType(model.get('loopItemType'))
  const contextCollection = normalizeContextCollection(model.get('cmsContextCollection'))
  const responsiveLayout = buildResponsiveLayoutConfig(model)
  const schema = normalizeLoopGridSchema({
    gridId: String(model.get('gridId') || createLoopGridId()),
    filterKey: String(model.get('filterKey') || ''),
    itemTemplateId: String(
      model.get('itemTemplateId') ||
        model.get('loopItemTemplateResourceId') ||
        DEFAULT_LOOP_GRID_SCHEMA.itemTemplateId
    ),
    loopItemType,
    loopItemTemplateResourceId: String(model.get('loopItemTemplateResourceId') || ''),
    emptyTemplateId: String(
      model.get('emptyTemplateId') || DEFAULT_LOOP_GRID_SCHEMA.emptyTemplateId || ''
    ),
    providerKey: String(model.get('providerKey') || DEFAULT_LOOP_GRID_SCHEMA.providerKey),
    query: {
      sourceType: resolveSourceType(loopItemType, contextCollection),
      queryMode: 'manual',
      category: parseCsvList(model.get('categoryFilter')),
      contextCollection,
      orderBy: model.get('orderBy') || DEFAULT_LOOP_GRID_SCHEMA.query.orderBy,
      order: model.get('order') || DEFAULT_LOOP_GRID_SCHEMA.query.order
    },
    layout: {
      columns: model.get('baseColumns') ?? model.get('columns'),
      itemsPerPage: model.get('itemsPerPage'),
      columnGap: model.get('baseColumnGap') ?? model.get('columnGap'),
      rowGap: model.get('baseRowGap') ?? model.get('rowGap'),
      loopCarousel: model.get('loopCarousel'),
      carouselItemWidth: model.get('carouselItemWidth'),
      carouselArrowPosition: model.get('carouselArrowPosition')
    },
    responsiveLayout,
    pagination: {
      mode: String(model.get('paginationType') || DEFAULT_LOOP_GRID_SCHEMA.pagination.mode),
      pageLimit: model.get('pageLimit')
    },
    emptyState: {
      nothingFoundText: String(
        model.get('nothingFoundText') || DEFAULT_LOOP_GRID_SCHEMA.emptyState.nothingFoundText
      )
    },
    filterState: {
      taxonomy: parseCsvList(model.get('activeTaxonomy')),
      tag: parseCsvList(model.get('activeTag')),
      category: parseCsvList(model.get('activeCategory')),
      author: parseCsvList(model.get('activeAuthor')),
      search: String(model.get('activeSearch') || ''),
      currentPage: model.get('previewCurrentPage'),
      extras: {
        cmsContextCollection: contextCollection,
        cmsCategoryLoopMode: String(model.get('cmsCategoryLoopMode') || 'root'),
        cmsCategoryParentId: String(model.get('cmsCategoryParentId') || ''),
        cmsCategoryClickTarget: String(model.get('cmsCategoryClickTarget') || 'contentList')
      }
    },
    advanced: {
      hostRenderMode: model.get('hostRenderMode')
    }
  })

  return schema
}

export function buildResponsiveLayoutConfig(
  model: LoopGridSchemaModelAdapter
): Record<string, ResponsiveLayoutConfig> {
  const responsive = normalizeResponsiveLayoutConfig(model.get('responsiveLayout'))
  const mobileHorizontalScroll = parseBoolean(model.get('mobileHorizontalScroll'))
  const mobileConfig = { ...(responsive[LOOP_GRID_MOBILE_SCROLL_DEVICE_ID] || {}) }

  if (mobileHorizontalScroll) {
    mobileConfig.mediaQuery =
      mobileConfig.mediaQuery ||
      getLoopGridDeviceFallbackMediaQuery(LOOP_GRID_MOBILE_SCROLL_DEVICE_ID)
    mobileConfig.horizontalScroll = true
    mobileConfig.scrollItemWidth = parseNumber(
      model.get('mobileScrollItemWidth'),
      DEFAULT_LOOP_GRID_MOBILE_SCROLL_ITEM_WIDTH,
      {
        min: 160,
        max: 720
      }
    )
    responsive[LOOP_GRID_MOBILE_SCROLL_DEVICE_ID] = mobileConfig
  } else if (responsive[LOOP_GRID_MOBILE_SCROLL_DEVICE_ID]) {
    delete mobileConfig.horizontalScroll
    delete mobileConfig.scrollItemWidth
    if (
      mobileConfig.columns !== undefined ||
      mobileConfig.columnGap !== undefined ||
      mobileConfig.rowGap !== undefined
    ) {
      responsive[LOOP_GRID_MOBILE_SCROLL_DEVICE_ID] = mobileConfig
    } else {
      delete responsive[LOOP_GRID_MOBILE_SCROLL_DEVICE_ID]
    }
  }

  return responsive
}

function parseSchemaNumber(
  value: unknown,
  fallback: number,
  options?: { min?: number; max?: number }
): number {
  if (value === '' || value === undefined || value === null) return fallback
  return parseNumber(value, fallback, options)
}
