<script setup lang="ts">
import type { TraitRow } from '../adapters/useTraitRows.js'

defineProps<{
  row: TraitRow
}>()
</script>

<template>
  <div class="wb-trait-code-field">
    <div class="wb-trait-code-field__meta">
      {{ row.language ? row.language.toUpperCase() : 'CODE' }}
    </div>
    <textarea
      :value="String(row.value ?? '')"
      spellcheck="false"
      @input="row.setValue(($event.target as HTMLTextAreaElement).value)"
    />
  </div>
</template>

<style scoped>
.wb-trait-code-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.wb-trait-code-field__meta {
  color: #6b7280;
  font-size: 11px;
  font-weight: 600;
}

.wb-trait-code-field textarea {
  min-height: 132px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 18px;
  resize: vertical;
}
</style>
