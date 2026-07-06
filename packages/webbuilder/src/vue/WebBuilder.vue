<script setup lang="ts">
import { computed, markRaw, onBeforeUnmount, provide, ref, shallowRef, watch } from 'vue'
import grapesjs from 'grapesjs'
import type { Editor, EditorConfig } from 'grapesjs'
import './styles/tooto-grapes.css'
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
  type WebBuilderSelfStorageOptions,
  type EditLockState,
} from '../core/index.js'
import PanelRail from './PanelRail.vue'
import PageSettingsDrawer from './PageSettingsDrawer.vue'
import PluginPanelHost from './PluginPanelHost.vue'
import TopBar from './TopBar.vue'
import WebBuilderShell from './WebBuilderShell.vue'
import { WEB_BUILDER_CONTEXT, type WebBuilderContext } from './context.js'
import { AssetsModalHost, getBuiltinPanelComponent, ModalHost } from './panels/index.js'
import { mergeTheme } from './theme.js'
import { resolveShellMessages } from './messages.js'
import {
  useAutosaveController,
  useDraftController,
  useLockController,
  usePublishController,
  useRevisionController,
} from './controllers/index.js'
import { useCanvasSetup } from './useCanvasSetup.js'
import {
  applyPageSettingsToPage,
  createEmptyPageSettings,
  getPageSettingsFromPage,
  getPrimaryContentPageFromEditor,
  type PageSettings,
} from './pageSettings.js'

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
  (event: 'save-success', projectData: Record<string, unknown> | null, editor: Editor | null): void
  (event: 'publish-success', projectData: Record<string, unknown> | null, editor: Editor | null): void
  (event: 'lock-changed', state: EditLockState): void
  (event: 'back'): void
  (event: 'diagnostics', diagnostics: WebBuilderPluginActivationDiagnostic[]): void
}>()

const editor = shallowRef<Editor | null>(null)
const editorReady = ref(false)
const isPreviewMode = ref(false)
const showBorders = ref(false)
const showCode = ref(false)
const activePanel = ref('blocks')
const diagnostics = ref<WebBuilderPluginActivationDiagnostic[]>([])
const isLoadingDraft = ref(false)
const pageSettingsVisible = ref(false)
const pageSettings = ref<PageSettings>(createEmptyPageSettings())
let canvasSetupCleanup: (() => void) | null = null
const INITIAL_DRAFT_SETTLE_MS = 1500
let draftLoadSettleTimer: ReturnType<typeof setTimeout> | null = null
const COMPONENT_OUTLINE_COMMAND = 'core:component-outline'

const resolvedOptions = computed(() => resolveWebBuilderOptions(props.options))
const grapesConfig = computed(() => {
  const config = resolvedOptions.value.grapesjs
  return {
    ...config,
    assetManager: {
      ...(config.assetManager ?? {}),
      custom: config.assetManager?.custom ?? true,
    },
  } as EditorConfig
})
const storageOptions = computed(() => resolvedOptions.value.storage)
const sessionOptions = computed(() => resolvedOptions.value.session)

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

const resolvedTheme = computed(() => mergeTheme(resolvedOptions.value.theme))

const themeVars = computed(() =>
  Object.fromEntries(Object.entries(resolvedTheme.value)),
)

const shellMessages = computed(() => resolveShellMessages(resolvedOptions.value.i18n))

const TEMPLATE_RESOURCE_TYPES = new Set([
  'TEMP_POST_DETAIL',
  'TEMP_POST_CATEGORY_LIST',
  'TEMP_MEDIA_DETAIL',
  'TEMP_MEDIA_CATEGORY_LIST',
  'TEMP_PRODUCT_DETAIL',
  'TEMP_PRODUCT_CATEGORY_LIST',
  'TEMP_LOOP_ITEM',
  'TEMP_POPUP',
])

const isTemplateResource = computed(() =>
  TEMPLATE_RESOURCE_TYPES.has(`${resolvedOptions.value.resource.resourceType ?? ''}`.trim()),
)

const pageSettingsTitle = computed(() =>
  isTemplateResource.value
    ? shellMessages.value['topbar.templateSettings']
    : shellMessages.value['topbar.pageSettings'],
)

const sidePanelGridStyle = computed(() => ({
  gridTemplateColumns: 'var(--wb-rail-width) var(--wb-side-panel-width) minmax(0, 1fr)',
}))

const diagnosticText = computed(() =>
  diagnostics.value.map(item => `${item.pluginId}: ${item.message}`).join('；'),
)

const getProjectData = () => editor.value?.getProjectData() as Record<string, unknown> | null ?? null
const getPlugins = () => resolvedOptions.value.plugins
const isSelfStorageOptions = (
  storage: typeof storageOptions.value,
): storage is WebBuilderSelfStorageOptions =>
  Boolean(storage && 'type' in storage && storage.type === 'self')

const hasDraftLoadSource = () =>
  isSelfStorageOptions(storageOptions.value) ||
  Boolean(storageOptions.value && 'getDraft' in storageOptions.value) ||
  Boolean(resolvedOptions.value.hostServices.page?.getDraft)

const hasDraftSaveSource = () =>
  isSelfStorageOptions(storageOptions.value) ||
  Boolean(storageOptions.value && 'saveDraft' in storageOptions.value) ||
  Boolean(resolvedOptions.value.hostServices.page?.saveDraft)

const autosaveOptions = computed(() => ({
  ...resolvedOptions.value.autosave,
  autosaveChanges:
    isSelfStorageOptions(storageOptions.value)
      ? storageOptions.value.autosaveChanges
      : resolvedOptions.value.autosave?.autosaveChanges,
}))

const draftController = useDraftController({
  editor: () => editor.value,
  resource: () => resolvedOptions.value.resource,
  hostServices: resolvedOptions.value.hostServices,
  storage: storageOptions.value,
  plugins: getPlugins,
  commands: resolvedOptions.value.commands,
  tenant: resolvedOptions.value.tenant,
  settings: resolvedOptions.value.settings,
  ui: resolvedOptions.value.ui,
  route: resolvedOptions.value.route,
  getSessionKey: sessionOptions.value?.getSessionKey,
})

const autosaveController = useAutosaveController({
  saveDraft: draftController.saveDraft,
  options: autosaveOptions.value,
})

const publishController = usePublishController({
  editor: () => editor.value,
  resource: () => resolvedOptions.value.resource,
  hostServices: resolvedOptions.value.hostServices,
  saveDraft: draftController.saveDraft,
  plugins: getPlugins,
  commands: resolvedOptions.value.commands,
  tenant: resolvedOptions.value.tenant,
  settings: resolvedOptions.value.settings,
  ui: resolvedOptions.value.ui,
  route: resolvedOptions.value.route,
  getSessionKey: sessionOptions.value?.getSessionKey,
  getBaseUpdateTime: () => draftController.baseUpdateTime.value,
  setBaseUpdateTime: value => {
    draftController.baseUpdateTime.value = value
  },
})

const lockController = useLockController({
  editor: () => editor.value,
  resource: () => resolvedOptions.value.resource,
  hostServices: resolvedOptions.value.hostServices,
  ui: resolvedOptions.value.ui,
  getSessionKey: sessionOptions.value?.getSessionKey,
})

const revisionController = useRevisionController({
  editor: () => editor.value,
  resource: () => resolvedOptions.value.resource,
  hostServices: resolvedOptions.value.hostServices,
  plugins: getPlugins,
  commands: resolvedOptions.value.commands,
  tenant: resolvedOptions.value.tenant,
  settings: resolvedOptions.value.settings,
  ui: resolvedOptions.value.ui,
  route: resolvedOptions.value.route,
  markDirty: draftController.markDirty,
})

const controllers = {
  draft: draftController,
  autosave: autosaveController,
  publish: publishController,
  lock: lockController,
  revision: revisionController,
}

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
  get controllers() {
    return controllers
  },
}

provide(WEB_BUILDER_CONTEXT, webBuilderContext)

defineExpose({
  controllers,
  handleRestoreHistory: revisionController.restore,
})

watch(
  () => lockController.lockState.value,
  state => emit('lock-changed', state),
  { deep: true },
)

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

const loadInitialDraft = async () => {
  if (!hasDraftLoadSource()) return

  clearDraftLoadSettleTimer()
  isLoadingDraft.value = true
  try {
    await draftController.loadDraft()
  } finally {
    scheduleDraftLoadSettled()
  }
}

const clearDraftLoadSettleTimer = () => {
  if (!draftLoadSettleTimer) return
  clearTimeout(draftLoadSettleTimer)
  draftLoadSettleTimer = null
}

const scheduleDraftLoadSettled = () => {
  clearDraftLoadSettleTimer()
  draftLoadSettleTimer = setTimeout(() => {
    isLoadingDraft.value = false
    draftLoadSettleTimer = null
  }, INITIAL_DRAFT_SETTLE_MS)
}

const onReady = (activeEditor: Editor) => {
  const rawEditor = markRaw(activeEditor)
  editor.value = rawEditor
  editorReady.value = true
  showBorders.value = rawEditor.Commands.isActive(COMPONENT_OUTLINE_COMMAND)
  canvasSetupCleanup?.()
  canvasSetupCleanup = useCanvasSetup(rawEditor, {
    frameReset: resolvedOptions.value.canvas.frameReset,
  })

  const initialComponents = resolvedOptions.value.canvas.initialComponents
  if (initialComponents) {
    rawEditor.setComponents(initialComponents)
  }

  void loadInitialDraft()
  if (resolvedOptions.value.hostServices.lock?.acquire) {
    void lockController.acquire()
  }

  emit('ready', rawEditor)
}

const onUpdate = (projectData: unknown, activeEditor: Editor) => {
  if (!isLoadingDraft.value) {
    draftController.markDirty()
    autosaveController.recordChange()
  }
  emit('update', projectData as Record<string, unknown>, activeEditor)
}

const selectPanel = (panelId: string) => {
  activePanel.value = panelId
}

const getEditablePage = () => {
  const activeEditor = editor.value
  if (!activeEditor) return null
  return getPrimaryContentPageFromEditor(activeEditor)
}

const openPageSettings = () => {
  const page = getEditablePage()
  if (!page) {
    resolvedOptions.value.ui.message.warning('未找到可编辑页面')
    return
  }

  pageSettings.value = getPageSettingsFromPage(page)
  pageSettingsVisible.value = true
}

const handleSavePageSettings = (settings: PageSettings) => {
  const activeEditor = editor.value
  const page = getEditablePage()
  if (!activeEditor || !page) return

  applyPageSettingsToPage(page, settings)
  pageSettings.value = settings
  draftController.markDirty()
  autosaveController.recordChange()
  emit('update', getProjectData() ?? {}, activeEditor)
  activeEditor.refresh?.({ tools: true })
}

const builtinPanelFor = (panelId: string) => {
  return getBuiltinPanelComponent(panelId)
}

const handleSaveDraft = async () => {
  if (!hasDraftSaveSource()) {
    emit('save', getProjectData(), editor.value)
    return
  }

  const saved = await draftController.saveDraft()
  if (saved) {
    emit('save-success', getProjectData(), editor.value)
  }
}

const handlePublish = async () => {
  if (!resolvedOptions.value.hostServices.page?.publish) {
    emit('publish', getProjectData(), editor.value)
    return
  }

  const published = await publishController.publish()
  if (published) {
    emit('publish-success', getProjectData(), editor.value)
  }
}

const handleToggleBorders = () => {
  const activeEditor = editor.value
  if (!activeEditor) return

  const nextShowBorders = !showBorders.value
  showBorders.value = nextShowBorders

  if (nextShowBorders) {
    activeEditor.runCommand(COMPONENT_OUTLINE_COMMAND)
    return
  }

  activeEditor.stopCommand(COMPONENT_OUTLINE_COMMAND)
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
  clearDraftLoadSettleTimer()
  autosaveController.stop()
  lockController.stopHeartbeat()
  void lockController.release()
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
      :style="themeVars"
      :theme="resolvedTheme"
      :messages="shellMessages"
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
            :show-code="showCode"
            :show-borders="showBorders"
            :messages="shellMessages"
            :branding="resolvedOptions.branding"
            :is-template-resource="isTemplateResource"
            @back="emit('back')"
            @open-page-settings="openPageSettings"
            @toggle-borders="handleToggleBorders"
            @toggle-code="showCode = !showCode"
            @preview="togglePreview"
            :is-publishing="publishController.isPublishing.value"
            @save-draft="handleSaveDraft"
            @publish="handlePublish"
            @export-project="handleSaveDraft"
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

      <template #modals>
        <slot
          name="modals"
          :editor="editor"
          :page-settings="pageSettings"
          :page-settings-visible="pageSettingsVisible"
        >
          <PageSettingsDrawer
            v-model:show="pageSettingsVisible"
            :settings="pageSettings"
            :title="pageSettingsTitle"
            :resource-type="resolvedOptions.resource.resourceType"
            :page-settings-service="resolvedOptions.hostServices.pageSettings"
            @save="handleSavePageSettings"
          />
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
