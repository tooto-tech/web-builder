<script setup lang="ts">
import type { TraitRow } from '../adapters/useTraitRows.js'

defineProps<{
  row: TraitRow
}>()
</script>

<template>
  <div class="wb-trait-svg-icon-field">
    <div class="wb-trait-svg-icon-field__preview">
      <div v-if="String(row.value ?? '').trim()" v-html="String(row.value ?? '')" />
      <span v-else>No icon</span>
    </div>
    <div v-if="row.sourceName" class="wb-trait-svg-icon-field__source">
      Source: {{ row.sourceName }}
    </div>
    <textarea
      :value="String(row.value ?? '')"
      spellcheck="false"
      @input="row.setValue(($event.target as HTMLTextAreaElement).value)"
    />
  </div>
</template>

<style scoped>
.wb-trait-svg-icon-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wb-trait-svg-icon-field__preview {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 12px;
  color: #9ca3af;
  background: #f9fafb;
  font-size: 12px;
}

.wb-trait-svg-icon-field__preview :deep(svg) {
  max-width: 100%;
  max-height: 100%;
}

.wb-trait-svg-icon-field__source {
  color: #6b7280;
  font-size: 11px;
}

.wb-trait-svg-icon-field textarea {
  min-height: 96px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 18px;
  resize: vertical;
}
</style>
