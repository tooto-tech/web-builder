import { reactive, ref } from 'vue'
import { getCategoryList } from '@/api/mall/product/category'
import { getSimpleBrandList } from '@/api/mall/product/brand'
import { getAllPostCategoryList } from '@/api/content/postCategory'
import { getAllPostTypeList } from '@/api/content/postType'
import { getAllPostTagList } from '@/api/content/postTag'
import { getAllMediaResourceCategoryList } from '@/api/content/mediaResourceCategory'
import type { TemplateRuleConditions } from '@/components/WebBuilder/utils/templateRules'

export interface TemplateRuleOption {
  value: number | string
  label: string
}

type OptionFieldKey = Extract<
  keyof TemplateRuleConditions,
  | 'categoryIds'
  | 'excludeCategoryIds'
  | 'rootCategoryIds'
  | 'levels'
  | 'typeIds'
  | 'excludeTypeIds'
  | 'tagIds'
  | 'brandIds'
>

type SourceFieldKey = Exclude<OptionFieldKey, 'levels'>
type OptionLoader = () => Promise<TemplateRuleOption[]>
type SourceKey = 'productCategory' | 'postCategory' | 'postType' | 'mediaCategory' | 'postTag' | 'brand'

const CATEGORY_LEVEL_OPTIONS: TemplateRuleOption[] = [
  { value: 1, label: '一级分类' },
  { value: 2, label: '二级分类' },
  { value: 3, label: '三级分类' },
  { value: 4, label: '四级分类' },
  { value: 5, label: '五级分类' },
]

const STATIC_FIELD_OPTIONS: Partial<Record<OptionFieldKey, TemplateRuleOption[]>> = {
  levels: CATEGORY_LEVEL_OPTIONS,
}

const FIELD_TO_SOURCE: Record<SourceFieldKey, SourceKey> = {
  categoryIds: 'productCategory',
  excludeCategoryIds: 'productCategory',
  rootCategoryIds: 'productCategory',
  typeIds: 'postType',
  excludeTypeIds: 'postType',
  tagIds: 'postTag',
  brandIds: 'brand',
}

const toName = (item: any): string => {
  const raw = item?.name ?? item?.title ?? item?.label
  return raw ? `${raw}` : ''
}

const toNumericOption = (item: any): TemplateRuleOption | null => {
  const value = Number(item?.id)
  if (!Number.isFinite(value)) return null
  const name = toName(item) || `#${value}`
  return { value, label: `${name} (#${value})` }
}

const collectTreeCategoryOptions = (list: any[]): TemplateRuleOption[] => {
  const byId = new Map<number, any>()
  list.forEach((item) => {
    if (item && Number.isFinite(Number(item.id))) byId.set(Number(item.id), item)
  })
  const labelOf = (id: number): string => {
    const item = byId.get(id)
    if (!item) return `#${id}`
    const parentId = Number(item.parentId)
    if (Number.isFinite(parentId) && parentId > 0 && byId.has(parentId)) {
      return `${labelOf(parentId)} / ${toName(item) || `#${id}`}`
    }
    return toName(item) || `#${id}`
  }
  const options: TemplateRuleOption[] = []
  byId.forEach((_item, id) => {
    options.push({ value: id, label: `${labelOf(id)} (#${id})` })
  })
  return options.sort((a, b) => `${a.label}`.localeCompare(`${b.label}`))
}

const SOURCE_LOADERS: Record<SourceKey, OptionLoader> = {
  async productCategory() {
    const raw = await getCategoryList({})
    const list = Array.isArray(raw) ? raw : Array.isArray((raw as any)?.list) ? (raw as any).list : []
    return collectTreeCategoryOptions(list as any[])
  },
  async postCategory() {
    const raw = await getAllPostCategoryList()
    const list = Array.isArray(raw) ? raw : []
    return collectTreeCategoryOptions(list as any[])
  },
  async postType() {
    const raw = await getAllPostTypeList()
    const list = Array.isArray(raw) ? raw : []
    return (list as any[]).map(toNumericOption).filter(Boolean) as TemplateRuleOption[]
  },
  async mediaCategory() {
    const raw = await getAllMediaResourceCategoryList()
    const list = Array.isArray(raw) ? raw : []
    return (list as any[]).map(toNumericOption).filter(Boolean) as TemplateRuleOption[]
  },
  async postTag() {
    const raw = await getAllPostTagList()
    const list = Array.isArray(raw) ? raw : []
    return (list as any[]).map(toNumericOption).filter(Boolean) as TemplateRuleOption[]
  },
  async brand() {
    const raw = await getSimpleBrandList()
    const list = Array.isArray(raw) ? raw : []
    return (list as any[]).map(toNumericOption).filter(Boolean) as TemplateRuleOption[]
  },
}

/**
 * Options for TEMP_MEDIA_* conditions override the generic product-category
 * source with the media-resource category source.  Keyed on templateResourceType.
 */
const mediaCategoryFieldOverrides: Record<string, OptionFieldKey[]> = {
  TEMP_MEDIA_DETAIL: ['categoryIds', 'excludeCategoryIds'],
  TEMP_MEDIA_CATEGORY_LIST: ['categoryIds', 'excludeCategoryIds'],
}

const postCategoryFieldOverrides: Record<string, OptionFieldKey[]> = {
  TEMP_POST_CATEGORY_LIST: ['categoryIds', 'excludeCategoryIds', 'rootCategoryIds'],
}

const isSourceFieldKey = (field: string): field is SourceFieldKey => field in FIELD_TO_SOURCE

const resolveSource = (
  templateType: string | null | undefined,
  field: SourceFieldKey,
): SourceKey => {
  if (templateType && mediaCategoryFieldOverrides[templateType]?.includes(field)) {
    return 'mediaCategory'
  }
  if (templateType && postCategoryFieldOverrides[templateType]?.includes(field)) {
    return 'postCategory'
  }
  return FIELD_TO_SOURCE[field]
}

export default function useTemplateRuleOptions() {
  const cache = reactive<Partial<Record<SourceKey, TemplateRuleOption[]>>>({})
  const pending = new Map<SourceKey, Promise<TemplateRuleOption[]>>()
  const errored = reactive<Partial<Record<SourceKey, boolean>>>({})
  const lastLoadError = ref<string | null>(null)

  const loadSource = async (source: SourceKey): Promise<TemplateRuleOption[]> => {
    if (cache[source]) return cache[source] as TemplateRuleOption[]
    if (pending.has(source)) return pending.get(source) as Promise<TemplateRuleOption[]>
    const loader = SOURCE_LOADERS[source]
    if (!loader) return []
    const task = loader()
      .then((options) => {
        cache[source] = options
        errored[source] = false
        return options
      })
      .catch((error) => {
        errored[source] = true
        lastLoadError.value = error?.message || `${source} 选项加载失败`
        return [] as TemplateRuleOption[]
      })
      .finally(() => {
        pending.delete(source)
      })
    pending.set(source, task)
    return task
  }

  const ensureOptionsForField = (
    templateType: string | null | undefined,
    field: SourceFieldKey,
  ): TemplateRuleOption[] => {
    const source = resolveSource(templateType, field)
    if (!source) return []
    if (!cache[source] && !pending.has(source)) {
      void loadSource(source)
    }
    return cache[source] ?? []
  }

  const getOptions = (
    templateType: string | null | undefined,
    field: string,
  ): TemplateRuleOption[] => {
    const staticOptions = STATIC_FIELD_OPTIONS[field as OptionFieldKey]
    if (staticOptions) return staticOptions
    if (!isSourceFieldKey(field)) return []
    return ensureOptionsForField(templateType, field)
  }

  return {
    cache,
    errored,
    lastLoadError,
    loadSource,
    getOptions,
  }
}
