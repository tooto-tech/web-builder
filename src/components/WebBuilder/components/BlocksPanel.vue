<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { Icon } from '@iconify/vue'
import useSymbols from '@/components/WebBuilder/composables/useSymbols'
import {
  blockMatchesSearch,
  createWebBuilderBlockCatalog,
  groupWebBuilderBlocks,
  type WebBuilderBlockCatalogContext,
  type WebBuilderBlockDefinition,
  type WebBuilderBlockPack,
} from '@/components/WebBuilder/components/blocks/blockCatalog'
import { resolveDynamicContext, type DynamicContext } from '@/components/WebBuilder/components/registries/dynamic/cms'

const props = defineProps<{
  grapes: any
  /** 当前页面所属资源类型（如 TEMP_POST_DETAIL），用于过滤仅在特定模板才显示的动态 block */
  resourceType?: string | null
  /** 资源扩展元数据，例如 TEMP_LOOP_ITEM 的 loopItemType */
  resourceExtJson?: string | null
  /** 代码级 block 扩展包，后续可按项目/租户注入 */
  extensionPacks?: WebBuilderBlockPack[]
  tenantId?: string | number | null
  siteType?: string | null
  projectKey?: string | null
  ownerType?: string | null
  ownerId?: string | number | null
}>()

const currentDynamicContext = computed<DynamicContext | null>(() =>
  resolveDynamicContext(props.resourceType || '', props.resourceExtJson || '')
)

const editorRef = shallowRef<any>(null)
const symbolsRef = shallowRef<ReturnType<typeof useSymbols> | null>(null)
const registeredEditorBlocks = ref<WebBuilderBlockDefinition[]>([])
let cleanupEditorBlockEvents: (() => void) | null = null

const toCollectionArray = (collection: any): any[] => {
  if (!collection) return []
  if (Array.isArray(collection)) return collection
  if (Array.isArray(collection.models)) return collection.models
  if (typeof collection.toArray === 'function') return collection.toArray()
  return []
}

const readModelValue = (model: any, key: string): any => {
  if (!model) return undefined
  if (typeof model.get === 'function') return model.get(key)
  return model[key]
}

const normalizeModelText = (value: any, fallback = ''): string => {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') return value.trim() || fallback
  if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) {
    return value.textContent?.trim() || fallback
  }
  if (typeof value === 'object') return fallback
  return `${value}`.trim() || fallback
}

const normalizeEditorBlockCategory = (category: any): string => {
  const raw =
    normalizeModelText(readModelValue(category, 'id')) ||
    normalizeModelText(readModelValue(category, 'label')) ||
    normalizeModelText(readModelValue(category, 'name')) ||
    normalizeModelText(category)
  const lower = raw.toLowerCase()
  if (lower === 'basics') return 'basic'
  if (lower === 'layouts') return 'layout'
  if (lower === 'sections') return 'section'
  if (lower === 'ui') return 'interactive'
  return raw || 'other'
}

const toEditorBlockDefinition = (
  blockModel: any,
  index: number
): WebBuilderBlockDefinition | null => {
  const id = normalizeModelText(
    readModelValue(blockModel, 'id') || blockModel?.id || blockModel?.getId?.()
  )
  if (!id || id.startsWith('__temp_drag_')) return null

  const content = readModelValue(blockModel, 'content')
  if (content === null || content === undefined) return null

  return {
    id,
    label: normalizeModelText(readModelValue(blockModel, 'label'), id),
    icon: normalizeModelText(readModelValue(blockModel, 'media'), 'lucide:box'),
    content,
    category: normalizeEditorBlockCategory(readModelValue(blockModel, 'category')),
    order: 1000 + index
  }
}

const refreshRegisteredEditorBlocks = (editor: any) => {
  const blockManager = editor?.Blocks || editor?.BlockManager
  registeredEditorBlocks.value = toCollectionArray(blockManager?.getAll?.())
    .map((blockModel, index) => toEditorBlockDefinition(blockModel, index))
    .filter(Boolean) as WebBuilderBlockDefinition[]
}

const bindEditorBlockEvents = (editor: any) => {
  cleanupEditorBlockEvents?.()
  cleanupEditorBlockEvents = null
  if (!editor || typeof editor.on !== 'function') return

  const refresh = () => refreshRegisteredEditorBlocks(editor)
  const events = ['block:add', 'block:remove', 'block:update']
  events.forEach((eventName) => editor.on(eventName, refresh))
  cleanupEditorBlockEvents = () => {
    if (typeof editor.off !== 'function') return
    events.forEach((eventName) => editor.off(eventName, refresh))
  }
}

// 计算属性：获取 symbols 列表（简化模板访问）
// 直接返回 symbols computed，让模板自动解包
const symbolsList = computed(() => {
  if (!symbolsRef.value) {
    return []
  }

  return symbolsRef.value.symbols.value
})

// 初始化 symbols（需要传入 grapes 对象）
symbolsRef.value = useSymbols(props.grapes)

props.grapes.onInit((editor: any) => {
  editorRef.value = editor
  refreshRegisteredEditorBlocks(editor)
  bindEditorBlockEvents(editor)
})

const activeTab = ref<'components' | 'symbols'>('components')
const blockSearchQuery = ref('')
const panelTabs = [
  { id: 'components', label: '组件' },
  { id: 'symbols', label: '全局组件' }
] as const

type BasicComponent = WebBuilderBlockDefinition

const blockCatalogContext = computed<WebBuilderBlockCatalogContext>(() => ({
  resourceType: props.resourceType || null,
  resourceExtJson: props.resourceExtJson || null,
  dynamicContext: currentDynamicContext.value,
  tenantId: props.tenantId ?? null,
  siteType: props.siteType || null,
  projectKey: props.projectKey || null,
  ownerType: props.ownerType || null,
  ownerId: props.ownerId ?? null,
}))

const baseVisibleBlocks = computed(() =>
  createWebBuilderBlockCatalog(blockCatalogContext.value, props.extensionPacks ?? [])
)

const getBlockContentType = (content: any): string =>
  content && typeof content === 'object' ? `${content.type || ''}`.trim() : ''

const visibleBlocks = computed(() => {
  const baseBlocks = baseVisibleBlocks.value
  const baseIds = new Set(baseBlocks.map((block) => block.id))
  const baseTypes = new Set(
    baseBlocks.map((block) => getBlockContentType(block.content)).filter(Boolean)
  )
  const editorBlocks = registeredEditorBlocks.value.filter((block) => {
    if (baseIds.has(block.id)) return false
    const contentType = getBlockContentType(block.content)
    return !contentType || !baseTypes.has(contentType)
  })
  return [...baseBlocks, ...editorBlocks]
})

const BOTTOM_DROP_MIME = 'application/x-wb-content'

/**
 * 按分类分组基础组件
 */
const groupedBasicComponents = computed(() => {
  const searchQuery = blockSearchQuery.value.trim().toLowerCase()
  return groupWebBuilderBlocks(
    visibleBlocks.value.filter((component) => blockMatchesSearch(component, searchQuery))
  )
})

const visibleBlockCount = computed(() =>
  groupedBasicComponents.value.reduce((total, group) => total + group.items.length, 0)
)

const isDroppableTarget = (component: any) => {
  if (!component || typeof component.get !== 'function') return false
  const droppable = component.get('droppable')
  return droppable !== false
}

const cloneInsertContent = (content: any) => {
  if (!content || typeof content !== 'object' || typeof content.get === 'function') {
    return content
  }

  try {
    if (typeof structuredClone === 'function') {
      return structuredClone(content)
    }
  } catch {
    // ignore and fall back to JSON clone
  }

  try {
    return JSON.parse(JSON.stringify(content))
  } catch {
    return content
  }
}

const getInsertedComponent = (result: any): any => {
  if (!result) return null

  if (Array.isArray(result)) {
    return result[result.length - 1] ?? null
  }

  const models = result?.models
  if (Array.isArray(models)) {
    return models[models.length - 1] ?? null
  }

  if (typeof result.get === 'function') {
    return result
  }

  return null
}

const selectInsertedComponent = (editor: any, result: any) => {
  const inserted = getInsertedComponent(result)
  if (!inserted) return false

  editor.select?.(inserted)
  return true
}

const toComponentArray = (children: any): any[] => {
  if (!children) return []
  if (Array.isArray(children)) return children
  if (Array.isArray(children.models)) return children.models
  if (typeof children.toArray === 'function') return children.toArray()
  return []
}

const findLoopItemRootComponent = (root: any): any | null => {
  if (!root) return null
  const stack = [root]
  const seen = new Set<any>()
  while (stack.length > 0) {
    const component = stack.shift()
    if (!component || seen.has(component)) continue
    seen.add(component)
    const attrs = component.getAttributes?.() || component.get?.('attributes') || {}
    if (Object.prototype.hasOwnProperty.call(attrs, 'data-wb-loop-item-root')) {
      return component
    }
    stack.push(...toComponentArray(component.components?.()))
  }
  return null
}

const isSameOrDescendant = (component: any, maybeAncestor: any): boolean => {
  if (!component || !maybeAncestor) return false
  let cur = component
  const seen = new Set<any>()
  while (cur && !seen.has(cur)) {
    seen.add(cur)
    if (cur === maybeAncestor) return true
    cur = cur.parent?.()
  }
  return false
}

const appendToSelectedOrCanvas = (editor: any, content: any) => {
  const nextContent = cloneInsertContent(content)
  const page = editor.Pages?.getSelected?.()
  const root = page?.getMainComponent?.()
  const loopRoot =
    `${props.resourceType ?? ''}`.trim() === 'TEMP_LOOP_ITEM'
      ? findLoopItemRootComponent(root)
      : null
  const selected = editor.getSelected?.()
  if (selected && isDroppableTarget(selected) && typeof selected.append === 'function') {
    const target = loopRoot && !isSameOrDescendant(selected, loopRoot) ? loopRoot : selected
    const inserted = target.append(nextContent)
    selectInsertedComponent(editor, inserted)
    return
  }

  const appendRoot = loopRoot || root
  if (appendRoot && isDroppableTarget(appendRoot) && typeof appendRoot.append === 'function') {
    const inserted = appendRoot.append(nextContent)
    selectInsertedComponent(editor, inserted)
    return
  }

  const inserted = editor.addComponents(nextContent)
  selectInsertedComponent(editor, inserted)
}

const setDragData = (event: DragEvent, content: any) => {
  if (!event.dataTransfer || content == null) return
  const payload = typeof content === 'object' ? JSON.stringify(content) : `${content}`
  event.dataTransfer.setData(BOTTOM_DROP_MIME, payload)
  event.dataTransfer.setData('text/html', payload)
  event.dataTransfer.effectAllowed = 'copy'
}

const addBasicComponent = (component: BasicComponent) => {
  const editor = editorRef.value
  if (!editor) return

  // 如果 content 是对象（自定义组件类型），使用 addComponents
  if (typeof component.content === 'object' && 'type' in component.content) {
    appendToSelectedOrCanvas(editor, component.content)
  } else if (typeof component.content === 'string') {
    // 否则直接添加 HTML 内容
    appendToSelectedOrCanvas(editor, component.content)
  }
}

/**
 * 处理基础组件的拖拽开始
 */
const handleBasicComponentDragStart = (component: BasicComponent, event: DragEvent) => {
  const editor = editorRef.value
  if (!editor || !event.dataTransfer) return

  setDragData(event, component.content)

  // 使用 GrapesJS 的 Blocks API 开始拖拽（需传入真实 Block 模型实例）
  if (editor.Blocks && typeof editor.Blocks.startDrag === 'function') {
    const blockId = `__temp_drag_${component.id}`
    const existingBlock = editor.Blocks.get(component.id)
    // 先注册临时 block，获取真实模型实例后再触发拖拽
    if (!existingBlock && !editor.Blocks.get(blockId)) {
      editor.Blocks.add(blockId, {
        label: component.label,
        content: component.content,
        category: component.category || 'basic',
        media: component.icon
      })
    }
    const blockModel = existingBlock || editor.Blocks.get(blockId)
    if (blockModel) {
      editor.Blocks.startDrag(blockModel, event)
    }
  }
}

/**
 * 处理基础组件的拖拽结束
 */
const handleBasicComponentDragEnd = () => {
  const editor = editorRef.value
  if (!editor) return

  // 使用 GrapesJS 的 Blocks API 结束拖拽
  if (editor.Blocks && typeof editor.Blocks.endDrag === 'function') {
    editor.Blocks.endDrag()
  }
}

const isInlineBlockIcon = (icon: string | undefined): boolean =>
  /^\s*</.test(`${icon || ''}`)

const addSymbolToCanvas = (symbolInfo: any) => {
  if (!symbolsRef.value || !symbolInfo?.component) return
  symbolsRef.value.addSymbolToEditor(symbolInfo.component)
}

const handleDeleteSymbol = async (symbolInfo: any) => {
  if (!symbolsRef.value || !symbolInfo?.component) return
  await symbolsRef.value.deleteSymbol(symbolInfo.component)
}

// 当切换到 symbols tab 时，刷新列表
watch(
  () => activeTab.value,
  (newTab) => {
    if (newTab === 'symbols' && symbolsRef.value) {
      symbolsRef.value.refreshSymbols()
    }
  }
)

onBeforeUnmount(() => {
  cleanupEditorBlockEvents?.()
  cleanupEditorBlockEvents = null
})
</script>

<template>
  <div class="blocks-panel-container">
    <div class="blocks-panel-tabs-wrapper">
      <div class="flex items-center justify-center gap-2 border-b px-3 py-2">
        <button
          v-for="tab in panelTabs"
          :key="tab.id"
          type="button"
          class="rounded px-2 py-1 text-xs"
          :class="activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'text-gray-500'"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="blocks-panel-content">
        <!-- Components Tab -->
        <div v-if="activeTab === 'components'">
          <div class="blocks-search">
            <Icon icon="lucide:search" class="blocks-search__icon" />
            <input
              v-model="blockSearchQuery"
              type="search"
              class="blocks-search__input"
              placeholder="搜索组件 Block"
              aria-label="搜索组件 Block"
            />
            <button
              v-if="blockSearchQuery"
              type="button"
              class="blocks-search__clear"
              title="清空搜索"
              aria-label="清空搜索"
              @click="blockSearchQuery = ''"
            >
              <Icon icon="lucide:x" class="text-xs" />
            </button>
          </div>
          <div class="grid grid-cols-1 gap-4">
            <template v-for="group in groupedBasicComponents" :key="group.label">
              <div class="border-b">
                <div class="text-xs font-medium text-gray-500 mb-2">{{ group.label }}</div>
                <div class="grid grid-cols-2 gap-2 py-3">
                  <button
                    v-for="component in group.items"
                    :key="component.id"
                    class="border rounded px-2 py-2 text-left hover:bg-gray-50 flex flex-col items-center justify-center cursor-move"
                    draggable="true"
                    @dragstart="handleBasicComponentDragStart(component, $event)"
                    @dragend="handleBasicComponentDragEnd()"
                    @click="addBasicComponent(component)"
                    :title="component.label"
                    :aria-label="component.label"
                  >
                    <div class="size-8 mb-1 flex items-center justify-center text-gray-600">
                      <span
                        v-if="isInlineBlockIcon(component.icon)"
                        class="blocks-panel-block__media"
                        v-html="component.icon"
                      ></span>
                      <Icon v-else :icon="component.icon" class="text-xl" />
                    </div>
                    <div class="text-[10px] text-gray-600 text-center">{{ component.label }}</div>
                  </button>
                </div>
              </div>
            </template>
            <div v-if="visibleBlockCount === 0" class="text-center text-gray-400 text-xs py-8">
              没有匹配的组件
            </div>
          </div>
        </div>

        <!-- Symbols Tab -->
        <div v-else-if="activeTab === 'symbols'">
          <div class="grid grid-cols-1 gap-4">
            <div v-if="symbolsList.length === 0" class="text-center text-gray-400 text-xs py-8">
              No symbols yet
              <div class="text-[10px] mt-2"
                >Right-click on a component in Layers panel to create a symbol</div
              >
            </div>
            <div v-else class="grid grid-cols-1 gap-2">
              <div
                v-for="symbolInfo in symbolsList"
                :key="symbolInfo.component?.cid || symbolInfo.component?.id"
                class="border rounded p-2 hover:bg-gray-50 group relative"
              >
                <button
                  class="w-full text-left"
                  @click="addSymbolToCanvas(symbolInfo)"
                  :title="symbolInfo.name"
                  :aria-label="symbolInfo.name"
                >
                  <div class="flex items-center justify-between mb-1">
                    <div class="text-xs font-medium text-gray-700 truncate flex-1">
                      {{ symbolInfo.name }}
                    </div>
                    <button
                      type="button"
                      class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded text-red-500"
                      @click.stop="handleDeleteSymbol(symbolInfo)"
                      :title="`Delete ${symbolInfo.name}`"
                    >
                      <Icon icon="lucide:trash-2" class="text-xs" />
                    </button>
                  </div>
                  <div class="text-[10px] text-gray-400">
                    {{ symbolInfo.instanceCount }} instance{{
                      symbolInfo.instanceCount !== 1 ? 's' : ''
                    }}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.blocks-panel-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.blocks-panel-tabs-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.blocks-panel-content {
  padding: 12px;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.blocks-search {
  position: sticky;
  top: -12px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 6px;
  margin: -12px -12px 12px;
  padding: 10px 12px;
  background: #fff;
  border-bottom: 1px solid #edf0f5;
}

.blocks-search__icon {
  flex: none;
  color: #9ca3af;
  font-size: 14px;
}

.blocks-search__input {
  min-width: 0;
  flex: 1;
  height: 30px;
  padding: 0 6px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  color: #374151;
  font-size: 12px;
  line-height: 30px;
  outline: none;
  background: #fff;
}

.blocks-search__input:focus {
  border-color: #93c5fd;
  box-shadow: 0 0 0 2px rgba(147, 197, 253, 0.18);
}

.blocks-search__clear {
  flex: none;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 4px;
  color: #6b7280;
  background: transparent;
  cursor: pointer;
}

.blocks-search__clear:hover {
  color: #111827;
  background: #f3f4f6;
}

.blocks-panel-block__media {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
}

.blocks-panel-block__media :deep(svg),
.blocks-panel-block__media :deep(img) {
  display: block;
  width: 22px;
  height: 22px;
}
</style>
