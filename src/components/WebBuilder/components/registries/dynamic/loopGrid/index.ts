import type { Editor } from 'grapesjs'
import { createApp, h, ref } from 'vue'
import { ElButton, ElOption, ElSelect } from 'element-plus'
import {
  LOOP_ITEM_TYPE_LABELS,
  LOOP_ITEM_TYPE_OPTIONS,
  type LoopItemType
} from '@/components/WebBuilder/config/templateSharedResources'
import {
  makeCheckboxTrait,
  makeNumberTrait,
  makeSelectTrait,
  makeTextTrait
} from '@/components/WebBuilder/utils/traitFactory'
import {
  mergeFilterState,
  renderLoopGridPreview,
  type LoopGridPreviewData,
  type LoopGridPreviewTemplate
} from './preview'
import {
  LOOP_GRID_NEXT_ICON,
  LOOP_GRID_PAGINATION_CSS,
  LOOP_GRID_PAGINATION_SCRIPT,
  LOOP_GRID_PAGINATION_STYLE,
  LOOP_GRID_PREV_ICON
} from './paginationStyles'
import {
  buildResponsiveLayoutConfig,
  buildLoopGridSchema,
  encodeLoopGridSchema,
  normalizeResponsiveLayoutConfig,
  parseBoolean,
  parsePersistedLoopGridSchema
} from './schema'
import {
  createLoopGridId,
  DEFAULT_LOOP_GRID_SCHEMA,
  parseCsvList,
  parseNumber,
  serializeCsvList,
  type FilterState,
  type LayoutConfig,
  type LoopGridComponentSchema,
  type PaginationConfig,
  type QueryConfig,
  type ResponsiveLayoutConfig
} from './types'
import {
  createLatestOnlyLoader,
  loopGridDataProvider,
  type LoopItemTemplateOption
} from './dataProvider'

export const WB_LOOP_GRID_TYPE = 'wb-loop-grid'
export const WB_LOOP_GRID_BLOCK_ID = 'wb-loop-grid'

const LOOP_GRID_CSS = `
  [data-wb-component="loop-grid"]{
    display:block;
    width:100%;
    min-height:180px;
  }
  .wb-loop-grid{
    display:block;
    width:100%;
    overflow-x:visible;
  }
  .wb-loop-grid__grid{
    display:grid;
    width:100%;
    align-items:stretch;
  }
  .wb-loop-grid__item{
    display:flex;
    flex-direction:column;
    min-width:0;
  }
  .wb-loop-grid__fallback-card{
    gap:10px;
    color:#0f172a;
  }
  .wb-loop-grid__fallback-media{
    aspect-ratio:4/3;
    width:100%;
    object-fit:cover;
    background:#f3f4f6;
  }
  .wb-loop-grid__fallback-title{
    margin:0;
    color:#041038;
    font-size:20px;
    line-height:1.2;
    font-weight:700;
  }
  .wb-loop-grid__fallback-text{
    margin:0;
    color:#4b5563;
    font-size:14px;
    line-height:1.6;
  }
  .wb-loop-grid__fallback-link{
    color:#264faa;
    text-decoration:none;
    font-weight:700;
  }
  .wb-loop-grid-preview{
    display:flex;
    flex-direction:column;
    gap:14px;
    padding:16px;
    border:1px solid #cbd5e1;
    border-radius:16px;
    background:
      radial-gradient(circle at top left, rgba(59,130,246,.08), transparent 34%),
      linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
    box-sizing:border-box;
    color:#0f172a;
    font-family:Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  .wb-loop-grid-toolbar,
  .wb-loop-grid-meta{
    display:flex;
    flex-wrap:wrap;
    align-items:center;
    justify-content:space-between;
    gap:8px 12px;
  }
  .wb-loop-grid-toolbar__title{
    font-size:13px;
    font-weight:700;
    letter-spacing:.02em;
  }
  .wb-loop-grid-toolbar__chips{
    display:flex;
    flex-wrap:wrap;
    gap:6px;
  }
  .wb-loop-grid-toolbar__chip,
  .wb-loop-grid-meta span,
  .wb-loop-grid-filter-state{
    display:inline-flex;
    align-items:center;
    gap:4px;
    padding:4px 8px;
    border-radius:999px;
    background:#e2e8f0;
    font-size:11px;
    color:#334155;
  }
  .wb-loop-grid-filter-state{
    background:#dbeafe;
    color:#1d4ed8;
  }
  .wb-loop-grid-cards{
    display:grid;
    align-items:stretch;
  }
  .wb-loop-grid-cards[style*="scroll-snap-type"] > *{
    scroll-snap-align:center;
    scroll-snap-stop:normal;
  }
  .wb-loop-grid-carousel-shell{
    position:relative;
    width:100%;
  }
  .wb-loop-grid-carousel-arrow{
    position:absolute;
    top:var(--wb-loop-grid-carousel-arrow-y, 50%);
    z-index:2;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    width:40px;
    height:40px;
    padding:0;
    border:1px solid rgba(15,23,42,.14);
    border-radius:999px;
    background:#fff;
    color:#0f172a;
    box-shadow:0 14px 36px rgba(15,23,42,.14);
    transform:translateY(-50%);
    cursor:pointer;
  }
  .wb-loop-grid-carousel-arrow:hover{
    color:#2847f3;
    border-color:rgba(40,71,243,.35);
  }
  .wb-loop-grid-carousel-arrow svg{
    width:20px;
    height:20px;
    display:block;
  }
  .wb-loop-grid-carousel-arrow--prev{
    left:-52px;
  }
  .wb-loop-grid-carousel-arrow--next{
    right:-52px;
  }
  @media (max-width: 767px){
    .wb-loop-grid-carousel-arrow--prev{left:8px;}
    .wb-loop-grid-carousel-arrow--next{right:8px;}
  }
  .wb-loop-grid-render{
    display:block;
    width:100%;
  }
  .wb-loop-grid-card{
    min-height:164px;
    padding:16px;
    border-radius:14px;
    border:1px solid rgba(148,163,184,.35);
    background:#fff;
    box-shadow:0 12px 30px rgba(15,23,42,.06);
    display:flex;
    flex-direction:column;
    gap:10px;
    box-sizing:border-box;
    position:relative;
    overflow:hidden;
  }
  .wb-loop-grid-card::before{
    content:"";
    position:absolute;
    inset:0 auto auto 0;
    width:100%;
    height:3px;
    background:var(--wb-loop-grid-accent, #1d4ed8);
  }
  .wb-loop-grid-card__meta-row,
  .wb-loop-grid-card__footer{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:8px;
  }
  .wb-loop-grid-card__meta,
  .wb-loop-grid-card__badge{
    font-size:11px;
    text-transform:uppercase;
    letter-spacing:.08em;
    color:#475569;
  }
  .wb-loop-grid-card__badge{
    color:var(--wb-loop-grid-accent, #1d4ed8);
    font-weight:700;
  }
  .wb-loop-grid-card__title{
    margin:0;
    font-size:18px;
    line-height:1.3;
  }
  .wb-loop-grid-card__subtitle,
  .wb-loop-grid-card__excerpt{
    margin:0;
    font-size:13px;
    line-height:1.6;
    color:#475569;
  }
  .wb-loop-grid-card__footer{
    margin-top:auto;
    font-size:12px;
    color:#64748b;
  }
  .wb-loop-grid-card__action,
  .wb-loop-grid-card__price{
    color:var(--wb-loop-grid-accent, #1d4ed8);
    font-weight:700;
  }
  ${LOOP_GRID_PAGINATION_CSS}
  .wb-loop-grid-pagination__summary,
  .wb-loop-grid-pagination__hint{
    font-size:12px;
    color:#64748b;
  }
  .wb-loop-grid-empty{
    min-height:160px;
    border:1px dashed #94a3b8;
    border-radius:14px;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    gap:8px;
    text-align:center;
    color:#475569;
    background:rgba(255,255,255,.76);
  }
`

type TraitCategory = {
  id: string
  label: string
  open?: boolean
}

const LOOP_GRID_LOOP_ITEM_TYPE_OPTIONS = LOOP_ITEM_TYPE_OPTIONS

const PRODUCT_CATEGORY_CONTEXT_LOOP_TYPES = new Set<LoopItemType>(['productCategoryFaq'])

const PRODUCT_CATEGORY_CONTEXT_POST_COLLECTION_OPTIONS = [
  { value: '', label: 'None / normal list' },
  { value: 'applicationPosts', label: 'Application articles' },
  { value: 'engineeringPosts', label: 'Engineering articles' },
  { value: 'challengePosts', label: 'Challenges articles' }
] as const

type ProductCategoryContextPostCollection =
  (typeof PRODUCT_CATEGORY_CONTEXT_POST_COLLECTION_OPTIONS)[number]['value']

const PRODUCT_CATEGORY_CONTEXT_POST_REPEAT: Record<
  Exclude<ProductCategoryContextPostCollection, ''>,
  string
> = {
  applicationPosts: 'post@productCategory.applicationPosts',
  engineeringPosts: 'post@productCategory.engineeringPosts',
  challengePosts: 'post@productCategory.challengePosts'
}

const LOOP_GRID_RESPONSIVE_LAYOUT_PROPS = ['columns', 'columnGap', 'rowGap'] as const
type LoopGridResponsiveLayoutProp = (typeof LOOP_GRID_RESPONSIVE_LAYOUT_PROPS)[number]
const LOOP_GRID_MOBILE_SCROLL_DEVICE_ID = 'mobile'
const DEFAULT_LOOP_GRID_MOBILE_SCROLL_ITEM_WIDTH = 320
const DEFAULT_LOOP_GRID_CAROUSEL_ITEM_WIDTH = 360
const DEFAULT_LOOP_GRID_CAROUSEL_ARROW_POSITION = 50

const LOOP_GRID_SYNC_PROPS = [
  'gridId',
  'filterKey',
  'providerKey',
  'itemTemplateId',
  'loopItemType',
  'loopItemTemplateResourceId',
  'cmsContextCollection',
  'categoryFilter',
  'cmsResourceType',
  'orderBy',
  'order',
  'cmsCategoryLoopMode',
  'cmsCategoryParentId',
  'cmsCategoryClickTarget',
  'itemsPerPage',
  'loopCarousel',
  'carouselItemWidth',
  'carouselArrowPosition',
  'mobileHorizontalScroll',
  'mobileScrollItemWidth',
  'paginationType',
  'pageLimit',
  'previewCurrentPage'
]

function traitCategory(id: string, label: string, open = true): TraitCategory {
  return { id, label, open }
}

function withCategory<T extends Record<string, unknown>>(trait: T, category: TraitCategory): T {
  return {
    ...trait,
    category
  }
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttr(value: unknown): string {
  return escapeHtml(value)
}

function normalizeLoopGridDeviceId(value: unknown): string {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
  return normalized || 'desktop'
}

function normalizeLoopGridMediaQuery(value: unknown): string {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  if (raw.startsWith('(') || raw.startsWith('not ') || raw.startsWith('only ')) return raw
  if (raw.includes(':')) return raw
  return `(max-width: ${raw})`
}

type LoopGridDeviceContext = { id: string; mediaQuery: string }

function readLoopGridDeviceContext(device: any): LoopGridDeviceContext {
  const rawId =
    device?.get?.('id') ?? device?.get?.('name') ?? device?.id ?? device?.cid ?? 'desktop'
  const id = normalizeLoopGridDeviceId(rawId)
  const widthMedia =
    device?.getWidthMedia?.() ?? device?.get?.('widthMedia') ?? device?.get?.('width') ?? ''
  const mediaQuery = normalizeLoopGridMediaQuery(widthMedia)
  return {
    id,
    mediaQuery: mediaQuery || getLoopGridDeviceFallbackMediaQuery(id)
  }
}

function getSelectedLoopGridDevice(editor: any, model?: any): LoopGridDeviceContext {
  if (model?.__wbLoopGridCurrentDevice) return model.__wbLoopGridCurrentDevice
  const selectedDevice = editor?.Devices?.getSelected?.() ?? editor?.DeviceManager?.getSelected?.()
  return readLoopGridDeviceContext(selectedDevice)
}

function isLoopGridDesktopDevice(deviceId: string): boolean {
  return !deviceId || deviceId === 'desktop'
}

function getLoopGridDeviceFallbackMediaQuery(deviceId: string): string {
  if (deviceId.includes('mobile')) return '(max-width: 767px)'
  if (deviceId.includes('tablet')) return '(max-width: 1024px)'
  return ''
}

function normalizeLoopItemType(value: unknown): LoopItemType {
  const raw = String(value ?? '').trim()
  return Object.prototype.hasOwnProperty.call(LOOP_ITEM_TYPE_LABELS, raw)
    ? (raw as LoopItemType)
    : 'post'
}

function normalizeContextCollection(value: unknown): ProductCategoryContextPostCollection {
  const raw = String(value ?? '').trim()
  return PRODUCT_CATEGORY_CONTEXT_POST_COLLECTION_OPTIONS.some((option) => option.value === raw)
    ? (raw as ProductCategoryContextPostCollection)
    : ''
}

function isProductCategoryContextLoopItemType(loopItemType: LoopItemType): boolean {
  return PRODUCT_CATEGORY_CONTEXT_LOOP_TYPES.has(loopItemType)
}

function isProductCategoryContextPostLoop(
  loopItemType: LoopItemType,
  contextCollection?: string
): boolean {
  return loopItemType === 'post' && !!normalizeContextCollection(contextCollection)
}

function isProductCategoryContextLoop(
  loopItemType: LoopItemType,
  contextCollection?: string
): boolean {
  return (
    isProductCategoryContextLoopItemType(loopItemType) ||
    isProductCategoryContextPostLoop(loopItemType, contextCollection)
  )
}

function resolveContextRepeatExpression(
  loopItemType: LoopItemType,
  contextCollection?: string
): string {
  if (loopItemType === 'productCategoryFaq') return 'faq@productCategory.faqs'
  const normalizedCollection = normalizeContextCollection(contextCollection)
  if (!normalizedCollection) return ''
  return PRODUCT_CATEGORY_CONTEXT_POST_REPEAT[
    normalizedCollection as Exclude<ProductCategoryContextPostCollection, ''>
  ]
}

function resolveCmsComponentType(
  loopItemType: LoopItemType,
  contextCollection?: string
): 'post-list' | 'product-list' | 'media-list' | 'context-loop' {
  if (isProductCategoryContextLoop(loopItemType, contextCollection)) return 'context-loop'
  if (loopItemType === 'product' || loopItemType === 'productCategory') return 'product-list'
  if (loopItemType === 'media' || loopItemType === 'mediaCategory') return 'media-list'
  return 'post-list'
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

function isCategoryLoopItemType(loopItemType: LoopItemType): boolean {
  return (
    loopItemType === 'postCategory' ||
    loopItemType === 'productCategory' ||
    loopItemType === 'mediaCategory'
  )
}

function resolveRootClass(loopItemType: LoopItemType, contextCollection?: string): string {
  const cmsType = resolveCmsComponentType(loopItemType, contextCollection)
  if (cmsType === 'context-loop') return 'wb-loop-grid wb-context-loop'
  if (cmsType === 'product-list') return 'wb-loop-grid wb-product-list'
  if (cmsType === 'media-list') return 'wb-loop-grid wb-cms-media-list'
  return 'wb-loop-grid wb-post-list'
}

function resolveRootClassWithExisting(
  loopItemType: LoopItemType,
  contextCollection?: string,
  model?: any
): string {
  const managedClasses = new Set([
    'wb-loop-grid',
    'wb-post-list',
    'wb-product-list',
    'wb-cms-media-list',
    'wb-context-loop'
  ])
  const existing = String(model?.getAttributes?.()?.class || '')
    .split(/\s+/)
    .map((className) => className.trim())
    .filter(Boolean)
    .filter((className) => !managedClasses.has(className))
  const next = resolveRootClass(loopItemType, contextCollection).split(/\s+/).filter(Boolean)
  return Array.from(new Set([...next, ...existing])).join(' ')
}

function resolveGridClass(loopItemType: LoopItemType, contextCollection?: string): string {
  const cmsType = resolveCmsComponentType(loopItemType, contextCollection)
  if (cmsType === 'context-loop') return 'wb-loop-grid__grid wb-context-loop__grid'
  if (cmsType === 'product-list') return 'wb-loop-grid__grid wb-product-list__grid'
  if (cmsType === 'media-list') return 'wb-loop-grid__grid wb-cms-media-grid'
  return 'wb-loop-grid__grid wb-post-list__grid'
}

function resolveGridDataAttribute(loopItemType: LoopItemType, contextCollection?: string): string {
  const cmsType = resolveCmsComponentType(loopItemType, contextCollection)
  if (cmsType === 'context-loop') return 'data-wb-context-loop-grid'
  if (cmsType === 'product-list') return 'data-wb-product-grid'
  if (cmsType === 'post-list') return 'data-wb-post-grid'
  return ''
}

function resolvePaginationMode(mode: unknown): 'none' | 'static' {
  if (mode === 'none') return 'none'
  return 'static'
}

function firstCsvValue(value: unknown): string {
  return parseCsvList(value)[0] || ''
}

function resolveProductSortField(orderBy: QueryConfig['orderBy']): string {
  if (orderBy === 'price') return 'price'
  if (orderBy === 'popularity') return 'salesCount'
  if (orderBy === 'date') return 'createTime'
  return ''
}

function registerLoopGridTemplateSelectTrait(editor: Editor) {
  const tm = editor.TraitManager
  if (!tm || tm.getType('loop-grid-template-select')) return

  const getLoopItemTypeForComponent = (component: any): LoopItemType | '' => {
    const type =
      `${component?.get?.('loopItemType') ?? component?.getAttributes?.()?.['data-loop-item-type'] ?? ''}`.trim()
    return Object.prototype.hasOwnProperty.call(LOOP_ITEM_TYPE_LABELS, type)
      ? (type as LoopItemType)
      : ''
  }

  const getTraitName = (trait: any) => `${trait?.get?.('name') || 'loopItemTemplateResourceId'}`

  const writeTemplateValue = (component: any, trait: any, value: string) => {
    const traitName = getTraitName(trait)
    component?.set?.({
      [traitName]: value,
      itemTemplateId: value || DEFAULT_LOOP_GRID_SCHEMA.itemTemplateId
    })
    component?.addAttributes?.({
      'data-loop-item-template-resource-id': value,
      'data-wb-item-template-id': value || DEFAULT_LOOP_GRID_SCHEMA.itemTemplateId
    })
  }

  const render = (elInput: HTMLElement, component: any, trait: any, force = false) => {
    const loopItemType = getLoopItemTypeForComponent(component)
    const traitName = getTraitName(trait)
    const currentValue = `${component?.get?.(traitName) ?? ''}`.trim()
    const typeLabel = loopItemType ? LOOP_ITEM_TYPE_LABELS[loopItemType] : '循环体'

    const statefulInput = elInput as HTMLElement & {
      __wbLoopGridTemplateVueApp?: ReturnType<typeof createApp>
    }
    statefulInput.__wbLoopGridTemplateVueApp?.unmount()
    statefulInput.innerHTML = ''

    const value = ref(currentValue)
    const loading = ref(false)
    const options = ref<LoopItemTemplateOption[]>([])
    const placeholder = ref(loopItemType ? `请选择${typeLabel}` : '请先选择循环体类型')

    const loadOptions = async (nextForce = false) => {
      loading.value = true
      try {
        const loadedOptions = await loopGridDataProvider.loadTemplateOptions(
          editor,
          loopItemType,
          nextForce
        )
        if (getLoopItemTypeForComponent(component) !== loopItemType) return
        const selectedValue = `${component?.get?.(traitName) ?? ''}`.trim()
        const hasSelectedValue = loadedOptions.some((option) => option.value === selectedValue)
        options.value =
          selectedValue && !hasSelectedValue
            ? [
                {
                  value: selectedValue,
                  label: `当前已选 ID ${selectedValue}（未在${typeLabel}列表中）`
                },
                ...loadedOptions
              ]
            : loadedOptions
        value.value = selectedValue
      } finally {
        loading.value = false
      }
    }

    const app = createApp({
      setup() {
        void loadOptions(force)
        return () =>
          h('div', { style: 'display:flex;flex-direction:column;gap:8px;width:100%;' }, [
            h(
              ElSelect,
              {
                modelValue: value.value,
                placeholder: placeholder.value,
                clearable: true,
                filterable: true,
                loading: loading.value,
                disabled: !loopItemType,
                noDataText: loopItemType
                  ? `未创建${typeLabel}，留空会使用默认循环体`
                  : '请先选择循环体类型',
                style: 'width:100%;',
                size: 'small',
                teleported: false,
                'onUpdate:modelValue': (nextValue: string) => {
                  value.value = `${nextValue ?? ''}`
                  writeTemplateValue(component, trait, value.value)
                }
              },
              () =>
                options.value.map((option) =>
                  h(ElOption, {
                    key: option.value,
                    value: option.value,
                    label: option.label
                  })
                )
            ),
            !loading.value && loopItemType && options.value.length === 0
              ? h(
                  'div',
                  {
                    style:
                      'font-size:12px;line-height:1.5;color:#667085;background:#f8fafc;border:1px solid #e5e7eb;border-radius:6px;padding:6px 8px;'
                  },
                  `未创建${typeLabel}。可在模板管理的“循环体”中新建并发布；当前留空会使用默认结构。`
                )
              : null,
            h(
              ElButton,
              {
                size: 'small',
                loading: loading.value,
                onClick: () => void loadOptions(true)
              },
              () => '刷新循环体列表'
            )
          ])
      }
    })
    statefulInput.__wbLoopGridTemplateVueApp = app
    app.mount(elInput)
  }

  tm.addType('loop-grid-template-select', {
    createInput() {
      const el = document.createElement('div')
      el.style.cssText = 'width:100%;'
      return el
    },
    onUpdate({ elInput, component, trait }: any) {
      const input = elInput as HTMLElement & {
        __wbLoopGridTemplateTypeHandler?: () => void
        __wbLoopGridTemplateComponent?: any
      }
      if (input.__wbLoopGridTemplateComponent !== component) {
        if (input.__wbLoopGridTemplateComponent && input.__wbLoopGridTemplateTypeHandler) {
          input.__wbLoopGridTemplateComponent.off?.(
            'change:loopItemType',
            input.__wbLoopGridTemplateTypeHandler
          )
        }
        input.__wbLoopGridTemplateTypeHandler = () => {
          writeTemplateValue(component, trait, '')
          render(elInput, component, trait, true)
        }
        component?.on?.('change:loopItemType', input.__wbLoopGridTemplateTypeHandler)
        input.__wbLoopGridTemplateComponent = component
      }
      render(elInput, component, trait)
    }
  })
}

function resolveLoopGridLayoutForDevice(
  schema: LoopGridComponentSchema,
  deviceId: string
): LayoutConfig {
  const responsive = schema.responsiveLayout?.[normalizeLoopGridDeviceId(deviceId)] || {}
  return {
    ...schema.layout,
    columns: responsive.columns ?? schema.layout.columns,
    columnGap: responsive.columnGap ?? schema.layout.columnGap,
    rowGap: responsive.rowGap ?? schema.layout.rowGap,
    horizontalScroll: responsive.horizontalScroll,
    scrollItemWidth: responsive.scrollItemWidth
  }
}

function buildLoopGridPreviewSchema(editor: any, model: any): LoopGridComponentSchema {
  const schema = buildLoopGridSchema(model)
  const device = getSelectedLoopGridDevice(editor, model)
  const inheritedLayout = isLoopGridDesktopDevice(device.id)
    ? schema.layout
    : resolveLoopGridLayoutForDevice(schema, device.id)

  return {
    ...schema,
    layout: {
      ...inheritedLayout,
      columns: parseNumber(model.get('columns'), inheritedLayout.columns, { min: 1, max: 6 }),
      columnGap: parseNumber(model.get('columnGap'), inheritedLayout.columnGap, {
        min: 0,
        max: 120
      }),
      rowGap: parseNumber(model.get('rowGap'), inheritedLayout.rowGap, { min: 0, max: 120 })
    }
  }
}

function buildCmsRenderAttrs(schema: LoopGridComponentSchema, model?: any): Record<string, string> {
  const loopItemType = normalizeLoopItemType(schema.loopItemType)
  const contextCollection = normalizeContextCollection(
    schema.query.contextCollection || model?.get?.('cmsContextCollection')
  )
  const cmsComponent = resolveCmsComponentType(loopItemType, contextCollection)
  const isContextLoop = cmsComponent === 'context-loop'
  const contextRepeat = resolveContextRepeatExpression(loopItemType, contextCollection)
  const categoryId = firstCsvValue(schema.query.category)
  const attrs: Record<string, string> = {
    class: resolveRootClassWithExisting(loopItemType, contextCollection, model),
    'data-cms-component': cmsComponent,
    'data-page-size': String(schema.layout.itemsPerPage),
    'data-wb-page-size': String(schema.layout.itemsPerPage),
    'data-pagination': isContextLoop ? 'none' : resolvePaginationMode(schema.pagination.mode),
    'data-wb-pagination': isContextLoop ? 'none' : resolvePaginationMode(schema.pagination.mode),
    'data-max-pages': String(schema.pagination.pageLimit),
    'data-wb-max-pages': String(schema.pagination.pageLimit),
    'data-category-id': categoryId,
    'data-wb-category-id': categoryId,
    'data-loop-item-type': loopItemType,
    'data-loop-item-template-resource-id': schema.loopItemTemplateResourceId,
    'data-category-loop-mode': String(model?.get?.('cmsCategoryLoopMode') || 'root'),
    'data-category-parent-id': String(model?.get?.('cmsCategoryParentId') || ''),
    'data-category-click-target': String(model?.get?.('cmsCategoryClickTarget') || 'contentList')
  }

  if (contextCollection && contextRepeat) {
    attrs['data-context-collection'] = contextCollection
    attrs['data-wb-context-collection'] = contextCollection
  }
  if (contextRepeat) {
    attrs['data-context-repeat'] = contextRepeat
    attrs['data-wb-context-repeat'] = contextRepeat
  }

  if (cmsComponent === 'product-list') {
    const sortField = resolveProductSortField(schema.query.orderBy)
    attrs['data-sort-field'] = sortField
    attrs['data-wb-sort-field'] = sortField
    attrs['data-sort-asc'] = schema.query.order === 'asc' ? 'true' : 'false'
    attrs['data-wb-sort-asc'] = attrs['data-sort-asc']
  }

  if (cmsComponent === 'media-list') {
    attrs['data-resource-type'] = String(model?.get?.('cmsResourceType') || '')
  }

  return attrs
}

function syncLoopGridAttrs(model: any) {
  if (model.__wbLoopGridSyncing) return
  model.__wbLoopGridSyncing = true
  const schema = buildLoopGridSchema(model)
  const cmsAttrs = buildCmsRenderAttrs(schema, model)

  try {
    model.addAttributes({
      ...cmsAttrs,
      'data-wb-component': 'loop-grid',
      'data-wb-instance-id': String(model.getId?.() || model.cid || ''),
      'data-wb-loop-grid-version': String(schema.version),
      'data-wb-grid-id': schema.gridId,
      'data-wb-filter-key': schema.filterKey,
      'data-wb-source-type': schema.query.sourceType,
      'data-wb-query-mode': schema.query.queryMode,
      'data-wb-item-template-id': schema.itemTemplateId,
      'data-wb-pagination': schema.pagination.mode,
      'data-wb-provider-key': schema.providerKey,
      'data-wb-loop-grid-schema': encodeLoopGridSchema(schema)
    })

    model.set('loopGridSchema', schema)
  } finally {
    model.__wbLoopGridSyncing = false
  }
}

function getLoopGridChangedLayoutProps(model: any): LoopGridResponsiveLayoutProp[] {
  const changed = model.changed || {}
  return LOOP_GRID_RESPONSIVE_LAYOUT_PROPS.filter((prop) =>
    Object.prototype.hasOwnProperty.call(changed, prop)
  )
}

function setLoopGridBaseLayoutProp(model: any, prop: LoopGridResponsiveLayoutProp, value: unknown) {
  const baseProp =
    prop === 'columns' ? 'baseColumns' : prop === 'columnGap' ? 'baseColumnGap' : 'baseRowGap'
  model.set(baseProp, value, { silent: true })
}

function updateLoopGridResponsiveLayoutForDevice(editor: any, model: any) {
  if (model.__wbLoopGridSyncingLayoutTraits) return

  const changedProps = getLoopGridChangedLayoutProps(model)
  if (!changedProps.length) return

  const schema = buildLoopGridSchema(model)
  const device = getSelectedLoopGridDevice(editor, model)

  if (isLoopGridDesktopDevice(device.id)) {
    changedProps.forEach((prop) => setLoopGridBaseLayoutProp(model, prop, model.get(prop)))
    return
  }

  const nextResponsive = buildResponsiveLayoutConfig(model)
  const currentConfig: ResponsiveLayoutConfig = {
    ...(nextResponsive[device.id] || {}),
    ...(device.mediaQuery ? { mediaQuery: device.mediaQuery } : {})
  }

  changedProps.forEach((prop) => {
    const currentValue = parseNumber(model.get(prop), schema.layout[prop], {
      min: prop === 'columns' ? 1 : 0,
      max: prop === 'columns' ? 6 : 120
    })
    if (currentValue === schema.layout[prop]) {
      delete currentConfig[prop]
    } else {
      currentConfig[prop] = currentValue
    }
  })

  if (
    currentConfig.columns === undefined &&
    currentConfig.columnGap === undefined &&
    currentConfig.rowGap === undefined &&
    !currentConfig.horizontalScroll
  ) {
    delete nextResponsive[device.id]
  } else {
    nextResponsive[device.id] = currentConfig
  }

  model.set('responsiveLayout', nextResponsive, { silent: true })
}

function syncLoopGridLayoutTraitsForDevice(editor: any, model: any) {
  const schema = buildLoopGridSchema(model)
  const device = getSelectedLoopGridDevice(editor, model)
  const layout = resolveLoopGridLayoutForDevice(schema, device.id)

  model.__wbLoopGridSyncingLayoutTraits = true
  model.set({
    columns: layout.columns,
    columnGap: layout.columnGap,
    rowGap: layout.rowGap
  })
  model.__wbLoopGridSyncingLayoutTraits = false
}

function renderFallbackLoopItem(loopItemType: LoopItemType, contextCollection?: string): string {
  const contextRepeat = resolveContextRepeatExpression(loopItemType, contextCollection)
  if (loopItemType === 'post' && contextRepeat) {
    return `
      <article class="wb-loop-grid__item wb-loop-grid__fallback-card wb-post-card" data-cms-repeat="${escapeAttr(contextRepeat)}">
        <img class="wb-loop-grid__fallback-media" src="" alt="" data-cms-bind-src="post.image" data-cms-bind-alt="post.imageAlt" />
        <time class="wb-loop-grid__fallback-text" data-cms-bind="post.publishTime" data-cms-format="yyyy-MM-dd">2026-01-01</time>
        <h3 class="wb-loop-grid__fallback-title" data-cms-bind="post.name">Post title</h3>
        <p class="wb-loop-grid__fallback-text" data-cms-bind="post.excerpt">Post excerpt</p>
        <a class="wb-loop-grid__fallback-link" href="#" data-cms-bind-href="post.url">Read more</a>
      </article>
    `
  }

  if (loopItemType === 'product') {
    return `
      <article class="wb-loop-grid__item wb-loop-grid__fallback-card wb-product-card" data-cms-repeat="product">
        <img class="wb-loop-grid__fallback-media" src="" alt="" data-cms-bind-src="product.picUrl" data-cms-bind-alt="product.name" />
        <h3 class="wb-loop-grid__fallback-title" data-cms-bind="product.name">Product name</h3>
        <p class="wb-loop-grid__fallback-text" data-cms-bind="product.introduction">Product introduction</p>
        <a class="wb-loop-grid__fallback-link" href="#" data-cms-bind-href="product.url">View product</a>
      </article>
    `
  }

  if (loopItemType === 'productCategory') {
    return `
      <article class="wb-loop-grid__item wb-loop-grid__fallback-card wb-product-card" data-cms-repeat="productCategory@productCategories">
        <img class="wb-loop-grid__fallback-media" src="" alt="" data-cms-bind-src="productCategory.picUrl" data-cms-bind-alt="productCategory.name" />
        <h3 class="wb-loop-grid__fallback-title" data-cms-bind="productCategory.name">Product category</h3>
        <p class="wb-loop-grid__fallback-text" data-cms-bind="productCategory.description">Category description</p>
        <a class="wb-loop-grid__fallback-link" href="#" data-cms-bind-href="productCategory.url">Open category</a>
      </article>
    `
  }

  if (loopItemType === 'productCategoryFaq') {
    return `
      <article class="wb-loop-grid__item wb-loop-grid__fallback-card wb-context-card" data-cms-repeat="faq@productCategory.faqs">
        <h3 class="wb-loop-grid__fallback-title" data-cms-bind="faq.question">FAQ question</h3>
        <div class="wb-loop-grid__fallback-text" data-cms-html="faq.answerHtml">FAQ answer</div>
      </article>
    `
  }

  if (loopItemType === 'media') {
    return `
      <article class="wb-loop-grid__item wb-loop-grid__fallback-card wb-cms-media-card" data-cms-repeat="media">
        <img class="wb-loop-grid__fallback-media" src="" alt="" data-cms-bind-src="media.coverUrl" data-cms-bind-alt="media.title" />
        <h3 class="wb-loop-grid__fallback-title" data-cms-bind="media.title">Media title</h3>
        <p class="wb-loop-grid__fallback-text" data-cms-bind="media.description">Media description</p>
        <a class="wb-loop-grid__fallback-link" href="#" data-cms-bind-href="media.detailUrl">View media</a>
      </article>
    `
  }

  if (loopItemType === 'mediaCategory') {
    return `
      <article class="wb-loop-grid__item wb-loop-grid__fallback-card wb-cms-media-card" data-cms-repeat="mediaCategory@mediaCategories">
        <h3 class="wb-loop-grid__fallback-title" data-cms-bind="mediaCategory.name">Media category</h3>
        <p class="wb-loop-grid__fallback-text" data-cms-bind="mediaCategory.description">Category description</p>
        <a class="wb-loop-grid__fallback-link" href="#" data-cms-bind-href="mediaCategory.url">Open category</a>
      </article>
    `
  }

  if (loopItemType === 'postCategory') {
    return `
      <article class="wb-loop-grid__item wb-loop-grid__fallback-card wb-post-card" data-cms-repeat="postCategory@postCategories">
        <h3 class="wb-loop-grid__fallback-title" data-cms-bind="postCategory.name">Post category</h3>
        <p class="wb-loop-grid__fallback-text" data-cms-bind="postCategory.description">Category description</p>
        <a class="wb-loop-grid__fallback-link" href="#" data-cms-bind-href="postCategory.url">Open category</a>
      </article>
    `
  }

  return `
    <article class="wb-loop-grid__item wb-loop-grid__fallback-card wb-post-card" data-cms-repeat="post">
      <img class="wb-loop-grid__fallback-media" src="" alt="" data-cms-bind-src="post.image" data-cms-bind-alt="post.imageAlt" />
      <time class="wb-loop-grid__fallback-text" data-cms-bind="post.publishTime" data-cms-format="yyyy-MM-dd">2026-01-01</time>
      <h3 class="wb-loop-grid__fallback-title" data-cms-bind="post.name">Post title</h3>
      <p class="wb-loop-grid__fallback-text" data-cms-bind="post.excerpt">Post excerpt</p>
      <a class="wb-loop-grid__fallback-link" href="#" data-cms-bind-href="post.url">Read more</a>
    </article>
  `
}

function buildLoopGridStyle(layout: LayoutConfig): string {
  const declarations = [
    `grid-template-columns:repeat(${layout.columns}, minmax(0, 1fr))`,
    `column-gap:${layout.columnGap}px`,
    `row-gap:${layout.rowGap}px`
  ]

  if (layout.loopCarousel || layout.horizontalScroll) {
    const itemWidth = layout.loopCarousel
      ? parseNumber(layout.carouselItemWidth, DEFAULT_LOOP_GRID_CAROUSEL_ITEM_WIDTH, {
          min: 160,
          max: 960
        })
      : parseNumber(layout.scrollItemWidth, DEFAULT_LOOP_GRID_MOBILE_SCROLL_ITEM_WIDTH, {
          min: 160,
          max: 720
        })
    const widthVar = layout.loopCarousel
      ? '--wb-loop-grid-carousel-item-width'
      : '--wb-loop-grid-mobile-item-width'
    declarations.push(
      `${widthVar}:${itemWidth}px`,
      'grid-template-columns:none',
      'grid-auto-flow:column',
      `grid-auto-columns:min(var(${widthVar}), 86vw)`,
      'overflow-x:auto',
      'overflow-y:hidden',
      '-webkit-overflow-scrolling:touch',
      'scroll-snap-type:x mandatory',
      `scroll-padding-inline:calc((100% - min(var(${widthVar}), 86vw)) / 2)`
    )
  }

  return declarations.join(';')
}

function buildLoopGridResponsiveStyle(
  schema: LoopGridComponentSchema,
  gridSelector: string,
  rootSelector: string
): string {
  const rules = Object.entries(schema.responsiveLayout || {})
    .map(([, config]) => {
      const mediaQuery = normalizeLoopGridMediaQuery(config.mediaQuery)
      if (!mediaQuery) return ''

      const declarations = [
        !schema.layout.loopCarousel && config.columns !== undefined
          ? `grid-template-columns:repeat(${config.columns}, minmax(0, 1fr)) !important`
          : '',
        config.columnGap !== undefined ? `column-gap:${config.columnGap}px !important` : '',
        config.rowGap !== undefined ? `row-gap:${config.rowGap}px !important` : ''
      ].filter(Boolean)

      if (config.horizontalScroll) {
        const itemWidth = parseNumber(
          config.scrollItemWidth,
          DEFAULT_LOOP_GRID_MOBILE_SCROLL_ITEM_WIDTH,
          {
            min: 160,
            max: 720
          }
        )
        declarations.push(
          `--wb-loop-grid-mobile-item-width:${itemWidth}px`,
          'grid-template-columns:none !important',
          'grid-auto-flow:column !important',
          'grid-auto-columns:min(var(--wb-loop-grid-mobile-item-width), 86vw) !important',
          'overflow-x:auto !important',
          'overflow-y:hidden !important',
          '-webkit-overflow-scrolling:touch',
          'scroll-snap-type:x mandatory',
          'scroll-padding-inline:calc((100% - min(var(--wb-loop-grid-mobile-item-width), 86vw)) / 2)'
        )
      }

      if (!declarations.length) return ''
      const rootDeclarations = config.horizontalScroll
        ? `${rootSelector},.wb-loop-grid{contain:layout;overflow-x:visible!important}`
        : ''
      return `@media ${mediaQuery}{${rootDeclarations}${gridSelector}{${declarations.join(';')}}${gridSelector}>*{scroll-snap-align:center;scroll-snap-stop:normal}}`
    })
    .filter(Boolean)

  return rules.length ? `<style data-wb-loop-grid-responsive-style>${rules.join('\n')}</style>` : ''
}

function buildLoopGridCarouselStyle(schema: LoopGridComponentSchema): string {
  if (!schema.layout.loopCarousel) return ''
  const arrowPosition = parseNumber(
    schema.layout.carouselArrowPosition,
    DEFAULT_LOOP_GRID_CAROUSEL_ARROW_POSITION,
    {
      min: 0,
      max: 100
    }
  )
  return [
    `--wb-loop-grid-carousel-arrow-y:${arrowPosition}%`,
    'position:relative',
    'width:100%'
  ].join(';')
}

function buildLoopGridCarouselScript(): string {
  return `
    <script data-wb-loop-grid-carousel-script>
      (function(){
        if (window.__wbLoopGridCarouselBound) return;
        window.__wbLoopGridCarouselBound = true;
        function getStep(track){
          var first = track && track.children && track.children[0];
          if (!first) return track ? Math.max(240, Math.round(track.clientWidth * 0.8)) : 320;
          var rect = first.getBoundingClientRect();
          var style = window.getComputedStyle(track);
          var gap = parseFloat(style.columnGap || style.gap || '0') || 0;
          return Math.max(1, Math.round(rect.width + gap));
        }
        function scrollCarousel(button, direction){
          var shell = button.closest && button.closest('.wb-loop-grid-carousel-shell');
          var track = shell && shell.querySelector('[data-wb-loop-carousel-track]');
          if (!track) return;
          track.scrollBy({ left: direction * getStep(track), behavior: 'smooth' });
        }
        document.addEventListener('click', function(event){
          var target = event.target && event.target.closest && event.target.closest('[data-wb-loop-carousel-prev],[data-wb-loop-carousel-next]');
          if (!target) return;
          event.preventDefault();
          scrollCarousel(target, target.hasAttribute('data-wb-loop-carousel-prev') ? -1 : 1);
        });
      })();
    </script>
  `
}

function renderLoopGridPublishHtml(schema: LoopGridComponentSchema): string {
  const loopItemType = normalizeLoopItemType(schema.loopItemType)
  const contextCollection = normalizeContextCollection(schema.query.contextCollection)
  const gridDataAttr = resolveGridDataAttribute(loopItemType, contextCollection)
  const gridStyle = buildLoopGridStyle(schema.layout)
  const gridAttr = gridDataAttr ? ` ${gridDataAttr}=""` : ''
  const gridId = schema.gridId || createLoopGridId()
  const gridSelector = `[data-wb-loop-grid-cards="${escapeAttr(gridId)}"]`
  const rootSelector = `[data-wb-grid-id="${escapeAttr(gridId)}"]`
  const responsiveStyle = buildLoopGridResponsiveStyle(schema, gridSelector, rootSelector)
  const isCarousel = !!schema.layout.loopCarousel
  const carouselShellStyle = buildLoopGridCarouselStyle(schema)
  const carouselTrackStyle = isCarousel
    ? `<style data-wb-loop-grid-carousel-style>
        .wb-loop-grid-carousel-shell{position:relative;width:100%}
        .wb-loop-grid-carousel-arrow{position:absolute;top:var(--wb-loop-grid-carousel-arrow-y,50%);z-index:2;display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;padding:0;border:1px solid rgba(15,23,42,.14);border-radius:999px;background:#fff;color:#0f172a;box-shadow:0 14px 36px rgba(15,23,42,.14);transform:translateY(-50%);cursor:pointer}
        .wb-loop-grid-carousel-arrow:hover{color:#2847f3;border-color:rgba(40,71,243,.35)}
        .wb-loop-grid-carousel-arrow svg{display:block;width:20px;height:20px}
        .wb-loop-grid-carousel-arrow--prev{left:-52px}
        .wb-loop-grid-carousel-arrow--next{right:-52px}
        ${gridSelector}>*{scroll-snap-align:center;scroll-snap-stop:normal}
        @media (max-width:767px){.wb-loop-grid-carousel-arrow--prev{left:8px}.wb-loop-grid-carousel-arrow--next{right:8px}}
      </style>`
    : ''
  const cmsComponent = resolveCmsComponentType(loopItemType, contextCollection)
  const isContextLoop = cmsComponent === 'context-loop'
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
    isContextLoop || resolvePaginationMode(schema.pagination.mode) === 'none'
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
    ${responsiveStyle}
    ${carouselTrackStyle}
    ${
      isCarousel
        ? `<div class="wb-loop-grid-carousel-shell" style="${escapeAttr(carouselShellStyle)}">
            <button type="button" class="wb-loop-grid-carousel-arrow wb-loop-grid-carousel-arrow--prev" data-wb-loop-carousel-prev aria-label="Previous">${LOOP_GRID_PREV_ICON}</button>`
        : ''
    }
    <div class="${escapeAttr(resolveGridClass(loopItemType, contextCollection))}"${gridAttr} data-wb-loop-grid-cards="${escapeAttr(gridId)}" ${isCarousel ? 'data-wb-loop-carousel-track' : ''} style="display:grid;width:100%;${escapeAttr(gridStyle)}">
      ${renderFallbackLoopItem(loopItemType, contextCollection)}
    </div>
    ${
      isCarousel
        ? `<button type="button" class="wb-loop-grid-carousel-arrow wb-loop-grid-carousel-arrow--next" data-wb-loop-carousel-next aria-label="Next">${LOOP_GRID_NEXT_ICON}</button>
          </div>
          ${buildLoopGridCarouselScript()}`
        : ''
    }
    ${pagination}
  `
}

function getLoopGridTraits() {
  const contentCategory = traitCategory('content', 'Content / Template')
  const queryCategory = traitCategory('query', 'Query / Filters')
  const layoutCategory = traitCategory('layout', 'Layout')
  const paginationCategory = traitCategory('pagination', 'Pagination')

  return [
    withCategory(
      makeSelectTrait('Loop Item Type', 'loopItemType', LOOP_GRID_LOOP_ITEM_TYPE_OPTIONS),
      contentCategory
    ),
    withCategory(
      {
        type: 'loop-grid-template-select',
        label: 'Loop Item Template',
        name: 'loopItemTemplateResourceId',
        changeProp: true
      },
      contentCategory
    ),
    withCategory(
      makeTextTrait('Category ID', 'categoryFilter', {
        placeholder: '例如 44；留空表示全部'
      }),
      queryCategory
    ),
    withCategory(
      makeSelectTrait(
        'Product Category Context (post only)',
        'cmsContextCollection',
        [...PRODUCT_CATEGORY_CONTEXT_POST_COLLECTION_OPTIONS]
      ),
      queryCategory
    ),
    withCategory(
      makeSelectTrait('Media Type (media only)', 'cmsResourceType', [
        { value: '', label: 'All' },
        { value: 'IMAGE', label: 'Image' },
        { value: 'VIDEO', label: 'Video' },
        { value: 'DOCUMENT', label: 'Document' }
      ]),
      queryCategory
    ),
    withCategory(
      makeSelectTrait('Product Sort Field (product only)', 'orderBy', [
        { value: 'date', label: 'Create Time' },
        { value: 'price', label: 'Price' },
        { value: 'popularity', label: 'Sales Count' }
      ]),
      queryCategory
    ),
    withCategory(
      makeSelectTrait('Product Sort Direction (product only)', 'order', [
        { value: 'desc', label: 'Descending' },
        { value: 'asc', label: 'Ascending' }
      ]),
      queryCategory
    ),
    withCategory(
      makeSelectTrait('Category Loop Mode', 'cmsCategoryLoopMode', [
        { value: 'root', label: 'Root categories' },
        { value: 'childrenOf', label: 'Children of parent' },
        { value: 'descendantsOf', label: 'Descendants of parent' },
        { value: 'currentChildren', label: 'Current children' },
        { value: 'currentDescendants', label: 'Current descendants' }
      ]),
      queryCategory
    ),
    withCategory(
      makeTextTrait('Parent / Category ID', 'cmsCategoryParentId', {
        placeholder: '留空时使用当前分类页面的分类 ID'
      }),
      queryCategory
    ),
    withCategory(
      makeSelectTrait('Category Click Target', 'cmsCategoryClickTarget', [
        { value: 'contentList', label: 'Content list' },
        { value: 'categoryList', label: 'Category list' },
        { value: 'productList', label: 'Product list' }
      ]),
      queryCategory
    ),

    withCategory(
      makeNumberTrait('Columns', 'columns', { min: 1, max: 6, step: 1 }),
      layoutCategory
    ),
    withCategory(
      makeNumberTrait('Items Per Page', 'itemsPerPage', { min: 1, max: 48, step: 1 }),
      layoutCategory
    ),
    withCategory(
      makeNumberTrait('Column Gap', 'columnGap', { min: 0, max: 120, step: 1 }),
      layoutCategory
    ),
    withCategory(
      makeNumberTrait('Row Gap', 'rowGap', { min: 0, max: 120, step: 1 }),
      layoutCategory
    ),
    withCategory(makeCheckboxTrait('Loop Carousel', 'loopCarousel'), layoutCategory),
    withCategory(
      makeNumberTrait('Carousel Item Width', 'carouselItemWidth', {
        min: 160,
        max: 960,
        step: 1
      }),
      layoutCategory
    ),
    withCategory(
      makeNumberTrait('Carousel Arrow Y (%)', 'carouselArrowPosition', {
        min: 0,
        max: 100,
        step: 1
      }),
      layoutCategory
    ),
    withCategory(
      makeCheckboxTrait('Mobile Horizontal Scroll', 'mobileHorizontalScroll'),
      layoutCategory
    ),
    withCategory(
      makeNumberTrait('Mobile Item Width', 'mobileScrollItemWidth', {
        min: 160,
        max: 720,
        step: 1
      }),
      layoutCategory
    ),

    withCategory(
      makeSelectTrait('Pagination Type', 'paginationType', [
        { value: 'none', label: 'None' },
        { value: 'numbers', label: 'Static pages' }
      ]),
      paginationCategory
    ),
    withCategory(
      makeNumberTrait('Max Static Pages', 'pageLimit', { min: 1, max: 99, step: 1 }),
      paginationCategory
    )
  ]
}

function registerBlock(editor: Editor) {
  if (editor.BlockManager.get(WB_LOOP_GRID_BLOCK_ID)) return

  editor.BlockManager.add(WB_LOOP_GRID_BLOCK_ID, {
    label: 'Loop Grid',
    category: 'Dynamic',
    media:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h4M7 16h10"/><path d="M14 12h3v3h-3z"/></svg>',
    content: { type: WB_LOOP_GRID_TYPE }
  })
}

export function registerLoopGridComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_LOOP_GRID_TYPE)) return

  registerLoopGridTemplateSelectTrait(editor)
  editor.addStyle?.(LOOP_GRID_CSS)

  domComponents.addType(WB_LOOP_GRID_TYPE, {
    isComponent: (el: HTMLElement) => {
      if (!el?.getAttribute) return false
      const wbComponent = el.getAttribute('data-wb-component')
      const cmsComponent = el.getAttribute('data-cms-component')
      const hasLoopGridSchema = el.hasAttribute('data-wb-loop-grid-schema')
      const hasLoopGridClass = el.classList?.contains('wb-loop-grid')
      return wbComponent === 'loop-grid' ||
        cmsComponent === 'loop-grid' ||
        hasLoopGridSchema ||
        hasLoopGridClass
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
          'data-cms-component': 'loop-grid',
          class: 'wb-loop-grid'
        },
        style: {
          width: '100%',
          display: 'block'
        },
        traits: getLoopGridTraits(),

        gridId: createLoopGridId('loop-grid-1'),
        filterKey: '',
        providerKey: DEFAULT_LOOP_GRID_SCHEMA.providerKey,
        itemTemplateId: DEFAULT_LOOP_GRID_SCHEMA.itemTemplateId,
        loopItemType: DEFAULT_LOOP_GRID_SCHEMA.loopItemType,
        loopItemTemplateResourceId: DEFAULT_LOOP_GRID_SCHEMA.loopItemTemplateResourceId,
        emptyTemplateId: DEFAULT_LOOP_GRID_SCHEMA.emptyTemplateId,

        categoryFilter: '',
        cmsContextCollection: '',
        cmsResourceType: '',
        orderBy: DEFAULT_LOOP_GRID_SCHEMA.query.orderBy,
        order: DEFAULT_LOOP_GRID_SCHEMA.query.order,
        cmsCategoryLoopMode: 'root',
        cmsCategoryParentId: '',
        cmsCategoryClickTarget: 'contentList',

        columns: DEFAULT_LOOP_GRID_SCHEMA.layout.columns,
        baseColumns: DEFAULT_LOOP_GRID_SCHEMA.layout.columns,
        itemsPerPage: DEFAULT_LOOP_GRID_SCHEMA.layout.itemsPerPage,
        columnGap: DEFAULT_LOOP_GRID_SCHEMA.layout.columnGap,
        baseColumnGap: DEFAULT_LOOP_GRID_SCHEMA.layout.columnGap,
        rowGap: DEFAULT_LOOP_GRID_SCHEMA.layout.rowGap,
        baseRowGap: DEFAULT_LOOP_GRID_SCHEMA.layout.rowGap,
        loopCarousel: false,
        carouselItemWidth: DEFAULT_LOOP_GRID_CAROUSEL_ITEM_WIDTH,
        carouselArrowPosition: DEFAULT_LOOP_GRID_CAROUSEL_ARROW_POSITION,
        responsiveLayout: {},
        mobileHorizontalScroll: false,
        mobileScrollItemWidth: DEFAULT_LOOP_GRID_MOBILE_SCROLL_ITEM_WIDTH,

        paginationType: DEFAULT_LOOP_GRID_SCHEMA.pagination.mode,
        pageLimit: DEFAULT_LOOP_GRID_SCHEMA.pagination.pageLimit,

        nothingFoundText: DEFAULT_LOOP_GRID_SCHEMA.emptyState.nothingFoundText,
        hostRenderMode: DEFAULT_LOOP_GRID_SCHEMA.advanced.hostRenderMode,

        activeCategory: '',
        activeTaxonomy: '',
        activeTag: '',
        activeAuthor: '',
        activeSearch: '',
        previewCurrentPage: 1
      },

      init(this: any) {
        this._hydratePropsFromAttrs()
        this.__wbLoopGridCurrentDevice = getSelectedLoopGridDevice(editor)
        this.on(LOOP_GRID_RESPONSIVE_LAYOUT_PROPS.map((prop) => `change:${prop}`).join(' '), () => {
          updateLoopGridResponsiveLayoutForDevice(editor, this)
          syncLoopGridAttrs(this)
          this.view?.renderPreview?.()
        })
        this.on(LOOP_GRID_SYNC_PROPS.map((prop) => `change:${prop}`).join(' '), () => {
          syncLoopGridAttrs(this)
        })
        this.__wbLoopGridDeviceSelectHandler = (device: any) => {
          this.__wbLoopGridCurrentDevice = readLoopGridDeviceContext(device)
          syncLoopGridLayoutTraitsForDevice(editor, this)
          syncLoopGridAttrs(this)
          this.view?.renderPreview?.()
        }
        editor.on?.('device:select', this.__wbLoopGridDeviceSelectHandler)
        this.on('remove', () => editor.off?.('device:select', this.__wbLoopGridDeviceSelectHandler))
        this.on('change:loopItemTemplateResourceId', () => {
          this.set(
            'itemTemplateId',
            this.get('loopItemTemplateResourceId') || DEFAULT_LOOP_GRID_SCHEMA.itemTemplateId
          )
        })
        syncLoopGridLayoutTraitsForDevice(editor, this)
        syncLoopGridAttrs(this)
      },

      getInnerHTML(this: any) {
        return renderLoopGridPublishHtml(buildLoopGridSchema(this))
      },

      _hydratePropsFromAttrs(this: any) {
        const attrs = this.getAttributes?.() || {}
        const readAttr = (key: string) => `${attrs[key] ?? ''}`.trim()
        let persistedSchema: Partial<LoopGridComponentSchema> = {}
        const encodedSchema = readAttr('data-wb-loop-grid-schema')
        if (encodedSchema) {
          persistedSchema = parsePersistedLoopGridSchema(encodedSchema)
        }
        const loopItemType = readAttr('data-loop-item-type')
        const loopItemTemplateResourceId = readAttr('data-loop-item-template-resource-id')
        const itemTemplateId = readAttr('data-wb-item-template-id')
        const schemaQuery = (persistedSchema.query || {}) as Partial<QueryConfig>
        const schemaLayout = (persistedSchema.layout || {}) as Partial<LayoutConfig>
        const schemaResponsiveLayout = normalizeResponsiveLayoutConfig(
          persistedSchema.responsiveLayout || this.get('responsiveLayout')
        )
        const mobileResponsiveLayout =
          schemaResponsiveLayout[LOOP_GRID_MOBILE_SCROLL_DEVICE_ID] || {}
        const schemaPagination = (persistedSchema.pagination || {}) as Partial<PaginationConfig>
        const schemaFilter = (persistedSchema.filterState || {}) as Partial<FilterState>
        const baseColumns =
          schemaLayout.columns ?? this.get('baseColumns') ?? DEFAULT_LOOP_GRID_SCHEMA.layout.columns
        const baseColumnGap =
          schemaLayout.columnGap ??
          this.get('baseColumnGap') ??
          DEFAULT_LOOP_GRID_SCHEMA.layout.columnGap
        const baseRowGap =
          schemaLayout.rowGap ?? this.get('baseRowGap') ?? DEFAULT_LOOP_GRID_SCHEMA.layout.rowGap

        this.set(
          {
            gridId:
              readAttr('data-wb-grid-id') ||
              persistedSchema.gridId ||
              this.get('gridId') ||
              DEFAULT_LOOP_GRID_SCHEMA.gridId,
            filterKey:
              readAttr('data-wb-filter-key') ||
              persistedSchema.filterKey ||
              this.get('filterKey') ||
              '',
            providerKey:
              readAttr('data-wb-provider-key') ||
              persistedSchema.providerKey ||
              this.get('providerKey') ||
              DEFAULT_LOOP_GRID_SCHEMA.providerKey,
            loopItemType:
              loopItemType &&
              Object.prototype.hasOwnProperty.call(LOOP_ITEM_TYPE_LABELS, loopItemType)
                ? loopItemType
                : persistedSchema.loopItemType ||
                  this.get('loopItemType') ||
                  DEFAULT_LOOP_GRID_SCHEMA.loopItemType,
            loopItemTemplateResourceId:
              loopItemTemplateResourceId ||
              persistedSchema.loopItemTemplateResourceId ||
              this.get('loopItemTemplateResourceId') ||
              '',
            itemTemplateId:
              loopItemTemplateResourceId ||
              itemTemplateId ||
              persistedSchema.itemTemplateId ||
              this.get('itemTemplateId') ||
              DEFAULT_LOOP_GRID_SCHEMA.itemTemplateId,
            emptyTemplateId:
              persistedSchema.emptyTemplateId ||
              this.get('emptyTemplateId') ||
              DEFAULT_LOOP_GRID_SCHEMA.emptyTemplateId,
            categoryFilter: serializeCsvList(
              schemaQuery.category ||
                parseCsvList(readAttr('data-category-id') || this.get('categoryFilter'))
            ),
            cmsContextCollection: normalizeContextCollection(
              readAttr('data-context-collection') ||
                readAttr('data-wb-context-collection') ||
                schemaQuery.contextCollection ||
                this.get('cmsContextCollection')
            ),
            cmsResourceType: readAttr('data-resource-type') || this.get('cmsResourceType') || '',
            orderBy:
              schemaQuery.orderBy || this.get('orderBy') || DEFAULT_LOOP_GRID_SCHEMA.query.orderBy,
            order: schemaQuery.order || this.get('order') || DEFAULT_LOOP_GRID_SCHEMA.query.order,
            cmsCategoryLoopMode:
              readAttr('data-category-loop-mode') || this.get('cmsCategoryLoopMode') || 'root',
            cmsCategoryParentId:
              readAttr('data-category-parent-id') || this.get('cmsCategoryParentId') || '',
            cmsCategoryClickTarget:
              readAttr('data-category-click-target') ||
              this.get('cmsCategoryClickTarget') ||
              'contentList',
            columns: baseColumns,
            baseColumns,
            itemsPerPage:
              schemaLayout.itemsPerPage ??
              this.get('itemsPerPage') ??
              DEFAULT_LOOP_GRID_SCHEMA.layout.itemsPerPage,
            columnGap: baseColumnGap,
            baseColumnGap,
            rowGap: baseRowGap,
            baseRowGap,
            loopCarousel:
              schemaLayout.loopCarousel !== undefined
                ? parseBoolean(schemaLayout.loopCarousel)
                : parseBoolean(this.get('loopCarousel')),
            carouselItemWidth:
              schemaLayout.carouselItemWidth !== undefined
                ? schemaLayout.carouselItemWidth
                : this.get('carouselItemWidth') || DEFAULT_LOOP_GRID_CAROUSEL_ITEM_WIDTH,
            carouselArrowPosition:
              schemaLayout.carouselArrowPosition !== undefined
                ? schemaLayout.carouselArrowPosition
                : this.get('carouselArrowPosition') || DEFAULT_LOOP_GRID_CAROUSEL_ARROW_POSITION,
            responsiveLayout: schemaResponsiveLayout,
            mobileHorizontalScroll: !!mobileResponsiveLayout.horizontalScroll,
            mobileScrollItemWidth:
              mobileResponsiveLayout.scrollItemWidth ||
              this.get('mobileScrollItemWidth') ||
              DEFAULT_LOOP_GRID_MOBILE_SCROLL_ITEM_WIDTH,
            paginationType:
              readAttr('data-wb-pagination') === 'none' ||
              schemaPagination.mode === 'none' ||
              this.get('paginationType') === 'none'
                ? 'none'
                : DEFAULT_LOOP_GRID_SCHEMA.pagination.mode,
            pageLimit:
              schemaPagination.pageLimit ||
              this.get('pageLimit') ||
              DEFAULT_LOOP_GRID_SCHEMA.pagination.pageLimit,
            nothingFoundText:
              persistedSchema.emptyState?.nothingFoundText ||
              this.get('nothingFoundText') ||
              DEFAULT_LOOP_GRID_SCHEMA.emptyState.nothingFoundText,
            activeCategory: serializeCsvList(
              schemaFilter.category || parseCsvList(this.get('activeCategory'))
            ),
            activeTaxonomy: serializeCsvList(
              schemaFilter.taxonomy || parseCsvList(this.get('activeTaxonomy'))
            ),
            activeTag: serializeCsvList(schemaFilter.tag || parseCsvList(this.get('activeTag'))),
            activeAuthor: serializeCsvList(
              schemaFilter.author || parseCsvList(this.get('activeAuthor'))
            ),
            activeSearch: schemaFilter.search || this.get('activeSearch') || '',
            previewCurrentPage:
              schemaFilter.currentPage ||
              this.get('previewCurrentPage') ||
              DEFAULT_LOOP_GRID_SCHEMA.filterState.currentPage,
            hostRenderMode:
              persistedSchema.advanced?.hostRenderMode ||
              this.get('hostRenderMode') ||
              DEFAULT_LOOP_GRID_SCHEMA.advanced.hostRenderMode
          },
          { silent: true }
        )
      }
    },

    view: {
      init(this: any) {
        this.listenTo(
          this.model,
          'change:loopGridSchema change:previewCurrentPage',
          this.renderPreview
        )
      },

      onRender(this: any) {
        this.renderPreview()

        const win = this.el?.ownerDocument?.defaultView
        if (!win) return

        if (this._wbLoopGridFilterHandler) {
          win.removeEventListener('wb:loop-grid:filter-change', this._wbLoopGridFilterHandler)
        }

        this._wbLoopGridFilterHandler = (event: Event) => {
          const customEvent = event as CustomEvent<{
            gridId?: string
            filterKey?: string
            filterState?: Partial<FilterState>
          }>
          const detail = customEvent.detail || {}
          const schema = buildLoopGridSchema(this.model)

          if (detail.gridId && detail.gridId !== schema.gridId) return
          if (detail.filterKey && detail.filterKey !== schema.filterKey) return

          const nextFilterState = mergeFilterState(schema.filterState, detail.filterState)
          this.model.set({
            activeTaxonomy: serializeCsvList(nextFilterState.taxonomy),
            activeTag: serializeCsvList(nextFilterState.tag),
            activeCategory: serializeCsvList(nextFilterState.category),
            activeAuthor: serializeCsvList(nextFilterState.author),
            activeSearch: nextFilterState.search || '',
            previewCurrentPage: nextFilterState.currentPage || 1
          })
        }

        win.addEventListener('wb:loop-grid:filter-change', this._wbLoopGridFilterHandler)
      },

      removed(this: any) {
        const win = this.el?.ownerDocument?.defaultView
        if (win && this._wbLoopGridFilterHandler) {
          win.removeEventListener('wb:loop-grid:filter-change', this._wbLoopGridFilterHandler)
        }
        if (this.model?.__wbLoopGridDeviceSelectHandler) {
          editor.off?.('device:select', this.model.__wbLoopGridDeviceSelectHandler)
        }
      },

      events: {
        'click [data-wb-loop-grid-page]': 'onPageClick',
        'click [data-wb-loop-carousel-prev]': 'onCarouselPrevClick',
        'click [data-wb-loop-carousel-next]': 'onCarouselNextClick'
      } as any,

      onPageClick(this: any, event: Event) {
        event.preventDefault()
        const target = event.currentTarget as HTMLElement | null
        const nextPage = parseNumber(target?.getAttribute('data-wb-loop-grid-page'), 1, {
          min: 1,
          max: 99
        })
        this.model.set('previewCurrentPage', nextPage)
      },

      scrollCarousel(this: any, event: Event, direction: number) {
        event.preventDefault()
        const button = event.currentTarget as HTMLElement | null
        const shell = button?.closest('.wb-loop-grid-carousel-shell')
        const track = shell?.querySelector('[data-wb-loop-carousel-track]') as HTMLElement | null
        if (!track) return
        const first = track.children[0] as HTMLElement | undefined
        const style = track.ownerDocument?.defaultView?.getComputedStyle(track)
        const gap = Number.parseFloat(style?.columnGap || style?.gap || '0') || 0
        const step = first
          ? first.getBoundingClientRect().width + gap
          : Math.max(240, track.clientWidth * 0.8)
        track.scrollBy({ left: direction * step, behavior: 'smooth' })
      },

      onCarouselPrevClick(this: any, event: Event) {
        this.scrollCarousel(event, -1)
      },

      onCarouselNextClick(this: any, event: Event) {
        this.scrollCarousel(event, 1)
      },

      renderPreview(this: any) {
        const schema = buildLoopGridPreviewSchema(editor, this.model)
        if (!this._wbLoopGridLatestPreviewLoader) {
          this._wbLoopGridLatestPreviewLoader = createLatestOnlyLoader<{
            template: LoopGridPreviewTemplate | null
            previewData: LoopGridPreviewData
          }>()
        }
        this.el.innerHTML = renderLoopGridPreview(schema, null, { items: [], loading: true })
        void this._wbLoopGridLatestPreviewLoader.run(
          async () => {
            const [template, previewData] = await Promise.all([
              loopGridDataProvider.loadPreviewTemplate(editor, schema.loopItemTemplateResourceId),
              loopGridDataProvider.loadPreviewData(schema)
            ])
            return { template, previewData }
          },
          ({ template, previewData }) => {
            if (!this.el?.isConnected) return
            this.el.innerHTML = renderLoopGridPreview(schema, template, previewData)
          },
          (error) => {
            if (!this.el?.isConnected) return
            this.el.innerHTML = renderLoopGridPreview(schema, null, {
              items: [],
              error: error?.message || '真实预览数据加载失败。'
            })
          }
        )
      }
    }
  })

  registerBlock(editor)
}
