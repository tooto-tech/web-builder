<script lang="ts" setup>
import type { WbStyleSector } from '../config/wbStyleSectors'
import type { WbStyleManager } from '../composables/useWbStyleManager'
import WbStyleControl from './WbStyleControl.vue'
import { WbCtrlTypography } from './style-controls'

// ─── Props ────────────────────────────────────────────────────────

defineProps<{
  sector: WbStyleSector
  styleManager: WbStyleManager
  editor?: any
  imageManager?: any
  grapes?: any
}>()
</script>

<template>
  <div class="wb-sector">
    <WbCtrlTypography
      v-if="sector.id === 'wb-spacing'"
      :style-manager="styleManager"
      :grapes="grapes"
    />

    <WbStyleControl
      v-for="prop in sector.properties"
      :key="prop.id"
      :property="prop"
      :style-manager="styleManager"
      :editor="editor"
      :image-manager="imageManager"
      :grapes="grapes"
      :context-properties="sector.properties"
    />
  </div>
</template>
