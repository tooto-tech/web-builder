<script setup lang="ts">
import { computed } from 'vue'
import type { Sector } from 'grapesjs'

import WbSector from '../controls/WbSector.vue'
import {
  createProviderStyleManager,
  normalizeStyleSectors,
} from './adapters/useStyleSectors.js'
import SelectorSection from './SelectorSection.vue'
import TraitSection from './TraitSection.vue'

const props = defineProps<{
  sectors: Sector[]
}>()

const normalizedSectors = computed(() => normalizeStyleSectors(props.sectors))
const styleManager = computed(() => createProviderStyleManager(props.sectors))
</script>

<template>
  <div class="wb-style-panel" data-testid="wb-style-panel">
    <SelectorSection />
    <TraitSection />

    <div v-if="!normalizedSectors.length" class="wb-style-panel__empty">
      No style controls are available.
    </div>

    <WbSector
      v-for="sector in normalizedSectors"
      :key="sector.id"
      :sector="sector"
      :style-manager="styleManager"
    />
  </div>
</template>

<style scoped>
.wb-style-panel {
  min-height: 100%;
  color: #111827;
  background: #fff;
}

.wb-style-panel__empty {
  margin: 16px;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  padding: 16px;
  color: #6b7280;
  font-size: 12px;
  line-height: 18px;
}
</style>
