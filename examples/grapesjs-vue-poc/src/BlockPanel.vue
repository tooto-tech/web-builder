<script setup lang="ts">
import { BlocksProvider } from '@tootix/grapesjs-vue'
</script>

<template>
  <BlocksProvider v-slot="{ mapCategoryBlocks, dragStart, dragStop }">
    <div class="tw-p-2 tw-border-b" data-testid="block-panel">
      <div v-for="[category, blocks] in mapCategoryBlocks" :key="category" class="tw-mb-2">
        <div class="tw-text-xs tw-text-gray-400 tw-mb-1">{{ category }}</div>
        <div class="tw-grid tw-grid-cols-2 tw-gap-1">
          <div
            v-for="block in blocks"
            :key="block.getId()"
            class="tw-border tw-border-gray-200 tw-rounded tw-p-2 tw-text-xs tw-text-center tw-cursor-grab hover:tw-border-blue-400"
            draggable="true"
            :data-block="block.getId()"
            @dragstart="(ev) => dragStart(block, ev)"
            @dragend="() => dragStop()"
          >
            {{ block.getLabel() }}
          </div>
        </div>
      </div>
    </div>
  </BlocksProvider>
</template>
