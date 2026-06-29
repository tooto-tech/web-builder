import {
  POPUP_TEMPLATE_RESOURCE_TYPE,
  TEMP_TEMPLATE_RESOURCE_TYPES,
  type TempTemplateResourceType
} from '../config/templateSharedResources'

export interface TemplateTimeRange {
  start?: string
  end?: string
}

export interface TemplateRuleConditions {
  postIds?: number[]
  excludePostIds?: number[]
  typeIds?: number[]
  excludeTypeIds?: number[]
  tagIds?: number[]
  templateNames?: string[]
  publishTimeRange?: TemplateTimeRange
  resourceIds?: number[]
  excludeResourceIds?: number[]
  categoryIds?: number[]
  excludeCategoryIds?: number[]
  mediaTypes?: string[]
  spuIds?: number[]
  excludeSpuIds?: number[]
  brandIds?: number[]
  createTimeRange?: TemplateTimeRange
  rootCategoryIds?: number[]
  levels?: number[]
}

export interface TemplateRule {
  id: string
  name?: string
  templateType: TempTemplateResourceType
  templateResourceId?: number
  templateResourceKey?: string
  enabled: boolean
  priority: number
  conditions: TemplateRuleConditions
}

type TemplateRuleResourceType = Exclude<TempTemplateResourceType, 'TEMP_LOOP_ITEM' | 'TEMP_POPUP'>

const isTemplateRuleResourceType = (
  value: TempTemplateResourceType | null | undefined
): value is TemplateRuleResourceType =>
  value !== undefined &&
  value !== null &&
  value !== 'TEMP_LOOP_ITEM' &&
  value !== POPUP_TEMPLATE_RESOURCE_TYPE

const SUPPORTED_CONDITION_KEYS: Record<
  TemplateRuleResourceType,
  Set<keyof TemplateRuleConditions>
> = {
  TEMP_POST_DETAIL: new Set([
    'postIds',
    'excludePostIds',
    'typeIds',
    'excludeTypeIds',
    'tagIds',
    'templateNames',
    'publishTimeRange'
  ]),
  TEMP_POST_CATEGORY_LIST: new Set([
    'categoryIds',
    'excludeCategoryIds',
    'rootCategoryIds',
    'levels'
  ]),
  TEMP_MEDIA_DETAIL: new Set([
    'resourceIds',
    'excludeResourceIds',
    'categoryIds',
    'excludeCategoryIds',
    'mediaTypes',
    'publishTimeRange'
  ]),
  TEMP_MEDIA_CATEGORY_LIST: new Set(['categoryIds', 'excludeCategoryIds']),
  TEMP_PRODUCT_DETAIL: new Set([
    'spuIds',
    'excludeSpuIds',
    'categoryIds',
    'excludeCategoryIds',
    'brandIds',
    'createTimeRange'
  ]),
  TEMP_PRODUCT_CATEGORY_LIST: new Set([
    'categoryIds',
    'excludeCategoryIds',
    'rootCategoryIds',
    'levels'
  ])
}

export interface WebBuilderTemplateRules {
  version: 1
  postDetail: TemplateRule[]
  postCategoryList: TemplateRule[]
  mediaDetail: TemplateRule[]
  mediaCategoryList: TemplateRule[]
  productDetail: TemplateRule[]
  productCategoryList: TemplateRule[]
}

type TemplateRuleBucketKey = keyof Omit<WebBuilderTemplateRules, 'version'>

const DEFAULT_VERSION = 1 as const

const TEMPLATE_RULE_BUCKET_BY_RESOURCE_TYPE: Record<
  TemplateRuleResourceType,
  TemplateRuleBucketKey
> = {
  TEMP_POST_DETAIL: 'postDetail',
  TEMP_POST_CATEGORY_LIST: 'postCategoryList',
  TEMP_MEDIA_DETAIL: 'mediaDetail',
  TEMP_MEDIA_CATEGORY_LIST: 'mediaCategoryList',
  TEMP_PRODUCT_DETAIL: 'productDetail',
  TEMP_PRODUCT_CATEGORY_LIST: 'productCategoryList'
}

const isRecord = (value: unknown): value is Record<string, any> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []

  const seen = new Set<string>()
  return value
    .map((item) => `${item ?? ''}`.trim())
    .filter((item) => {
      if (!item || seen.has(item)) return false
      seen.add(item)
      return true
    })
}

const normalizeNumberArray = (value: unknown): number[] => {
  if (!Array.isArray(value)) return []

  const seen = new Set<number>()
  return value
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item))
    .filter((item) => {
      if (seen.has(item)) return false
      seen.add(item)
      return true
    })
}

const normalizeTimeRange = (value: unknown): TemplateTimeRange | undefined => {
  if (!isRecord(value)) return undefined

  const start = `${value.start ?? ''}`.trim()
  const end = `${value.end ?? ''}`.trim()
  if (!start && !end) return undefined
  return {
    ...(start ? { start } : {}),
    ...(end ? { end } : {})
  }
}

const normalizeConditions = (
  value: unknown,
  templateType?: TemplateRuleResourceType
): TemplateRuleConditions => {
  const raw = isRecord(value) ? value : {}
  const next: TemplateRuleConditions = {}
  const supportedKeys = templateType ? SUPPORTED_CONDITION_KEYS[templateType] : undefined
  const isSupported = (key: keyof TemplateRuleConditions) =>
    !supportedKeys || supportedKeys.has(key)

  const assignNumbers = (key: keyof TemplateRuleConditions) => {
    if (!isSupported(key)) return
    const numbers = normalizeNumberArray(raw[key])
    if (numbers.length) next[key] = numbers as never
  }
  const assignStrings = (key: keyof TemplateRuleConditions) => {
    if (!isSupported(key)) return
    const strings = normalizeStringArray(raw[key])
    if (strings.length) next[key] = strings as never
  }

  assignNumbers('postIds')
  assignNumbers('excludePostIds')
  assignNumbers('typeIds')
  assignNumbers('excludeTypeIds')
  assignNumbers('tagIds')
  assignStrings('templateNames')
  assignNumbers('resourceIds')
  assignNumbers('excludeResourceIds')
  assignNumbers('categoryIds')
  assignNumbers('excludeCategoryIds')
  assignStrings('mediaTypes')
  assignNumbers('spuIds')
  assignNumbers('excludeSpuIds')
  assignNumbers('brandIds')
  assignNumbers('rootCategoryIds')
  assignNumbers('levels')

  const publishTimeRange = isSupported('publishTimeRange')
    ? normalizeTimeRange(raw.publishTimeRange)
    : undefined
  if (publishTimeRange) next.publishTimeRange = publishTimeRange

  const createTimeRange = isSupported('createTimeRange')
    ? normalizeTimeRange(raw.createTimeRange)
    : undefined
  if (createTimeRange) next.createTimeRange = createTimeRange

  return next
}

const normalizeTemplateType = (value: unknown, fallbackType: TemplateRuleResourceType) => {
  const normalized = TEMP_TEMPLATE_RESOURCE_TYPES.find((type) => type === `${value ?? ''}`.trim())
  return isTemplateRuleResourceType(normalized) ? normalized : fallbackType
}

const normalizeTemplateRule = (
  value: unknown,
  fallbackType: TemplateRuleResourceType,
  fallbackIndex: number
): TemplateRule => {
  const raw = isRecord(value) ? value : {}
  const id =
    typeof raw.id === 'string' && raw.id.trim()
      ? raw.id.trim()
      : `template-rule-${fallbackType.toLowerCase()}-${fallbackIndex + 1}`

  const templateResourceId = Number(raw.templateResourceId)
  const templateResourceKey = `${raw.templateResourceKey ?? ''}`.trim()

  const templateType = normalizeTemplateType(raw.templateType ?? fallbackType, fallbackType)

  return {
    id,
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : undefined,
    templateType,
    ...(Number.isFinite(templateResourceId) ? { templateResourceId } : {}),
    ...(templateResourceKey ? { templateResourceKey } : {}),
    enabled: raw.enabled !== false,
    priority: Number.isFinite(Number(raw.priority)) ? Number(raw.priority) : fallbackIndex,
    conditions: normalizeConditions(raw.conditions, templateType)
  }
}

const normalizeRuleList = (
  value: unknown,
  templateType: TemplateRuleResourceType
): TemplateRule[] =>
  Array.isArray(value)
    ? value.map((item, index) => normalizeTemplateRule(item, templateType, index))
    : []

export const createDefaultTemplateRulesPayload = (): WebBuilderTemplateRules => ({
  version: DEFAULT_VERSION,
  postDetail: [],
  postCategoryList: [],
  mediaDetail: [],
  mediaCategoryList: [],
  productDetail: [],
  productCategoryList: []
})

export const normalizeTemplateRulesPayload = (value: unknown): WebBuilderTemplateRules => {
  const raw = isRecord(value) ? value : {}
  return {
    version: DEFAULT_VERSION,
    postDetail: normalizeRuleList(raw.postDetail, 'TEMP_POST_DETAIL'),
    postCategoryList: normalizeRuleList(raw.postCategoryList, 'TEMP_POST_CATEGORY_LIST'),
    mediaDetail: normalizeRuleList(raw.mediaDetail, 'TEMP_MEDIA_DETAIL'),
    mediaCategoryList: normalizeRuleList(raw.mediaCategoryList, 'TEMP_MEDIA_CATEGORY_LIST'),
    productDetail: normalizeRuleList(raw.productDetail, 'TEMP_PRODUCT_DETAIL'),
    productCategoryList: normalizeRuleList(raw.productCategoryList, 'TEMP_PRODUCT_CATEGORY_LIST')
  }
}

export const cloneTemplateRulesPayload = (
  value?: WebBuilderTemplateRules | Partial<WebBuilderTemplateRules> | null
): WebBuilderTemplateRules => normalizeTemplateRulesPayload(value)

export const getTemplateRuleBucketKey = (
  templateType: TempTemplateResourceType
): TemplateRuleBucketKey | null =>
  isTemplateRuleResourceType(templateType)
    ? TEMPLATE_RULE_BUCKET_BY_RESOURCE_TYPE[templateType]
    : null

export const getTemplateRulesForType = (
  payload: WebBuilderTemplateRules,
  templateType: TempTemplateResourceType
): TemplateRule[] => {
  const bucketKey = getTemplateRuleBucketKey(templateType)
  return bucketKey ? payload[bucketKey] : []
}

export const setTemplateRulesForType = (
  payload: WebBuilderTemplateRules,
  templateType: TempTemplateResourceType,
  rules: TemplateRule[]
): WebBuilderTemplateRules => {
  const bucketKey = getTemplateRuleBucketKey(templateType)
  return bucketKey
    ? {
        ...payload,
        [bucketKey]: rules
      }
    : payload
}
