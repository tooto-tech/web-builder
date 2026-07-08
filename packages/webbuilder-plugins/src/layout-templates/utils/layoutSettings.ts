export type LayoutTarget = string | number | null

export type LayoutMatchMode = 'include' | 'exclude'

export type LayoutSlotKey = 'header' | 'footer'

export type LayoutRuleTargetResourceType =
  | 'PAGE'
  | 'TEMP_POST_DETAIL'
  | 'TEMP_POST_CATEGORY_LIST'
  | 'TEMP_PRODUCT_DETAIL'
  | 'TEMP_PRODUCT_CATEGORY_LIST'
  | 'TEMP_MEDIA_DETAIL'
  | 'TEMP_MEDIA_CATEGORY_LIST'

export interface LayoutTimeRange {
  start?: string
  end?: string
}

export interface LayoutRuleConditions {
  postIds?: number[]
  excludePostIds?: number[]
  typeIds?: number[]
  excludeTypeIds?: number[]
  categoryIds?: number[]
  excludeCategoryIds?: number[]
  rootCategoryIds?: number[]
  levels?: number[]
  tagIds?: number[]
  excludeTagIds?: number[]
  templateNames?: string[]
  publishTimeRange?: LayoutTimeRange
  resourceIds?: number[]
  excludeResourceIds?: number[]
  mediaTypes?: string[]
  spuIds?: number[]
  excludeSpuIds?: number[]
  brandIds?: number[]
  createTimeRange?: LayoutTimeRange
}

export interface LayoutRuleMatchContext {
  resourceType?: LayoutRuleTargetResourceType | string | null
  attributes?: Record<string, unknown> | null
}

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
  targetResourceTypes?: LayoutRuleTargetResourceType[]
  conditions?: LayoutRuleConditions
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

export const LAYOUT_RULE_TARGET_RESOURCE_TYPES: LayoutRuleTargetResourceType[] = [
  'PAGE',
  'TEMP_POST_DETAIL',
  'TEMP_POST_CATEGORY_LIST',
  'TEMP_PRODUCT_DETAIL',
  'TEMP_PRODUCT_CATEGORY_LIST',
  'TEMP_MEDIA_DETAIL',
  'TEMP_MEDIA_CATEGORY_LIST',
]

const LAYOUT_RULE_TARGET_RESOURCE_TYPE_SET = new Set<string>(LAYOUT_RULE_TARGET_RESOURCE_TYPES)

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

const normalizeNumberArray = (value: unknown): number[] => {
  if (!Array.isArray(value)) return []

  const values: number[] = []
  const seen = new Set<number>()

  for (const item of value) {
    const numberValue = Number(item)
    if (!Number.isFinite(numberValue) || seen.has(numberValue)) continue
    seen.add(numberValue)
    values.push(numberValue)
  }

  return values
}

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return uniqueStrings(value)
}

const normalizeTimeRange = (value: unknown): LayoutTimeRange | undefined => {
  if (!isRecord(value)) return undefined

  const start = `${value.start ?? ''}`.trim()
  const end = `${value.end ?? ''}`.trim()
  if (!start && !end) return undefined
  return {
    ...(start ? { start } : {}),
    ...(end ? { end } : {}),
  }
}

const normalizeTargetResourceTypes = (value: unknown): LayoutRuleTargetResourceType[] | undefined => {
  if (!Array.isArray(value)) return undefined

  const values: LayoutRuleTargetResourceType[] = []
  const seen = new Set<string>()
  for (const item of value) {
    const resourceType = `${item ?? ''}`.trim()
    if (!LAYOUT_RULE_TARGET_RESOURCE_TYPE_SET.has(resourceType) || seen.has(resourceType)) continue
    seen.add(resourceType)
    values.push(resourceType as LayoutRuleTargetResourceType)
  }

  return values.length ? values : undefined
}

const normalizeConditions = (value: unknown): LayoutRuleConditions | undefined => {
  if (!isRecord(value)) return undefined

  const next: LayoutRuleConditions = {}
  const assignNumbers = (key: keyof LayoutRuleConditions) => {
    const numbers = normalizeNumberArray(value[key])
    if (numbers.length) next[key] = numbers as never
  }
  const assignStrings = (key: keyof LayoutRuleConditions) => {
    const strings = normalizeStringArray(value[key])
    if (strings.length) next[key] = strings as never
  }

  assignNumbers('postIds')
  assignNumbers('excludePostIds')
  assignNumbers('typeIds')
  assignNumbers('excludeTypeIds')
  assignNumbers('categoryIds')
  assignNumbers('excludeCategoryIds')
  assignNumbers('rootCategoryIds')
  assignNumbers('levels')
  assignNumbers('tagIds')
  assignNumbers('excludeTagIds')
  assignStrings('templateNames')
  assignNumbers('resourceIds')
  assignNumbers('excludeResourceIds')
  assignStrings('mediaTypes')
  assignNumbers('spuIds')
  assignNumbers('excludeSpuIds')
  assignNumbers('brandIds')

  const publishTimeRange = normalizeTimeRange(value.publishTimeRange)
  if (publishTimeRange) next.publishTimeRange = publishTimeRange
  const createTimeRange = normalizeTimeRange(value.createTimeRange)
  if (createTimeRange) next.createTimeRange = createTimeRange

  return next
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

  const targetResourceTypes = normalizeTargetResourceTypes(rawRule.targetResourceTypes)
  const conditions = normalizeConditions(rawRule.conditions)

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
    ...(targetResourceTypes ? { targetResourceTypes } : {}),
    ...(conditions ? { conditions } : {}),
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

const getRulePriority = (rule: LayoutRule): number => {
  return typeof rule.priority === 'number' && Number.isFinite(rule.priority) ? rule.priority : 0
}

const getRuleSourceUpdatedAt = (rule: LayoutRule): number => {
  const value = `${rule.sourceUpdatedAt ?? ''}`.trim()
  if (!value) return 0
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : 0
}

const getRuleSourceResourceId = (rule: LayoutRule): number => {
  return typeof rule.sourceResourceId === 'number' && Number.isFinite(rule.sourceResourceId)
    ? rule.sourceResourceId
    : 0
}

const hasConditionValues = (value: unknown[] | undefined): boolean => Array.isArray(value) && value.length > 0

export const getLayoutRuleSpecificity = (rule: LayoutRule | null | undefined): number => {
  const conditions = rule?.conditions
  if (!conditions) return 0

  let score = 0
  const addScore = (keys: (keyof LayoutRuleConditions)[], weight: number) => {
    keys.forEach((key) => {
      const value = conditions[key]
      if (Array.isArray(value) && value.length) {
        score += weight + value.length
      } else if (value && typeof value === 'object') {
        score += weight
      }
    })
  }

  addScore(['postIds', 'excludePostIds', 'spuIds', 'excludeSpuIds', 'resourceIds', 'excludeResourceIds'], 300)
  addScore([
    'categoryIds',
    'excludeCategoryIds',
    'typeIds',
    'excludeTypeIds',
    'tagIds',
    'excludeTagIds',
    'brandIds',
    'rootCategoryIds',
    'levels',
    'mediaTypes',
    'templateNames',
  ], 100)
  addScore(['publishTimeRange', 'createTimeRange'], 20)
  return score
}

export const compareLayoutRules = (left: LayoutRule, right: LayoutRule): number => {
  const priorityDiff = getRulePriority(right) - getRulePriority(left)
  if (priorityDiff !== 0) return priorityDiff

  const specificityDiff = getLayoutRuleSpecificity(right) - getLayoutRuleSpecificity(left)
  if (specificityDiff !== 0) return specificityDiff

  const updatedAtDiff = getRuleSourceUpdatedAt(right) - getRuleSourceUpdatedAt(left)
  if (updatedAtDiff !== 0) return updatedAtDiff

  const resourceIdDiff = getRuleSourceResourceId(right) - getRuleSourceResourceId(left)
  if (resourceIdDiff !== 0) return resourceIdDiff

  return `${left.id ?? ''}`.localeCompare(`${right.id ?? ''}`)
}

const toComparableValues = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => toComparableValues(item))
  }
  if (value === null || value === undefined || value === '') return []
  return [`${value}`]
}

const getAttributeValues = (
  attributes: Record<string, unknown>,
  keys: string[],
): string[] => {
  return uniqueStrings(keys.flatMap((key) => toComparableValues(attributes[key])))
}

const intersectsValues = (
  attributes: Record<string, unknown>,
  keys: string[],
  expected: Array<number | string> | undefined,
): boolean => {
  const expectedValues = Array.isArray(expected) ? expected : []
  if (!hasConditionValues(expectedValues)) return true
  const actual = new Set(getAttributeValues(attributes, keys))
  if (actual.size === 0) return false
  return expectedValues.some((item) => actual.has(`${item}`))
}

const hitsExcludedValues = (
  attributes: Record<string, unknown>,
  keys: string[],
  excluded: Array<number | string> | undefined,
): boolean => {
  const excludedValues = Array.isArray(excluded) ? excluded : []
  if (!hasConditionValues(excludedValues)) return false
  const actual = new Set(getAttributeValues(attributes, keys))
  if (actual.size === 0) return false
  return excludedValues.some((item) => actual.has(`${item}`))
}

const parseMatchTime = (value: unknown): number | null => {
  if (value instanceof Date) {
    const time = value.getTime()
    return Number.isFinite(time) ? time : null
  }
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const stringValue = `${value ?? ''}`.trim()
  if (!stringValue) return null
  const time = Date.parse(stringValue)
  return Number.isFinite(time) ? time : null
}

const timeRangeMatches = (value: unknown, range: LayoutTimeRange | undefined): boolean => {
  if (!range?.start && !range?.end) return true

  const actual = parseMatchTime(value)
  if (actual === null) return false

  const start = range.start ? parseMatchTime(range.start) : null
  const end = range.end ? parseMatchTime(range.end) : null
  if (start !== null && actual < start) return false
  if (end !== null && actual > end) return false
  return true
}

const conditionsMatch = (
  conditions: LayoutRuleConditions | undefined,
  attributes: Record<string, unknown>,
): boolean => {
  if (!conditions) return true

  if (hitsExcludedValues(attributes, ['postId'], conditions.excludePostIds)) return false
  if (hitsExcludedValues(attributes, ['typeId'], conditions.excludeTypeIds)) return false
  if (hitsExcludedValues(attributes, ['categoryId', 'categoryIds'], conditions.excludeCategoryIds)) return false
  if (hitsExcludedValues(attributes, ['tagId', 'tagIds'], conditions.excludeTagIds)) return false
  if (hitsExcludedValues(attributes, ['resourceId'], conditions.excludeResourceIds)) return false
  if (hitsExcludedValues(attributes, ['spuId', 'productId'], conditions.excludeSpuIds)) return false

  return (
    intersectsValues(attributes, ['postId'], conditions.postIds) &&
    intersectsValues(attributes, ['typeId'], conditions.typeIds) &&
    intersectsValues(attributes, ['categoryId', 'categoryIds'], conditions.categoryIds) &&
    intersectsValues(attributes, ['rootCategoryId'], conditions.rootCategoryIds) &&
    intersectsValues(attributes, ['level'], conditions.levels) &&
    intersectsValues(attributes, ['tagId', 'tagIds'], conditions.tagIds) &&
    intersectsValues(attributes, ['templateName', 'template'], conditions.templateNames) &&
    intersectsValues(attributes, ['resourceId'], conditions.resourceIds) &&
    intersectsValues(attributes, ['mediaType'], conditions.mediaTypes) &&
    intersectsValues(attributes, ['spuId', 'productId'], conditions.spuIds) &&
    intersectsValues(attributes, ['brandId'], conditions.brandIds) &&
    timeRangeMatches(attributes.publishTime, conditions.publishTimeRange) &&
    timeRangeMatches(attributes.createTime, conditions.createTimeRange)
  )
}

export const layoutRuleMatchesContext = (
  rule: LayoutRule,
  context: LayoutRuleMatchContext | null | undefined,
): boolean => {
  const resourceType = `${context?.resourceType ?? 'PAGE'}`.trim() || 'PAGE'
  const targetResourceTypes = rule.targetResourceTypes ?? []
  if (targetResourceTypes.length > 0 && !targetResourceTypes.includes(resourceType as LayoutRuleTargetResourceType)) {
    return false
  }

  const attributes = isRecord(context?.attributes) ? context.attributes : {}
  return conditionsMatch(rule.conditions, attributes)
}

export const layoutRuleMatchesPage = (
  rule: LayoutRule,
  pageId: string | string[],
  context?: LayoutRuleMatchContext | null,
): boolean => {
  if (!rule?.enabled) return false
  const normalizedLayoutId = normalizeLayoutTarget(rule.layoutId)
  // `layoutId = null` means "disable layout".
  // Only `include` mode is meaningful here; `exclude` would disable almost every page.
  if (normalizedLayoutId === null && rule.matchMode === 'exclude') return false
  if (!layoutRuleMatchesContext(rule, context)) return false

  const currentPageIds = (Array.isArray(pageId) ? pageId : [pageId])
    .map((item) => `${item ?? ''}`.trim())
    .filter(Boolean)
  if (currentPageIds.length === 0) return false

  const pageIds = Array.isArray(rule.pageIds)
    ? rule.pageIds.map((item) => `${item}`.trim()).filter(Boolean)
    : []
  const hasMatchedPage = currentPageIds.some((currentPageId) => pageIds.includes(currentPageId))
  return rule.matchMode === 'exclude' ? !hasMatchedPage : hasMatchedPage
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
  context?: LayoutRuleMatchContext | null,
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
    .sort(compareLayoutRules)

  for (const rule of rules) {
    const normalizedLayoutId = normalizeLayoutTarget(rule.layoutId)
    if (layoutRuleMatchesPage(rule, currentPageIds, context)) {
      return normalizedLayoutId
    }
  }
  return null
}
