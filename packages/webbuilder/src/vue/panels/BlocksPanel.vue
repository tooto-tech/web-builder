<script setup lang="ts">
import { BlocksProvider } from '@tootix/grapesjs-vue'

import BlocksPanelContent from './BlocksPanelContent.vue'
</script>

<template>
  <BlocksProvider v-slot="{ mapCategoryBlocks, append, dragStart, dragStop }">
    <BlocksPanelContent
      :map-category-blocks="mapCategoryBlocks"
      :append="append"
      :drag-start="dragStart"
      :drag-stop="dragStop"
    />
  </BlocksProvider>
</template>
