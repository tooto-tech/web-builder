import { ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { wbMessage as ElMessage } from '@/components/WebBuilder/utils/wbMessage'
import type { PageHistoryDetailRespVO } from '@/api/content/page'
import type { ResourceTransactionResult } from './useResourceTransaction'
import useEditorActions from './useEditorActions'

export type WebBuilderBlockingAction = 'publish' | 'save'
export type WebBuilderBlockingMessage = string | string[]

type WebBuilderI18nEntry = {
  translation?: unknown
}

export interface WebBuilderLeaveConfirmationState {
  hasUnsavedChanges: boolean
  title: string
  message: string
}

export interface WebBuilderSessionEditorAdapter {
  getProjectData?: () => Record<string, unknown> | null
  runCommand?: (command: string) => void
  stopCommand?: (command: string) => void
}

export interface UseWebBuilderSessionOptions {
  getEditor: () => WebBuilderSessionEditorAdapter | null | undefined
  blockingProcessingActive: { value: boolean }
  startBlockingProcess: (
    action: WebBuilderBlockingAction,
    message?: WebBuilderBlockingMessage
  ) => void
  stopBlockingProcess: () => void
  setBlockingProcessMessage: (message: WebBuilderBlockingMessage) => void
  ensureI18nReadyOrConfirmed: (action: WebBuilderBlockingAction) => Promise<boolean>
  getI18nEntries: () => WebBuilderI18nEntry[]
  getI18nPreviewProjectData: () => Record<string, unknown> | null
  loadI18nPreviewProjectData: (projectData: Record<string, unknown>) => Promise<void>
  refreshI18nSourceEntries: () => void
  autoTranslateMissing: (options: {
    publishReady: boolean
    reloadCurrentLocale: boolean
    silent: boolean
  }) => Promise<unknown> | unknown
  resourceTransaction: {
    flushDrafts: (silent?: boolean) => Promise<ResourceTransactionResult>
    publish: () => Promise<ResourceTransactionResult>
  }
  hasCurrentResourceChanges: (projectData: Record<string, unknown> | null) => boolean
  updateCurrentResourceBaseline: (projectData: Record<string, unknown>) => void
  markEditorSaved: () => void
  markEditorChanged: () => void
  resumeEditorTracking: (markClean?: boolean) => void
  hasEditorChanges: () => boolean
  hasUnsavedEditorWork: () => boolean
  parseProjectData: (
    schemaJson: string,
    errorMessage: string
  ) => Record<string, unknown> | null
  applyProjectDataToEditor: (projectData: Record<string, unknown>) => Promise<void>
}

const cloneProjectData = (projectData: Record<string, unknown> | null) =>
  projectData ? JSON.parse(JSON.stringify(projectData)) : null

export default function useWebBuilderSession(options: UseWebBuilderSessionOptions) {
  const isPreviewMode = ref(false)
  const restoringHistoryId = ref<number | null>(null)
  const historyPanelRefreshKey = ref(0)
  const i18nPreviewSourceProjectData = ref<Record<string, unknown> | null>(null)
  const i18nPreviewHadChanges = ref(false)
  const editorActions = useEditorActions({
    blockingProcess: {
      active: options.blockingProcessingActive,
      start: options.startBlockingProcess,
      stop: options.stopBlockingProcess,
      setMessage: options.setBlockingProcessMessage
    },
    ensureReadyOrConfirm: options.ensureI18nReadyOrConfirmed,
    resourceTransaction: options.resourceTransaction,
    getProjectData: () => options.getEditor()?.getProjectData?.() || null,
    hasCurrentResourceChanges: options.hasCurrentResourceChanges,
    updateCurrentResourceBaseline: options.updateCurrentResourceBaseline,
    markEditorSaved: options.markEditorSaved,
    refreshI18nSourceEntries: options.refreshI18nSourceEntries,
    autoTranslateMissing: options.autoTranslateMissing,
    hasI18nPreview: () => i18nPreviewSourceProjectData.value !== null,
    restoreI18nPreview: () => restoreI18nPreview()
  })

  const loadI18nPreview = async () => {
    const editor = options.getEditor()
    if (!editor?.getProjectData || i18nPreviewSourceProjectData.value) return
    if (!options.getI18nEntries().some((entry) => `${entry.translation ?? ''}`.trim())) return
    const sourceProjectData = cloneProjectData(editor.getProjectData?.() || null)
    const previewProjectData = options.getI18nPreviewProjectData()
    if (!sourceProjectData || !previewProjectData) return
    i18nPreviewSourceProjectData.value = sourceProjectData
    i18nPreviewHadChanges.value = options.hasEditorChanges()
    await options.loadI18nPreviewProjectData(previewProjectData)
  }

  const restoreI18nPreview = async () => {
    const sourceProjectData = i18nPreviewSourceProjectData.value
    if (!sourceProjectData) return
    const hadChanges = i18nPreviewHadChanges.value
    i18nPreviewSourceProjectData.value = null
    i18nPreviewHadChanges.value = false
    await options.loadI18nPreviewProjectData(sourceProjectData)
    if (hadChanges) {
      options.markEditorChanged()
    } else {
      options.markEditorSaved()
    }
    options.refreshI18nSourceEntries()
  }

  const openPreview = async () => {
    const editor = options.getEditor()
    if (!editor) return
    try {
      await loadI18nPreview()
    } catch (error) {
      console.warn('[WebBuilder] i18n preview load failed', error)
      ElMessage.warning('多语言预览加载失败，已使用默认语言预览')
    }
    isPreviewMode.value = true
    editor.runCommand('core:preview')
  }

  const exitPreview = async () => {
    const editor = options.getEditor()
    if (!editor) return
    isPreviewMode.value = false
    editor.stopCommand('core:preview')
    try {
      await restoreI18nPreview()
    } catch (error) {
      console.warn('[WebBuilder] i18n preview restore failed', error)
      ElMessage.error('恢复默认语言画布失败，请刷新后继续编辑')
    }
  }

  const handleSaveDraft = (silent = false) => editorActions.save(silent)

  const handlePublish = () => editorActions.publish()

  const getLeaveConfirmationState = (): WebBuilderLeaveConfirmationState => ({
    hasUnsavedChanges: options.hasUnsavedEditorWork(),
    title: '未保存提醒',
    message: '当前页面有未保存的页面内容或译文草稿，离开后这些改动可能丢失。确认离开吗？',
  })

  const handleRestoreHistory = async (detail: PageHistoryDetailRespVO) => {
    const versionLabel = detail.version || `历史版本 #${detail.id}`
    const hasUnsavedChanges = options.hasUnsavedEditorWork()

    if (!detail.schemaJson) {
      ElMessage.warning('该历史版本缺少 schema 数据，暂时无法恢复')
      return
    }

    const projectData = options.parseProjectData(detail.schemaJson, '解析历史版本失败')
    if (!projectData) return

    try {
      await ElMessageBox.confirm(
        hasUnsavedChanges
          ? `恢复 ${versionLabel} 会覆盖当前编辑器内容，并立即保存为当前草稿。当前还有未保存修改，确认继续吗？`
          : `确认恢复 ${versionLabel} 吗？恢复后会覆盖当前编辑器内容，并立即保存为当前草稿。`,
        '恢复历史版本',
        {
          type: 'warning',
          confirmButtonText: '恢复并保存',
          cancelButtonText: '取消'
        }
      )
    } catch {
      return
    }

    restoringHistoryId.value = detail.id

    try {
      await options.applyProjectDataToEditor(projectData)
      const saved = await handleSaveDraft(true)

      if (saved) {
        options.resumeEditorTracking(true)
        historyPanelRefreshKey.value += 1
        ElMessage.success(`已恢复 ${versionLabel} 到当前草稿`)
        return
      }

      options.resumeEditorTracking(false)
      options.markEditorChanged()
      ElMessage.warning('历史版本已加载到编辑器，但自动保存失败，请手动保存草稿')
    } catch {
      options.resumeEditorTracking(false)
      options.markEditorChanged()
      ElMessage.error('恢复历史版本失败，请稍后重试')
    } finally {
      restoringHistoryId.value = null
    }
  }

  return {
    isPreviewMode,
    restoringHistoryId,
    historyPanelRefreshKey,
    i18nPreviewSourceProjectData,
    loadI18nPreview,
    restoreI18nPreview,
    openPreview,
    exitPreview,
    handleSaveDraft,
    handlePublish,
    getLeaveConfirmationState,
    handleRestoreHistory,
  }
}
