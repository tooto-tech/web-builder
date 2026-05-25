<script lang="ts" setup>
import { Icon } from '@iconify/vue'

type PanelId = 'blocks' | 'styles' | 'i18n' | 'global' | 'assets' | 'layout' | 'template'
type PanelButton = { id: PanelId; icon: string; title: string }

const props = defineProps<{
  activePanel: PanelId
  showLayoutPanel?: boolean
  showTemplatePanel?: boolean
}>()

const emit = defineEmits<{
  (e: 'select-panel', panel: PanelId): void
}>()

const panelButtons: PanelButton[] = [
  {
    id: 'blocks',
    icon: 'uit:create-dashboard',
    title: 'Components'
  },
  {
    id: 'styles',
    icon: 'material-symbols-light:palette-outline',
    title: 'Styles'
  },
  {
    id: 'i18n',
    icon: 'material-symbols-light:translate',
    title: '片段翻译'
  },
  ...(props.showLayoutPanel === false
    ? []
    : [
        {
          id: 'layout',
          icon: 'fluent:layout-add-above-20-regular',
          title: '页眉页脚'
        } satisfies PanelButton
      ]),
  ...(props.showTemplatePanel === false
    ? []
    : [
        {
          id: 'template',
          icon: 'lucide:list-filter',
          title: '模板规则'
        } satisfies PanelButton
      ]),
  {
    id: 'assets',
    icon: 'ph:image-light',
    title: 'Assets'
  },
  {
    id: 'global',
    icon: 'mdi-light:settings',
    title: 'Global Settings'
  }
]
</script>

<template>
  <div class="flex h-full flex-col items-center gap-2 bg-editor-panel py-3">
    <button
      v-for="btn in panelButtons"
      :key="btn.id"
      type="button"
      class="flex size-8 items-center justify-center rounded text-lg transition-colors"
      :class="
        props.activePanel === btn.id
          ? 'bg-editor-btn-active text-white'
          : 'text-white hover:bg-editor-btn-hover'
      "
      :title="btn.title"
      @click="emit('select-panel', btn.id as PanelId)"
    >
      <Icon :icon="btn.icon" />
    </button>
  </div>
</template>
