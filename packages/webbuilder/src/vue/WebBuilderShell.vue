<script setup lang="ts">
import type { StyleValue } from 'vue'
import { Icon } from '@iconify/vue'

import { resolveShellMessages, type WebBuilderShellMessages } from './messages.js'

withDefaults(defineProps<{
  registrationDiagnosticText?: string
  editorReady: boolean
  isPageSwitching?: boolean
  isPreviewMode?: boolean
  isActivePanelFullWidth?: boolean
  sidePanelGridStyle?: StyleValue
  isResizingSidePanel?: boolean
  isBottomDropActive?: boolean
  editorLoadingVisible?: boolean
  blockingProcessingActive?: boolean
  editorLoadingText?: string
  messages?: WebBuilderShellMessages
}>(), {
  registrationDiagnosticText: '',
  isPageSwitching: false,
  isPreviewMode: false,
  isActivePanelFullWidth: false,
  sidePanelGridStyle: undefined,
  isResizingSidePanel: false,
  isBottomDropActive: false,
  editorLoadingVisible: false,
  blockingProcessingActive: false,
  editorLoadingText: '',
  messages: () => resolveShellMessages(),
})

const emit = defineEmits<{
  (event: 'exit-preview'): void
  (event: 'bottom-drop-drag-enter', value: DragEvent): void
  (event: 'bottom-drop-drag-leave', value: DragEvent): void
  (event: 'bottom-drop-drag-over', value: DragEvent): void
  (event: 'bottom-drop', value: DragEvent): void
  (event: 'start-side-panel-resize', value: MouseEvent): void
  (event: 'side-panel-resize-move', value: MouseEvent): void
  (event: 'stop-side-panel-resize', value: MouseEvent): void
}>()
</script>

<template>
  <div class="wb-shell tw-h-screen tw-relative tw-bg-white">
    <div
      v-if="registrationDiagnosticText"
      class="wb-registration-diagnostics"
      role="status"
      aria-live="polite"
    >
      <Icon icon="mdi:alert-outline" class="tw-text-base" />
      <span>{{ registrationDiagnosticText }}</span>
    </div>

    <div
      v-show="editorReady && !isPageSwitching"
      class="tw-h-full tw-flex tw-flex-col"
    >
      <slot name="top-bar"></slot>

      <div
        class="tw-flex-1 tw-min-h-0"
        :class="isPreviewMode ? '' : 'tw-grid'"
        :style="isPreviewMode ? undefined : sidePanelGridStyle"
      >
        <slot name="rail"></slot>

        <div
          v-show="!isPreviewMode && !isActivePanelFullWidth"
          class="tw-relative tw-min-h-0 tw-overflow-hidden tw-border-r tw-bg-white"
        >
          <div class="tw-size-full tw-overflow-y-auto tw-overflow-x-hidden">
            <slot name="side-panel"></slot>
          </div>
          <div
            class="tw-absolute tw-right-0 tw-top-0 tw-z-20 tw-h-full tw-w-1 tw-cursor-col-resize tw-bg-transparent tw-transition-colors hover:tw-bg-[color:var(--wb-resize-hover-bg)]"
            :class="isResizingSidePanel ? 'tw-bg-[color:var(--wb-resize-active-bg)]' : ''"
            @mousedown.prevent="emit('start-side-panel-resize', $event)"
          ></div>
        </div>

        <div
          v-show="!isPreviewMode && isActivePanelFullWidth"
          class="wb-full-panel tw-relative tw-z-[100] tw-min-h-0 tw-overflow-hidden tw-bg-white"
          style="grid-column: 2 / -1"
        >
          <div class="tw-size-full tw-overflow-y-auto tw-overflow-x-hidden">
            <slot name="full-panel"></slot>
          </div>
        </div>

        <div
          v-show="isPreviewMode || !isActivePanelFullWidth"
          class="tw-relative tw-size-full"
        >
          <slot name="canvas"></slot>

          <div
            v-show="!isPreviewMode"
            class="tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-14 tw-border-t tw-bg-white/95 tw-backdrop-blur-sm tw-flex tw-items-center tw-justify-center tw-text-xs tw-transition-colors"
            :class="
              isBottomDropActive
                ? 'tw-border-[color:var(--wb-accent)] tw-text-[color:var(--wb-accent-text)] tw-bg-[color:var(--wb-accent-soft-bg)]'
                : 'tw-border-[color:var(--wb-drop-idle-border)] tw-text-[color:var(--wb-drop-idle-text)]'
            "
            @dragenter="emit('bottom-drop-drag-enter', $event)"
            @dragleave="emit('bottom-drop-drag-leave', $event)"
            @dragover="emit('bottom-drop-drag-over', $event)"
            @drop="emit('bottom-drop', $event)"
          >
            {{ messages['shell.bottomDropHint'] }}
          </div>

          <button
            v-show="isPreviewMode"
            class="tw-absolute tw-top-4 tw-right-4 tw-z-50 tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-bg-gray-900/80 tw-text-white tw-text-sm tw-rounded-full hover:tw-bg-gray-900 tw-transition-colors tw-backdrop-blur-sm"
            type="button"
            @click="emit('exit-preview')"
          >
            <Icon icon="mdi:eye-off-outline" class="tw-text-base" />
            {{ messages['shell.exitPreview'] }}
          </button>
        </div>

        <div
          v-if="isResizingSidePanel"
          class="tw-fixed tw-inset-0 tw-z-[9999] tw-cursor-col-resize"
          @mousemove.prevent="emit('side-panel-resize-move', $event)"
          @mouseup.prevent="emit('stop-side-panel-resize', $event)"
        ></div>
      </div>

      <slot name="floating-panels"></slot>
      <slot name="modals"></slot>
    </div>

    <div
      v-show="editorLoadingVisible"
      class="wb-editor-loading"
      :class="{ 'wb-editor-loading--blocking': blockingProcessingActive }"
      aria-live="polite"
      aria-busy="true"
    >
      <div class="wb-editor-loading__panel">
        <div class="wb-editor-loading__text">{{ editorLoadingText }}</div>
        <div class="wb-editor-loading__mark"></div>
        <div v-if="blockingProcessingActive" class="wb-editor-loading__subtext">
          {{ messages['shell.blockingProcessing'] }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wb-registration-diagnostics {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 3100;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: min(560px, calc(100vw - 24px));
  padding: 8px 12px;
  border: 1px solid var(--wb-diagnostic-border);
  border-radius: 6px;
  background: var(--wb-diagnostic-bg);
  color: var(--wb-diagnostic-text);
  font-size: 12px;
  line-height: 18px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
}

.wb-editor-loading {
  position: absolute;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--wb-loading-bg);
  color: var(--wb-loading-text);
  pointer-events: auto;
}

.wb-editor-loading--blocking {
  background: var(--wb-loading-bg);
}

.wb-editor-loading__panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: min(420px, calc(100vw - 48px));
  text-align: center;
}

.wb-editor-loading__mark {
  position: relative;
  width: 48px;
  height: 48px;
  border: 3px solid var(--wb-loading-spinner-track);
  border-top-color: var(--wb-loading-spinner-head);
  border-radius: 50%;
  box-sizing: border-box;
  animation: wb-editor-loading-spin 1.1s linear infinite;
  transform-origin: 50% 50%;
  will-change: transform;
}

.wb-editor-loading__text {
  margin-bottom: 30px;
  color: var(--wb-loading-text);
  font-size: 18px;
  font-weight: 600;
  line-height: 26px;
}

.wb-editor-loading__subtext {
  margin-top: 18px;
  color: var(--wb-loading-subtext);
  font-size: 12px;
  line-height: 18px;
}

:global(body.wb-side-panel-resizing iframe) {
  pointer-events: none !important;
}

@keyframes wb-editor-loading-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
