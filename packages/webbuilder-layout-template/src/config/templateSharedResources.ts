export const TEMP_RULES_RESOURCE_SCOPE = 'OWNED'
export const TEMP_RULES_RESOURCE_KEY = 'template.rules'
export const TEMP_RULES_RESOURCE_TYPE = 'TEMP_RULES'

export const TEMP_TEMPLATE_RESOURCE_TYPES = [
  'TEMP_POST_DETAIL',
  'TEMP_POST_CATEGORY_LIST',
  'TEMP_PRODUCT_DETAIL',
  'TEMP_PRODUCT_CATEGORY_LIST',
  'TEMP_MEDIA_DETAIL',
  'TEMP_MEDIA_CATEGORY_LIST',
  'TEMP_LOOP_ITEM',
  'TEMP_POPUP'
] as const

export type TempTemplateResourceType = (typeof TEMP_TEMPLATE_RESOURCE_TYPES)[number]

export const TEMP_TEMPLATE_RESOURCE_TYPE_OPTIONS: Array<{
  label: string
  value: TempTemplateResourceType
}> = [
  { label: '文章详情', value: 'TEMP_POST_DETAIL' },
  { label: '文章分类列表', value: 'TEMP_POST_CATEGORY_LIST' },
  { label: '产品详情', value: 'TEMP_PRODUCT_DETAIL' },
  { label: '产品分类详情/列表', value: 'TEMP_PRODUCT_CATEGORY_LIST' },
  { label: '媒体详情', value: 'TEMP_MEDIA_DETAIL' },
  { label: '媒体分类列表', value: 'TEMP_MEDIA_CATEGORY_LIST' },
  { label: '循环体', value: 'TEMP_LOOP_ITEM' },
  { label: '弹窗', value: 'TEMP_POPUP' }
]

const TEMPLATE_RESOURCE_TYPE_SET = new Set<string>(TEMP_TEMPLATE_RESOURCE_TYPES)

export const isTempTemplateResourceType = (
  resourceType?: string | null
): resourceType is TempTemplateResourceType =>
  TEMPLATE_RESOURCE_TYPE_SET.has(`${resourceType ?? ''}`.trim())

export const isTempDetailResourceType = (resourceType?: string | null) =>
  resourceType === 'TEMP_POST_DETAIL' ||
  resourceType === 'TEMP_MEDIA_DETAIL' ||
  resourceType === 'TEMP_PRODUCT_DETAIL'

export const isTempCategoryListResourceType = (resourceType?: string | null) =>
  resourceType === 'TEMP_POST_CATEGORY_LIST' ||
  resourceType === 'TEMP_MEDIA_CATEGORY_LIST' ||
  resourceType === 'TEMP_PRODUCT_CATEGORY_LIST'

export const POPUP_TEMPLATE_RESOURCE_TYPE = 'TEMP_POPUP'

export const isPopupTemplateResourceType = (resourceType?: string | null) =>
  resourceType === POPUP_TEMPLATE_RESOURCE_TYPE

export type LoopItemType =
  | 'post'
  | 'postCategory'
  | 'product'
  | 'productCategory'
  | 'productCategoryFaq'
  | 'media'
  | 'mediaCategory'

export interface LoopItemResourceExt {
  loopItemType?: LoopItemType
}

export const LOOP_ITEM_RESOURCE_TYPE = 'TEMP_LOOP_ITEM'

export const LOOP_ITEM_TYPE_LABELS: Record<LoopItemType, string> = {
  post: '文章循环体',
  postCategory: '文章分类循环体',
  product: '产品循环体',
  productCategory: '产品分类循环体',
  productCategoryFaq: '产品分类 FAQ 循环体',
  media: '媒体循环体',
  mediaCategory: '媒体分类循环体'
}

export const LOOP_ITEM_TYPE_OPTIONS: Array<{ label: string; value: LoopItemType }> = [
  { label: LOOP_ITEM_TYPE_LABELS.post, value: 'post' },
  { label: LOOP_ITEM_TYPE_LABELS.postCategory, value: 'postCategory' },
  { label: LOOP_ITEM_TYPE_LABELS.product, value: 'product' },
  { label: LOOP_ITEM_TYPE_LABELS.productCategory, value: 'productCategory' },
  { label: LOOP_ITEM_TYPE_LABELS.productCategoryFaq, value: 'productCategoryFaq' },
  { label: LOOP_ITEM_TYPE_LABELS.media, value: 'media' },
  { label: LOOP_ITEM_TYPE_LABELS.mediaCategory, value: 'mediaCategory' }
]

export function parseLoopItemResourceExt(extJson?: string | null): LoopItemResourceExt {
  const raw = `${extJson ?? ''}`.trim()
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function getLoopItemType(extJson?: string | null): LoopItemType | '' {
  const type = parseLoopItemResourceExt(extJson).loopItemType
  return type && Object.prototype.hasOwnProperty.call(LOOP_ITEM_TYPE_LABELS, type) ? type : ''
}

export function getLoopItemTypeLabel(extJson?: string | null): string {
  const type = getLoopItemType(extJson)
  return type ? LOOP_ITEM_TYPE_LABELS[type] : '-'
}

export function buildLoopItemResourceExt(loopItemType: LoopItemType): string {
  return JSON.stringify({ loopItemType })
}
