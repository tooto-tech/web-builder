<script setup lang="ts">
const props = defineProps<{
  component: any
  depth?: number
}>()

const getComponentId = (component: any): string =>
  component?.getId?.() ?? component?.cid ?? ''

const getComponentLabel = (component: any): string =>
  component?.getName?.()
    ?? component?.get?.('name')
    ?? component?.get?.('tagName')
    ?? component?.get?.('type')
    ?? 'Layer'

const getChildren = (component: any): any[] => {
  const collection = component?.components?.()
  if (Array.isArray(collection)) return collection
  if (Array.isArray(collection?.models)) return collection.models
  return []
}

const selectLayer = (component: any) => {
  component?.select?.()
  component?.em?.get?.('Editor')?.select?.(component)
}
</script>

<template>
  <div class="wb-layer-tree-item" :style="{ '--wb-layer-depth': depth ?? 0 }">
    <button
      type="button"
      class="wb-layer-tree-item__button"
      @click="selectLayer(props.component)"
    >
      {{ getComponentLabel(props.component) }}
    </button>
    <div v-if="getChildren(props.component).length" class="wb-layer-tree-item__children">
      <LayerTreeItem
        v-for="child in getChildren(props.component)"
        :key="getComponentId(child)"
        :component="child"
        :depth="(depth ?? 0) + 1"
      />
    </div>
  </div>
</template>

<style scoped>
.wb-layer-tree-item__button {
  width: 100%;
  min-height: 28px;
  border: 0;
  border-radius: 4px;
  padding: 0 8px;
  padding-left: calc(8px + var(--wb-layer-depth) * 14px);
  color: #374151;
  background: transparent;
  font: inherit;
  font-size: 12px;
  line-height: 18px;
  text-align: left;
}

.wb-layer-tree-item__button:hover,
.wb-layer-tree-item__button:focus-visible {
  background: #eff6ff;
  color: #1d4ed8;
  outline: none;
}
</style>
