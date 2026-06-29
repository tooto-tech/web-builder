<script lang="ts" setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { WebBuilderPanelContribution } from '../core/index.js'

type PanelId = string
type PanelButton = { id: PanelId; icon: string; title: string }
const CORE_PANEL_IDS = new Set([
  'blocks',
  'styles',
  'assets',
])
const PLUGIN_PANEL_FALLBACK_ICON = 'lucide:panel-right'

const props = defineProps<{
  activePanel: PanelId
  showLayoutPanel?: boolean
  showTemplatePanel?: boolean
  pluginPanels?: WebBuilderPanelContribution[]
}>()

const emit = defineEmits<{
  (event: 'select-panel', panel: PanelId): void
}>()

const pluginPanelButtons = computed<PanelButton[]>(() =>
  (props.pluginPanels ?? [])
    .filter(panel => panel.component && !CORE_PANEL_IDS.has(panel.id))
    .filter(panel => {
      if (panel.id === 'layout') return props.showLayoutPanel !== false
      if (panel.id === 'template') return props.showTemplatePanel !== false
      return true
    })
    .map(panel => ({
      id: panel.id,
      icon: panel.icon || PLUGIN_PANEL_FALLBACK_ICON,
      title: panel.label,
    }))
)

const panelButtons = computed<PanelButton[]>(() => [
  {
    id: 'blocks',
    icon: 'uit:create-dashboard',
    title: 'Components',
  },
  {
    id: 'styles',
    icon: 'material-symbols-light:palette-outline',
    title: 'Styles',
  },
  ...pluginPanelButtons.value,
  {
    id: 'assets',
    icon: 'ph:image-light',
    title: 'Assets',
  },
])
</script>

<template>
  <div class="tw-flex tw-h-full tw-flex-col tw-items-center tw-gap-2 tw-bg-editor-panel tw-py-3">
    <button
      v-for="btn in panelButtons"
      :key="btn.id"
      type="button"
      class="tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded tw-text-lg tw-transition-colors"
      :class="
        props.activePanel === btn.id
          ? 'tw-bg-editor-btn-active tw-text-white'
          : 'tw-text-white hover:tw-bg-editor-btn-hover'
      "
      :title="btn.title"
      @click="emit('select-panel', btn.id)"
    >
      <Icon :icon="btn.icon" />
    </button>
  </div>
</template>
