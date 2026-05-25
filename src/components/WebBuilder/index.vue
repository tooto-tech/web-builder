<script lang="ts" setup>
import { onBeforeUnmount, watchEffect } from 'vue'
import { Icon } from '@iconify/vue'
import BlocksPanel from '@/components/WebBuilder/components/BlocksPanel.vue'
import StylesPropertiesPanel from '@/components/WebBuilder/components/StylesPropertiesPanel.vue'
import GlobalSettingsPanel from '@/components/WebBuilder/components/GlobalSettingsPanel.vue'
import LayoutPanel from '@/components/WebBuilder/components/LayoutPanel.vue'
import TemplateRulesPanel from '@/components/WebBuilder/components/TemplateRulesPanel.vue'
import I18nPanel from '@/components/WebBuilder/components/I18nPanel.vue'
import AssetsPanel from '@/components/WebBuilder/components/AssetsPanel.vue'
import LayersPanel from '@/components/WebBuilder/components/LayersPanel.vue'
import AssetsModal from '@/components/WebBuilder/components/AssetsModal.vue'
import PageSettingsModal from '@/components/WebBuilder/components/PageSettingsModal.vue'
import CodeModal from '@/components/WebBuilder/components/CodeModal.vue'
import PanelRail from '@/components/WebBuilder/components/PanelRail.vue'
import TopBar from '@/components/WebBuilder/components/TopBar.vue'
import ProjectsBrowserModal from '@/components/WebBuilder/components/ProjectsBrowserModal.vue'
import useWebBuilderController, {
  type WebBuilderControllerProps
} from '@/components/WebBuilder/composables/useWebBuilderController'
import { clearWebBuilderRuntime, provideWebBuilderRuntime, setWebBuilderRuntime } from '@/runtime'
import '@/components/WebBuilder/assets/vue-grapes.css'

const props = defineProps<WebBuilderControllerProps>()

const runtime = {
  get adapters() {
    return props.adapters || {}
  },
  get resource() {
    return props.resource
  },
  get storageMode() {
    return props.storageMode
  }
}

provideWebBuilderRuntime(runtime)
watchEffect(() => {
  setWebBuilderRuntime(runtime)
})
onBeforeUnmount(() => {
  clearWebBuilderRuntime()
})

const {
  activePanel,
  blockingProcessingActive,
  canvas,
  closeLayers,
  codeEditor,
  currentResourceExtJson,
  devices,
  editorChanges,
  editorInit,
  editorLoadingText,
  editorLoadingVisible,
  exitPreview,
  grapes,
  handleBottomDrop,
  handleBottomDropDragEnter,
  handleBottomDropDragLeave,
  handleBottomDropDragOver,
  handleCodeSave,
  handleImportDone,
  handleImportStart,
  handleOpenPageSettings,
  handlePublish,
  handleResetEditor,
  handleRestoreHistory,
  handleSaveDraft,
  handleSavePageSettings,
  handleSelectPanel,
  handleSidePanelResizeMove,
  imageManager,
  isBottomDropActive,
  isCodeRefreshing,
  isDev,
  isPageSwitching,
  isPreviewMode,
  isResizingSidePanel,
  isTempTemplateResource,
  layoutBundleManager,
  openPreview,
  openProjectsBrowser,
  pageResource,
  pageSettings,
  publishManager,
  refreshCodeForModal,
  registrationDiagnosticText,
  selected,
  selectedDevice,
  setDevice,
  showCode,
  showLayers,
  showLayoutPanel,
  showProjectsBrowser,
  showTemplatePanel,
  sidePanelGridStyle,
  startSidePanelResize,
  stopSidePanelResize,
  templateRuleOptions,
  templateRulesManager,
  toggleCode,
  toggleLayers,
  webBuilderI18n
} = useWebBuilderController(props)

defineExpose({ handleRestoreHistory })
</script>

<template>
  <div class="h-screen relative bg-white">
    <div
      v-if="registrationDiagnosticText"
      class="wb-registration-diagnostics"
      role="status"
      aria-live="polite"
    >
      <Icon icon="mdi:alert-outline" class="text-base" />
      <span>{{ registrationDiagnosticText }}</span>
    </div>
    <div class="h-full flex flex-col" v-show="editorInit.isEditorReady.value && !isPageSwitching">
      <TopBar
        v-show="!isPreviewMode"
        :show-layers="showLayers"
        :show-code="showCode"
        :is-publishing="publishManager.isPublishing.value"
        :grapes="grapes"
        :devices="devices"
        :selected-device="selectedDevice"
        :is-template-resource="isTempTemplateResource"
        @open-page-settings="handleOpenPageSettings"
        @toggle-layers="toggleLayers"
        @toggle-code="toggleCode"
        @browse-projects="openProjectsBrowser"
        @preview="openPreview"
        @reset-editor="handleResetEditor"
        @set-device="setDevice"
        @save-draft="handleSaveDraft"
        @publish="handlePublish"
        @import-start="handleImportStart"
        @import-done="handleImportDone"
      />
      <div
        class="flex-1 min-h-0"
        :class="isPreviewMode ? '' : 'grid'"
        :style="isPreviewMode ? undefined : sidePanelGridStyle"
      >
        <PanelRail
          v-show="!isPreviewMode"
          :active-panel="activePanel"
          :show-layout-panel="showLayoutPanel"
          :show-template-panel="showTemplatePanel"
          @select-panel="handleSelectPanel"
        />
        <div v-show="!isPreviewMode" class="relative min-h-0 overflow-hidden border-r bg-white">
          <div class="size-full overflow-y-auto overflow-x-hidden">
            <BlocksPanel
              v-if="activePanel === 'blocks'"
              :grapes="grapes"
              :resource-type="pageResource.resourceType"
              :resource-ext-json="currentResourceExtJson"
            />
            <LayoutPanel
              v-else-if="activePanel === 'layout'"
              :grapes="grapes"
              :ensure-rules-editable="layoutBundleManager.ensureRulesEditable"
              :get-rules-lock-state="layoutBundleManager.getRulesLockState"
              @change="editorChanges.markAsChanged"
            />
            <TemplateRulesPanel
              v-else-if="activePanel === 'template'"
              :current-template-type="templateRulesManager.currentTemplateType.value"
              :current-rules="templateRulesManager.currentRules.value"
              :ensure-rules-editable="templateRulesManager.ensureRulesEditable"
              :get-rules-lock-state="templateRulesManager.getRulesLockState"
              :add-rule="templateRulesManager.addRule"
              :patch-rule="templateRulesManager.patchRule"
              :remove-rule="templateRulesManager.removeRule"
              :get-field-options="templateRuleOptions.getOptions"
            />
            <I18nPanel
              v-else-if="activePanel === 'i18n'"
              :manager="webBuilderI18n"
              :selected-component="selected.getRawComponent?.()"
              :selected-revision="selected.revision"
            />
            <AssetsPanel v-else-if="activePanel === 'assets'" />
            <GlobalSettingsPanel
              v-else-if="activePanel === 'global'"
              :grapes="grapes"
              :is-editor-ready="editorInit.isEditorReady.value"
            />
            <StylesPropertiesPanel
              v-else-if="activePanel === 'styles'"
              :grapes="grapes"
              :image-manager="imageManager"
            />
          </div>
          <div
            class="absolute right-0 top-0 z-20 h-full w-1 cursor-col-resize bg-transparent transition-colors hover:bg-blue-300/70"
            :class="isResizingSidePanel ? 'bg-blue-400/80' : ''"
            @mousedown.prevent="startSidePanelResize"
          ></div>
        </div>
        <div class="relative size-full">
          <div
            ref="canvas"
            class="absolute inset-x-0 top-0"
            :class="isPreviewMode ? 'bottom-0' : 'bottom-14'"
          ></div>
          <div
            v-show="!isPreviewMode"
            class="absolute inset-x-0 bottom-0 h-14 border-t bg-white/95 backdrop-blur-sm flex items-center justify-center text-xs transition-colors"
            :class="
              isBottomDropActive
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-gray-200 text-gray-400'
            "
            @dragenter="handleBottomDropDragEnter"
            @dragleave="handleBottomDropDragLeave"
            @dragover="handleBottomDropDragOver"
            @drop="handleBottomDrop"
          >
            拖拽组件到这里，追加到页面底部（不影响页面代码结构）
          </div>
          <!-- 预览模式退出按钮 -->
          <button
            v-show="isPreviewMode"
            class="absolute top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-gray-900/80 text-white text-sm rounded-full hover:bg-gray-900 transition-colors backdrop-blur-sm"
            @click="exitPreview"
          >
            <Icon icon="mdi:eye-off-outline" class="text-base" />
            退出预览
          </button>
        </div>
        <div
          v-if="isResizingSidePanel"
          class="fixed inset-0 z-[9999] cursor-col-resize"
          @mousemove.prevent="handleSidePanelResizeMove"
          @mouseup.prevent="stopSidePanelResize"
        ></div>
      </div>
      <LayersPanel
        v-if="showLayers && !isPreviewMode"
        :grapes="grapes"
        @close="closeLayers"
      />

      <PageSettingsModal
        v-model="pageSettings.showPageSettings.value"
        :settings="pageSettings.pageSettings.value"
        :resource-type="pageResource.resourceType"
        :resource-ext-json="currentResourceExtJson"
        @save="handleSavePageSettings"
      />
      <CodeModal
        v-if="isDev"
        v-model="showCode"
        :html="codeEditor.html.value"
        :css="codeEditor.css.value"
        :js="codeEditor.js.value"
        :refreshing="isCodeRefreshing"
        @refresh="refreshCodeForModal"
        @save="handleCodeSave"
      />
      <AssetsModal
        v-model="imageManager.showAssetsDialog.value"
        :grapes="grapes"
        :image-replacement-target="imageManager.imageReplacementTarget.value"
        @image-selected="imageManager.handleImageSelected"
      />
      <ProjectsBrowserModal v-model="showProjectsBrowser" />
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
          正在处理复杂任务，请保持页面打开
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./assets/webbuilder-shell.scss"></style>
