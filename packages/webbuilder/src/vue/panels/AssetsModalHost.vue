<script setup lang="ts">
import { AssetsProvider } from '@tootix/grapesjs-vue'
import { NModal } from 'naive-ui'
import type { MediaAssetLike, MediaAssetRecord } from '../../core/index.js'
import { useWebBuilderContext } from '../context.js'
import {
  normalizeMediaAssetRecord,
  syncMediaAssetToEditor,
} from '../mediaAssets.js'
import AssetsManager from './AssetsManager.vue'

const context = useWebBuilderContext()

const toRecords = (assets: unknown[]): MediaAssetRecord[] =>
  assets
    .map(normalizeMediaAssetRecord)
    .filter((asset): asset is MediaAssetRecord => Boolean(asset))

const closeOnHide = (visible: boolean, close: () => void) => {
  if (!visible) close()
}

const selectAsset = (
  asset: MediaAssetRecord,
  select: (asset: MediaAssetLike, complete?: boolean) => void,
  close: () => void,
) => {
  const syncedAsset = syncMediaAssetToEditor(context.editor, asset) as MediaAssetLike
  select(syncedAsset, true)
  close()
}
</script>

<template>
  <AssetsProvider v-slot="{ open, assets, types, select, close }">
    <NModal
      :show="open"
      :block-scroll="false"
      :mask-closable="true"
      @update:show="(visible) => closeOnHide(visible, close)"
    >
      <section
        class="wb-modal-host__dialog wb-assets-modal-host"
        role="dialog"
        aria-modal="true"
      >
        <header class="wb-modal-host__header">
          <span>Select Image</span>
          <button type="button" class="wb-modal-host__close" @click="close()">Close</button>
        </header>
        <div class="wb-modal-host__body wb-assets-modal-host__body">
          <AssetsManager
            variant="modal"
            title="Assets"
            :initial-records="toRecords(assets)"
            :types="types"
            :media-service="context.hostServices.media"
            :ui="context.ui"
            @select="(asset) => selectAsset(asset, select, close)"
          />
        </div>
      </section>
    </NModal>
  </AssetsProvider>
</template>

<style scoped>
.wb-assets-modal-host {
  display: flex;
  width: min(960px, calc(100vw - 48px));
  max-height: min(760px, calc(100vh - 48px));
  flex-direction: column;
}

.wb-assets-modal-host__body {
  min-height: 420px;
  padding: 0;
}
</style>
