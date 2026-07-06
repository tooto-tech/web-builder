<script setup lang="ts">
import AssetsManager from './AssetsManager.vue'
import { useWebBuilderContext } from '../context.js'
import type { MediaAssetRecord } from '../../core/index.js'
import {
  applyMediaAssetToSelectedImage,
  syncMediaAssetToEditor,
} from '../mediaAssets.js'

const context = useWebBuilderContext()

const handleSelectAsset = (asset: MediaAssetRecord) => {
  syncMediaAssetToEditor(context.editor, asset)
  const applied = applyMediaAssetToSelectedImage(context.editor, asset)
  context.ui.message.success(applied ? 'Image updated' : 'Asset added')
}
</script>

<template>
  <AssetsManager
    variant="panel"
    title="Assets"
    :media-service="context.hostServices.media"
    :ui="context.ui"
    @select="handleSelectAsset"
  />
</template>
