<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Sector } from 'grapesjs'
import { NCollapse, NCollapseItem, NTab, NTabs } from 'naive-ui'
import { useEditor } from '@tootix/grapesjs-vue'

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
const editor = useEditor()

type StylePanelTab = 'style-manager' | 'traits'

const activeTab = ref<StylePanelTab>('style-manager')
const activeSectorIds = ref<string[]>([])
const knownSectorIds = ref<Set<string>>(new Set())

const tabOptions: Array<{ label: string, value: StylePanelTab }> = [
  { label: 'Style Manager', value: 'style-manager' },
  { label: 'Traits', value: 'traits' },
]

watch(
  () => normalizedSectors.value.map(sector => ({
    id: sector.id,
    defaultOpen: sector.defaultOpen,
  })),
  (sectors) => {
    const nextIds = new Set(sectors.map(sector => sector.id))
    const nextActive = activeSectorIds.value.filter(id => nextIds.has(id))
    const nextKnown = new Set<string>()

    sectors.forEach((sector) => {
      const wasKnown = knownSectorIds.value.has(sector.id)
      if (!wasKnown && sector.defaultOpen !== false) {
        nextActive.push(sector.id)
      }
      nextKnown.add(sector.id)
    })

    activeSectorIds.value = Array.from(new Set(nextActive))
    knownSectorIds.value = nextKnown
  },
  { immediate: true },
)

const updateActiveSectorIds = (value: string | number | Array<string | number>) => {
  activeSectorIds.value = Array.isArray(value)
    ? value.map(item => String(item))
    : [String(value)]
}
</script>

<template>
  <div class="wb-style-panel" data-testid="wb-style-panel">
    <div class="wb-style-panel__tabs">
      <NTabs
        v-model:value="activeTab"
        class="wb-style-panel__segmented"
        type="segment"
        size="small"
        animated
      >
        <NTab
          v-for="tab in tabOptions"
          :key="tab.value"
          :name="tab.value"
          :tab="tab.label"
        />
      </NTabs>
    </div>

    <div v-show="activeTab === 'style-manager'" class="wb-style-panel__view">
      <SelectorSection />

      <div v-if="!normalizedSectors.length" class="wb-style-panel__empty">
        No style controls are available.
      </div>

      <NCollapse
        v-else
        class="wb-style-panel__collapse"
        :expanded-names="activeSectorIds"
        @update:expanded-names="updateActiveSectorIds"
      >
        <NCollapseItem
          v-for="sector in normalizedSectors"
          :key="sector.id"
          :name="sector.id"
          :title="sector.label"
          class="wb-style-panel__sector"
        >
          <WbSector
            :sector="sector"
            :style-manager="styleManager"
            :editor="editor"
          />
        </NCollapseItem>
      </NCollapse>
    </div>

    <div v-show="activeTab === 'traits'" class="wb-style-panel__view wb-style-panel__view--traits">
      <TraitSection />
    </div>
  </div>
</template>

<style scoped>
.wb-style-panel {
  min-height: 100%;
  color: #111827;
  background: #fff;
}

.wb-style-panel__tabs {
  border-bottom: 1px solid #e5e7eb;
  padding: 10px 12px;
}

.wb-style-panel__segmented {
  width: 100%;
}

.wb-style-panel__segmented :deep(.n-tabs-tab) {
  min-width: 0;
}

.wb-style-panel__segmented :deep(.n-tabs-tab__label) {
  justify-content: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wb-style-panel__view {
  min-height: 0;
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

.wb-style-panel__collapse {
  border-top: 0;
}

.wb-style-panel__sector :deep(.n-collapse-item__header) {
  min-height: 38px;
  padding: 0 12px;
  color: #374151;
  font-size: 12px;
  font-weight: 600;
  line-height: 38px;
}

.wb-style-panel__sector :deep(.n-collapse-item__header-main) {
  min-width: 0;
}

.wb-style-panel__sector :deep(.n-collapse-item__content-wrapper) {
  border-bottom: 1px solid #e5e7eb;
}

.wb-style-panel__sector :deep(.n-collapse-item__content-inner) {
  padding: 12px;
}

.wb-style-panel__view--traits :deep(.wb-trait-section) {
  border-bottom: 0;
}
</style>
