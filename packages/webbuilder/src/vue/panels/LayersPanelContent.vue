<script setup lang="ts">
import { computed, h, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import type { Component } from 'grapesjs'
import { NTree } from 'naive-ui'
import type { TreeDropInfo, TreeOption } from 'naive-ui'
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
  children?: LayerNode[]
}

type NaiveDropPosition = 'before' | 'inside' | 'after'

const props = defineProps<{
  root: Component
}>()

const editor = useEditor()
const layers = editor.Layers

const treeData = shallowRef<LayerNode[]>([])
const treeOptions = computed(() => treeData.value as unknown as TreeOption[])
const expandedIds = shallowRef<string[]>([])
const selectedIds = shallowRef(new Set<string>())
const selectedKeys = computed(() => Array.from(selectedIds.value))
const hoveredId = ref('')
const editingId = ref('')
const editingName = ref('')

let componentsById = new Map<string, Component>()

const componentOf = (node?: LayerNode | null) =>
  node ? componentsById.get(node.id) : undefined

const toLayerNode = (node: TreeOption | null | undefined): LayerNode | null =>
  node ? node as unknown as LayerNode : null

const buildNode = (
  component: Component,
  expanded: string[],
  selected: Set<string>,
  byId: Map<string, Component>,
  forceOpen = false,
): LayerNode => {
  const data = layers.getLayerData(component)
  byId.set(component.cid, component)
  if (data.selected) selected.add(component.cid)
  const children = buildNodes(component, expanded, selected, byId)
  if ((forceOpen || data.open) && children.length) expanded.push(component.cid)

  return {
    id: component.cid,
    label: data.name || 'Root',
    visible: data.visible,
    locked: data.locked,
    ...(children.length ? { children } : {}),
  }
}

const buildNodes = (
  component: Component,
  expanded: string[],
  selected: Set<string>,
  byId: Map<string, Component>,
): LayerNode[] =>
  layers.getComponents(component).map(child => buildNode(child, expanded, selected, byId))

const refresh = () => {
  const expanded: string[] = []
  const selected = new Set<string>()
  const byId = new Map<string, Component>()
  treeData.value = [buildNode(props.root, expanded, selected, byId, true)]
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
 * Tree drop positions map onto GrapesJS moves against the raw child
 * collection: `at` counts every child (text nodes included), so indices come
 * from component.index()/components().length rather than the layer tree.
 */
const resolveDropTarget = (dropNode: LayerNode, type: NaiveDropPosition) => {
  const dropComponent = componentOf(dropNode)
  if (!dropComponent) return null
  if (type === 'inside') {
    return { target: dropComponent, index: dropComponent.components().length }
  }
  const target = dropComponent.parent()
  if (!target) return null
  const index = dropComponent.index()
  return {
    target,
    index: type === 'before' ? index : index + 1,
  }
}

const allowDrop = (info: { node: TreeOption, dropPosition: NaiveDropPosition }) => {
  const dropNode = toLayerNode(info.node)
  const resolved = dropNode ? resolveDropTarget(dropNode, info.dropPosition) : null
  return Boolean(resolved)
}

const onNodeDrop = ({ dragNode, node, dropPosition }: TreeDropInfo) => {
  const source = componentOf(toLayerNode(dragNode))
  const dropNode = toLayerNode(node)
  const resolved = dropNode ? resolveDropTarget(dropNode, dropPosition) : null
  if (!source || !resolved || !editor.Components.canMove(resolved.target, source, resolved.index).result) {
    scheduleRefresh()
    return
  }
  source.move(resolved.target, { at: resolved.index })
  scheduleRefresh()
}

const onExpandedKeysUpdate = (
  keys: Array<string | number>,
  _options: Array<TreeOption | null>,
  meta: { node: TreeOption, action: 'expand' | 'collapse' } | { node: null, action: 'filter' },
) => {
  expandedIds.value = keys.map(String)
  const component = componentOf(toLayerNode(meta.node))
  if (component && meta.action !== 'filter') {
    layers.setOpen(component, meta.action === 'expand')
  }
}

const stopTreeNodeEvent = (event: Event) => event.stopPropagation()

const renderLayerLabel = ({ option }: { option: TreeOption }) => {
  const data = toLayerNode(option)
  if (!data) return null
  const isRenaming = editingId.value === data.id

  return h(
    'div',
    {
      class: [
        'wb-layers-node',
        {
          'is-selected': selectedIds.value.has(data.id),
          'is-hovered': hoveredId.value === data.id,
          'is-hidden': !data.visible,
          'is-locked': data.locked,
        },
      ],
      onClick: (event: MouseEvent) => selectLayer(data, event),
      onDblclick: (event: MouseEvent) => {
        event.stopPropagation()
        startRename(data)
      },
      onMouseenter: () => setHovered(data, true),
      onMouseleave: () => setHovered(data, false),
    },
    [
      isRenaming
        ? h('input', {
          ref: setRenameInput,
          value: editingName.value,
          class: 'wb-layers-node__rename',
          onClick: stopTreeNodeEvent,
          onDblclick: stopTreeNodeEvent,
          onInput: (event: Event) => {
            editingName.value = (event.target as HTMLInputElement).value
          },
          onBlur: () => commitRename(data),
          onKeydown: (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commitRename(data)
            }
            if (event.key === 'Escape') {
              event.preventDefault()
              cancelRename()
            }
          },
        })
        : h('span', {
          class: 'wb-layers-node__label',
          title: data.label,
        }, data.label),
      h('span', {
        class: 'wb-layers-node__actions',
        onClick: stopTreeNodeEvent,
        onDblclick: stopTreeNodeEvent,
      }, [
        h('button', {
          type: 'button',
          class: [
            'wb-layers-node__action',
            { 'is-active': !data.visible },
          ],
          'aria-label': data.visible ? 'Hide layer' : 'Show layer',
          'aria-pressed': !data.visible,
          onClick: () => toggleVisible(data),
        }, [
          h(Icon, { icon: data.visible ? 'mdi:eye-outline' : 'mdi:eye-off-outline' }),
        ]),
        h('button', {
          type: 'button',
          class: [
            'wb-layers-node__action',
            { 'is-active': data.locked },
          ],
          'aria-label': data.locked ? 'Unlock layer' : 'Lock layer',
          'aria-pressed': data.locked,
          onClick: () => toggleLocked(data),
        }, [
          h(Icon, { icon: data.locked ? 'mdi:lock-outline' : 'mdi:lock-open-variant-outline' }),
        ]),
      ]),
    ],
  )
}
</script>

<template>
  <div class="wb-layers-panel" data-testid="wb-layers-panel">
    <NTree
      class="wb-layers-tree"
      :data="treeOptions"
      key-field="id"
      label-field="label"
      children-field="children"
      :expanded-keys="expandedIds"
      :selected-keys="selectedKeys"
      :expand-on-click="false"
      :selectable="false"
      draggable
      block-line
      :allow-drop="allowDrop"
      :render-label="renderLayerLabel"
      empty-text="No layers are available."
      @update:expanded-keys="onExpandedKeysUpdate"
      @drop="onNodeDrop"
    />
  </div>
</template>

<style scoped>
.wb-layers-panel {
  min-height: 100%;
  padding: 10px 8px;
  color: #111827;
  background: #fff;
}

.wb-layers-tree {
  background: transparent;
  font-size: 13px;
  color: #374151;
}
.wb-layers-panel :deep(.n-tree .n-tree-node-wrapper){
  --n-node-wrapper-padding: 0;
}

.wb-layers-tree :deep(.n-tree-node) {

}

.wb-layers-tree :deep(.n-tree-node-switcher) {
  width: 20px;
  height: auto;
  color: #64748b;
}

.wb-layers-tree :deep(.n-tree-node-switcher--hide) {
  visibility: hidden;
}

.wb-layers-tree :deep(.n-tree-node-content) {
  height: auto;
  min-width: 0;
  border-radius: 5px;
}

.wb-layers-tree :deep(.n-tree-node-content:has(.wb-layers-node.is-hovered)) {
  background: #f1f5f9;
}

.wb-layers-tree :deep(.n-tree-node-content:has(.wb-layers-node.is-selected)) {
  background: #eff6ff;
  color: #1d4ed8;
}

.wb-layers-tree :deep(.n-tree-node-content__text) {
  min-width: 0;
  flex: 1;
}

.wb-layers-node {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  flex: 1;
  align-items: center;
  gap: 8px;
  min-width: 0;
  height: 100%;
  padding: 0 6px 0 4px;
}

.wb-layers-node.is-hidden {
  opacity: 0.55;
}

.wb-layers-node__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1f2937;
  line-height: 18px;
}

.wb-layers-node__rename {
  width: 100%;
  min-width: 0;
  height: 22px;
  border: 1px solid #2563eb;
  border-radius: 4px;
  padding: 0 6px;
  color: inherit;
  background: #fff;
  font: inherit;
  outline: none;
}

.wb-layers-node__actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  width: 48px;
  opacity: 0.72;
  transition: opacity 0.12s ease;
}
.wb-layers-panel :deep(.wb-layers-node){
  display: flex;
  font-size: 12px;
}
.wb-layers-panel :deep(.wb-layers-node__actions){
  margin-inline-start: auto;
  display: flex;
  gap: 6px;
}
.wb-layers-node__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 4px;
  padding: 0;
  color: #64748b;
  background: transparent;
  font-size: 14px;
  visibility: visible;
  cursor: pointer;
  margin-inline-start: auto;
}

.wb-layers-node:hover .wb-layers-node__actions,
.wb-layers-node.is-selected .wb-layers-node__actions {
  opacity: 1;
}

.wb-layers-node__action.is-active {
  color: #2563eb;
  background: #dbeafe;
}

.wb-layers-node__action:hover {
  color: #111827;
  background: #e2e8f0;
}
</style>
