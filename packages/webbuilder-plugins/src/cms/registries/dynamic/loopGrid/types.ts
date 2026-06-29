export type LoopGridSourceType = 'posts' | 'products' | 'media' | 'context'

export type LoopGridQueryMode = 'manual'

export type LoopGridOrderBy =
  | 'date'
  | 'title'
  | 'menuOrder'
  | 'price'
  | 'popularity'
  | 'rand'
  | 'custom'

export type LoopGridOrder = 'asc' | 'desc'

export type LoopGridPaginationMode = 'none' | 'numbers'

export interface QueryConfig {
  sourceType: LoopGridSourceType
  queryMode: LoopGridQueryMode
  category: string[]
  contextCollection?: string
  orderBy: LoopGridOrderBy
  order: LoopGridOrder
}

export interface LayoutConfig {
  columns: number
  itemsPerPage: number
  columnGap: number
  rowGap: number
  loopCarousel?: boolean
  carouselItemWidth?: number
  carouselArrowPosition?: number
  horizontalScroll?: boolean
  scrollItemWidth?: number
}

export interface ResponsiveLayoutConfig {
  columns?: number
  columnGap?: number
  rowGap?: number
  mediaQuery?: string
  horizontalScroll?: boolean
  scrollItemWidth?: number
}

export interface PaginationConfig {
  mode: LoopGridPaginationMode
  pageLimit: number
}

export interface FilterState {
  taxonomy: string[]
  tag: string[]
  category: string[]
  author: string[]
  search?: string
  currentPage: number
  extras?: Record<string, unknown>
}

export interface LoopGridComponentSchema {
  type: 'loop-grid'
  version: 1
  gridId: string
  filterKey: string
  itemTemplateId: string
  loopItemType: string
  loopItemTemplateResourceId: string
  emptyTemplateId?: string
  providerKey: string
  query: QueryConfig
  layout: LayoutConfig
  responsiveLayout?: Record<string, ResponsiveLayoutConfig>
  pagination: PaginationConfig
  emptyState: {
    nothingFoundText: string
  }
  filterState: FilterState
  advanced: {
    hostRenderMode: 'mock' | 'ssr' | 'client'
  }
}

export interface LoopGridTemplateDefinition {
  id: string
  label: string
  kind: 'item' | 'empty'
  accentColor?: string
}

export interface LoopGridRecord {
  id: string
  type: LoopGridSourceType
  fields?: Record<string, unknown>
  title: string
  subtitle?: string
  excerpt?: string
  taxonomy?: string
  image?: string
  meta?: string
  price?: string
  badge?: string
  href?: string
}

export const LOOP_GRID_SCHEMA_VERSION = 1

export const DEFAULT_LOOP_GRID_SCHEMA: LoopGridComponentSchema = {
  type: 'loop-grid',
  version: 1,
  gridId: 'loop-grid-1',
  filterKey: '',
  itemTemplateId: 'post-card',
  loopItemType: 'post',
  loopItemTemplateResourceId: '',
  emptyTemplateId: 'empty-default',
  providerKey: 'mock',
  query: {
    sourceType: 'posts',
    queryMode: 'manual',
    category: [],
    contextCollection: '',
    orderBy: 'date',
    order: 'desc'
  },
  layout: {
    columns: 3,
    itemsPerPage: 6,
    columnGap: 24,
    rowGap: 24
  },
  pagination: {
    mode: 'numbers',
    pageLimit: 8
  },
  emptyState: {
    nothingFoundText: 'Nothing found.'
  },
  filterState: {
    taxonomy: [],
    tag: [],
    category: [],
    author: [],
    search: '',
    currentPage: 1,
    extras: {}
  },
  advanced: {
    hostRenderMode: 'ssr'
  }
}

export function parseCsvList(value: unknown): string[] {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function serializeCsvList(items: string[]): string {
  return items
    .map((item) => item.trim())
    .filter(Boolean)
    .join(', ')
}

export function parseNumber(
  value: unknown,
  fallback: number,
  options?: { min?: number; max?: number }
): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback

  let next = numeric
  if (options?.min !== undefined && next < options.min) next = options.min
  if (options?.max !== undefined && next > options.max) next = options.max
  return next
}

export function encodeLoopGridSchema(schema: LoopGridComponentSchema): string {
  return encodeURIComponent(JSON.stringify(schema))
}

export function createLoopGridId(seed?: string): string {
  if (seed) return seed
  return `loop-grid-${Math.random().toString(36).slice(2, 8)}`
}
