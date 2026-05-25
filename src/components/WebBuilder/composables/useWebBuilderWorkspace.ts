import { computed, markRaw, ref, shallowRef, watch, type ComputedRef, type Ref } from 'vue'
import useWebBuilderSession, {
  type UseWebBuilderSessionOptions,
  type WebBuilderBlockingAction,
  type WebBuilderBlockingMessage,
} from './useWebBuilderSession'

export type { WebBuilderBlockingAction, WebBuilderBlockingMessage } from './useWebBuilderSession'

export type WebBuilderPanelId =
  | 'blocks'
  | 'styles'
  | 'i18n'
  | 'global'
  | 'assets'
  | 'layout'
  | 'template'

type RefLike<T> = Ref<T> | ComputedRef<T>

const toModelList = (input: any): any[] => {
  if (Array.isArray(input)) return input
  if (Array.isArray(input?.models)) return input.models
  return []
}

const readDeviceId = (device: any) =>
  device?.get?.('id') ?? device?.id ?? device?.cid ?? null

export interface UseWebBuilderWorkspaceOptions extends UseWebBuilderSessionOptions {
  isDev: boolean
  grapes: any
  selectedKey: RefLike<unknown>
  showLayoutPanel: RefLike<boolean>
  showTemplatePanel: RefLike<boolean>
  blockingProcessingActive: RefLike<boolean>
  blockingProcessMessage: RefLike<string>
  isEditorReady: RefLike<boolean>
  isPageSwitching: RefLike<boolean>
  canOpenPageSettings: () => boolean
  openPageSettings: () => void
  runAfterProjectLoadPaint: (callback: () => void) => void
  pauseEditorTracking: () => void
}

export default function useWebBuilderWorkspace(options: UseWebBuilderWorkspaceOptions) {
  const activePanel = ref<WebBuilderPanelId>('blocks')
  const showLayers = ref(true)
  const showCode = ref(false)
  const showProjectsBrowser = ref(false)
  const isImporting = ref(false)
  const devices = ref<any[]>([])
  const selectedDevice = ref<any>(null)
  const editorRef = shallowRef<any>(null)
  const session = useWebBuilderSession(options)

  watch(
    options.selectedKey,
    (key) => {
      if (key) {
        if (activePanel.value === 'i18n') return
        activePanel.value = 'styles'
        return
      }

      if (activePanel.value === 'styles') {
        activePanel.value = 'blocks'
      }
    },
    { immediate: true }
  )

  watch(
    options.showLayoutPanel,
    (visible) => {
      if (!visible && activePanel.value === 'layout') {
        activePanel.value = 'blocks'
      }
    },
    { flush: 'sync' }
  )

  watch(
    options.showTemplatePanel,
    (visible) => {
      if (!visible && activePanel.value === 'template') {
        activePanel.value = 'blocks'
      }
    },
    { flush: 'sync' }
  )

  const handleSelectPanel = (panel: WebBuilderPanelId) => {
    if (panel === 'layout' && !options.showLayoutPanel.value) return
    if (panel === 'template' && !options.showTemplatePanel.value) return
    activePanel.value = panel
  }

  const resetPanelAfterSelectionCleared = (editor?: any, currentEditor?: any) => {
    if (currentEditor && editor && currentEditor !== editor) return
    try {
      if (!editor?.getSelected?.()) {
        activePanel.value = 'blocks'
      }
    } catch {
      // Editor may already be partially destroyed while leaving WebBuilder.
    }
  }

  const toggleLayers = () => {
    showLayers.value = !showLayers.value
  }

  const closeLayers = () => {
    showLayers.value = false
  }

  const toggleCode = () => {
    if (!options.isDev) return
    showCode.value = !showCode.value
  }

  const closeCode = () => {
    showCode.value = false
  }

  const openProjectsBrowser = () => {
    showProjectsBrowser.value = true
  }

  const handleOpenPageSettings = () => {
    if (!options.canOpenPageSettings()) return
    options.openPageSettings()
  }

  const handleImportStart = () => {
    isImporting.value = true
    options.pauseEditorTracking()
  }

  const handleImportDone = () => {
    options.runAfterProjectLoadPaint(() => {
      options.resumeEditorTracking(true)
      isImporting.value = false
    })
  }

  const setDevice = (deviceOrId: any) => {
    const editor = editorRef.value
    const deviceManager = editor?.Devices ?? editor?.DeviceManager
    if (!deviceManager) return
    const rawDevice = deviceOrId?._model ?? deviceOrId
    deviceManager.select(rawDevice)
    selectedDevice.value = markRaw(deviceManager.getSelected?.() ?? rawDevice)
  }

  options.grapes.onInit((editor: any) => {
    editorRef.value = editor
    const deviceManager = editor.Devices ?? editor.DeviceManager

    const refreshDevices = () => {
      devices.value = toModelList(deviceManager.getAll?.()).map((device) => markRaw(device))
    }

    const updateSelectedDevice = (device: any) => {
      const currentDeviceId = readDeviceId(selectedDevice.value)
      const nextDeviceId = readDeviceId(device)
      if (currentDeviceId && nextDeviceId && currentDeviceId === nextDeviceId) return
      selectedDevice.value = device ? markRaw(device) : null
    }

    refreshDevices()
    updateSelectedDevice(deviceManager.getSelected?.())

    editor.on('device:select', updateSelectedDevice)
    editor.on('device:add', refreshDevices)
    editor.on('device:remove', refreshDevices)
    editor.on('destroy', () => {
      editor.off?.('device:select', updateSelectedDevice)
      editor.off?.('device:add', refreshDevices)
      editor.off?.('device:remove', refreshDevices)
    })
  })

  const editorLoadingVisible = computed(
    () =>
      options.blockingProcessingActive.value ||
      !options.isEditorReady.value ||
      options.isPageSwitching.value ||
      isImporting.value ||
      session.restoringHistoryId.value !== null
  )

  const editorLoadingText = computed(() => {
    if (options.blockingProcessingActive.value) {
      return options.blockingProcessMessage.value || '正在处理任务...'
    }
    if (isImporting.value) return '正在导入项目...'
    if (session.restoringHistoryId.value !== null) return '正在恢复历史版本...'
    if (options.isPageSwitching.value) return '正在切换页面...'
    return 'toototech数字营销网站管理系统'
  })

  const workspace = {
    activePanel,
    showLayers,
    showCode,
    showProjectsBrowser,
    isImporting,
    devices,
    selectedDevice,
    restoringHistoryId: session.restoringHistoryId,
    historyPanelRefreshKey: session.historyPanelRefreshKey,
    isPreviewMode: session.isPreviewMode,
    i18nPreviewSourceProjectData: session.i18nPreviewSourceProjectData,
    editorLoadingVisible,
    editorLoadingText,
    handleSelectPanel,
    resetPanelAfterSelectionCleared,
    toggleLayers,
    closeLayers,
    toggleCode,
    closeCode,
    openProjectsBrowser,
    handleOpenPageSettings,
    loadI18nPreview: session.loadI18nPreview,
    restoreI18nPreview: session.restoreI18nPreview,
    openPreview: session.openPreview,
    exitPreview: session.exitPreview,
    handleSaveDraft: session.handleSaveDraft,
    handlePublish: session.handlePublish,
    getLeaveConfirmationState: session.getLeaveConfirmationState,
    handleImportStart,
    handleImportDone,
    setDevice,
    handleRestoreHistory: session.handleRestoreHistory,
  }

  return workspace
}
