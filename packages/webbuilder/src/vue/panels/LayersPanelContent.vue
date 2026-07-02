<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import type { Component } from 'grapesjs'
import { ElTree } from 'element-plus'
import { Icon } from '@iconify/vue'
import { useEditor } from '@tootix/grapesjs-vue'

/*
 * IMPORTANT: GrapesJS Component instances must never enter Vue reactivity.
 * A Component is a Backbone model holding the whole editor graph (em, views,
 * collections); deep-proxying it freezes the page. Tree nodes therefore carry
 * scalars only, and components are resolved through a plain (non-reactive)
 * id -> Component map rebuilt on every refresh.
 */
interface LayerNode {
  id: string
  label: string
  visible: boolean
  locked: boolean
  children: LayerNode[]
}

type DropPosition = 'prev' | 'inner' | 'next' | 'before' | 'after'

const props = defineProps<{
  root: Component
}>()

const editor = useEditor()
const layers = editor.Layers

const treeData = shallowRef<LayerNode[]>([])
const expandedIds = shallowRef<string[]>([])
const selectedIds = shallowRef(new Set<string>())
const hoveredId = ref('')
const editingId = ref('')
const editingName = ref('')

let componentsById = new Map<string, Component>()

const componentOf = (node: LayerNode) => componentsById.get(node.id)

const buildNodes = (
  component: Component,
  expanded: string[],
  selected: Set<string>,
  byId: Map<string, Component>,
): LayerNode[] =>
  layers.getComponents(component).map((child) => {
    const data = layers.getLayerData(child)
    byId.set(child.cid, child)
    if (data.open) expanded.push(child.cid)
    if (data.selected) selected.add(child.cid)
    return {
      id: child.cid,
      label: data.name,
      visible: data.visible,
      locked: data.locked,
      children: buildNodes(child, expanded, selected, byId),
    }
  })

const refresh = () => {
  const expanded: string[] = []
  const selected = new Set<string>()
  const byId = new Map<string, Component>()
  treeData.value = buildNodes(props.root, expanded, selected, byId)
  componentsById = byId
  expandedIds.value = expanded
  selectedIds.value = selected
}

let refreshQueued = false
const scheduleRefresh = () => {
  if (refreshQueued) return
  refreshQueued = true
  requestAnimationFrame(() => {
    refreshQueued = false
    refresh()
  })
}

const onCanvasHover = (component?: Component) => {
  hoveredId.value = component?.cid ?? ''
}

const REFRESH_EVENTS = [
  'layer:component',
  'component:add',
  'component:remove',
  'component:selected',
  'component:deselected',
] as const

onMounted(() => {
  REFRESH_EVENTS.forEach(event => editor.on(event, scheduleRefresh))
  editor.on('component:hover', onCanvasHover)
  refresh()
})

onBeforeUnmount(() => {
  REFRESH_EVENTS.forEach(event => editor.off(event, scheduleRefresh))
  editor.off('component:hover', onCanvasHover)
})

watch(() => props.root, refresh)

const selectLayer = (node: LayerNode, event: MouseEvent) => {
  const component = componentOf(node)
  if (!component) return
  if (event.ctrlKey || event.metaKey) {
    editor.selectToggle(component)
  } else {
    editor.select(component)
  }
}

const setHovered = (node: LayerNode, hovered: boolean) => {
  const component = componentOf(node)
  if (component) layers.setLayerData(component, { hovered })
}

const toggleVisible = (node: LayerNode) => {
  const component = componentOf(node)
  if (component) layers.setVisible(component, !node.visible)
}

const toggleLocked = (node: LayerNode) => {
  const component = componentOf(node)
  if (component) layers.setLocked(component, !node.locked)
}

let renameInputEl: HTMLInputElement | null = null
const setRenameInput = (el: unknown) => {
  renameInputEl = (el as HTMLInputElement | null) ?? null
}

const startRename = (node: LayerNode) => {
  editingId.value = node.id
  editingName.value = node.label
  void nextTick(() => {
    renameInputEl?.focus()
    renameInputEl?.select()
  })
}

const commitRename = (node: LayerNode) => {
  if (editingId.value !== node.id) return
  const name = editingName.value.trim()
  const component = componentOf(node)
  if (component && name && name !== node.label) {
    layers.setName(component, name)
  }
  editingId.value = ''
}

const cancelRename = () => {
  editingId.value = ''
}

/*
 * el-tree drop positions map onto GrapesJS moves against the raw child
 * collection: `at` counts every child (text nodes included), so indices come
 * from component.index()/components().length rather than the layer tree.
 */
/* el-tree 回调的 Node 形参与本地结构类型不兼容，参数放宽后在入口处收窄 */
type ElTreeNode = { data: LayerNode }

const resolveDropTarget = (dropNode: ElTreeNode, type: DropPosition) => {
  const dropComponent = componentOf(dropNode.data)
  if (!dropComponent) return null
  if (type === 'inner') {
    return { target: dropComponent, index: dropComponent.components().length }
  }
  const target = dropComponent.parent()
  if (!target) return null
  const index = dropComponent.index()
  return {
    target,
    index: type === 'prev' || type === 'before' ? index : index + 1,
  }
}

const allowDrag = (node: any) =>
  componentOf((node as ElTreeNode).data)?.get('draggable') !== false

const allowDrop = (draggingNode: any, dropNode: any, type: DropPosition) => {
  const source = componentOf((draggingNode as ElTreeNode).data)
  const resolved = resolveDropTarget(dropNode as ElTreeNode, type)
  if (!source || !resolved) return false
  return editor.Components.canMove(resolved.target, source, resolved.index).result
}

const onNodeDrop = (draggingNode: any, dropNode: any, type: DropPosition) => {
  const source = componentOf((draggingNode as ElTreeNode).data)
  const resolved = resolveDropTarget(dropNode as ElTreeNode, type)
  if (!source || !resolved || !editor.Components.canMove(resolved.target, source, resolved.index).result) {
    scheduleRefresh()
    return
  }
  source.move(resolved.target, { at: resolved.index })
  scheduleRefresh()
}

const onNodeExpand = (data: LayerNode) => {
  const component = componentOf(data)
  if (component) layers.setOpen(component, true)
}
const onNodeCollapse = (data: LayerNode) => {
  const component = componentOf(data)
  if (component) layers.setOpen(component, false)
}
</script>

<template>
  <div class="wb-layers-panel" data-testid="wb-layers-panel">
    <ElTree
      class="wb-layers-tree"
      :data="treeData"
      node-key="id"
      :props="{ label: 'label', children: 'children' }"
      :default-expanded-keys="expandedIds"
      :expand-on-click-node="false"
      draggable
      :allow-drag="allowDrag"
      :allow-drop="allowDrop"
      empty-text="No layers are available."
      @node-expand="onNodeExpand"
      @node-collapse="onNodeCollapse"
      @node-drop="onNodeDrop"
    >
      <template #default="{ data }">
        <div
          class="wb-layers-node"
          :class="{
            'is-selected': selectedIds.has(data.id),
            'is-hovered': hoveredId === data.id,
            'is-hidden': !data.visible,
            'is-locked': data.locked,
          }"
          @click="selectLayer(data, $event)"
          @dblclick.stop="startRename(data)"
          @mouseenter="setHovered(data, true)"
          @mouseleave="setHovered(data, false)"
        >
          <input
            v-if="editingId === data.id"
            :ref="setRenameInput"
            v-model="editingName"
            class="wb-layers-node__rename"
            @click.stop
            @dblclick.stop
            @blur="commitRename(data)"
            @keydown.enter.prevent="commitRename(data)"
            @keydown.esc.prevent="cancelRename"
          />
          <span v-else class="wb-layers-node__label" :title="data.label">{{ data.label }}</span>
          <span class="wb-layers-node__actions" @click.stop @dblclick.stop>
            <button
              type="button"
              class="wb-layers-node__action"
              :class="{ 'is-active': !data.visible }"
              :aria-label="data.visible ? 'Hide layer' : 'Show layer'"
              :aria-pressed="!data.visible"
              @click="toggleVisible(data)"
            >
              <Icon :icon="data.visible ? 'mdi:eye-outline' : 'mdi:eye-off-outline'" />
            </button>
            <button
              type="button"
              class="wb-layers-node__action"
              :class="{ 'is-active': data.locked }"
              :aria-label="data.locked ? 'Unlock layer' : 'Lock layer'"
              :aria-pressed="data.locked"
              @click="toggleLocked(data)"
            >
              <Icon :icon="data.locked ? 'mdi:lock-outline' : 'mdi:lock-open-variant-outline'" />
            </button>
          </span>
        </div>
      </template>
    </ElTree>
  </div>
</template>

<style scoped>
.wb-layers-panel {
  min-height: 100%;
  padding: 8px;
  color: #111827;
  background: #fff;
}

.wb-layers-tree {
  --el-tree-node-hover-bg-color: #f3f4f6;
  background: transparent;
  font-size: 12px;
  color: #374151;
}

.wb-layers-tree :deep(.el-tree-node__content) {
  height: 28px;
  border-radius: 4px;
}

.wb-layers-tree :deep(.el-tree-node__content:has(.wb-layers-node.is-hovered)) {
  background: #f3f4f6;
}

.wb-layers-tree :deep(.el-tree-node__content:has(.wb-layers-node.is-selected)) {
  background: #eff6ff;
  color: #1d4ed8;
}

.wb-layers-tree :deep(.el-tree__drop-indicator) {
  background-color: var(--wb-accent, #3b82f6);
}

.wb-layers-node {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 4px;
  min-width: 0;
  height: 100%;
  padding-right: 4px;
}

.wb-layers-node.is-hidden {
  opacity: 0.5;
}

.wb-layers-node__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wb-layers-node__rename {
  flex: 1;
  min-width: 0;
  height: 20px;
  border: 1px solid #2563eb;
  border-radius: 3px;
  padding: 0 4px;
  color: inherit;
  background: #fff;
  font: inherit;
  outline: none;
}

.wb-layers-node__actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.wb-layers-node__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: 0;
  border-radius: 3px;
  padding: 0;
  color: #6b7280;
  background: transparent;
  font-size: 13px;
  visibility: hidden;
  cursor: pointer;
}

.wb-layers-node:hover .wb-layers-node__action,
.wb-layers-node__action.is-active {
  visibility: visible;
}

.wb-layers-node__action:hover {
  color: #111827;
  background: #e5e7eb;
}
</style>
