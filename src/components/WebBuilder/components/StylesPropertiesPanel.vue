<script lang="ts" setup>
import { computed, ref, reactive, watch, onBeforeUnmount } from 'vue'
import { ElInput, ElSwitch, ElSelect, ElOption, ElSlider, ElButton } from 'element-plus'
import { Icon } from '@iconify/vue'
import {
  useSelectedComponent,
  useTraits,
  useCustomTraits,
} from '@/components/WebBuilder/composables'
import WbStylePanel from '@/components/WebBuilder/components/WbStylePanel.vue'
import { FieldWrapper, WbColorPicker } from '@/components/WebBuilder/components/fields'
import { setColorPickerHandler, setImageManager, getImageManager } from '@/components/WebBuilder/utils/traitBridge'
import {
  dedupeTraitDataSourceOptions,
  getLocalPageLinkOptions,
  getTraitDataSourceRegistry,
  type TraitDataSourceOption,
} from '@/components/WebBuilder/utils/traitDataSourceRegistry'

const props = defineProps<{
  grapes: any
  imageManager?: any
}>()

const editorRef = ref<any>(null)
const activeTab = ref<'properties' | 'styles'>('styles')

// 使用 composables（仅 properties tab 所需）
const selected = useSelectedComponent(props.grapes)
const traits = useTraits(props.grapes)
const customTraits = useCustomTraits(props.grapes, editorRef)

// 计算属性
const hasSelection = computed(() => {
  return typeof selected.getRawComponent?.()?.get === 'function' || typeof selected.component?.get === 'function'
})

const getTraitName = (trait: any): string => {
  return (trait as any)?.get?.('name') ?? (trait as any)?.name ?? ''
}

const getTraitWidget = (trait: any): string | null => {
  return (trait?.get?.('ui') as any)?.widget ?? null
}

interface TraitCategorySection {
  id: string
  label: string
  traits: any[]
}

const toNumericValue = (value: unknown, fallback = 0) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

// P1-5: 从各 trait 的 ui.inlineUnit 字段动态收集单位 trait 名称，替代静态 inlineUnitTraitMap
const inlineUnitTraitNames = computed(() => {
  const names = new Set<string>()
  for (const t of traits.componentTraits.value) {
    const inlineUnit = (t?.get?.('ui') as any)?.inlineUnit
    if (inlineUnit) names.add(inlineUnit)
  }
  return names
})

const getInlineUnitTrait = (trait: any) => {
  const unitTraitName = (trait?.get?.('ui') as any)?.inlineUnit
  if (!unitTraitName) return null
  return getTraitByName(unitTraitName) || null
}

const isHiddenInlineUnitTrait = (trait: any) => {
  return inlineUnitTraitNames.value.has(getTraitName(trait))
}

const isGridColumnsCustom = computed(() => `${getTraitRawValue('gridColumnsUnit', 'fr')}` === 'custom')
const isGridRowsCustom = computed(() => `${getTraitRawValue('gridRowsUnit', 'fr')}` === 'custom')

const isHiddenGridTemplateTrait = (trait: any) => {
  const traitName = getTraitName(trait)
  if (traitName === 'gridColumns') return isGridColumnsCustom.value
  if (traitName === 'gridRows') return isGridRowsCustom.value
  if (traitName === 'gridColumnsTemplate') return !isGridColumnsCustom.value
  if (traitName === 'gridRowsTemplate') return !isGridRowsCustom.value
  return false
}

const isTraitVisible = (trait: any) => {
  return !(
    getTraitWidget(trait) === 'hidden'
    || isHiddenInlineUnitTrait(trait)
    || isHiddenGridTemplateTrait(trait)
    || (getTraitName(trait) === 'imageLinkTarget' && !isImageHasLink.value)
  )
}

const getTraitCategory = (trait: any): { id: string; label: string } => {
  const rawCategory = trait?.get?.('category') ?? trait?.category
  if (rawCategory && typeof rawCategory === 'object') {
    const id = `${rawCategory.id ?? rawCategory.label ?? 'general'}`.trim() || 'general'
    const label = `${rawCategory.label ?? rawCategory.id ?? 'General'}`.trim() || 'General'
    return { id, label }
  }

  if (typeof rawCategory === 'string' && rawCategory.trim()) {
    return { id: rawCategory.trim(), label: rawCategory.trim() }
  }

  return { id: 'general', label: 'General' }
}

const traitSections = computed<TraitCategorySection[]>(() => {
  const sections = new Map<string, TraitCategorySection>()

  for (const trait of traits.componentTraits.value) {
    if (!isTraitVisible(trait)) continue

    const category = getTraitCategory(trait)
    const existing = sections.get(category.id)
    if (existing) {
      existing.traits.push(trait)
      continue
    }

    sections.set(category.id, {
      id: category.id,
      label: category.label,
      traits: [trait],
    })
  }

  return Array.from(sections.values())
})

const hasVisibleTraits = computed(() => traitSections.value.length > 0)

const traitMap = computed(() => {
  const map = new Map<string, any>()
  for (const t of traits.componentTraits.value) {
    map.set(getTraitName(t), t)
  }
  return map
})

const getTraitByName = (name: string) => traitMap.value.get(name) ?? null

const getTraitRawValue = (name: string, fallback: any = '') => {
  const trait = getTraitByName(name)
  if (!trait) return fallback
  const value = traits.getTraitValue(trait)
  return value == null ? fallback : value
}

const isBoxedContentWidth = computed(() => `${getTraitRawValue('contentWidth', 'full')}` === 'boxed')
const isImageHasLink = computed(() => !!getTraitRawValue('imageLink', ''))

const PAGE_LINK_MANUAL = '__manual__'
type PageLinkKind = typeof PAGE_LINK_MANUAL | 'page' | 'post' | 'product'
type PageLinkOption = TraitDataSourceOption

const remotePageLinkOptions = ref<PageLinkOption[]>([])
const remotePageLinkLoading = ref(false)
const remotePostLinkOptionsByType = ref<Record<string, PageLinkOption[]>>({})
const remotePostLinkLoadingByType = reactive<Record<string, boolean>>({})
const remoteProductLinkOptions = ref<PageLinkOption[]>([])
const remoteProductLinkLoading = ref(false)
const pageLinkKindByKey = reactive<Record<string, PageLinkKind>>({})

const dedupePageLinkOptions = (options: PageLinkOption[]): PageLinkOption[] => {
  return dedupeTraitDataSourceOptions(options)
}

const pageLinkOptions = computed(() => {
  const editor = editorRef.value
  const localOptions = editor ? getLocalPageLinkOptions(editor) : []
  return dedupePageLinkOptions([...localOptions, ...remotePageLinkOptions.value])
})

const getPostLinkOptions = (typeId = '') => {
  return remotePostLinkOptionsByType.value[typeId || 'all'] || []
}

const getProductLinkOptions = () => remoteProductLinkOptions.value

const getPageLinkControlKey = (trait: any) => getTraitName(trait) || 'href'

const inferPageLinkKind = (value: string): PageLinkKind => {
  const href = `${value ?? ''}`.trim()
  if (!href) return PAGE_LINK_MANUAL
  if (pageLinkOptions.value.some(option => option.value === href)) return 'page'
  if (getPostLinkOptions().some(option => option.value === href)) return 'post'
  if (getProductLinkOptions().some(option => option.value === href)) return 'product'
  return PAGE_LINK_MANUAL
}

const getPageLinkKind = (trait: any): PageLinkKind => {
  const key = getPageLinkControlKey(trait)
  return pageLinkKindByKey[key] || inferPageLinkKind(`${traits.getTraitValue(trait) ?? ''}`)
}

const setPageLinkKind = async (trait: any, value: PageLinkKind) => {
  const key = getPageLinkControlKey(trait)
  pageLinkKindByKey[key] = value
  await loadPageLinkOptionsByKind(value)
}

const getPageLinkOptionsByKind = (kind: PageLinkKind): PageLinkOption[] => {
  if (kind === 'page') return pageLinkOptions.value
  if (kind === 'post') return getPostLinkOptions()
  if (kind === 'product') return getProductLinkOptions()
  return []
}

const getPageLinkItemSelectValue = (trait: any) => {
  const value = `${traits.getTraitValue(trait) ?? ''}`.trim()
  const kind = getPageLinkKind(trait)
  return getPageLinkOptionsByKind(kind).some(option => option.value === value) ? value : ''
}

const getPageLinkLoadingLabel = (trait: any) => {
  const kind = getPageLinkKind(trait)
  if (kind === 'page' && remotePageLinkLoading.value) return '正在加载后台页面...'
  if (kind === 'post' && remotePostLinkLoadingByType.all) return '正在加载文章...'
  if (kind === 'product' && remoteProductLinkLoading.value) return '正在加载产品...'
  return ''
}

const loadRemotePageLinkOptions = async () => {
  if (remotePageLinkLoading.value || remotePageLinkOptions.value.length > 0) return
  const editor = editorRef.value
  if (!editor) return
  remotePageLinkLoading.value = true

  try {
    remotePageLinkOptions.value = await getTraitDataSourceRegistry(editor).loadPageLinks()
  } catch (error) {
    console.warn('[WebBuilder] 右侧链接 CMS 页面列表加载失败', error)
    remotePageLinkOptions.value = []
  } finally {
    remotePageLinkLoading.value = false
  }
}

const loadRemotePostLinkOptions = async (typeId = '') => {
  const key = typeId || 'all'
  if (remotePostLinkLoadingByType[key] || remotePostLinkOptionsByType.value[key]?.length > 0) return
  const editor = editorRef.value
  if (!editor) return
  remotePostLinkLoadingByType[key] = true

  try {
    remotePostLinkOptionsByType.value = {
      ...remotePostLinkOptionsByType.value,
      [key]: await getTraitDataSourceRegistry(editor).loadPostLinks({ typeId }),
    }
  } catch (error) {
    console.warn('[WebBuilder] 右侧链接文章列表加载失败', error)
    remotePostLinkOptionsByType.value = {
      ...remotePostLinkOptionsByType.value,
      [key]: [],
    }
  } finally {
    remotePostLinkLoadingByType[key] = false
  }
}

const loadRemoteProductLinkOptions = async () => {
  if (remoteProductLinkLoading.value || remoteProductLinkOptions.value.length > 0) return
  const editor = editorRef.value
  if (!editor) return
  remoteProductLinkLoading.value = true

  try {
    remoteProductLinkOptions.value = await getTraitDataSourceRegistry(editor).loadProductLinks()
  } catch (error) {
    console.warn('[WebBuilder] 右侧链接产品列表加载失败', error)
    remoteProductLinkOptions.value = []
  } finally {
    remoteProductLinkLoading.value = false
  }
}

const loadPageLinkOptionsByKind = async (kind: PageLinkKind) => {
  if (kind === 'page') {
    await loadRemotePageLinkOptions()
    return
  }
  if (kind === 'post') {
    await loadRemotePostLinkOptions()
    return
  }
  if (kind === 'product') {
    await loadRemoteProductLinkOptions()
  }
}

const getPageLinkPlaceholder = (trait: any) => {
  return (trait as any)?.get?.('placeholder') ?? (trait as any)?.placeholder ?? 'https://'
}

const handlePageLinkSelect = (trait: any, value: string) => {
  if (!value || value === PAGE_LINK_MANUAL) return
  traits.setTraitValue(trait, value)
}

const getTraitButtonText = (trait: any): string => {
  const text = (trait as any)?.get?.('text') ?? (trait as any)?.text ?? ''
  if (`${text}`.trim()) return `${text}`
  return traits.getTraitLabel(trait) || '执行'
}

const isButtonTraitFull = (trait: any): boolean => {
  return Boolean((trait as any)?.get?.('full') ?? (trait as any)?.full)
}

const runButtonTrait = (trait: any) => {
  const editor = editorRef.value
  if (!editor) return

  const traitModel = trait?._model ?? trait
  const command = traitModel?.get?.('command') ?? trait?.command
  if (!command) return

  const component = getRawComp()

  if (typeof command === 'string') {
    editor.runCommand?.(command, { trait: traitModel, component })
    return
  }

  if (typeof command === 'function') {
    try {
      command.call(traitModel, editor, { trait: traitModel, component })
    } catch (err) {
      console.error('[TraitsPanel] button trait command failed:', err)
    }
  }
}

const isNativeAnchor = computed(() => {
  const comp = getRawComp()
  const tagName = `${comp?.get?.('tagName') ?? comp?.tagName ?? ''}`.toLowerCase()
  return tagName === 'a'
})

const hasAnchorLinkTrait = computed(() => {
  return traits.componentTraits.value.some((trait: any) => {
    const type = `${traits.getTraitType(trait) ?? ''}`.toLowerCase()
    const name = `${getTraitName(trait) ?? ''}`.toLowerCase()
    return type === 'page-link' || /(href|link)/.test(name)
  })
})

const showAnchorFallbackLinkControls = computed(() => {
  return isNativeAnchor.value && !hasAnchorLinkTrait.value
})

const getAnchorAttrs = () => {
  const comp = getRawComp()
  return (comp?.getAttributes?.() ?? {}) as Record<string, string>
}

const anchorHref = computed(() => {
  return `${getAnchorAttrs().href ?? ''}`
})

const anchorTarget = computed(() => {
  return `${getAnchorAttrs().target ?? '_self'}`
})

const ANCHOR_LINK_KEY = '__anchor_href__'

const anchorPageLinkKind = computed<PageLinkKind>(() => {
  return pageLinkKindByKey[ANCHOR_LINK_KEY] || inferPageLinkKind(anchorHref.value)
})

const anchorPageLinkItemSelectValue = computed(() => {
  const href = `${anchorHref.value}`.trim()
  return getPageLinkOptionsByKind(anchorPageLinkKind.value).some(option => option.value === href)
    ? href
    : ''
})

const setAnchorHref = (value: string) => {
  const comp = getRawComp()
  if (!comp?.addAttributes) return
  comp.addAttributes({ href: value })
}

const setAnchorTarget = (value: string) => {
  const comp = getRawComp()
  if (!comp?.addAttributes) return
  comp.addAttributes({ target: value })
}

const handleAnchorPageSelect = (value: string) => {
  if (!value || value === PAGE_LINK_MANUAL) return
  setAnchorHref(value)
}

const setAnchorPageLinkKind = async (value: PageLinkKind) => {
  pageLinkKindByKey[ANCHOR_LINK_KEY] = value
  await loadPageLinkOptionsByKind(value)
}

const getAnchorPageLinkLoadingLabel = () => {
  const kind = anchorPageLinkKind.value
  if (kind === 'page' && remotePageLinkLoading.value) return '正在加载后台页面...'
  if (kind === 'post' && remotePostLinkLoadingByType.all) return '正在加载文章...'
  if (kind === 'product' && remoteProductLinkLoading.value) return '正在加载产品...'
  return ''
}

// ── 浮动颜色选择器 ─────────────────────────────────────────────
const cpState = reactive({
  visible: false,
  value: '',
  style: {} as Record<string, string>,
  onChange: null as ((v: string) => void) | null,
  onClear: null as (() => void) | null,
})

let _cpCloseCleanup: (() => void) | null = null

function closeCp() {
  cpState.visible = false
  _cpCloseCleanup?.()
  _cpCloseCleanup = null
}

setColorPickerHandler(({ anchor, value, onChange, onClear }) => {
  const rect = anchor.getBoundingClientRect()
  const top = rect.bottom + 4
  const left = Math.max(4, rect.left)
  // 如果弹出框超出视口底部，则向上弹出
  const viewportH = window.innerHeight
  const pickerH = 380
  const actualTop = (top + pickerH > viewportH) ? Math.max(4, rect.top - pickerH - 4) : top

  cpState.value = value
  cpState.onChange = onChange
  cpState.onClear = onClear
  cpState.style = { top: `${actualTop}px`, left: `${left}px` }
  cpState.visible = true

  // 点击外部关闭
  _cpCloseCleanup?.()
  const handler = (e: MouseEvent) => {
    const cpEl = document.querySelector('.wb-floating-cp')
    if (cpEl && !cpEl.contains(e.target as Node)) {
      closeCp()
    }
  }
  setTimeout(() => document.addEventListener('mousedown', handler), 0)
  _cpCloseCleanup = () => document.removeEventListener('mousedown', handler)
})

const handleCpUpdate = (v: string) => {
  cpState.value = v
  cpState.onChange?.(v)
}

const handleCpClear = () => {
  cpState.value = ''
  cpState.onClear?.()
}

onBeforeUnmount(() => {
  closeCp()
})

// ── 自定义属性编辑（所有元素通用） ────────────────────────────

/** 不在自定义属性区显示的系统级属性 */
const SYSTEM_ATTRS = new Set([
  'id',
  'class',
  'style',
  'onsubmit',
  'data-wb-component',
  'data-inquiry-type-id',
  'data-inquiry-type-code',
  'data-inquiry-type-name',
  'data-inquiry-fields',
  'data-submit-url',
  'data-captcha-base',
  'data-tenant-id',
])

interface AttrRow {
  id: number
  name: string
  value: string
  /** 提交到 GrapesJS 时的原始属性名，用于重命名场景 */
  _origName: string
}

let _attrRowId = 0
const attrRows = ref<AttrRow[]>([])

function getRawComp() {
  return selected.getRawComponent?.() ?? selected.component?._model ?? selected.component
}

function rebuildAttrRows() {
  const comp = getRawComp()
  if (!comp?.getAttributes) { attrRows.value = []; return }
  const attrs = comp.getAttributes() as Record<string, string>
  attrRows.value = Object.entries(attrs)
    .filter(([k]) => !SYSTEM_ATTRS.has(k))
    .map(([name, value]) => ({
      id: ++_attrRowId,
      name,
      value: String(value ?? ''),
      _origName: name,
    }))
}

watch(() => [selected.component, selected.revision], rebuildAttrRows, { immediate: true })

/** 属性名失焦时提交（处理重命名） */
function onAttrNameBlur(row: AttrRow) {
  const comp = getRawComp()
  if (!comp) return
  const newName = row.name.trim()
  if (!newName) return
  const attrs = { ...(comp.getAttributes() as Record<string, string>) }
  if (row._origName && row._origName !== newName) {
    delete attrs[row._origName]
  }
  attrs[newName] = row.value
  comp.setAttributes?.(attrs)
  row._origName = newName
}

/** 属性值变化时立即写入 */
function onAttrValueChange(row: AttrRow, value: string) {
  row.value = value
  const comp = getRawComp()
  if (!comp || !row.name.trim()) return
  comp.addAttributes?.({ [row.name.trim()]: value })
}

/** 删除属性行 */
function removeAttr(row: AttrRow) {
  const comp = getRawComp()
  if (comp && row._origName) {
    const attrs = { ...(comp.getAttributes() as Record<string, string>) }
    delete attrs[row._origName]
    comp.setAttributes?.(attrs)
  }
  attrRows.value = attrRows.value.filter(r => r.id !== row.id)
}

/** 新增空属性行 */
function addAttrRow() {
  attrRows.value.push({ id: ++_attrRowId, name: '', value: '', _origName: '' })
}

// ── 原生 <img> 图片选择 ────────────────────────────────────────

/** 当前选中是否为原生 img 元素（非 wb-image 自定义组件） */
const isNativeImg = computed(() => {
  const comp = getRawComp()
  const tagName = comp?.get?.('tagName') ?? comp?.tagName
  const type = comp?.get?.('type') ?? comp?.type
  return tagName === 'img' && type !== 'wb-image'
})

const nativeImgSrc = computed(() => {
  if (!isNativeImg.value) return ''
  const comp = getRawComp()
  return comp?.getAttributes?.()?.src ?? ''
})

function setNativeImgSrc(src: string) {
  const comp = getRawComp()
  comp?.addAttributes?.({ src })
}

function openNativeImgPicker() {
  const im = getImageManager()
  if (!im) return
  im.openAssetsDialogWithTarget({
    selectCallback: (asset: any) => {
      const src = asset?.getSrc?.() ?? asset?.src ?? ''
      if (src) setNativeImgSrc(src)
    },
  })
}

// 初始化编辑器
props.grapes.onInit((editor: any) => {
  editorRef.value = editor
  setImageManager(props.imageManager)
  loadRemotePageLinkOptions()
  loadRemotePostLinkOptions()
  loadRemoteProductLinkOptions()
})
</script>

<template>
  <div v-if="hasSelection" class="border-t">
    <!-- Tab 切换 -->
    <div class="flex items-center justify-center gap-2 px-3 py-2 border-b">
      <button
        type="button"
        class="text-xs px-2 py-1 rounded"
        :class="activeTab === 'styles' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'"
        @click="activeTab = 'styles'"
      >
        样式
      </button>
      <button
        type="button"
        class="text-xs px-2 py-1 rounded"
        :class="activeTab === 'properties' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'"
        @click="activeTab = 'properties'"
      >
        属性
      </button>
    </div>

    <!-- 样式面板（完全由 WbStylePanel 接管） -->
    <WbStylePanel
      v-if="activeTab === 'styles'"
      :grapes="grapes"
      :image-manager="imageManager"
    />

    <!-- 属性面板 -->
    <div v-else class="p-3">

      <!-- 原生 <img> 图片选择器 -->
      <div v-if="isNativeImg" class="mb-4 pb-4 border-b">
        <div class="text-xs font-semibold text-gray-700 mb-2">图片</div>
        <!-- 预览 -->
        <div
          class="group relative w-full aspect-video rounded border border-gray-200 flex items-center justify-center overflow-hidden mb-2"
          style="    background-image: linear-gradient(45deg, rgb(204, 204, 204) 25%, transparent 25%), linear-gradient(-45deg, rgb(204, 204, 204) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgb(204, 204, 204) 75%), linear-gradient(-45deg, transparent 75%, rgb(204, 204, 204) 75%);
    background-size: 10px 10px;
    background-position: 0px 0px, 0px 5px, 5px -5px, -5px 0px;"
        >
          <template v-if="nativeImgSrc">
            <img
              :src="nativeImgSrc"
              alt="预览"
              class="w-full h-full object-contain"
            />
          </template>
          <template v-else>
            <Icon icon="fa:image" />
          </template>

          <!-- hover 浮层：选择 / 删除 -->
          <div
            class="absolute inset-0 flex items-end justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <button
              type="button"
              class="inline-flex items-center text-xs justify-center w-full h-8 bg-white/30 text-white transition-colors"
              title="从素材库选择"
              aria-label="从素材库选择"
              @click="openNativeImgPicker"
            >
            从素材库选择
            </button>

            <button
              v-if="nativeImgSrc"
              type="button"
              class="absolute top-2 right-2 inline-flex items-center justify-center size-6 rounded-full bg-white/95 text-red-600 hover:bg-white transition-colors"
              title="删除"
              aria-label="删除"
              @click="setNativeImgSrc('')"
            >
              <Icon icon="mdi:trash-can-outline" class="text-xs" />
            </button>
          </div>
        </div>
        <!-- URL 直接输入 -->
<!--        <el-input
          :model-value="nativeImgSrc"
          @update:model-value="setNativeImgSrc($event)"
          size="small"
          placeholder="https://"
          class="w-full"
        />-->
      </div>

      <div v-if="hasVisibleTraits">
        <div class="text-xs font-semibold text-gray-700 mb-3">Component Properties</div>

        <section
          v-for="section in traitSections"
          :key="section.id"
          class="mb-4 last:mb-0"
        >
          <div class="mb-2 text-xs font-semibold text-gray-500">{{ section.label }}</div>

          <template v-for="(trait, index) in section.traits" :key="`${section.id}-${index}`">
            <FieldWrapper :class="[traits.getTraitType(trait)==='checkbox' && 'flex items-center']" :label="traits.getTraitLabel(trait) || `Property ${index + 1}`">

              <!-- label-end 插槽：内联单位选择 / 内联下拉 -->
              <template #label-end>
                <el-select
                  v-if="getInlineUnitTrait(trait)"
                  :model-value="traits.getTraitValue(getInlineUnitTrait(trait))"
                  @update:model-value="traits.setTraitValue(getInlineUnitTrait(trait), $event)"
                  size="small"
                  class="w-12 inline-unit-select"
                >
                  <el-option
                    v-for="option in traits.getTraitOptions(getInlineUnitTrait(trait))"
                    :key="String(option.value)"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
                <el-select
                  v-else-if="getTraitWidget(trait) === 'inline-select'"
                  :model-value="traits.getTraitValue(trait)"
                  @update:model-value="traits.setTraitValue(trait, $event)"
                  size="small"
                  class="w-28"
                >
                  <el-option
                    v-for="option in traits.getTraitOptions(trait)"
                    :key="String(option.value)"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </template>

              <!-- 控件主体 -->

              <!-- Page link（Element Plus） -->
              <div
                v-if="traits.getTraitType(trait) === 'page-link'"
                class="w-full flex flex-col gap-2"
              >
                <el-select
                  :model-value="getPageLinkKind(trait)"
                  @update:model-value="setPageLinkKind(trait, $event)"
                  size="small"
                  class="w-full"
                >
                  <el-option label="手动填写 URL" :value="PAGE_LINK_MANUAL" />
                  <el-option label="页面" value="page" />
                  <el-option label="文章" value="post" />
                  <el-option label="产品" value="product" />
                </el-select>
                <el-select
                  v-if="getPageLinkKind(trait) !== PAGE_LINK_MANUAL"
                  :model-value="getPageLinkItemSelectValue(trait)"
                  @update:model-value="handlePageLinkSelect(trait, $event)"
                  size="small"
                  class="w-full"
                >
                  <el-option
                    :label="getPageLinkKind(trait) === 'page' ? '请选择页面' : getPageLinkKind(trait) === 'post' ? '请选择文章' : '请选择产品'"
                    value=""
                  />
                  <el-option
                    v-for="option in getPageLinkOptionsByKind(getPageLinkKind(trait))"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                  <el-option
                    v-if="getPageLinkLoadingLabel(trait)"
                    :label="getPageLinkLoadingLabel(trait)"
                    value="__loading__"
                    disabled
                  />
                </el-select>
                <el-input
                  :model-value="traits.getTraitValue(trait)"
                  @update:model-value="traits.setTraitValue(trait, $event)"
                  size="small"
                  class="w-full"
                  :placeholder="getPageLinkPlaceholder(trait)"
                />
              </div>

              <!-- 自定义 Trait 类型（color-picker / image-picker / icon-radio / custom-attributes 等） -->
              <div
                v-else-if="traits.isCustomTraitType(traits.getTraitType(trait))"
                class="custom-trait-container"
                :ref="(el) => customTraits.setupCustomTrait(el, trait)"
              ></div>

              <!-- Button -->
              <el-button
                v-else-if="traits.getTraitType(trait) === 'button'"
                size="small"
                plain
                :class="{ 'w-full': isButtonTraitFull(trait) }"
                @click="runButtonTrait(trait)"
              >
                {{ getTraitButtonText(trait) }}
              </el-button>

              <!-- Checkbox -->
              <el-checkbox
                class="mb-1 h-auto"
                v-else-if="traits.getTraitType(trait) === 'checkbox'"
                :model-value="traits.getTraitValue(trait)"
                @update:model-value="traits.setTraitValue(trait, $event)"
              />

              <!-- Number -->
              <div v-else-if="traits.getTraitType(trait) === 'number'" class="w-full">
                <div v-if="getTraitWidget(trait) === 'slider'" class="flex items-center gap-2">
                  <el-slider
                    class="flex-1"
                    size="small"
                    :model-value="Number(traits.getTraitValue(trait) ?? 0)"
                    @update:model-value="traits.setTraitValue(trait, Number($event ?? 0))"
                    :min="(trait as any)?.get?.('min') ?? (trait as any)?.min ?? 0"
                    :max="(trait as any)?.get?.('max') ?? (trait as any)?.max ?? 100"
                    :step="(trait as any)?.get?.('step') ?? (trait as any)?.step ?? 1"
                    :show-tooltip="true"
                  />
                  <el-input
                    :model-value="String(traits.getTraitValue(trait) ?? '')"
                    @update:model-value="traits.setTraitValue(trait, toNumericValue($event, 0))"
                    type="number"
                    size="small"
                    class="w-auto"
                    :min="(trait as any)?.get?.('min') ?? (trait as any)?.min"
                    :max="(trait as any)?.get?.('max') ?? (trait as any)?.max"
                    :step="(trait as any)?.get?.('step') ?? (trait as any)?.step ?? 1"
                  />
                </div>
                <el-input
                  v-else
                  :model-value="String(traits.getTraitValue(trait) ?? '')"
                  @update:model-value="traits.setTraitValue(trait, toNumericValue($event, 0))"
                  type="number"
                  size="small"
                  class="w-full"
                  :min="(trait as any)?.get?.('min') ?? (trait as any)?.min"
                  :max="(trait as any)?.get?.('max') ?? (trait as any)?.max"
                  :step="(trait as any)?.get?.('step') ?? (trait as any)?.step ?? 1"
                />
              </div>

              <!-- Select -->
              <el-select
                v-else-if="traits.getTraitType(trait) === 'select' && getTraitWidget(trait) !== 'inline-select'"
                :model-value="traits.getTraitValue(trait)"
                @update:model-value="traits.setTraitValue(trait, $event)"
                size="small"
                class="w-full"
              >
                <el-option
                  v-for="option in traits.getTraitOptions(trait)"
                  :key="String(option.value)"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>

              <!-- contentWidth = boxed 时额外显示盒式宽度输入 -->
              <div
                v-if="getTraitWidget(trait) === 'content-width' && isBoxedContentWidth"
                class="mt-2"
              >
                <el-input
                  :model-value="String(getTraitRawValue('boxedWidth', 1140))"
                  @update:model-value="(val) => {
                    const boxedWidthTrait = getTraitByName('boxedWidth')
                    if (boxedWidthTrait) traits.setTraitValue(boxedWidthTrait, toNumericValue(val, 1140))
                  }"
                  type="number"
                  size="small"
                  class="w-full"
                  min="320"
                  step="1"
                  placeholder="盒式宽度(px)"
                />
              </div>

              <!-- Textarea -->
              <el-input
                v-else-if="traits.getTraitType(trait) === 'textarea'"
                :model-value="traits.getTraitValue(trait)"
                @update:model-value="traits.setTraitValue(trait, $event)"
                type="textarea"
                :rows="3"
                size="small"
                class="w-full"
              />

              <!-- Text -->
              <el-input
                v-else-if="traits.getTraitType(trait) === 'text'"
                :model-value="traits.getTraitValue(trait)"
                @update:model-value="traits.setTraitValue(trait, $event)"
                size="small"
                class="w-full"
              />
            </FieldWrapper>
          </template>
        </section>
      </div>

      <div v-if="showAnchorFallbackLinkControls" class="mb-4">
        <div class="text-xs font-semibold text-gray-700 mb-3">Link</div>
        <FieldWrapper label="链接地址">
          <div class="w-full flex flex-col gap-2">
            <el-select
              :model-value="anchorPageLinkKind"
              @update:model-value="setAnchorPageLinkKind($event)"
              size="small"
              class="w-full"
            >
              <el-option label="手动填写 URL" :value="PAGE_LINK_MANUAL" />
              <el-option label="页面" value="page" />
              <el-option label="文章" value="post" />
              <el-option label="产品" value="product" />
            </el-select>
            <el-select
              v-if="anchorPageLinkKind !== PAGE_LINK_MANUAL"
              :model-value="anchorPageLinkItemSelectValue"
              @update:model-value="handleAnchorPageSelect($event)"
              size="small"
              class="w-full"
            >
              <el-option
                :label="anchorPageLinkKind === 'page' ? '请选择页面' : anchorPageLinkKind === 'post' ? '请选择文章' : '请选择产品'"
                value=""
              />
                <el-option
                  v-for="option in getPageLinkOptionsByKind(anchorPageLinkKind)"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
                <el-option
                  v-if="getAnchorPageLinkLoadingLabel()"
                  :label="getAnchorPageLinkLoadingLabel()"
                  value="__loading__"
                  disabled
                />
              </el-select>
            <el-input
              :model-value="anchorHref"
              @update:model-value="setAnchorHref($event)"
              size="small"
              class="w-full"
              placeholder="https://"
            />
          </div>
        </FieldWrapper>
        <FieldWrapper label="打开方式">
          <el-select
            :model-value="anchorTarget"
            @update:model-value="setAnchorTarget($event)"
            size="small"
            class="w-full"
          >
            <el-option label="当前页" value="_self" />
            <el-option label="新窗口" value="_blank" />
          </el-select>
        </FieldWrapper>
      </div>

      <!-- Empty State（仅当 traits 和自定义属性行均为空时） -->
      <div
        v-if="!hasVisibleTraits && attrRows.length === 0 && !isNativeImg && !showAnchorFallbackLinkControls"
        class="text-xs text-gray-400 text-center py-4"
      >
        暂无属性配置
      </div>

      <!-- 自定义属性（所有元素通用） -->
      <div class="mt-4 pt-4 border-t">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold text-gray-700">自定义属性</span>
          <button
            type="button"
            class="text-xs px-2 py-1 border border-blue-300 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
            @click="addAttrRow"
          >
            + 添加
          </button>
        </div>

        <div v-if="attrRows.length > 0" class="flex flex-col gap-1.5">
          <div
            v-for="row in attrRows"
            :key="row.id"
            class="flex items-center gap-1"
          >
            <!-- 属性名 -->
            <el-input
              v-model="row.name"
              size="small"
              placeholder="属性名"
              class="flex-1 min-w-0"
              @blur="onAttrNameBlur(row)"
              @keydown.enter="onAttrNameBlur(row)"
            />
            <!-- 属性值 -->
            <el-input
              :model-value="row.value"
              size="small"
              placeholder="属性值"
              class="flex-1 min-w-0"
              @update:model-value="onAttrValueChange(row, $event)"
            />
            <!-- 删除 -->
            <button
              type="button"
              class="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              @click="removeAttr(row)"
              title="删除"
            >
              <Icon icon="lucide:x" class="text-xs" />
            </button>
          </div>
        </div>

        <div v-else class="text-xs text-gray-400 text-center py-2">
          暂无自定义属性
        </div>
      </div>
    </div>

    <!-- 浮动颜色选择器（由 color-picker 自定义 trait 触发） -->
    <Teleport to="body">
      <template v-if="cpState.visible">
        <div class="wb-cp-backdrop" @mousedown="closeCp"></div>
        <div class="wb-floating-cp" :style="cpState.style">
          <WbColorPicker
            :model-value="cpState.value"
            @update:model-value="handleCpUpdate"
            @clear="handleCpClear"
          />
        </div>
      </template>
    </Teleport>
  </div>
</template>

<style scoped>
.el-slider{
  --el-slider-button-size:16px;
  --el-slider-height: 4px;
  --el-slider-main-bg-color:#d9dde3;
  --el-slider-button-bg-color:#1f2937;
  --el-slider-button-text-color:#ffffff;
  --el-slider-button-border-color:#d9dde3;
  --el-slider-button-border-radius:4px;
  --el-slider-button-border-width:1px;
  --el-slider-button-border-style:solid;
}
</style>

<style>
/* 浮动颜色选择器（非 scoped，Teleport 挂载到 body） */
.wb-cp-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9998;
}

.wb-floating-cp {
  position: fixed;
  z-index: 9999;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  padding: 8px;
}
</style>
