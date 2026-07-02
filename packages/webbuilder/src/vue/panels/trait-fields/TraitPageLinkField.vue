<script setup lang="ts">
import { PagesProvider } from '@tootix/grapesjs-vue'

import type { TraitRow } from '../adapters/useTraitRows.js'

defineProps<{
  row: TraitRow
}>()

const getPageId = (page: any): string => `${page?.getId?.() ?? page?.id ?? ''}`
const getPageLabel = (page: any): string => {
  const label = page?.getName?.() ?? page?.get?.('name') ?? getPageId(page)
  return `${label || 'Untitled page'}`
}
const getPageValue = (page: any): string =>
  `${page?.get?.('url') ?? page?.get?.('path') ?? page?.get?.('slug') ?? getPageId(page)}`
</script>

<template>
  <PagesProvider v-slot="{ pages }">
    <div class="wb-trait-page-link-field">
      <select
        v-if="pages.length"
        :value="String(row.value ?? '')"
        @change="row.setValue(($event.target as HTMLSelectElement).value)"
      >
        <option value="">Select page</option>
        <option
          v-for="page in pages"
          :key="getPageId(page)"
          :value="getPageValue(page)"
        >
          {{ getPageLabel(page) }}
        </option>
      </select>
      <input
        :value="String(row.value ?? '')"
        type="text"
        :placeholder="row.placeholder || 'https://'"
        @input="row.setValue(($event.target as HTMLInputElement).value)"
      />
    </div>
  </PagesProvider>
</template>

<style scoped>
.wb-trait-page-link-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wb-trait-page-link-field select,
.wb-trait-page-link-field input {
  min-height: 28px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 0 8px;
  background: #fff;
  font: inherit;
  font-size: 12px;
}
</style>
