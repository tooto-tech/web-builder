import { ref } from 'vue'

import {
  hasPageResourceLocator,
  normalizePageResourceIdentity,
  runBeforeProjectLoadHooks,
  type HostServices,
  type HostUi,
  type PageResourceIdentity,
  type RevisionSummary,
  type RouteAdapter,
  type SettingsSource,
  type TenantContext,
  type WebBuilderCommandContext,
  type WebBuilderFeaturePlugin,
  type WebBuilderPluginContext,
} from '../../core/index.js'

export interface UseRevisionControllerOptions {
  editor: unknown | (() => unknown)
  resource: PageResourceIdentity | (() => PageResourceIdentity)
  hostServices: HostServices
  plugins?: WebBuilderFeaturePlugin[] | (() => WebBuilderFeaturePlugin[])
  commands?: WebBuilderCommandContext
  tenant?: TenantContext
  settings: SettingsSource
  ui: Pick<HostUi, 'message'>
  route: RouteAdapter
  markDirty?: () => void
}

const defaultTenant = (): TenantContext => ({
  roles: [],
  permissions: new Set<string>(),
})

const getValue = <T>(value: T | (() => T)): T =>
  typeof value === 'function' ? (value as () => T)() : value

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (isRecord(error) && 'message' in error) {
    return String(error.message || fallback)
  }
  return fallback
}

const extractProjectData = (detail: unknown): Record<string, unknown> | null => {
  if (!isRecord(detail)) return null

  if (isRecord(detail.projectData)) return detail.projectData
  if (isRecord(detail.schema)) return detail.schema

  if (typeof detail.schemaJson === 'string' && detail.schemaJson.trim()) {
    const parsed = JSON.parse(detail.schemaJson)
    return isRecord(parsed) ? parsed : null
  }

  return null
}

export const useRevisionController = (options: UseRevisionControllerOptions) => {
  const revisions = ref<RevisionSummary[]>([])
  const selectedDetail = ref<unknown>(null)
  const isLoading = ref(false)
  const isRestoring = ref(false)

  const getEditor = () => getValue(options.editor)
  const getResource = () => normalizePageResourceIdentity(getValue(options.resource))
  const getPlugins = () => getValue(options.plugins ?? [])

  const createPluginContext = (
    editor: unknown,
    resource: PageResourceIdentity,
    projectData: Record<string, unknown> | null,
  ): WebBuilderPluginContext => ({
    resource,
    projectData,
    usedComponentTypes: new Set<string>(),
    capabilityIds: new Set<string>(),
    tenant: options.tenant ?? defaultTenant(),
    editor: editor as WebBuilderPluginContext['editor'],
    commands: options.commands ?? {},
    hostServices: options.hostServices,
    settings: options.settings,
    ui: options.ui as HostUi,
    route: options.route,
    registerCleanup: () => undefined,
  })

  const list = async (params?: Record<string, unknown>) => {
    const resource = getResource()
    if (!hasPageResourceLocator(resource)) return []
    if (!options.hostServices.revision?.list) {
      options.ui.message.error('缺少 hostServices.revision.list')
      return []
    }

    isLoading.value = true
    try {
      const result = await options.hostServices.revision.list(resource, params)
      revisions.value = result
      return result
    } finally {
      isLoading.value = false
    }
  }

  const getDetail = async (id: number) => {
    if (!options.hostServices.revision?.getDetail) {
      options.ui.message.error('缺少 hostServices.revision.getDetail')
      return null
    }
    const detail = await options.hostServices.revision.getDetail(id)
    selectedDetail.value = detail
    return detail
  }

  const restore = async (revisionOrId: number | unknown): Promise<boolean> => {
    const editor = getEditor()
    if (!editor) {
      options.ui.message.warning('编辑器未就绪')
      return false
    }
    if (typeof revisionOrId === 'number' && !options.hostServices.revision?.getDetail) {
      options.ui.message.error('缺少 hostServices.revision.getDetail')
      return false
    }

    isRestoring.value = true
    try {
      const detail = typeof revisionOrId === 'number'
        ? await getDetail(revisionOrId)
        : revisionOrId
      const projectData = extractProjectData(detail)
      if (!projectData) {
        options.ui.message.error('历史版本数据无效')
        return false
      }

      await runBeforeProjectLoadHooks(
        getPlugins(),
        createPluginContext(editor, getResource(), projectData),
      )

      if (
        isRecord(editor) &&
        'loadProjectData' in editor &&
        typeof editor.loadProjectData === 'function'
      ) {
        editor.loadProjectData(projectData)
      } else {
        options.ui.message.error('编辑器不支持加载历史版本')
        return false
      }

      options.markDirty?.()
      options.ui.message.success('历史版本已恢复')
      return true
    } catch (error) {
      options.ui.message.error(getErrorMessage(error, '恢复历史版本失败'))
      return false
    } finally {
      isRestoring.value = false
    }
  }

  return {
    revisions,
    selectedDetail,
    isLoading,
    isRestoring,
    list,
    getDetail,
    restore,
  }
}
