import { ref, type ComputedRef, type Ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { wbMessage as ElMessage } from '@/components/WebBuilder/utils/wbMessage'
import type { ResourceTransactionResult } from './useResourceTransaction'
import type { BlockingProcessAction, BlockingProcessMessage } from './useBlockingProcess'

type RefLike<T> = Ref<T> | ComputedRef<T>

export interface UseEditorActionsBlockingProcess {
  active: RefLike<boolean>
  start: (action: BlockingProcessAction, message?: BlockingProcessMessage) => void
  stop: () => void
  setMessage: (message: BlockingProcessMessage) => void
}

export interface UseEditorActionsResourceTransaction {
  flushDrafts: (silent?: boolean) => Promise<ResourceTransactionResult>
  publish: () => Promise<ResourceTransactionResult>
}

export interface UseEditorActionsOptions {
  blockingProcess: UseEditorActionsBlockingProcess
  ensureReadyOrConfirm: (action: BlockingProcessAction) => Promise<boolean>
  resourceTransaction: UseEditorActionsResourceTransaction
  getProjectData: () => Record<string, unknown> | null
  hasCurrentResourceChanges: (projectData: Record<string, unknown> | null) => boolean
  updateCurrentResourceBaseline: (projectData: Record<string, unknown>) => void
  markEditorSaved: () => void
  refreshI18nSourceEntries: () => void
  autoTranslateMissing: (options: {
    publishReady: boolean
    reloadCurrentLocale: boolean
    silent: boolean
  }) => Promise<unknown> | unknown
  hasI18nPreview?: () => boolean
  restoreI18nPreview?: () => Promise<void>
}

export interface UseEditorActionsReturn {
  save: (silent?: boolean) => Promise<boolean>
  publish: () => Promise<boolean>
  lastSaveResult: Ref<ResourceTransactionResult | null>
  lastPublishResult: Ref<ResourceTransactionResult | null>
}

export default function useEditorActions(options: UseEditorActionsOptions): UseEditorActionsReturn {
  const lastSaveResult = ref<ResourceTransactionResult | null>(null)
  const lastPublishResult = ref<ResourceTransactionResult | null>(null)

  const restorePreviewIfNeeded = async () => {
    if (!options.hasI18nPreview?.()) return
    options.blockingProcess.setMessage(['正在恢复默认编辑画布', '正在还原多语言预览状态'])
    await options.restoreI18nPreview?.()
  }

  const save = async (silent = false) => {
    lastSaveResult.value = null
    if (!silent) {
      if (options.blockingProcess.active.value) return false
      options.blockingProcess.start('save', ['正在准备保存', '正在读取当前页面内容'])
    }

    try {
      await restorePreviewIfNeeded()

      if (!silent) {
        const canContinueForI18n = await options.ensureReadyOrConfirm('save')
        if (!canContinueForI18n) return false
      }

      options.blockingProcess.setMessage(['正在整理页面内容', '正在检查草稿变更'])
      options.refreshI18nSourceEntries()
      const projectData = options.getProjectData()
      options.blockingProcess.setMessage(
        options.hasCurrentResourceChanges(projectData)
          ? ['保存中，请稍候', '正在提交草稿数据']
          : '正在确认保存状态'
      )

      const flushResult = await options.resourceTransaction.flushDrafts(silent)
      lastSaveResult.value = flushResult
      if (!silent) {
        flushResult.warnings.forEach((warning) => {
          ElMessage.warning(warning.message)
        })
      }
      if (flushResult.success && projectData) {
        options.updateCurrentResourceBaseline(projectData)
        options.markEditorSaved()
        if (silent) {
          void options.autoTranslateMissing({
            publishReady: false,
            reloadCurrentLocale: false,
            silent: true
          })
        }
      }
      return flushResult.success
    } finally {
      if (!silent) {
        options.blockingProcess.stop()
      }
    }
  }

  const publish = async () => {
    lastPublishResult.value = null
    if (options.blockingProcess.active.value) return false
    try {
      await ElMessageBox.confirm(
        '确认发布当前版本？确认后将检查并补齐多语言内容，然后生成HTML并创建新的草稿版本。',
        '确认发布',
        {
          confirmButtonText: '确认发布',
          cancelButtonText: '取消',
          type: 'warning',
          showClose: false,
          closeOnClickModal: false,
          closeOnPressEscape: false,
          distinguishCancelAndClose: true
        }
      )
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : ''
      if (error !== 'cancel' && message !== 'cancel') {
        ElMessage.error(message || '发布失败，请重试')
      }
      return false
    }

    options.blockingProcess.start('publish', ['正在准备发布', '正在锁定发布流程'])
    try {
      await restorePreviewIfNeeded()

      const canContinueForI18n = await options.ensureReadyOrConfirm('publish')
      if (!canContinueForI18n) return false

      options.blockingProcess.setMessage(['发布中，请稍候', '正在同步依赖资源'])
      const result = await options.resourceTransaction.publish()
      lastPublishResult.value = result
      result.warnings.forEach((warning) => {
        ElMessage.warning(warning.message)
      })
      if (!result.success) {
        ElMessage.error(result.failures[0]?.message || '发布失败，请重试')
        return false
      }

      const projectData = options.getProjectData()
      if (projectData) {
        options.updateCurrentResourceBaseline(projectData)
      }
      options.markEditorSaved()
      return true
    } finally {
      options.blockingProcess.stop()
    }
  }

  return {
    save,
    publish,
    lastSaveResult,
    lastPublishResult
  }
}
