<script setup lang="ts">
import { AssetsProvider } from '@tootix/grapesjs-vue'

const getAssetId = (asset: any): string => asset?.get?.('id') ?? asset?.cid ?? getAssetSrc(asset)
const getAssetSrc = (asset: any): string => asset?.getSrc?.() ?? asset?.get?.('src') ?? asset?.src ?? ''
const getAssetName = (asset: any): string => asset?.get?.('name') ?? getAssetSrc(asset)
</script>

<template>
  <AssetsProvider v-slot="{ open, assets, select, close }">
    <Teleport to="body">
      <div
        v-if="open"
        class="wb-assets-modal-host"
        data-testid="wb-assets-modal-host"
        @click.self="close()"
      >
        <section class="wb-assets-modal-host__dialog" role="dialog" aria-modal="true">
          <header class="wb-assets-modal-host__header">
            <span>Assets</span>
            <button type="button" @click="close()">Close</button>
          </header>
          <div v-if="assets.length" class="wb-assets-modal-host__grid">
            <button
              v-for="asset in assets"
              :key="getAssetId(asset)"
              type="button"
              class="wb-assets-modal-host__asset"
              @click="select(asset, true)"
            >
              <img v-if="getAssetSrc(asset)" :src="getAssetSrc(asset)" :alt="getAssetName(asset)" />
              <span v-else>{{ getAssetName(asset) }}</span>
            </button>
          </div>
          <div v-else class="wb-assets-modal-host__empty">No assets are available.</div>
        </section>
      </div>
    </Teleport>
  </AssetsProvider>
</template>

<style scoped>
.wb-assets-modal-host {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.45);
}

.wb-assets-modal-host__dialog {
  display: flex;
  flex-direction: column;
  width: min(860px, 96vw);
  max-height: min(720px, 92vh);
  overflow: hidden;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);
}

.wb-assets-modal-host__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
  padding: 12px 16px;
  color: #111827;
  font-size: 13px;
  font-weight: 600;
}

.wb-assets-modal-host__header button {
  border: 0;
  color: #2563eb;
  background: transparent;
  font: inherit;
  font-size: 12px;
}

.wb-assets-modal-host__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  overflow: auto;
  padding: 16px;
}

.wb-assets-modal-host__asset {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  overflow: hidden;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 6px;
  background: #fff;
}

.wb-assets-modal-host__asset img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.wb-assets-modal-host__empty {
  margin: 16px;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  padding: 20px;
  color: #6b7280;
  font-size: 12px;
  text-align: center;
}
</style>
