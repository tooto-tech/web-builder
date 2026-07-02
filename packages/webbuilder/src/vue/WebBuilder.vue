<script setup lang="ts">
import { computed, onBeforeUnmount, provide, ref } from 'vue'
import grapesjs from 'grapesjs'
import type { Editor, EditorConfig } from 'grapesjs'
import 'grapesjs/dist/css/grapes.min.css'
import { Canvas, GjsEditor } from '@tootix/grapesjs-vue'
import type { PluginTypeToLoad } from '@tootix/grapesjs-vue'

import {
  collectBuiltinWebBuilderPanels,
  collectWebBuilderPanelContributions,
  createGrapesPluginDescriptor,
  resolveWebBuilderOptions,
  type WebBuilderOptions,
  type WebBuilderPanelContribution,
  type WebBuilderPluginActivationDiagnostic,
  type WebBuilderPluginContext,
} from '../core/index.js'
import PanelRail from './PanelRail.vue'
import PluginPanelHost from './PluginPanelHost.vue'
import TopBar from './TopBar.vue'
import WebBuilderShell from './WebBuilderShell.vue'
import { WEB_BUILDER_CONTEXT, type WebBuilderContext } from './context.js'
import { AssetsModalHost, getBuiltinPanelComponent, ModalHost } from './panels/index.js'
import { useCanvasSetup } from './useCanvasSetup.js'

const props = withDefaults(defineProps<{
  options?: WebBuilderOptions
}>(), {
  options: () => ({}),
})

const emit = defineEmits<{
  (event: 'ready', editor: Editor): void
  (event: 'update', projectData: Record<string, unknown>, editor: Editor): void
  (event: 'save', projectData: Record<string, unknown> | null, editor: Editor | null): void
  (event: 'publish', projectData: Record<string, unknown> | null, editor: Editor | null): void
  (event: 'back'): void
  (event: 'diagnostics', diagnostics: WebBuilderPluginActivationDiagnostic[]): void
}>()

const editor = ref<Editor | null>(null)
const editorReady = ref(false)
const isPreviewMode = ref(false)
const showBorders = ref(false)
const showLayers = ref(false)
const showCode = ref(false)
const activePanel = ref('blocks')
const diagnostics = ref<WebBuilderPluginActivationDiagnostic[]>([])
let canvasSetupCleanup: (() => void) | null = null

const resolvedOptions = computed(() => resolveWebBuilderOptions(props.options))
const grapesConfig = computed(() => resolvedOptions.value.grapesjs as EditorConfig)

const panelContributions = computed<WebBuilderPanelContribution[]>(() =>
  collectWebBuilderPanelContributions(resolvedOptions.value.plugins),
)

const availablePanels = computed<WebBuilderPanelContribution[]>(() =>
  collectBuiltinWebBuilderPanels(panelContributions.value),
)

const activePanelContribution = computed(() =>
  availablePanels.value.find(panel => panel.id === activePanel.value) ?? null,
)

const activePluginPanelContribution = computed(() =>
  panelContributions.value.find(panel => panel.id === activePanel.value) ?? null,
)

const isActivePanelFullWidth = computed(() =>
  activePluginPanelContribution.value?.layout === 'full',
)

const activePanelTitle = computed(() => {
  return activePanelContribution.value?.label ?? activePanel.value
})

const sidePanelGridStyle = computed(() => ({
  gridTemplateColumns: '40px 280px minmax(0, 1fr)',
}))

const diagnosticText = computed(() =>
  diagnostics.value.map(item => `${item.pluginId}: ${item.message}`).join('；'),
)

const getProjectData = () => editor.value?.getProjectData() as Record<string, unknown> | null ?? null

const webBuilderContext: WebBuilderContext = {
  get editor() {
    if (!editor.value) {
      throw new Error('WebBuilder editor is not ready')
    }
    return editor.value
  },
  get capabilities() {
    return resolvedOptions.value.capabilities.snapshot
  },
  get hostServices() {
    return resolvedOptions.value.hostServices
  },
  get settings() {
    return resolvedOptions.value.settings
  },
  get ui() {
    return resolvedOptions.value.ui
  },
}

provide(WEB_BUILDER_CONTEXT, webBuilderContext)

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message || 'Plugin activation failed')
  }
  return 'Plugin activation failed'
}

const pushDiagnostic = (
  pluginId: string,
  error: unknown,
) => {
  diagnostics.value = [
    ...diagnostics.value,
    {
      pluginId,
      message: getErrorMessage(error),
      error,
    },
  ]
  emit('diagnostics', diagnostics.value)
}

const grapesPlugins = computed<PluginTypeToLoad[]>(() =>
  resolvedOptions.value.plugins.map((feature) => {
    const descriptor = createGrapesPluginDescriptor(feature, (activeEditor) => ({
      resource: resolvedOptions.value.resource,
      projectData: getProjectData(),
      usedComponentTypes: new Set<string>(),
      capabilityIds: resolvedOptions.value.capabilities.capabilityIds,
      tenant: resolvedOptions.value.tenant,
      editor: activeEditor,
      commands: resolvedOptions.value.commands,
      hostServices: resolvedOptions.value.hostServices,
      settings: resolvedOptions.value.settings,
      ui: resolvedOptions.value.ui,
      route: resolvedOptions.value.route,
      registerCleanup: () => undefined,
    } satisfies WebBuilderPluginContext))

    return {
      id: descriptor.id,
      plugin(activeEditor: Editor) {
        try {
          return descriptor.plugin(activeEditor, {})
        } catch (error) {
          pushDiagnostic(feature.id, error)
          return undefined
        }
      },
    } as unknown as PluginTypeToLoad
  }),
)

const onReady = (activeEditor: Editor) => {
  editor.value = activeEditor
  editorReady.value = true
  canvasSetupCleanup?.()
  canvasSetupCleanup = useCanvasSetup(activeEditor, {
    frameReset: resolvedOptions.value.canvas.frameReset,
    bottomDropZone: resolvedOptions.value.canvas.bottomDropZone,
  })

  const initialComponents = resolvedOptions.value.canvas.initialComponents
  if (initialComponents) {
    activeEditor.setComponents(initialComponents)
  }

  emit('ready', activeEditor)
}

const onUpdate = (projectData: unknown, activeEditor: Editor) => {
  emit('update', projectData as Record<string, unknown>, activeEditor)
}

const selectPanel = (panelId: string) => {
  activePanel.value = panelId
}

const builtinPanelFor = (panelId: string) => {
  return getBuiltinPanelComponent(panelId)
}

const emitProjectEvent = (event: 'save' | 'publish') => {
  if (event === 'save') {
    emit('save', getProjectData(), editor.value)
    return
  }
  emit('publish', getProjectData(), editor.value)
}

const togglePreview = () => {
  const activeEditor = editor.value
  if (!activeEditor) return
  isPreviewMode.value = true
  activeEditor.runCommand('preview')
}

const exitPreview = () => {
  const activeEditor = editor.value
  if (!activeEditor) {
    isPreviewMode.value = false
    return
  }
  isPreviewMode.value = false
  activeEditor.stopCommand('preview')
}

onBeforeUnmount(() => {
  canvasSetupCleanup?.()
  canvasSetupCleanup = null
})
</script>

<template>
  <GjsEditor
    :grapesjs="grapesjs"
    :options="grapesConfig"
    :plugins="grapesPlugins"
    @ready="onReady"
    @update="onUpdate"
  >
    <WebBuilderShell
      :editor-ready="editorReady"
      :registration-diagnostic-text="diagnosticText"
      :is-preview-mode="isPreviewMode"
      :is-active-panel-full-width="isActivePanelFullWidth"
      :side-panel-grid-style="sidePanelGridStyle"
      :editor-loading-visible="!editorReady"
      editor-loading-text="Loading WebBuilder"
      @exit-preview="exitPreview"
    >
      <template #top-bar>
        <slot
          name="top-bar"
          :active-panel="activePanel"
          :editor="editor"
          :panels="availablePanels"
          :select-panel="selectPanel"
        >
          <TopBar
            :show-layers="showLayers"
            :show-code="showCode"
            :show-borders="showBorders"
            @back="emit('back')"
            @open-page-settings="selectPanel('settings')"
            @toggle-borders="showBorders = !showBorders"
            @toggle-layers="showLayers = !showLayers"
            @toggle-code="showCode = !showCode"
            @preview="togglePreview"
            @save-draft="emitProjectEvent('save')"
            @publish="emitProjectEvent('publish')"
            @export-project="emitProjectEvent('save')"
            @import-project="selectPanel('assets')"
            @reset-editor="editor?.setComponents('')"
          />
        </slot>
      </template>

      <template #rail>
        <slot
          name="rail"
          :active-panel="activePanel"
          :panels="availablePanels"
          :select-panel="selectPanel"
        >
          <PanelRail
            :active-panel="activePanel"
            :panels="availablePanels"
            @select-panel="selectPanel"
          />
        </slot>
      </template>

      <template #side-panel>
        <slot
          name="side-panel"
          :active-panel="activePanel"
          :editor="editor"
          :panels="availablePanels"
          :select-panel="selectPanel"
        >
          <component
            :is="builtinPanelFor(activePanel)"
            v-if="builtinPanelFor(activePanel)"
          />
          <PluginPanelHost
            v-else-if="activePluginPanelContribution?.component && activePluginPanelContribution.layout !== 'full'"
            :panels="panelContributions"
            :active-panel-id="activePanel"
          />
          <div v-else class="wb-default-panel">
            <div class="wb-default-panel__title">{{ activePanelTitle }}</div>
            <div class="wb-default-panel__empty">No panel is registered for this section.</div>
          </div>
        </slot>
      </template>

      <template #full-panel>
        <slot
          name="full-panel"
          :active-panel="activePanel"
          :editor="editor"
          :panels="availablePanels"
          :select-panel="selectPanel"
        >
          <PluginPanelHost
            :panels="panelContributions"
            :active-panel-id="activePanel"
          />
        </slot>
      </template>

      <template #canvas>
        <slot
          name="canvas"
          :editor="editor"
        >
          <Canvas />
        </slot>
      </template>
    </WebBuilderShell>
    <ModalHost />
    <AssetsModalHost />
  </GjsEditor>
</template>

<style scoped>
.wb-default-panel {
  min-height: 100%;
  padding: 16px;
  color: #111827;
  background: #fff;
}

.wb-default-panel__title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.wb-default-panel__empty {
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  padding: 16px;
  color: #6b7280;
  font-size: 12px;
  line-height: 18px;
}
</style>
