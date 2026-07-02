<script setup lang="ts">
import { LayersProvider } from '@tootix/grapesjs-vue'

import LayersPanelContent from './LayersPanelContent.vue'
</script>

<template>
  <LayersProvider v-slot="{ root }">
    <LayersPanelContent v-if="root" :root="root" />
    <div v-else class="wb-layers-panel__empty">No layers are available.</div>
  </LayersProvider>
</template>

<style scoped>
.wb-layers-panel__empty {
  margin: 8px;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  padding: 16px;
  color: #6b7280;
  font-size: 12px;
  line-height: 18px;
}
</style>
