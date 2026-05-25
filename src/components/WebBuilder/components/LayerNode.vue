<template>
  <div class="flex flex-col">
    <!-- Row -->
    <div
      ref="rowEl"
      class="layer-row"
      :class="{
        'is-selected': ctx.selectedIds.value.has(node.id),
        'is-hidden': !node.visible,
        'is-dragging': ctx.dragState.draggingId === node.id,
        'drop-before': ctx.dragState.dropTarget?.id === node.id && ctx.dragState.dropTarget.position === 'before',
        'drop-inside': ctx.dragState.dropTarget?.id === node.id && ctx.dragState.dropTarget.position === 'inside',
        'drop-after':  ctx.dragState.dropTarget?.id === node.id && ctx.dragState.dropTarget.position === 'after',
      }"
      :style="{ paddingLeft: `${8 + depth * 14}px` }"
      :draggable="!isRenaming && !node.isWrapper"
      @click="ctx.selectLayer(node.id, $event)"
      @dblclick.stop="startRename"
      @contextmenu.prevent.stop="ctx.onContextMenu($event, node)"
      @dragstart.stop="ctx.onDragStart($event, node.id)"
      @dragover.prevent.stop="ctx.onDragOver($event, node)"
      @drop.prevent.stop="ctx.onDrop(node.id)"
      @dragend.stop="ctx.onDragEnd()"
    >
      <!-- Expand toggle -->
      <button
        v-if="node.hasChildren"
        class="layer-btn layer-expand"
        :class="{ 'is-expanded': !ctx.collapsedIds.value.has(node.id) }"
        title="Expand/collapse"
        @click.stop="ctx.toggleExpand(node.id)"
        @dblclick.stop
      >
        <Icon icon="lucide:chevron-right" class="w-[11px] h-[11px]" />
      </button>
      <span v-else class="layer-expand-spacer"></span>

      <!-- Type icon -->
      <span class="layer-icon">
        <Icon :icon="typeIcon" class="w-3 h-3" />
      </span>

      <!-- Label -->
      <input
        v-if="isRenaming"
        ref="renameInput"
        v-model="renameValue"
        class="layer-rename-input"
        @click.stop
        @dblclick.stop
        @keydown.enter.prevent.stop="saveRename"
        @keydown.esc.prevent.stop="cancelRename"
        @blur="saveRename"
      />
      <span v-else class="layer-label">{{ node.label }}</span>

      <!-- Visibility toggle -->
      <button
        v-if="!node.isWrapper"
        class="layer-btn layer-eye"
        :class="{ 'is-always-visible': !node.visible }"
        :title="node.visible ? 'Hide' : 'Show'"
        @click.stop="ctx.toggleVisible(node.id)"
        @dblclick.stop
      >
        <Icon :icon="node.visible ? 'lucide:eye' : 'lucide:eye-off'" class="w-[11px] h-[11px]" />
      </button>
      <span v-else class="layer-eye-spacer"></span>
    </div>

    <!-- Children (recursive) -->
    <div v-if="node.hasChildren && !ctx.collapsedIds.value.has(node.id)" class="layer-children">
      <LayerNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import type { LayerNode as LayerNodeType, LayerDragContext } from '@/components/WebBuilder/composables/useLayerTree'

const props = defineProps<{
  node: LayerNodeType
  depth: number
}>()

const ctx = inject<LayerDragContext>('layerDrag')!
const rowEl = ref<HTMLElement | null>(null)
const renameInput = ref<HTMLInputElement | null>(null)
const isRenaming = ref(false)
const renameValue = ref(props.node.label)

// When this node becomes selected (canvas → layer tree sync), scroll it into view
watch(
  () => ctx.selectedId.value === props.node.id,
  (isSelected) => {
    if (isSelected) {
      nextTick(() => rowEl.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
    }
  },
)

watch(
  () => props.node.label,
  (label) => {
    if (!isRenaming.value) renameValue.value = label
  }
)

const startRename = async () => {
  if (props.node.isWrapper) return
  isRenaming.value = true
  renameValue.value = props.node.label
  await nextTick()
  renameInput.value?.focus()
  renameInput.value?.select()
}

const cancelRename = () => {
  isRenaming.value = false
  renameValue.value = props.node.label
}

const saveRename = () => {
  if (!isRenaming.value) return
  const nextName = renameValue.value.trim()
  if (nextName && nextName !== props.node.label) {
    ctx.renameLayer(props.node.id, nextName)
  }
  isRenaming.value = false
  renameValue.value = nextName || props.node.label
}

const typeIcon = computed((): string => {
  const { type, tagName: tag } = props.node
  if (props.node.isWrapper)
    return 'lucide:box'
  if (type === 'text' || tag === 'p' || tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6' || tag === 'span')
    return 'lucide:type'
  if (type === 'image' || tag === 'img')
    return 'lucide:image'
  if (type === 'link' || tag === 'a')
    return 'lucide:link'
  if (type === 'video' || tag === 'video')
    return 'lucide:video'
  if (tag === 'button' || tag === 'input')
    return 'lucide:rectangle-horizontal'
  if (tag === 'section' || tag === 'article' || tag === 'main' || tag === 'header' || tag === 'footer' || tag === 'nav')
    return 'lucide:layout-panel-top'
  return 'lucide:square-dashed'
})
</script>

<style scoped>
.layer-row {
  display: flex;
  align-items: center;
  height: 26px;
  gap: 2px;
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  padding-right: 4px;
  user-select: none;
}
.layer-row:hover {
  background: #f5f5f5;
}
.layer-row.is-selected {
  background: #eff6ff;
  color: #1d4ed8;
}
.layer-row.is-hidden {
  opacity: 0.45;
}
.layer-row.is-dragging {
  opacity: 0.4;
}

/* Drop indicators */
.layer-row.drop-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: #3b82f6;
  border-radius: 1px;
  pointer-events: none;
}
.layer-row.drop-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: #3b82f6;
  border-radius: 1px;
  pointer-events: none;
}
.layer-row.drop-inside {
  outline: 2px solid #3b82f6;
  outline-offset: -1px;
}

.layer-btn {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  border: none;
  background: transparent;
  flex-shrink: 0;
  cursor: pointer;
  color: inherit;
}
.layer-btn:hover {
  background: #e5e7eb;
}

.layer-expand :deep(svg) {
  transition: transform 150ms ease;
}
.layer-expand.is-expanded :deep(svg) {
  transform: rotate(90deg);
}

.layer-expand-spacer {
  width: 18px;
  flex-shrink: 0;
}

.layer-icon {
  color: #9ca3af;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}
.is-selected .layer-icon {
  color: #60a5fa;
}

.layer-label {
  flex: 1;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 2px;
}

.layer-rename-input {
  flex: 1;
  min-width: 0;
  height: 20px;
  padding: 0 4px;
  border: 1px solid #93c5fd;
  border-radius: 4px;
  outline: none;
  background: #fff;
  color: #111827;
  font-size: 11px;
  line-height: 18px;
}

.layer-eye {
  opacity: 0;
  transition: opacity 100ms;
}
.layer-eye-spacer {
  width: 18px;
  flex-shrink: 0;
}
.layer-row:hover .layer-eye,
.layer-eye.is-always-visible {
  opacity: 1;
}
</style>
