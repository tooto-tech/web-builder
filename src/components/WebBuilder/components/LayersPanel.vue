<script lang="ts" setup>
import { computed, ref, reactive, provide, onBeforeUnmount, onMounted, shallowRef } from 'vue'
import { Icon } from '@iconify/vue'
import { wbMessage as ElMessage } from '@/components/WebBuilder/utils/wbMessage'
import { useLayerTree } from '@/components/WebBuilder/composables/useLayerTree'
import type { LayerDragContext, LayerNode as LayerNodeType, DropTarget } from '@/components/WebBuilder/composables/useLayerTree'
import useSymbols from '@/components/WebBuilder/composables/useSymbols'
import LayerNode from '@/components/WebBuilder/components/LayerNode.vue'
import { WB_SECTION_TYPE } from '@/components/WebBuilder/components/registries/layout/section'

const props = defineProps<{
  grapes: any
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

// ── Editor ref (provided to child components) ──────────────────────────────

const editorRef = ref<any>(null)
props.grapes.onInit((editor: any) => {
  editorRef.value = editor
})
provide('wbEditor', editorRef)

// ── Layer tree ─────────────────────────────────────────────────────────────

const { layers, selectedId, selectedIds, collapsedIds, selectLayer, renameLayer, toggleVisible, toggleExpand, moveLayer, toggleAll: treeToggleAll } = useLayerTree(props.grapes)

// ── Symbols ────────────────────────────────────────────────────────────────

const symbolsRef = shallowRef<ReturnType<typeof useSymbols> | null>(null)
symbolsRef.value = useSymbols(props.grapes)

// ── Context menu ───────────────────────────────────────────────────────────

const contextMenu = ref<{ visible: boolean; x: number; y: number; node: LayerNodeType | null }>({
  visible: false,
  x: 0,
  y: 0,
  node: null,
})

const closeContextMenu = () => {
  contextMenu.value.visible = false
  contextMenu.value.node = null
}

const isWrapperContextNode = computed(() => !!contextMenu.value.node?.isWrapper)
const copiedComponents = shallowRef<any[]>([])
const clipboardVersion = ref(0)

const CROSS_PAGE_LAYER_CLIPBOARD_KEY = 'wb:layer-clipboard:v1'

type SerializedCssRule = {
  selectors: Array<Record<string, any>>
  style: Record<string, any>
  mediaText?: string
  state?: string
  atRuleType?: string
  selectorsAdd?: string
}

type CrossPageLayerClipboard = {
  version: 1
  createdAt: number
  components: any[]
  cssRules: SerializedCssRule[]
  componentIds?: string[][]
}

const getCssComposer = (editor: any) => editor?.CssComposer || editor?.Css

const getComponentChildren = (component: any): any[] =>
  component?.components?.()?.models ?? component?.get?.('components')?.models ?? []

const getComponentDataChildren = (componentData: any): any[] => {
  const children = componentData?.components
  if (Array.isArray(children)) return children
  if (Array.isArray(children?.models)) return children.models
  return []
}

const getComponentDataId = (componentData: any): string => {
  return `${componentData?.attributes?.id ?? componentData?.id ?? ''}`.trim()
}

const cloneJson = <T,>(value: T): T => JSON.parse(JSON.stringify(value))

const collectComponentIds = (component: any, ids: string[] = []): string[] => {
  const id = `${component?.getId?.() ?? ''}`.trim()
  if (id) ids.push(id)
  getComponentChildren(component).forEach((child) => collectComponentIds(child, ids))
  return ids
}

const readClassList = (value: unknown): string[] =>
  `${value ?? ''}`
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)

const collectComponentClasses = (component: any, classes = new Set<string>()): Set<string> => {
  const rawClasses = component?.getClasses?.() ?? []
  rawClasses.forEach?.((item: any) => {
    const className = `${item?.get?.('name') ?? item?.name ?? item ?? ''}`.trim()
    if (className) classes.add(className)
  })

  readClassList(component?.getAttributes?.()?.class).forEach((className) => classes.add(className))
  getComponentChildren(component).forEach((child) => collectComponentClasses(child, classes))
  return classes
}

const collectComponentDataIds = (componentData: any, ids: string[] = []): string[] => {
  const id = getComponentDataId(componentData)
  if (id) ids.push(id)
  getComponentDataChildren(componentData).forEach((child) => collectComponentDataIds(child, ids))
  return ids
}

const stripComponentDataIds = (componentData: any): any => {
  if (!componentData || typeof componentData !== 'object') return componentData

  delete componentData.id
  if (componentData.attributes && typeof componentData.attributes === 'object') {
    delete componentData.attributes.id
  }

  getComponentDataChildren(componentData).forEach((child) => stripComponentDataIds(child))
  return componentData
}

const serializeComponentForCrossPageClipboard = (component: any): any | null => {
  const data = component?.toJSON?.()
  if (!data) return null
  return stripComponentDataIds(cloneJson(data))
}

const serializeSelector = (selector: any): Record<string, any> => ({
  name: selector?.get?.('name') ?? selector?.name ?? '',
  type: selector?.get?.('type') ?? selector?.type,
  active: selector?.get?.('active') ?? selector?.active ?? true,
  label: selector?.get?.('label') ?? selector?.label ?? '',
})

const serializeCssRule = (rule: any): SerializedCssRule => ({
  selectors: (rule?.get?.('selectors') || []).map((selector: any) => serializeSelector(selector)),
  style: { ...(rule?.get?.('style') ?? {}) },
  mediaText: rule?.get?.('mediaText') ?? '',
  state: rule?.get?.('state') ?? '',
  atRuleType: rule?.get?.('atRuleType') ?? '',
  selectorsAdd: rule?.get?.('selectorsAdd') ?? rule?.selectorsAdd ?? '',
})

const collectCssRulesForComponents = (editor: any, components: any[]): SerializedCssRule[] => {
  const cssComposer = getCssComposer(editor)
  const componentIds = new Set(components.flatMap((component) => collectComponentIds(component)))
  const componentClasses = new Set(
    components.flatMap((component) => Array.from(collectComponentClasses(component))),
  )
  const rules: SerializedCssRule[] = []
  if (!cssComposer || (!componentIds.size && !componentClasses.size)) return rules

  cssComposer.getAll?.()?.each?.((rule: any) => {
    const selectors = rule?.get?.('selectors')
    if (!selectors?.length) return

    const belongsToCopiedComponent = selectors.some((selector: any) => {
      const name = `${selector?.get?.('name') ?? selector?.name ?? ''}`.trim()
      const type = selector?.get?.('type') ?? selector?.type
      return (type === 2 && componentIds.has(name)) || (type !== 2 && componentClasses.has(name))
    })

    if (belongsToCopiedComponent) rules.push(serializeCssRule(rule))
  })

  return rules
}

const readCrossPageClipboard = (): CrossPageLayerClipboard | null => {
  clipboardVersion.value
  try {
    const raw = window.localStorage.getItem(CROSS_PAGE_LAYER_CLIPBOARD_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.version !== 1 || !Array.isArray(parsed?.components)) return null
    return {
      version: 1,
      createdAt: Number(parsed.createdAt || Date.now()),
      components: parsed.components,
      cssRules: Array.isArray(parsed.cssRules) ? parsed.cssRules : [],
      componentIds: Array.isArray(parsed.componentIds) ? parsed.componentIds : [],
    }
  } catch {
    return null
  }
}

const writeCrossPageClipboard = (payload: CrossPageLayerClipboard) => {
  try {
    window.localStorage.setItem(CROSS_PAGE_LAYER_CLIPBOARD_KEY, JSON.stringify(payload))
    clipboardVersion.value += 1
  } catch {
    // 只影响跨页面粘贴，不影响当前页面内存复制
  }
}

const hasCrossPageClipboard = computed(() => !!readCrossPageClipboard()?.components.length)

const getSiblingInsert = (rawModel: any, position: 'after' | 'inside') => {
  if (position === 'inside') {
    const collection = rawModel?.components?.()
    return collection?.add ? { collection, options: {} } : null
  }

  const parent = rawModel?.parent?.()
  const collection = parent?.components?.()
  if (!collection?.add) return null

  const index = (collection.models ?? []).indexOf(rawModel)
  return { collection, options: index >= 0 ? { at: index + 1 } : {} }
}

const insertComponentClone = (sourceModel: any, insert: { collection: any; options: Record<string, any> }) => {
  const editor = editorRef.value
  if (!sourceModel?.clone || !insert?.collection?.add || !editor) return null

  const clone = sourceModel.clone()
  const added = insert.collection.add(clone, insert.options)
  const component = Array.isArray(added) ? added[0] : added
  if (!component) return null

  editor.select?.(component)
  if (typeof insert.options.at === 'number') {
    insert.options.at += 1
  }
  return component
}

const addComponentData = (
  componentData: any,
  insert: { collection: any; options: Record<string, any> },
) => {
  if (!insert?.collection?.add) return null
  const added = insert.collection.add(componentData, insert.options)
  const component = Array.isArray(added) ? added[0] : added
  if (typeof insert.options.at === 'number') {
    insert.options.at += 1
  }
  return component
}

const buildComponentIdMap = (sourceData: any, targetComponent: any): Record<string, string> => {
  const sourceIds = Array.isArray(sourceData?.__wbSourceIds)
    ? sourceData.__wbSourceIds
    : collectComponentDataIds(sourceData)
  const targetIds = collectComponentIds(targetComponent)
  return sourceIds.reduce<Record<string, string>>((acc, sourceId, index) => {
    const targetId = targetIds[index]
    if (sourceId && targetId && sourceId !== targetId) acc[sourceId] = targetId
    return acc
  }, {})
}

const applyStoredCssRules = (
  editor: any,
  cssRules: SerializedCssRule[],
  idMap: Record<string, string>,
) => {
  const cssComposer = getCssComposer(editor)
  if (!cssComposer || !cssRules.length) return

  cssRules.forEach((rule) => {
    const mappedRule = {
      ...rule,
      selectors: (rule.selectors || []).map((selector) => {
        const name = `${selector.name ?? ''}`.trim()
        if (selector.type === 2 && idMap[name]) {
          return { ...selector, name: idMap[name], active: true }
        }
        return selector
      }),
      style: { ...(rule.style ?? {}) },
    }
    cssComposer.addCollection?.([mappedRule], { avoidUpdateStyle: false })
  })
}

const rewriteTokenList = (value: string, idMap: Record<string, string>) =>
  value
    .split(/\s+/)
    .map((token) => idMap[token] || token)
    .join(' ')

const rewriteComponentIdReferences = (component: any, idMap: Record<string, string>) => {
  if (!component || !Object.keys(idMap).length) return

  const attrs = { ...(component.getAttributes?.() || {}) }
  let changed = false

  ;['for', 'aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns', 'list'].forEach(
    (attr) => {
      const value = attrs[attr]
      if (!value) return
      const nextValue = rewriteTokenList(String(value), idMap)
      if (nextValue !== value) {
        attrs[attr] = nextValue
        changed = true
      }
    },
  )

  ;['href', 'xlink:href', 'data-bs-target', 'data-target'].forEach((attr) => {
    const value = String(attrs[attr] || '')
    if (!value.startsWith('#')) return
    const nextId = idMap[value.slice(1)]
    if (nextId) {
      attrs[attr] = `#${nextId}`
      changed = true
    }
  })

  if (changed) component.addAttributes?.(attrs)
  getComponentChildren(component).forEach((child) => rewriteComponentIdReferences(child, idMap))
}

const isComponentAncestor = (ancestor: any, component: any) => {
  let parent = component?.parent?.()
  while (parent) {
    if (parent === ancestor) return true
    parent = parent?.parent?.()
  }
  return false
}

const pruneNestedComponents = (components: any[]) => {
  return components.filter((component) =>
    !components.some((candidate) => candidate !== component && isComponentAncestor(candidate, component))
  )
}

const getContextActionModels = () => {
  const layerNode = contextMenu.value.node
  if (!layerNode || layerNode.isWrapper) return []

  const selectedSet = selectedIds.value
  const selectedModels = selectedSet.has(layerNode.id)
    ? layers.value
      .flatMap(function collect(node: LayerNodeType): any[] {
        const self = selectedSet.has(node.id) && !node.isWrapper ? [node._model] : []
        return [...self, ...node.children.flatMap(collect)]
      })
    : [layerNode._model]

  return pruneNestedComponents(selectedModels.filter(Boolean))
}

const handleAddSection = () => {
  const layerNode = contextMenu.value.node
  const rawModel = layerNode?._model
  const editor = editorRef.value

  if (!rawModel?.append || !editor) {
    closeContextMenu()
    return
  }

  const added = rawModel.append({ type: WB_SECTION_TYPE })
  const section = Array.isArray(added) ? added[0] : added
  if (section) editor.select?.(section)
  closeContextMenu()
}

const handleDuplicate = () => {
  const models = getContextActionModels()

  if (!models.length) {
    closeContextMenu()
    return
  }

  models.forEach((rawModel) => {
    if (!rawModel?.clone) return
    const insert = getSiblingInsert(rawModel, 'after')
    if (insert) insertComponentClone(rawModel, insert)
  })
  closeContextMenu()
}

const handleCopy = () => {
  const models = getContextActionModels()

  if (!models.length || models.some((model) => !model?.clone)) {
    closeContextMenu()
    return
  }

  copiedComponents.value = models
  const serializedComponents = models
    .map((model) => serializeComponentForCrossPageClipboard(model))
    .filter(Boolean)

  writeCrossPageClipboard({
    version: 1,
    createdAt: Date.now(),
    components: serializedComponents,
    cssRules: collectCssRulesForComponents(editorRef.value, models),
    componentIds: models.map((model) => collectComponentIds(model)),
  })
  ElMessage.success(models.length > 1 ? `Copied ${models.length} layers` : 'Copied')
  closeContextMenu()
}

const canPasteToContextNode = computed(() => {
  const layerNode = contextMenu.value.node
  const rawModel = layerNode?._model
  if ((!copiedComponents.value.length && !hasCrossPageClipboard.value) || !rawModel) return false
  if (layerNode?.isWrapper) return !!rawModel.components?.()?.add
  return !!rawModel.parent?.()?.components?.()?.add
})

const handlePaste = () => {
  const layerNode = contextMenu.value.node
  const rawModel = layerNode?._model
  const sources = copiedComponents.value
  const crossPageClipboard = readCrossPageClipboard()

  if ((!sources.length && !crossPageClipboard?.components.length) || !rawModel || !canPasteToContextNode.value) {
    closeContextMenu()
    return
  }

  const insert = layerNode?.isWrapper
    ? getSiblingInsert(rawModel, 'inside')
    : getSiblingInsert(rawModel, 'after')

  if (insert) {
    if (crossPageClipboard?.components.length) {
      const editor = editorRef.value
      crossPageClipboard.components.forEach((componentData, componentIndex) => {
        const sourceData = {
          ...componentData,
          __wbSourceIds: crossPageClipboard.componentIds?.[componentIndex] || [],
        }
        const added = addComponentData(cloneJson(componentData), insert)
        if (!added) return
        const idMap = buildComponentIdMap(sourceData, added)
        rewriteComponentIdReferences(added, idMap)
        applyStoredCssRules(
          editor,
          crossPageClipboard.cssRules,
          idMap,
        )
        editor?.select?.(added)
      })
    } else if (sources.length) {
      sources.forEach((source) => {
        insertComponentClone(source, insert)
      })
    }
  }
  closeContextMenu()
}

const handleDelete = () => {
  const models = getContextActionModels()
  if (!models.length) {
    closeContextMenu()
    return
  }

  models.forEach((model) => model?.remove?.())
  closeContextMenu()
}

const handleCreateSymbol = async () => {
  const layerNode = contextMenu.value.node
  if (!layerNode || layerNode.isWrapper || !symbolsRef.value) {
    closeContextMenu()
    return
  }

  let component = layerNode._model
  if (!component || (!component.cid && !component.toJSON && !component.get)) {
    ElMessage.error('Unable to get component object')
    closeContextMenu()
    return
  }

  await symbolsRef.value.createSymbol(component)
  closeContextMenu()
}

// ── Expand / collapse all ──────────────────────────────────────────────────

const expandableIds = computed(() => {
  const ids: string[] = []
  const walk = (nodes: LayerNodeType[]) => {
    for (const node of nodes) {
      if (node.hasChildren) ids.push(node.id)
      walk(node.children)
    }
  }
  walk(layers.value)
  return ids
})

const allExpanded = computed(() =>
  expandableIds.value.length > 0 &&
  expandableIds.value.every((id) => !collapsedIds.value.has(id))
)

const toggleAll = () => {
  treeToggleAll(!allExpanded.value)
}

// ── Drag state ─────────────────────────────────────────────────────────────

const dragState = reactive<{ draggingId: string | null; dropTarget: DropTarget | null }>({
  draggingId: null,
  dropTarget: null,
})

function setTransparentDragImage(e: DragEvent) {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  e.dataTransfer?.setDragImage(canvas, 0, 0)
}

function onDragStart(e: DragEvent, id: string) {
  if (!e.dataTransfer) return
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', id)
  setTransparentDragImage(e)
  dragState.draggingId = id
}

function onDragOver(e: DragEvent, node: LayerNodeType) {
  if (!e.dataTransfer) return
  e.dataTransfer.dropEffect = 'move'

  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const ratio = (e.clientY - rect.top) / rect.height

  let position: 'before' | 'after' | 'inside'
  if (node.isWrapper) {
    position = 'inside'
  } else if (node.hasChildren && ratio > 0.25 && ratio < 0.75) {
    position = 'inside'
  } else if (ratio < 0.5) {
    position = 'before'
  } else {
    position = 'after'
  }

  dragState.dropTarget = { id: node.id, position }
}

function onDrop(targetId: string) {
  if (!dragState.draggingId || !dragState.dropTarget) return
  if (dragState.dropTarget.id !== targetId) return
  moveLayer(dragState.draggingId, targetId, dragState.dropTarget.position)
  onDragEnd()
}

function onDragEnd() {
  dragState.draggingId = null
  dragState.dropTarget = null
}

// ── Provide context to all descendant LayerNode components ─────────────────

const ctx: LayerDragContext = {
  selectedId,
  selectedIds,
  collapsedIds,
  dragState,
  selectLayer,
  renameLayer,
  toggleVisible,
  toggleExpand,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onContextMenu: (e: MouseEvent, node: LayerNodeType) => {
    clipboardVersion.value += 1
    if (!node.isWrapper && !selectedIds.value.has(node.id)) {
      selectLayer(node.id)
    }
    contextMenu.value = { visible: true, x: e.clientX, y: e.clientY, node }
  },
}

provide('layerDrag', ctx)

// ── Floating panel drag ────────────────────────────────────────────────────

const panelRef = ref<HTMLElement | null>(null)
const panelEl = ref<HTMLElement | null>(null)
const pos = ref({ x: 0, y: 100 })
const panelWidth = 256
const panelRight = 30
const panelDragging = ref(false)
let panelDragOffset = { x: 0, y: 0 }

const clampPanelPosition = (x: number, y: number) => {
  const panelHeight = panelRef.value?.offsetHeight ?? 380
  return {
    x: Math.max(0, Math.min(window.innerWidth - panelWidth, x)),
    y: Math.max(0, Math.min(window.innerHeight - panelHeight, y)),
  }
}

const updateDefaultPos = () => {
  pos.value = clampPanelPosition(
    window.innerWidth - panelWidth - panelRight,
    Math.min(pos.value.y || 100, window.innerHeight - (panelRef.value?.offsetHeight ?? 380)),
  )
}

const onPanelDragMove = (event: MouseEvent) => {
  if (!panelDragging.value) return
  pos.value = clampPanelPosition(
    event.clientX - panelDragOffset.x,
    event.clientY - panelDragOffset.y,
  )
}

const onPanelDragEnd = () => {
  panelDragging.value = false
  document.removeEventListener('mousemove', onPanelDragMove)
  document.removeEventListener('mouseup', onPanelDragEnd)
  document.body.style.userSelect = ''
}

const onPanelDragStart = (event: MouseEvent) => {
  if (event.button !== 0) return

  const rect = panelRef.value?.getBoundingClientRect()
  if (!rect) return

  panelDragging.value = true
  panelDragOffset = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }

  document.addEventListener('mousemove', onPanelDragMove)
  document.addEventListener('mouseup', onPanelDragEnd)
  document.body.style.userSelect = 'none'
  event.preventDefault()
}

onMounted(() => {
  updateDefaultPos()
  window.addEventListener('resize', updateDefaultPos)
  window.addEventListener('click', closeContextMenu)
  window.addEventListener('storage', onClipboardStorageChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDefaultPos)
  window.removeEventListener('click', closeContextMenu)
  window.removeEventListener('storage', onClipboardStorageChange)
  onPanelDragEnd()
})

const onClipboardStorageChange = (event: StorageEvent) => {
  if (event.key === CROSS_PAGE_LAYER_CLIPBOARD_KEY) {
    clipboardVersion.value += 1
  }
}

const onPanelDragLeave = (e: DragEvent) => {
  const el = panelEl.value
  if (!el) return
  if (!e.relatedTarget || !el.contains(e.relatedTarget as Node)) {
    dragState.dropTarget = null
  }
}
</script>

<template>
  <div>
    <div
      v-if="panelDragging"
      class="fixed inset-0 z-20 cursor-move"
      @mousemove="onPanelDragMove"
      @mouseup="onPanelDragEnd"
    ></div>

    <!-- Floating panel -->
    <div
      ref="panelRef"
      class="fixed w-64 bg-white/80 backdrop-blur-[5px] border rounded shadow z-30"
      :style="{ left: `${pos.x}px`, top: `${pos.y}px` }"
    >
      <!-- Header -->
      <div
        class="px-3 py-2 border-b text-sm font-medium text-gray-700 grid grid-cols-[1fr_auto_1fr] items-center gap-2 cursor-move select-none"
        @mousedown="onPanelDragStart"
      >
        <button
          type="button"
          class="size-5 border flex items-center justify-center rounded hover:bg-gray-50"
          :aria-label="allExpanded ? 'Collapse all' : 'Expand all'"
          @click="toggleAll"
        >
          <Icon
            icon="icon-park-solid:right-one"
            class="transition-transform duration-200"
            :class="{ 'rotate-90': allExpanded }"
          />
        </button>
        <span>Layers</span>
        <button
          type="button"
          class="size-5 justify-self-end flex items-center justify-center rounded hover:bg-gray-50"
          @click.stop="emit('close')"
          @mousedown.stop
        >
          <Icon icon="uiw:close" class="text-xs" />
        </button>
      </div>

      <!-- Tree -->
      <div
        ref="panelEl"
        class="h-80 overflow-y-auto overflow-x-hidden py-1 px-1"
        @dragleave="onPanelDragLeave"
      >
        <div v-if="layers.length === 0" class="flex flex-col items-center justify-center h-full gap-2 text-gray-400 text-[11px]">
          <Icon icon="lucide:layers" class="w-7 h-7 opacity-40" />
          <span>No components yet</span>
        </div>
        <LayerNode
          v-for="node in layers"
          :key="node.id"
          :node="node"
          :depth="0"
        />
      </div>
    </div>

    <!-- Context menu -->
    <div
      v-show="contextMenu.visible"
      class="fixed z-40 bg-white border rounded shadow text-xs min-w-[120px]"
      :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
      @click.stop
    >
      <button
        v-if="isWrapperContextNode"
        class="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
        @click="handleAddSection"
      >
        <Icon icon="lucide:plus" class="text-xs" />
        <span>Add Section</span>
      </button>
      <button
        v-if="!isWrapperContextNode"
        class="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
        @click="handleDuplicate"
      >
        <Icon icon="lucide:copy-plus" class="text-xs" />
        <span>Duplicate</span>
      </button>
      <button
        v-if="!isWrapperContextNode"
        class="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
        @click="handleCopy"
      >
        <Icon icon="lucide:copy" class="text-xs" />
        <span>Copy</span>
      </button>
      <button
        class="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
        :disabled="!canPasteToContextNode"
        @click="handlePaste"
      >
        <Icon icon="lucide:clipboard-paste" class="text-xs" />
        <span>Paste</span>
      </button>
      <button
        v-if="!isWrapperContextNode"
        class="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
        @click="handleCreateSymbol"
      >
        <Icon icon="lucide:layers" class="text-xs" />
        <span>Create Symbol</span>
      </button>
      <button
        v-if="!isWrapperContextNode"
        class="w-full text-left px-3 py-2 hover:bg-gray-50 text-red-600 flex items-center gap-2"
        @click="handleDelete"
      >
        <Icon icon="lucide:trash-2" class="text-xs" />
        <span>Delete</span>
      </button>
    </div>
  </div>
</template>
