<script setup lang="ts">
import { computed } from 'vue'

import { useWebBuilderContext } from '../../context.js'
import type { MediaAssetLike, MediaSelectionTarget } from '../../../core/index.js'
import type { TraitRow } from '../adapters/useTraitRows.js'

const props = defineProps<{
  row: TraitRow
}>()

const context = useWebBuilderContext()

const value = computed(() => `${props.row.value ?? ''}`)
const showPreview = computed(() => props.row.ui.showPreview !== false)
const filterType = computed(() => `${props.row.ui.filterType ?? ''}`.trim())

const getAssetSrc = (asset: MediaAssetLike): string =>
  asset.getSrc?.()
    ?? `${asset.get?.('src') ?? asset.src ?? (typeof asset.url === 'function' ? asset.url() : asset.url) ?? ''}`

const pickAsset = () => {
  const selectCallback = (asset: MediaAssetLike) => {
    const src = getAssetSrc(asset)
    if (src) props.row.setValue(src)
  }
  const target: MediaSelectionTarget = {
    isStyleProp: !showPreview.value,
    filterType: filterType.value || undefined,
    selectCallback,
  }

  const media = context.hostServices.media
  if (typeof media?.openAssetsDialogWithTarget === 'function') {
    media.openAssetsDialogWithTarget(target)
    return
  }
  if (typeof media?.openAssetsDialog === 'function') {
    media.openAssetsDialog(target)
    return
  }

  context.editor.AssetManager.open({
    types: filterType.value === 'svg' ? ['image/svg+xml'] : ['image'],
    select(asset: MediaAssetLike, complete?: boolean) {
      selectCallback(asset)
      if (complete) context.editor.AssetManager.close()
    },
  })
}
</script>

<template>
  <div class="wb-trait-image-field">
    <div v-if="showPreview" class="wb-trait-image-field__preview">
      <img v-if="value" :src="value" alt="" />
      <span v-else>No image</span>
    </div>
    <div class="wb-trait-image-field__actions">
      <button type="button" @click="pickAsset">Select</button>
      <button type="button" @click="row.setValue('')">Clear</button>
    </div>
    <input
      :value="value"
      type="text"
      :placeholder="row.placeholder || 'https://'"
      @input="row.setValue(($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<style scoped>
.wb-trait-image-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wb-trait-image-field__preview {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  color: #9ca3af;
  background: #f9fafb;
  font-size: 12px;
}

.wb-trait-image-field__preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.wb-trait-image-field__actions {
  display: flex;
  gap: 8px;
}

.wb-trait-image-field button,
.wb-trait-image-field input {
  min-height: 28px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 0 8px;
  background: #fff;
  font: inherit;
  font-size: 12px;
}

.wb-trait-image-field button:first-child {
  border-color: #2563eb;
  color: #2563eb;
  background: #eff6ff;
}
</style>
