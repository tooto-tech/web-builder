import { ref, type Ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { wbMessage as ElMessage } from '@/components/WebBuilder/utils/wbMessage'
import {
  hasPageResourceLocator,
  normalizePageResourceIdentity,
  type PageResourceIdentity,
  type PageSaveReqVO,
  type PageVO
} from '@/api/content/page'
import { getEditorSchemaJson } from '../utils/editorHelpers'
import { getOrCreateSessionKey } from '../utils/sessionKey'
import { sanitizeFlipbookProjectData } from '../components/registries/media/flipbook'
import {
  createDraftStorageAdapter,
  type DraftStorageMode
} from '../utils/draftStorageAdapter'
import { getWebBuilderResourceNameFromEditor } from '../utils/pageResourceIdentity'
import {
  extractLegacySharedPayloads,
  stripLegacySharedFields,
  type LegacySharedPayloads
} from '../config/sharedResources'
import type { EditSession } from './useEditSession'

const getByteSize = (value: string): number => {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value).length
  }
  return value.length
}

const getNowMs = (): number =>
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()

export interface UseDraftManagerOptions {
  pageResource: () => PageResourceIdentity
  getEditor: () => any
  session?: Ref<EditSession | null>
  getSessionKey?: () => string
  serializeSchemaJson?: (editor: any) => string
  /** 当发布正在进行时，阻止保存 */
  isPublishing?: () => boolean
  onSaveConflictConfirmStart?: (silent: boolean) => void
  onSaveConflictConfirmEnd?: (silent: boolean) => void
}

/**
 * 草稿数据管理 composable
 */
export default function useDraftManager(options: UseDraftManagerOptions) {
  const {
    pageResource,
    getEditor,
    session,
    getSessionKey,
    serializeSchemaJson,
    isPublishing,
    onSaveConflictConfirmStart,
    onSaveConflictConfirmEnd
  } = options

  const baseUpdateTime = ref<Date | undefined>(undefined)
  const hasDataLoadError = ref(false)
  const currentPage = ref<PageVO | null>(null)
  /** 实例级保存锁，防止同一草稿管理器并发保存 */
  let isSaving = false
  const legacySharedPayloads = ref<LegacySharedPayloads>({
    colors: null,
    typography: null,
    customCss: null,
    customCode: null
  })

  const resolveSessionKey = () => session?.value?.sessionKey || getSessionKey?.() || ''

  const parseProjectData = (
    schemaJson?: string | null,
    errorMessage = '解析草稿数据失败'
  ): Record<string, unknown> | null => {
    if (!schemaJson) return null

    try {
      const projectData = sanitizeFlipbookProjectData(JSON.parse(schemaJson))
      legacySharedPayloads.value = extractLegacySharedPayloads(projectData)
      return stripLegacySharedFields(projectData)
    } catch (error) {
      ElMessage.error(errorMessage)
      return null
    }
  }

  const hydrateProjectData = (_projectData: Record<string, any> | null) => {}

  const logSaveSummary = (
    resource: PageResourceIdentity,
    resourceName: string | undefined,
    schemaJson: string,
    startedAtMs: number,
    options?: { forceOverride?: boolean; storage?: DraftStorageMode }
  ) => {
    if (!import.meta.env.DEV) return

    console.log('[saveDraft] summary:', {
      resourceId: resource.resourceId,
      resourceKey: resource.resourceKey,
      resourceType: resource.resourceType,
      resourceScope: resource.resourceScope,
      ownerType: resource.ownerType,
      ownerId: resource.ownerId,
      resourceName,
      schemaBytes: getByteSize(schemaJson),
      durationMs: Math.round((getNowMs() - startedAtMs) * 100) / 100,
      forceOverride: options?.forceOverride ?? false,
      storage: options?.storage
    })
  }

  /**
   * 从服务端加载草稿数据
   */
  const loadDraftData = async (): Promise<any> => {
    const resource = normalizePageResourceIdentity(pageResource())
    if (!hasPageResourceLocator(resource)) {
      return null
    }

    const adapter = createDraftStorageAdapter()
    try {
      const result = await adapter.load(resource)
      currentPage.value = result || null
      // 存储 baseUpdateTime（用于并发控制）
      baseUpdateTime.value =
        result?.updateTime || (adapter.mode === 'backend' && result ? new Date() : undefined)

      // 解析 schema JSON
      let projectData: Record<string, any> | null = null
      if (result?.schemaJson) {
        projectData = parseProjectData(result.schemaJson)
        if (!projectData) {
          hasDataLoadError.value = true
          return null
        }
        hasDataLoadError.value = false
        hydrateProjectData(projectData)
      } else {
        hasDataLoadError.value = false
        currentPage.value = result || null
        hydrateProjectData(null)
        legacySharedPayloads.value = {
          colors: null,
          typography: null,
          customCss: null,
          customCode: null
        }
      }

      return projectData
    } catch (error) {
      ElMessage.warning(
        adapter.mode === 'backend' ? '加载草稿失败，将使用空白模板' : '加载本地草稿失败，将使用空白模板'
      )
      hasDataLoadError.value = true
      currentPage.value = null
      return null
    }
  }

  /**
   * 保存草稿
   */
  const saveDraftData = async (silent = false): Promise<boolean> => {
    // 并发锁：防止快速多次保存
    if (isSaving) {
      if (!silent) {
        ElMessage.warning('正在保存中，请稍候...')
      }
      return false
    }

    // 发布期间不允许保存（schema 可能处于中间状态）
    if (isPublishing?.()) {
      if (!silent) {
        ElMessage.warning('正在发布中，请等待发布完成后再保存')
      }
      return false
    }

    const editor = getEditor()
    if (!editor) {
      if (!silent) {
        ElMessage.warning('编辑器未就绪')
      }
      return false
    }

    const resource = normalizePageResourceIdentity(pageResource())
    const adapter = createDraftStorageAdapter()

    if (!hasPageResourceLocator(resource)) {
      if (!silent) {
        ElMessage.error('缺少必要参数: resource')
      }
      return false
    }

    isSaving = true
    const saveStartedAtMs = getNowMs()
    try {
      // 获取 schema JSON 并注入全局颜色
      let schemaJson: string
      try {
        schemaJson = serializeSchemaJson ? serializeSchemaJson(editor) : getEditorSchemaJson(editor)
      } catch (serializeError) {
        if (!silent) {
          ElMessage.error('序列化编辑器数据失败，无法保存')
        }
        console.error('[saveDraft] schema 序列化失败:', serializeError)
        return false
      }

      // 获取或创建 session key
      const sessionKey = resolveSessionKey() || getOrCreateSessionKey()

      const resourceName = getWebBuilderResourceNameFromEditor(editor, resource)

      // 准备保存请求
      const saveData: PageSaveReqVO = {
        ...resource,
        resourceName,
        schemaJson,
        baseUpdateTime: baseUpdateTime.value || undefined,
        forceOverride: false,
        sessionKey
      }

      const result = await adapter.save(saveData, { currentPage: currentPage.value })

      // 更新 baseUpdateTime 用于下次保存
      baseUpdateTime.value = result.updateTime || new Date()
      currentPage.value = result || null
      logSaveSummary(resource, resourceName, schemaJson, saveStartedAtMs, {
        forceOverride: false,
        storage: adapter.mode
      })

      if (!silent) {
        ElMessage.success(adapter.mode === 'indexedDb' ? '已保存到本地 IndexedDB' : '保存成功')
      }
      return true
    } catch (error: any) {
      // 处理锁验证错误
      if (error?.code === 1009013000) {
        ElMessage.error('缺少编辑锁参数，请刷新页面重试')
        return false
      } else if (error?.code === 1009013001) {
        ElMessage.error('未获取编辑锁，无法保存。请刷新页面重试')
        return false
      } else if (error?.code === 1009013002) {
        ElMessage.error(error?.message || '编辑锁被其他会话持有，无法保存')
        return false
      } else if (error?.code === 1009012001) {
        if (!adapter.supportsConflictOverride) {
          ElMessage.error('本地存储模式下不支持冲突覆盖分支')
          return false
        }
        // 内容冲突，询问是否强制覆盖
        try {
          onSaveConflictConfirmStart?.(silent)
          await ElMessageBox.confirm('页面已被他人修改，是否强制覆盖？', '保存冲突', {
            confirmButtonText: '强制覆盖',
            cancelButtonText: '取消',
            type: 'warning'
          })
          onSaveConflictConfirmEnd?.(silent)

          // 强制覆盖
          const schemaJson = serializeSchemaJson
            ? serializeSchemaJson(editor)
            : getEditorSchemaJson(editor)
          const sessionKey = resolveSessionKey() || getOrCreateSessionKey()
          const resourceName = getWebBuilderResourceNameFromEditor(editor, resource)
          const saveData: PageSaveReqVO = {
            ...resource,
            resourceName,
            schemaJson,
            baseUpdateTime: baseUpdateTime.value || undefined,
            forceOverride: true,
            sessionKey
          }

          const result = await adapter.save(saveData, { currentPage: currentPage.value })
          baseUpdateTime.value = result.updateTime || new Date()
          currentPage.value = result || null
          logSaveSummary(resource, resourceName, schemaJson, saveStartedAtMs, {
            forceOverride: true,
            storage: adapter.mode
          })
          if (!silent) {
            ElMessage.success('强制保存成功')
          }
          return true
        } catch (cancelError) {
          // 用户取消
          return false
        }
      } else {
        ElMessage.error(error?.message || '保存失败，请重试')
        return false
      }
    } finally {
      isSaving = false
    }

    return false
  }

  return {
    baseUpdateTime,
    hasDataLoadError,
    currentPage,
    legacySharedPayloads,
    parseProjectData,
    hydrateProjectData,
    loadDraftData,
    saveDraftData
  }
}
