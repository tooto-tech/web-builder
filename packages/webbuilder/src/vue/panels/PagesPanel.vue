<script setup lang="ts">
import { PagesProvider } from '@tootix/grapesjs-vue'

const getPageId = (page: any): string => page?.getId?.() ?? page?.id ?? ''
const getPageName = (page: any): string =>
  (page?.getName?.() ?? page?.get?.('name') ?? getPageId(page)) || 'Untitled page'
</script>

<template>
  <PagesProvider v-slot="{ pages, selected, select, add, remove }">
    <div class="wb-pages-panel" data-testid="wb-pages-panel">
      <div class="wb-pages-panel__header">
        <span>Pages</span>
        <button type="button" class="wb-pages-panel__add" @click="add({ name: `Page ${pages.length + 1}` })">
          Add
        </button>
      </div>
      <div v-if="pages.length" class="wb-pages-panel__list">
        <div
          v-for="page in pages"
          :key="getPageId(page)"
          class="wb-pages-panel__row"
          :class="{ 'is-active': selected && getPageId(page) === getPageId(selected) }"
        >
          <button type="button" class="wb-pages-panel__name" @click="select(page)">
            {{ getPageName(page) }}
          </button>
          <button type="button" class="wb-pages-panel__remove" @click="remove(page)">
            Remove
          </button>
        </div>
      </div>
      <div v-else class="wb-pages-panel__empty">No pages are available.</div>
    </div>
  </PagesProvider>
</template>

<style scoped>
.wb-pages-panel {
  min-height: 100%;
  padding: 12px;
  color: #111827;
  background: #fff;
}

.wb-pages-panel__header,
.wb-pages-panel__row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wb-pages-panel__header {
  justify-content: space-between;
  margin-bottom: 10px;
  color: #4b5563;
  font-size: 12px;
  font-weight: 600;
}

.wb-pages-panel__row {
  border-radius: 4px;
}

.wb-pages-panel__row.is-active {
  background: #eff6ff;
}

.wb-pages-panel__name,
.wb-pages-panel__add,
.wb-pages-panel__remove {
  border: 0;
  background: transparent;
  font: inherit;
}

.wb-pages-panel__name {
  flex: 1;
  min-height: 30px;
  padding: 0 8px;
  color: #374151;
  font-size: 12px;
  text-align: left;
}

.wb-pages-panel__add,
.wb-pages-panel__remove {
  color: #2563eb;
  font-size: 11px;
}

.wb-pages-panel__empty {
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  padding: 16px;
  color: #6b7280;
  font-size: 12px;
}
</style>
