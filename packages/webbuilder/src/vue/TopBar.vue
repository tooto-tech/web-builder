<script lang="ts" setup>
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { ElPopover } from 'element-plus'

import DeviceSwitcher from './DeviceSwitcher.vue'

const props = defineProps<{
  showLayers: boolean
  showCode: boolean
  showBorders: boolean
  showDevActions?: boolean
  isPublishing?: boolean
  isTemplateResource?: boolean
}>()

type TopBarEvent =
  | 'back'
  | 'open-page-settings'
  | 'toggle-borders'
  | 'toggle-layers'
  | 'toggle-code'
  | 'preview'
  | 'save-draft'
  | 'publish'
  | 'export-project'
  | 'import-project'
  | 'reset-editor'

const emit = defineEmits<{
  (event: TopBarEvent): void
}>()

const showPublishPopover = ref(false)

const centerButtons = computed(() => [
  {
    id: 'page-settings',
    icon: props.isTemplateResource
      ? 'carbon:task-settings'
      : 'qlementine-icons:page-setup-16',
    ariaLabel: props.isTemplateResource ? 'Template settings' : 'Page settings',
    title: props.isTemplateResource ? '模板设置' : '页面设置',
    event: 'open-page-settings' as const,
    class: 'tw-w-8 tw-h-8 tw-self-center tw-flex tw-items-center tw-justify-center tw-rounded hover:tw-bg-editor-btn-active tw-text-white',
  },
])

const rightButtons = computed(() => [
  ...(props.showDevActions
    ? [{
        id: 'reset-editor',
        icon: 'mdi:restore',
        ariaLabel: 'Reset editor',
        event: 'reset-editor' as const,
        class: 'tw-w-8 tw-h-8 tw-self-center tw-flex tw-items-center tw-justify-center tw-rounded hover:tw-bg-red-500/10 tw-text-red-200 hover:tw-text-red-100',
      }]
    : []),
  ...(props.showDevActions
    ? [{
        id: 'code',
        icon: 'carbon:code',
        ariaLabel: 'Toggle code editor',
        ariaPressed: props.showCode,
        event: 'toggle-code' as const,
        class: 'tw-w-8 tw-h-8 tw-self-center tw-flex tw-items-center tw-justify-center tw-rounded hover:tw-bg-editor-btn-hover',
        activeClass: props.showCode ? 'tw-bg-editor-btn-active tw-text-white' : 'tw-text-white',
      }]
    : []),
  {
    id: 'layers',
    icon: 'si:layers-line',
    ariaLabel: 'Toggle layers',
    ariaPressed: props.showLayers,
    event: 'toggle-layers' as const,
    class: 'tw-w-8 tw-h-8 tw-self-center tw-flex tw-items-center tw-justify-center tw-rounded hover:tw-bg-editor-btn-hover',
    activeClass: props.showLayers ? 'tw-bg-editor-btn-active tw-text-white' : 'tw-text-white',
  },
  {
    id: 'preview',
    icon: 'mdi:eye-outline',
    ariaLabel: 'Preview',
    event: 'preview' as const,
    class: 'tw-w-8 tw-h-8 tw-self-center tw-flex tw-items-center tw-justify-center tw-rounded hover:tw-bg-[#ffffff29] tw-text-white',
  },
  {
    id: 'save-draft',
    icon: 'fluent:save-16-regular',
    ariaLabel: 'Save draft',
    event: 'save-draft' as const,
    class: 'tw-w-8 tw-h-8 tw-self-center tw-flex tw-items-center tw-justify-center tw-rounded hover:tw-bg-editor-btn-hover tw-text-white',
  },
])

const publishMenuItems = [
  {
    label: '导出',
    icon: 'stash:file-export',
    event: 'export-project' as const,
    class: 'tw-w-full tw-flex tw-items-center tw-gap-2 tw-text-left tw-px-3 tw-py-2 hover:tw-bg-gray-50 tw-rounded tw-text-gray-700',
  },
  {
    label: '导入',
    icon: 'stash:file-import',
    event: 'import-project' as const,
    class: 'tw-w-full tw-flex tw-items-center tw-gap-2 tw-text-left tw-px-3 tw-py-2 hover:tw-bg-gray-50 tw-rounded tw-text-gray-700',
  },
]

const handlePublishMenuClick = (event: Extract<TopBarEvent, 'export-project' | 'import-project'>) => {
  showPublishPopover.value = false
  emit(event)
}
</script>

<template>
  <div class="topbar tw-h-10 tw-flex-shrink-0 tw-bg-editor-panel tw-grid tw-grid-cols-[1fr_auto_1fr] tw-items-center">
    <div class="tw-flex tw-h-full tw-items-center tw-gap-2 tw-relative">
      <div class="tw-h-full tw-mr-3">
        <button
          title="Dashboard"
          class="tw-flex tw-items-center tw-text-xl tw-justify-center tw-h-full tw-px-3.5 tw-py-1 tw-bg-editor-primary tw-text-white hover:tw-bg-blue-600 tw-transition-colors"
          @click="emit('back')"
        >
          <Icon icon="clarity:dashboard-line" />
        </button>
      </div>
    </div>

    <div class="tw-flex tw-gap-3">
      <button
        v-for="btn in centerButtons"
        :key="btn.id"
        type="button"
        :class="btn.class"
        :aria-label="btn.ariaLabel"
        :title="btn.title"
        @click="emit(btn.event)"
      >
        <Icon :icon="btn.icon" />
      </button>
      <DeviceSwitcher
      />
    </div>

    <div class="tw-flex tw-h-full tw-justify-end tw-pl-3 tw-gap-3 tw-relative">
      <button
        type="button"
        class="tw-w-8 tw-h-8 tw-self-center tw-flex tw-items-center tw-justify-center tw-rounded hover:tw-bg-editor-btn-hover"
        :class="props.showBorders ? 'tw-bg-editor-btn-active tw-text-white' : 'tw-text-white'"
        :aria-pressed="props.showBorders"
        aria-label="Toggle component borders"
        title="显示组件边框"
        @click="emit('toggle-borders')"
      >
        <Icon icon="fluent:border-none-16-regular" />
      </button>

      <button
        v-for="btn in rightButtons"
        :key="btn.id"
        type="button"
        :class="[btn.class, btn.activeClass || '']"
        :aria-label="btn.ariaLabel"
        :aria-pressed="btn.ariaPressed"
        @click="emit(btn.event)"
      >
        <Icon :icon="btn.icon" />
      </button>

      <div class="tw-flex">
        <button
          class="tw-h-full tw-flex tw-justify-center tw-items-center tw-gap-2 tw-text-sm tw-px-6 tw-py-1 tw-bg-editor-primary tw-text-white hover:tw-bg-blue-600 tw-transition-opacity disabled:tw-cursor-not-allowed disabled:tw-opacity-70 disabled:hover:tw-bg-editor-primary"
          :disabled="props.isPublishing"
          @click="emit('publish')"
        >
          <Icon v-if="props.isPublishing" icon="mdi:loading" class="tw-animate-spin" />
          {{ props.isPublishing ? '发布中' : '发布' }}
        </button>
        <ElPopover
          v-model:visible="showPublishPopover"
          placement="bottom-end"
          popper-class="wb-shell-popper"
          :width="160"
          trigger="click"
          :disabled="props.isPublishing"
        >
          <template #reference>
            <button
              class="tw-h-full tw-flex tw-border-l tw-border-white/20 tw-items-center tw-justify-center tw-px-3 tw-py-1 tw-bg-editor-primary tw-text-white hover:tw-bg-blue-600 disabled:tw-cursor-not-allowed disabled:tw-opacity-70 disabled:hover:tw-bg-editor-primary"
              :disabled="props.isPublishing"
            >
              <Icon icon="ep:arrow-down" />
            </button>
          </template>
          <div class="tw-text-sm">
            <button
              v-for="item in publishMenuItems"
              :key="item.label"
              type="button"
              :class="item.class"
              @click="handlePublishMenuClick(item.event)"
            >
              <Icon :icon="item.icon" />
              {{ item.label }}
            </button>
          </div>
        </ElPopover>
      </div>
    </div>
  </div>
</template>
