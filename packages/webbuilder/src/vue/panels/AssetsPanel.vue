<script setup lang="ts">
import { AssetsProvider } from '@tootix/grapesjs-vue'

const getAssetId = (asset: any): string => asset?.get?.('id') ?? asset?.cid ?? getAssetSrc(asset)
const getAssetSrc = (asset: any): string => asset?.getSrc?.() ?? asset?.get?.('src') ?? asset?.src ?? ''
const getAssetName = (asset: any): string => asset?.get?.('name') ?? getAssetSrc(asset)
</script>

<template>
  <AssetsProvider v-slot="{ assets, select, close }">
    <div class="wb-assets-panel" data-testid="wb-assets-panel">
      <div class="wb-assets-panel__header">
        <span>Assets</span>
        <button type="button" class="wb-assets-panel__close" @click="close()">Close</button>
      </div>
      <div v-if="assets.length" class="wb-assets-panel__grid">
        <button
          v-for="asset in assets"
          :key="getAssetId(asset)"
          type="button"
          class="wb-assets-panel__asset"
          @click="select(asset, true)"
        >
          <img v-if="getAssetSrc(asset)" :src="getAssetSrc(asset)" :alt="getAssetName(asset)" />
          <span v-else>{{ getAssetName(asset) }}</span>
        </button>
      </div>
      <div v-else class="wb-assets-panel__empty">No assets are available.</div>
    </div>
  </AssetsProvider>
</template>

<style scoped>
.wb-assets-panel {
  min-height: 100%;
  padding: 12px;
  color: #111827;
  background: #fff;
}

.wb-assets-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #4b5563;
  font-size: 12px;
  font-weight: 600;
}

.wb-assets-panel__close {
  border: 0;
  color: #2563eb;
  background: transparent;
  font: inherit;
  font-size: 11px;
}

.wb-assets-panel__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.wb-assets-panel__asset {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  overflow: hidden;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 4px;
  background: #fff;
}

.wb-assets-panel__asset img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.wb-assets-panel__empty {
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  padding: 16px;
  color: #6b7280;
  font-size: 12px;
}
</style>
