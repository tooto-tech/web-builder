import { computed, nextTick, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('element-plus', () => ({
  ElMessageBox: { confirm: vi.fn() },
}))

vi.mock('@/components/WebBuilder/utils/wbMessage', () => ({
  wbMessage: { warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() },
}))

vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
  cb(0)
  return 0
})

import { ElMessageBox } from 'element-plus'
import { wbMessage } from '@/components/WebBuilder/utils/wbMessage'
import useWebBuilderWorkspace from './useWebBuilderWorkspace'

const mockedConfirm = vi.mocked(ElMessageBox.confirm)
const mockedMessage = vi.mocked(wbMessage)

const makeEditor = () => ({
  getProjectData: vi.fn(() => ({ pages: [{ id: 'home' }] })),
  runCommand: vi.fn(),
  stopCommand: vi.fn(),
})

const makeGrapes = () => {
  const initHandlers: Array<(editor: any) => void> = []
  return {
    _cache: {} as Record<string, any>,
    onInit: vi.fn((handler: (editor: any) => void) => {
      initHandlers.push(handler)
    }),
    emitInit(editor: any) {
      initHandlers.forEach((handler) => handler(editor))
    },
  }
}

const makeOptions = (overrides: Record<string, any> = {}) => {
  const editor = overrides.editor ?? makeEditor()
  const selectedKey = overrides.selectedKey ?? ref<string | null>(null)
  const showLayoutPanel = overrides.showLayoutPanel ?? ref(false)
  const showTemplatePanel = overrides.showTemplatePanel ?? ref(false)
  const blockingProcessingActive = overrides.blockingProcessingActive ?? ref(false)
  const blockingProcessMessage = overrides.blockingProcessMessage ?? ref('')
  const isEditorReady = overrides.isEditorReady ?? ref(true)
  const isPageSwitching = overrides.isPageSwitching ?? ref(false)

  return {
    editor,
    selectedKey,
    showLayoutPanel,
    showTemplatePanel,
    blockingProcessingActive,
    blockingProcessMessage,
    isEditorReady,
    isPageSwitching,
    options: {
      isDev: true,
      grapes: overrides.grapes ?? makeGrapes(),
      selectedKey,
      showLayoutPanel,
      showTemplatePanel,
      blockingProcessingActive,
      blockingProcessMessage,
      isEditorReady,
      isPageSwitching,
      getEditor: () => editor,
      canOpenPageSettings: () => true,
      openPageSettings: vi.fn(),
      runAfterProjectLoadPaint: (callback: () => void) => callback(),
      startBlockingProcess: vi.fn(),
      stopBlockingProcess: vi.fn(),
      setBlockingProcessMessage: vi.fn(),
      ensureI18nReadyOrConfirmed: vi.fn(async () => true),
      getI18nEntries: vi.fn(() => [{ translation: 'translated' }]),
      getI18nPreviewProjectData: vi.fn(() => ({ pages: [{ id: 'preview' }] })),
      loadI18nPreviewProjectData: vi.fn(async () => undefined),
      refreshI18nSourceEntries: vi.fn(),
      autoTranslateMissing: vi.fn(async () => true),
      resourceTransaction: {
        flushDrafts: vi.fn(async () => ({ success: true, failures: [], warnings: [] })),
        publish: vi.fn(async () => ({ success: true, failures: [], warnings: [] })),
      },
      hasCurrentResourceChanges: vi.fn(() => true),
      updateCurrentResourceBaseline: vi.fn(),
      markEditorSaved: vi.fn(),
      markEditorChanged: vi.fn(),
      pauseEditorTracking: vi.fn(),
      resumeEditorTracking: vi.fn(),
      hasEditorChanges: vi.fn(() => false),
      hasUnsavedEditorWork: vi.fn(() => false),
      parseProjectData: vi.fn((raw: string) => JSON.parse(raw)),
      applyProjectDataToEditor: vi.fn(async () => undefined),
      ...overrides.options,
    },
  }
}

describe('useWebBuilderWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedConfirm.mockResolvedValue('confirm' as any)
  })

  it('keeps panel selection consistent with component selection and panel availability', async () => {
    const ctx = makeOptions()
    const workspace = useWebBuilderWorkspace(ctx.options)

    expect(workspace.activePanel.value).toBe('blocks')

    ctx.selectedKey.value = 'cmp-1'
    await nextTick()
    expect(workspace.activePanel.value).toBe('styles')

    workspace.handleSelectPanel('i18n')
    ctx.selectedKey.value = 'cmp-2'
    await nextTick()
    expect(workspace.activePanel.value).toBe('i18n')

    workspace.handleSelectPanel('layout')
    expect(workspace.activePanel.value).toBe('i18n')

    ctx.showLayoutPanel.value = true
    workspace.handleSelectPanel('layout')
    expect(workspace.activePanel.value).toBe('layout')

    ctx.showLayoutPanel.value = false
    await nextTick()
    expect(workspace.activePanel.value).toBe('blocks')
  })

  it('toggles dev-only code state, layer state, imports, and loading text', () => {
    const ctx = makeOptions({
      isEditorReady: ref(false),
      options: { isDev: false },
    })
    const workspace = useWebBuilderWorkspace(ctx.options)

    expect(workspace.showLayers.value).toBe(true)
    workspace.toggleLayers()
    expect(workspace.showLayers.value).toBe(false)

    workspace.toggleCode()
    expect(workspace.showCode.value).toBe(false)

    expect(workspace.editorLoadingVisible.value).toBe(true)
    expect(workspace.editorLoadingText.value).toBe('toototech数字营销网站管理系统')

    workspace.handleImportStart()
    expect(workspace.isImporting.value).toBe(true)
    expect(ctx.options.pauseEditorTracking).toHaveBeenCalled()
    expect(workspace.editorLoadingText.value).toBe('正在导入项目...')

    workspace.handleImportDone()
    expect(ctx.options.resumeEditorTracking).toHaveBeenCalledWith(true)
    expect(workspace.isImporting.value).toBe(false)
  })

  it('enters and restores i18n preview while preserving dirty state', async () => {
    const editor = makeEditor()
    const ctx = makeOptions({
      editor,
      options: {
        hasEditorChanges: vi.fn(() => true),
      },
    })
    const workspace = useWebBuilderWorkspace(ctx.options)

    await workspace.openPreview()

    expect(ctx.options.loadI18nPreviewProjectData).toHaveBeenCalledWith({
      pages: [{ id: 'preview' }],
    })
    expect(editor.runCommand).toHaveBeenCalledWith('core:preview')
    expect(workspace.isPreviewMode.value).toBe(true)

    await workspace.exitPreview()

    expect(editor.stopCommand).toHaveBeenCalledWith('core:preview')
    expect(ctx.options.loadI18nPreviewProjectData).toHaveBeenLastCalledWith({
      pages: [{ id: 'home' }],
    })
    expect(ctx.options.markEditorChanged).toHaveBeenCalled()
    expect(ctx.options.refreshI18nSourceEntries).toHaveBeenCalled()
    expect(workspace.isPreviewMode.value).toBe(false)
  })

  it('saves draft resources through the resource transaction and updates baselines after page save', async () => {
    const ctx = makeOptions()
    const workspace = useWebBuilderWorkspace(ctx.options)

    await expect(workspace.handleSaveDraft()).resolves.toBe(true)

    expect(ctx.options.startBlockingProcess).toHaveBeenCalledWith('save', [
      '正在准备保存',
      '正在读取当前页面内容',
    ])
    expect(ctx.options.ensureI18nReadyOrConfirmed).toHaveBeenCalledWith('save')
    expect(ctx.options.resourceTransaction.flushDrafts).toHaveBeenCalledWith(false)
    expect(ctx.options.updateCurrentResourceBaseline).toHaveBeenCalledWith({
      pages: [{ id: 'home' }],
    })
    expect(ctx.options.markEditorSaved).toHaveBeenCalled()
    expect(ctx.options.stopBlockingProcess).toHaveBeenCalled()
  })

  it('confirms publish and lets the resource transaction run the ordered publish chain', async () => {
    const calls: string[] = []
    const ctx = makeOptions({
      options: {
        ensureI18nReadyOrConfirmed: vi.fn(async () => {
          calls.push('i18n')
          return true
        }),
        resourceTransaction: {
          flushDrafts: vi.fn(async () => {
            calls.push('flushDrafts')
            return { success: true, failures: [], warnings: [] }
          }),
          publish: vi.fn(async () => {
            calls.push('publishResources')
            return { success: true, failures: [], warnings: [] }
          }),
        },
      },
    })
    const workspace = useWebBuilderWorkspace(ctx.options)

    await expect(workspace.handlePublish()).resolves.toBe(true)

    expect(mockedConfirm).toHaveBeenCalledWith(
      '确认发布当前版本？确认后将检查并补齐多语言内容，然后生成HTML并创建新的草稿版本。',
      '确认发布',
      expect.any(Object),
    )
    expect(calls).toEqual(['i18n', 'publishResources'])
    expect(ctx.options.markEditorSaved).toHaveBeenCalled()
  })

  it('restores a history version, saves it silently, and refreshes history state', async () => {
    const ctx = makeOptions()
    const workspace = useWebBuilderWorkspace(ctx.options)

    await workspace.handleRestoreHistory({
      id: 7,
      version: 'v7',
      schemaJson: JSON.stringify({ pages: [{ id: 'restored' }] }),
    } as any)

    expect(mockedConfirm).toHaveBeenCalled()
    expect(ctx.options.applyProjectDataToEditor).toHaveBeenCalledWith({
      pages: [{ id: 'restored' }],
    })
    expect(ctx.options.resourceTransaction.flushDrafts).toHaveBeenCalledWith(true)
    expect(ctx.options.resumeEditorTracking).toHaveBeenCalledWith(true)
    expect(workspace.historyPanelRefreshKey.value).toBe(1)
    expect(workspace.restoringHistoryId.value).toBeNull()
    expect(mockedMessage.success).toHaveBeenCalledWith('已恢复 v7 到当前草稿')
  })

  it('does not open page settings when the workspace disallows it', () => {
    const ctx = makeOptions({
      options: {
        canOpenPageSettings: () => false,
      },
    })
    const workspace = useWebBuilderWorkspace(ctx.options)

    workspace.handleOpenPageSettings()

    expect(ctx.options.openPageSettings).not.toHaveBeenCalled()
  })

  it('computes blocking loading text from injected processing state', () => {
    const blockingProcessingActive = ref(true)
    const blockingProcessMessage = ref('正在保存页面...')
    const ctx = makeOptions({
      blockingProcessingActive,
      blockingProcessMessage,
      options: {
        blockingProcessingActive: computed(() => blockingProcessingActive.value),
        blockingProcessMessage: computed(() => blockingProcessMessage.value),
      },
    })
    const workspace = useWebBuilderWorkspace(ctx.options)

    expect(workspace.editorLoadingVisible.value).toBe(true)
    expect(workspace.editorLoadingText.value).toBe('正在保存页面...')
  })

  it('tracks devices and switches selected device through the workspace', () => {
    const desktop = {
      id: 'desktop',
      get: vi.fn((key: string) => (key === 'id' ? 'desktop' : 'Desktop')),
    }
    const mobile = {
      id: 'mobile',
      get: vi.fn((key: string) => (key === 'id' ? 'mobile' : 'Mobile')),
    }
    let selected = desktop
    const handlers = new Map<string, Array<(payload?: any) => void>>()
    const editor = {
      Devices: {
        getAll: vi.fn(() => ({ models: [desktop, mobile] })),
        getSelected: vi.fn(() => selected),
        select: vi.fn((device: any) => {
          selected = device
        }),
        add: vi.fn(),
        remove: vi.fn(),
      },
      on: vi.fn((event: string, handler: (payload?: any) => void) => {
        handlers.set(event, [...(handlers.get(event) ?? []), handler])
      }),
      off: vi.fn(),
    }
    const grapes = makeGrapes()
    const ctx = makeOptions({ grapes })
    const workspace = useWebBuilderWorkspace(ctx.options)

    grapes.emitInit(editor)

    expect(workspace.devices.value).toEqual([desktop, mobile])
    expect(workspace.selectedDevice.value).toBe(desktop)

    workspace.setDevice(mobile)
    expect(editor.Devices.select).toHaveBeenCalledWith(mobile)
    expect(workspace.selectedDevice.value).toBe(mobile)

    workspace.setDevice('desktop')
    expect(editor.Devices.select).toHaveBeenCalledWith('desktop')

    handlers.get('device:select')?.forEach((handler) => handler(desktop))
    expect(workspace.selectedDevice.value).toBe(desktop)
  })
})
