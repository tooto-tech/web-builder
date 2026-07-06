<script setup lang="ts">
import type { Block } from 'grapesjs'
import { NCollapse, NCollapseItem } from 'naive-ui'
import { computed, ref, watch } from 'vue'

import { normalizeBlockCatalog } from './adapters/useBlockCatalog.js'

type CollapseValue = string | number | Array<string | number>

const props = defineProps<{
  mapCategoryBlocks: Map<string, Block[]>
  append: (block: Block, event: MouseEvent) => void
  dragStart: (block: Block, event: DragEvent) => void
  dragStop: () => void
}>()

const groups = computed(() => normalizeBlockCatalog(props.mapCategoryBlocks))
const activeGroupIds = ref<string[]>([])
const knownGroupIds = ref<Set<string>>(new Set())

const getBlockId = (block: any): string => block?.getId?.() ?? block?.id ?? ''
const getBlockLabel = (block: any): string => block?.getLabel?.() ?? block?.label ?? getBlockId(block)
const getBlockMedia = (block: any): string => block?.getMedia?.() ?? block?.media ?? ''

watch(
  () => groups.value.map(group => group.id),
  (groupIds) => {
    const currentIds = new Set(groupIds)
    const previousKnownIds = knownGroupIds.value

    activeGroupIds.value = activeGroupIds.value.filter(id => currentIds.has(id))

    groupIds.forEach((id) => {
      if (!previousKnownIds.has(id)) {
        activeGroupIds.value.push(id)
      }
    })

    knownGroupIds.value = currentIds
  },
  { immediate: true },
)

const updateActiveGroupIds = (value: CollapseValue) => {
  activeGroupIds.value = (Array.isArray(value) ? value : [value]).map(String)
}
</script>

<template>
  <div class="wb-blocks-panel" data-testid="wb-blocks-panel">
    <NCollapse
      v-if="groups.length"
      class="wb-blocks-panel__collapse"
      :expanded-names="activeGroupIds"
      @update:expanded-names="updateActiveGroupIds"
    >
      <NCollapseItem
        v-for="group in groups"
        :key="group.id"
        :name="group.id"
        :title="group.label"
        class="wb-blocks-panel__group"
      >
        <div class="wb-blocks-panel__list">
          <button
            v-for="block in group.blocks"
            :key="getBlockId(block)"
            class="wb-blocks-panel__cell"
            type="button"
            draggable="true"
            :data-block-id="getBlockId(block)"
            @click="(event) => append(block, event)"
            @dragstart="(event) => dragStart(block, event)"
            @dragend="() => dragStop()"
          >
            <span
              class="wb-blocks-panel__cell-media"
              :class="{ 'is-empty': !getBlockMedia(block) }"
            >
              <span
                v-if="getBlockMedia(block)"
                v-html="getBlockMedia(block)"
              />
            </span>
            <span class="wb-blocks-panel__cell-body">
              <span class="wb-blocks-panel__cell-label">{{ getBlockLabel(block) }}</span>
            </span>
          </button>
        </div>
      </NCollapseItem>
    </NCollapse>
    <div v-else class="wb-blocks-panel__empty">No blocks are registered.</div>
  </div>
</template>

<style scoped>
.wb-blocks-panel {
  min-height: 100%;
  padding: 6px 8px 10px;
  color: #111827;
  background: #fff;
}

.wb-blocks-panel__collapse {
  border-top: 0;
  border-bottom: 0;
}

.wb-blocks-panel__group :deep(.n-collapse-item__header) {
  height: 32px;
  padding: 0;
  color: #374151;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
}

.wb-blocks-panel__group :deep(.n-collapse-item__header-main) {
  min-width: 0;
}

.wb-blocks-panel__group :deep(.n-collapse-item__content-inner) {
  padding: 4px 0 8px !important;
}

.wb-blocks-panel__list {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
}

.wb-blocks-panel__cell {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 4px;
  padding-block: 16px;
  align-items: center;
  border: 1px solid #e7e8e9;
  border-radius: 5px;
  color: #111827;
  background: #fff;
  font: inherit;
  font-size: 12px;
  line-height: 15px;
  text-align: left;
  cursor: grab;
}

.wb-blocks-panel__cell-media {
  display: flex;
  width: 16px;
  height: 16px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: #4b5563;
}

.wb-blocks-panel__cell-media.is-empty::before {
  width: 10px;
  height: 10px;
  border: 1px solid #cbd5e1;
  border-radius: 3px;
  content: '';
}

.wb-blocks-panel__cell-media :deep(svg) {
  max-width: 16px;
  max-height: 16px;
}

.wb-blocks-panel__cell-media :deep(img) {
  max-width: 22px;
  max-height: 22px;
  object-fit: contain;
}

.wb-blocks-panel__cell-body {
  display: grid;
  min-width: 0;
  font-size: 10px;
}

.wb-blocks-panel__cell-label {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  color: #111827;
  -webkit-line-clamp: 2;
}

.wb-blocks-panel__cell:hover,
.wb-blocks-panel__cell:focus-visible {
  border-color: #2563eb;
  background: #eff6ff;
  outline: none;
}

.wb-blocks-panel__cell:active {
  cursor: grabbing;
}

.wb-blocks-panel__empty {
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  padding: 16px;
  color: #6b7280;
  font-size: 12px;
  line-height: 18px;
}
</style>
