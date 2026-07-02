<script lang="ts" setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import {
  BUILTIN_WEB_BUILDER_PANEL_IDS,
  collectBuiltinWebBuilderPanels,
  type WebBuilderPanelContribution,
} from '../core/index.js'

type PanelId = string
type PanelButton = { id: PanelId; icon: string; title: string }
const PLUGIN_PANEL_FALLBACK_ICON = 'lucide:panel-right'

const props = defineProps<{
  activePanel: PanelId
  showLayoutPanel?: boolean
  showTemplatePanel?: boolean
  panels?: WebBuilderPanelContribution[]
  pluginPanels?: WebBuilderPanelContribution[]
}>()

const emit = defineEmits<{
  (event: 'select-panel', panel: PanelId): void
}>()

const railPanels = computed(() =>
  props.panels ?? collectBuiltinWebBuilderPanels(props.pluginPanels ?? []),
)

const panelButtons = computed<PanelButton[]>(() =>
  railPanels.value
    .filter(panel => BUILTIN_WEB_BUILDER_PANEL_IDS.has(panel.id) || panel.component)
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
</script>

<template>
  <div class="tw-flex tw-h-full tw-flex-col tw-items-center tw-gap-2 tw-bg-[color:var(--wb-topbar-bg)] tw-py-3">
    <button
      v-for="btn in panelButtons"
      :key="btn.id"
      type="button"
      class="tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded tw-text-lg tw-transition-colors"
      :class="
        props.activePanel === btn.id
          ? 'tw-bg-[color:var(--wb-btn-active-bg)] tw-text-white'
          : 'tw-text-white hover:tw-bg-[color:var(--wb-btn-hover-bg)]'
      "
      :title="btn.title"
      @click="emit('select-panel', btn.id)"
    >
      <Icon :icon="btn.icon" />
    </button>
  </div>
</template>
