import { ref } from 'vue'
import { wbMessage as ElMessage } from '@/components/WebBuilder/utils/wbMessage'
import {
  hasPageResourceLocator,
  normalizePageResourceIdentity,
  publishVersion,
  publishContentPage,
  type PagePublishReqVO,
  type PageResourceIdentity
} from '@/api/content/page'
import { getEditorSchemaJson } from '../utils/editorHelpers'
import { getOrCreateSessionKey } from '../utils/sessionKey'
import { getWebBuilderResourceNameFromEditor } from '../utils/pageResourceIdentity'

type PublishProcessingMessage = string | string[]

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

const isLayoutPagePublishType = (type: string): boolean =>
  type === 'LAYOUT_PAGE_HEADER' ||
  type === 'LAYOUT_PAGE_FOOTER' ||
  type === 'HEADER' ||
  type === 'FOOTER'

const waitForPaint = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })

export interface UsePublishOptions {
  pageResource: () => PageResourceIdentity
  getEditor: () => any
  getSessionKey: () => string
  getBaseUpdateTime: () => Date | undefined
  setBaseUpdateTime: (time: Date) => void
  serializeSchemaJson?: (editor: any) => string
  onPublishProcessingStart?: (message: PublishProcessingMessage) => void
  onPublishProcessingMessage?: (message: PublishProcessingMessage) => void
  onPublishProcessingEnd?: () => void
  onBeforeAutoReload?: () => void
  /** 可选注入，用于测试替换真实 API；生产代码不需要传 */
  _deps?: {
    publishVersion?: typeof publishVersion
    publishContentPage?: typeof publishContentPage
  }
}

/**
 * 发布功能 composable
 */
export default function usePublish(options: UsePublishOptions) {
  const {
    pageResource,
    getEditor,
    getSessionKey,
    getBaseUpdateTime,
    setBaseUpdateTime,
    serializeSchemaJson,
    onPublishProcessingStart,
    onPublishProcessingMessage,
    onPublishProcessingEnd
  } = options

  const _publishVersion = options._deps?.publishVersion ?? publishVersion
  const _publishContentPage = options._deps?.publishContentPage ?? publishContentPage

  const logPublishSummary = (
    publishData: PagePublishReqVO,
    startedAtMs: number,
    resource: PageResourceIdentity
  ) => {
    if (!import.meta.env.DEV) return

    console.log('[WebBuilder] publish summary:', {
      resourceId: resource.resourceId,
      resourceKey: resource.resourceKey,
      resourceType: publishData.resourceType,
      resourceScope: resource.resourceScope,
      ownerType: resource.ownerType,
      ownerId: resource.ownerId,
      resourceName: publishData.resourceName,
      schemaBytes: getByteSize(publishData.schemaJson || ''),
      durationMs: Math.round((getNowMs() - startedAtMs) * 100) / 100
    })
  }

  /**
   * 发布期间标志位，用于阻止自动保存并发执行
   * （自动保存在发布途中触发可能在页面 CSS 状态不一致时抓取 schema）
   */
  const isPublishing = ref(false)

  /**
   * 发布页面
   */
  const publish = async (): Promise<boolean> => {
    if (isPublishing.value) return false

    const editor = getEditor()
    if (!editor) {
      ElMessage.warning('编辑器未就绪')
      return false
    }

    const resource = normalizePageResourceIdentity(pageResource())
    const type = resource.resourceType || resource.ownerType || ''
    const ownerId = resource.ownerId

    if (!hasPageResourceLocator(resource)) {
      ElMessage.error('缺少必要参数: resource')
      return false
    }

    try {
      // 设置发布标志，防止自动保存在此期间并发执行
      isPublishing.value = true
      const publishStartedAtMs = getNowMs()
      // 先让 loading 状态完成一次绘制，再进入发布数据整理，避免阻塞首帧。
      await waitForPaint()
      onPublishProcessingStart?.(['正在准备发布', '正在锁定发布流程'])

      onPublishProcessingMessage?.(['正在整理发布数据', '正在打包页面配置'])
      const schemaJson = serializeSchemaJson
        ? serializeSchemaJson(editor)
        : getEditorSchemaJson(editor)

      // 获取或创建 session key
      const sessionKey = getSessionKey() || getOrCreateSessionKey()

      // 准备发布请求，统一使用 resource/resource owner 语义
      const publishData: PagePublishReqVO = {
        ...resource,
        resourceType: type || resource.resourceType,
        resourceName: getWebBuilderResourceNameFromEditor(editor, resource),
        schemaJson,
        baseUpdateTime: getBaseUpdateTime() || undefined,
        sessionKey
      }

      onPublishProcessingMessage?.(['发布中，请稍候', '正在提交发布版本'])
      const result = await _publishVersion(publishData)

      // HEADER/FOOTER 还需要额外调用页面上线接口，
      // 否则前台仍会继续读取旧的 publish 版本。
      if (isLayoutPagePublishType(type) && ownerId) {
        onPublishProcessingMessage?.(['正在上线布局页面', '正在刷新布局发布状态'])
        await _publishContentPage(ownerId)
      }

      logPublishSummary(publishData, publishStartedAtMs, resource)

      // 更新 baseUpdateTime（现在指向新的草稿）
      setBaseUpdateTime(result.updateTime || new Date())
      onPublishProcessingMessage?.('发布成功，正在刷新页面')

      ElMessage.success(
        isLayoutPagePublishType(type) ? '发布并上线成功！请稍等...' : '发布成功！请稍等...'
      )
      // 发布成功后刷新页面
      setTimeout(() => {
        options.onBeforeAutoReload?.()
        window.location.reload()
      }, 800)
      return true
    } catch (err: any) {
      onPublishProcessingEnd?.()
      // 处理锁验证错误
      if (err?.code === 1009013000) {
        ElMessage.error('缺少编辑锁参数，请刷新页面重试')
      } else if (err?.code === 1009013001) {
        ElMessage.error('未获取编辑锁，无法发布。请刷新页面重试')
      } else if (err?.code === 1009013002) {
        ElMessage.error(err?.message || '编辑锁被其他会话持有，无法发布')
      } else if (err?.code === 1009012001) {
        ElMessage.error('页面已被他人修改，请刷新页面后重试')
      } else {
        ElMessage.error(err?.message || '发布失败，请重试')
      }
      return false
    } finally {
      isPublishing.value = false
    }
  }

  return {
    publish,
    isPublishing
  }
}
