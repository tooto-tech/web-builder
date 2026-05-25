export type LayoutTarget = string | number | null

export type LayoutMatchMode = 'include' | 'exclude'

export type LayoutSlotKey = 'header' | 'footer'

export const WB_LAYOUT_PAGE_CUSTOM_KEY = 'wbLayoutSlot'
export const WB_LAYOUT_PAGE_ID_CUSTOM_KEY = 'wbLayoutPageId'

export interface LayoutRule {
  id: string
  name?: string
  layoutId: LayoutTarget
  matchMode: LayoutMatchMode
  pageIds: string[]
  enabled: boolean
  priority: number
  sourceUpdatedAt?: string
  sourceResourceId?: number
}

export interface LayoutSlot {
  defaultLayoutId: LayoutTarget
  rules: LayoutRule[]
}

export interface WebBuilderLayoutSettings {
  version: 1
  header: LayoutSlot
  footer: LayoutSlot
}

const DEFAULT_VERSION = 1 as const

const isRecord = (value: unknown): value is Record<string, any> => {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

const normalizeLayoutTarget = (value: unknown): LayoutTarget => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }

  return null
}

const normalizePageIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []

  const pageIds: string[] = []
  const seen = new Set<string>()

  for (const item of value) {
    const normalized =
      typeof item === 'string'
        ? item.trim()
        : typeof item === 'number' && Number.isFinite(item)
          ? String(item)
          : ''

    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    pageIds.push(normalized)
  }

  return pageIds
}

const uniqueStrings = (items: unknown[]): string[] => {
  const values: string[] = []
  const seen = new Set<string>()

  items.forEach((item) => {
    const value = `${item ?? ''}`.trim()
    if (!value || seen.has(value)) return
    seen.add(value)
    values.push(value)
  })

  return values
}

const normalizeLayoutRule = (
  rule: unknown,
  fallbackIndex = 0,
): LayoutRule => {
  const rawRule = isRecord(rule) ? rule : {}
  const id =
    typeof rawRule.id === 'string' && rawRule.id.trim()
      ? rawRule.id.trim()
      : `layout-rule-${fallbackIndex + 1}`

  return {
    id,
    name:
      typeof rawRule.name === 'string' && rawRule.name.trim()
        ? rawRule.name.trim()
        : undefined,
    layoutId: normalizeLayoutTarget(rawRule.layoutId),
    matchMode: rawRule.matchMode === 'exclude' ? 'exclude' : 'include',
    pageIds: normalizePageIds(rawRule.pageIds),
    enabled: rawRule.enabled !== false,
    priority:
      typeof rawRule.priority === 'number' && Number.isFinite(rawRule.priority)
        ? rawRule.priority
        : fallbackIndex,
    sourceUpdatedAt:
      typeof rawRule.sourceUpdatedAt === 'string' && rawRule.sourceUpdatedAt.trim()
        ? rawRule.sourceUpdatedAt.trim()
        : undefined,
    sourceResourceId:
      typeof rawRule.sourceResourceId === 'number' && Number.isFinite(rawRule.sourceResourceId)
        ? rawRule.sourceResourceId
        : undefined,
  }
}

const normalizeLayoutSlot = (slot: unknown): LayoutSlot => {
  const rawSlot = isRecord(slot) ? slot : {}
  const rules = Array.isArray(rawSlot.rules)
    ? rawSlot.rules.map((rule, index) => normalizeLayoutRule(rule, index))
    : []

  return {
    defaultLayoutId: null,
    rules,
  }
}

export const createDefaultLayoutSettings = (): WebBuilderLayoutSettings => {
  return {
    version: DEFAULT_VERSION,
    header: {
      defaultLayoutId: null,
      rules: [],
    },
    footer: {
      defaultLayoutId: null,
      rules: [],
    },
  }
}

export const normalizeLayoutSettings = (
  settings: unknown,
): WebBuilderLayoutSettings => {
  const rawSettings = isRecord(settings) ? settings : {}

  return {
    version: DEFAULT_VERSION,
    header: normalizeLayoutSlot(rawSettings.header),
    footer: normalizeLayoutSlot(rawSettings.footer),
  }
}

export const cloneLayoutSettings = (
  settings: WebBuilderLayoutSettings | Partial<WebBuilderLayoutSettings> | null | undefined,
): WebBuilderLayoutSettings => {
  return normalizeLayoutSettings(settings)
}

export const getGrapesPageId = (page: any): string => {
  const custom = page?.get?.('custom') ?? page?.custom ?? {}
  return `${custom?.[WB_LAYOUT_PAGE_ID_CUSTOM_KEY] ?? page?.get?.('id') ?? page?.id ?? page?.get?.('name') ?? page?.name ?? ''}`.trim()
}

export const getGrapesPageName = (page: any): string => {
  return `${page?.get?.('name') ?? page?.name ?? getGrapesPageId(page) ?? 'Page'}`.trim()
}

export const getGrapesPageRouteId = (page: any): string => {
  const custom = page?.get?.('custom') ?? page?.custom ?? {}
  return `${page?.get?.('slug') ?? page?.slug ?? custom.slug ?? getGrapesPageId(page)}`.trim()
}

export const getGrapesPageMatchIds = (page: any): string[] => {
  const custom = page?.get?.('custom') ?? page?.custom ?? {}
  const candidates = [
    custom?.[WB_LAYOUT_PAGE_ID_CUSTOM_KEY],
    getGrapesPageRouteId(page),
    getGrapesPageId(page),
    getGrapesPageName(page),
    page?.get?.('slug'),
    page?.slug,
    custom.slug,
  ]
  return uniqueStrings(candidates)
}

export const getPageLayoutSlot = (page: any): LayoutSlotKey | null => {
  const custom = page?.get?.('custom') ?? page?.custom ?? {}
  const slot = custom?.[WB_LAYOUT_PAGE_CUSTOM_KEY]
  if (slot === 'header' || slot === 'footer') return slot

  const layoutPageId = `${custom?.[WB_LAYOUT_PAGE_ID_CUSTOM_KEY] ?? page?.get?.('id') ?? page?.id ?? ''}`.trim()
  if (/^wb-header(?:-\d+)?$/.test(layoutPageId)) return 'header'
  if (/^wb-footer(?:-\d+)?$/.test(layoutPageId)) return 'footer'

  const name = `${page?.get?.('name') ?? page?.name ?? ''}`.trim()
  if (/^Header(?:\s+\d+)?$/.test(name)) return 'header'
  if (/^Footer(?:\s+\d+)?$/.test(name)) return 'footer'

  return null
}

export const isLayoutPage = (page: any): boolean => {
  return getPageLayoutSlot(page) !== null
}

export const getLayoutPageFallbackName = (layoutId: LayoutTarget): string => {
  const id = `${layoutId ?? ''}`.trim()
  const match = /^wb-(header|footer)(?:-(\d+))?$/.exec(id)
  if (!match) return ''

  const title = match[1] === 'header' ? 'Header' : 'Footer'
  return match[2] ? `${title} ${match[2]}` : title
}

export const getLayoutTargetAliases = (layoutId: LayoutTarget): string[] => {
  const id = `${layoutId ?? ''}`.trim()
  if (!id) return []
  return uniqueStrings([
    id,
    getLayoutPageFallbackName(id),
  ])
}

export const getLayoutPageAliases = (page: any): string[] => {
  const id = getGrapesPageId(page)
  return uniqueStrings([
    ...getGrapesPageMatchIds(page),
    id,
    getLayoutPageFallbackName(id),
  ])
}

export const layoutTargetMatchesPage = (layoutId: LayoutTarget, page: any): boolean => {
  const targetAliases = getLayoutTargetAliases(layoutId)
  if (targetAliases.length === 0) return false

  const pageAliases = getLayoutPageAliases(page)
  if (pageAliases.length === 0) return false

  return targetAliases.some((alias) => pageAliases.includes(alias))
}

export const createLayoutPageData = (
  slotKey: LayoutSlotKey,
  existingPages: any[] = [],
  reservedLayoutIds: LayoutTarget[] = [],
): { id: string; name: string; custom: Record<string, any>; component: any } => {
  const existingIds = new Set([
    ...existingPages.map(getGrapesPageId).filter(Boolean),
    ...reservedLayoutIds
      .map((layoutId) => normalizeLayoutTarget(layoutId))
      .filter((layoutId): layoutId is string | number => layoutId !== null)
      .map((layoutId) => String(layoutId)),
  ])
  const baseId = `wb-${slotKey}`
  let id = baseId
  let index = 2

  while (existingIds.has(id)) {
    id = `${baseId}-${index}`
    index += 1
  }

  const title = slotKey === 'header' ? 'Header' : 'Footer'

  return {
    id,
    name: `${title} ${index === 2 ? '' : index - 1}`.trim(),
    custom: {
      [WB_LAYOUT_PAGE_CUSTOM_KEY]: slotKey,
      [WB_LAYOUT_PAGE_ID_CUSTOM_KEY]: id,
    },
    component: {
      type: slotKey === 'header' ? 'navbar' : 'footer-section',
    },
  }
}

export const resolveLayoutIdForPage = (
  slot: LayoutSlot | null | undefined,
  pageId: string | string[],
  availableLayoutIds: LayoutTarget[] = [],
): LayoutTarget => {
  if (!slot) return null

  const currentPageIds = (Array.isArray(pageId) ? pageId : [pageId])
    .map((item) => `${item ?? ''}`.trim())
    .filter(Boolean)
  if (currentPageIds.length === 0) return null
  const availableLayoutIdSet = new Set(
    availableLayoutIds
      .map((layoutId) => normalizeLayoutTarget(layoutId))
      .filter((layoutId): layoutId is string | number => layoutId !== null)
      .map((layoutId) => String(layoutId)),
  )
  const hasAvailableLayouts = availableLayoutIdSet.size > 0
  const isAvailableLayoutId = (layoutId: LayoutTarget) => {
    const normalized = normalizeLayoutTarget(layoutId)
    if (normalized === null) return true
    return !hasAvailableLayouts || availableLayoutIdSet.has(String(normalized))
  }
  const rules = [...(slot.rules ?? [])]
    .filter((rule) => isAvailableLayoutId(rule.layoutId))
    .sort((a, b) => {
      const priorityA = typeof a.priority === 'number' && Number.isFinite(a.priority) ? a.priority : 0
      const priorityB = typeof b.priority === 'number' && Number.isFinite(b.priority) ? b.priority : 0
      return priorityA - priorityB
    })

  for (const rule of rules) {
    if (!rule?.enabled) continue
    const normalizedLayoutId = normalizeLayoutTarget(rule.layoutId)
    // `layoutId = null` means "disable layout".
    // Only `include` mode is meaningful here; `exclude` would disable almost every page.
    if (normalizedLayoutId === null && rule.matchMode === 'exclude') continue

    const pageIds = Array.isArray(rule.pageIds) ? rule.pageIds.map((item) => `${item}`.trim()).filter(Boolean) : []
    const hasMatchedPage = currentPageIds.some((currentPageId) => pageIds.includes(currentPageId))
    const matched =
      rule.matchMode === 'exclude'
        ? !hasMatchedPage
        : hasMatchedPage

    if (matched) {
      return normalizedLayoutId
    }
  }
  return null
}
