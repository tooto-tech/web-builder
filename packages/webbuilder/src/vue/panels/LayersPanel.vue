<script setup lang="ts">
import { LayersProvider } from '@tootix/grapesjs-vue'

import LayerTreeItem from './LayerTreeItem.vue'
</script>

<template>
  <LayersProvider v-slot="{ root }">
    <div class="wb-layers-panel" data-testid="wb-layers-panel">
      <LayerTreeItem v-if="root" :component="root" />
      <div v-else class="wb-layers-panel__empty">No layers are available.</div>
    </div>
  </LayersProvider>
</template>

<style scoped>
.wb-layers-panel {
  min-height: 100%;
  padding: 8px;
  color: #111827;
  background: #fff;
}

.wb-layers-panel__empty {
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  padding: 16px;
  color: #6b7280;
  font-size: 12px;
  line-height: 18px;
}
</style>
