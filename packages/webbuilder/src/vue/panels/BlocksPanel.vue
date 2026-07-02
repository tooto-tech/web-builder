<script setup lang="ts">
import { BlocksProvider } from '@tootix/grapesjs-vue'

import { normalizeBlockCatalog } from './adapters/useBlockCatalog.js'

const getBlockId = (block: any): string => block?.getId?.() ?? block?.id ?? ''
const getBlockLabel = (block: any): string => block?.getLabel?.() ?? block?.label ?? getBlockId(block)
</script>

<template>
  <BlocksProvider v-slot="{ mapCategoryBlocks, append, dragStart, dragStop }">
    <div class="wb-blocks-panel" data-testid="wb-blocks-panel">
      <template v-if="mapCategoryBlocks.size">
        <section
          v-for="group in normalizeBlockCatalog(mapCategoryBlocks)"
          :key="group.id"
          class="wb-blocks-panel__group"
        >
          <div class="wb-blocks-panel__category">{{ group.label }}</div>
          <div class="wb-blocks-panel__grid">
            <button
              v-for="block in group.blocks"
              :key="getBlockId(block)"
              class="wb-blocks-panel__block"
              type="button"
              draggable="true"
              :data-block-id="getBlockId(block)"
              @click="(event) => append(block, event)"
              @dragstart="(event) => dragStart(block, event)"
              @dragend="() => dragStop()"
            >
              {{ getBlockLabel(block) }}
            </button>
          </div>
        </section>
      </template>
      <div v-else class="wb-blocks-panel__empty">No blocks are registered.</div>
    </div>
  </BlocksProvider>
</template>

<style scoped>
.wb-blocks-panel {
  min-height: 100%;
  padding: 12px;
  color: #111827;
  background: #fff;
}

.wb-blocks-panel__group + .wb-blocks-panel__group {
  margin-top: 16px;
}

.wb-blocks-panel__category {
  margin-bottom: 8px;
  color: #6b7280;
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
  text-transform: uppercase;
}

.wb-blocks-panel__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.wb-blocks-panel__block {
  min-height: 56px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px;
  color: #111827;
  background: #fff;
  font: inherit;
  font-size: 12px;
  line-height: 16px;
  text-align: center;
  cursor: grab;
}

.wb-blocks-panel__block:hover,
.wb-blocks-panel__block:focus-visible {
  border-color: #2563eb;
  outline: none;
}

.wb-blocks-panel__block:active {
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
