import { ref } from 'vue'

import {
  buildDraftSaveRequest,
  createResourceTransaction,
  getDraftUpdateTime,
  hasPageResourceLocator,
  normalizePageResourceIdentity,
  parseDraftProjectData,
  runBeforeProjectLoadHooks,
  runAfterSaveSuccessHooks,
  runBeforeProjectSerializeHooks,
  runBeforeSaveHooks,
  serializeDraftProjectData,
  type HostServices,
  type HostUi,
  type PageResourceIdentity,
  type RouteAdapter,
  type SettingsSource,
  type TenantContext,
  type WebBuilderCommandContext,
  type WebBuilderFeaturePlugin,
  type WebBuilderPluginContext,
} from '../../core/index.js'

export interface SaveDraftOptions {
  silent?: boolean
}

export interface UseDraftControllerOptions {
  editor: unknown | (() => unknown)
  resource: PageResourceIdentity | (() => PageResourceIdentity)
  hostServices: HostServices
  plugins?: WebBuilderFeaturePlugin[] | (() => WebBuilderFeaturePlugin[])
  commands?: WebBuilderCommandContext
  tenant?: TenantContext
  settings: SettingsSource
  ui: HostUi
  route: RouteAdapter
  getSessionKey?: () => string
  getResourceName?: (editor: unknown, resource: PageResourceIdentity) => string | undefined
  isPublishing?: () => boolean
  supportsConflictOverride?: boolean
}

const PAGE_CONFLICT_CODE = 1009012001

const defaultTenant = (): TenantContext => ({
  roles: [],
  permissions: new Set<string>(),
})

const getValue = <T>(value: T | (() => T)): T =>
  typeof value === 'function' ? (value as () => T)() : value

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message || fallback)
  }
  return fallback
}

export const useDraftController = (options: UseDraftControllerOptions) => {
  const isDirty = ref(false)
  const isSaving = ref(false)
  const baseUpdateTime = ref<Date | string | undefined>(undefined)
  const currentPage = ref<unknown>(null)

  const getEditor = () => getValue(options.editor)
  const getResource = () => normalizePageResourceIdentity(getValue(options.resource))
  const getPlugins = () => getValue(options.plugins ?? [])

  const createPluginContext = (
    editor: unknown,
    resource: PageResourceIdentity,
    projectData: Record<string, unknown> | null,
    usedComponentTypes = new Set<string>(),
  ): WebBuilderPluginContext => ({
    resource,
    projectData,
    usedComponentTypes,
    capabilityIds: new Set<string>(),
    tenant: options.tenant ?? defaultTenant(),
    editor: editor as WebBuilderPluginContext['editor'],
    commands: options.commands ?? {},
    hostServices: options.hostServices,
    settings: options.settings,
    ui: options.ui,
    route: options.route,
    registerCleanup: () => undefined,
  })

  const serializeForSave = async (
    editor: unknown,
    resource: PageResourceIdentity,
  ) => {
    const preSerializeContext = createPluginContext(editor, resource, null)
    await runBeforeProjectSerializeHooks(getPlugins(), preSerializeContext)
    return serializeDraftProjectData(editor)
  }

  const flushResourceDrafts = async (context: WebBuilderPluginContext) => {
    const participants = getPlugins().flatMap(plugin =>
      (Array.isArray(plugin.resources) ? plugin.resources : [])
        .flatMap(provider => {
          const provided = provider(context)
          return Array.isArray(provided) ? provided : []
        })
    )

    if (!participants.length) return true

    const result = await createResourceTransaction({ participants }).flushDrafts()
    if (result.success) return true

    const firstFailure = result.failures[0]
    if (firstFailure?.message) {
      options.ui.message.error(firstFailure.message)
    }
    return false
  }

  const saveOnce = async (
    requestOptions: {
      editor: unknown
      resource: PageResourceIdentity
      schemaJson: string
      forceOverride: boolean
    },
  ) => {
    const request = buildDraftSaveRequest({
      resource: requestOptions.resource,
      resourceName: options.getResourceName?.(requestOptions.editor, requestOptions.resource),
      schemaJson: requestOptions.schemaJson,
      baseUpdateTime: baseUpdateTime.value,
      sessionKey: options.getSessionKey?.() ?? '',
      forceOverride: requestOptions.forceOverride,
    })

    const result = await options.hostServices.page?.saveDraft(request)
    baseUpdateTime.value = getDraftUpdateTime(result) ?? new Date()
    currentPage.value = result ?? null
    return result
  }

  const saveDraft = async (saveOptions: SaveDraftOptions = {}): Promise<boolean> => {
    const silent = saveOptions.silent === true

    if (isSaving.value) {
      if (!silent) options.ui.message.warning('正在保存中，请稍候...')
      return false
    }
    if (options.isPublishing?.()) {
      if (!silent) options.ui.message.warning('正在发布中，请等待发布完成后再保存')
      return false
    }

    const editor = getEditor()
    if (!editor) {
      if (!silent) options.ui.message.warning('编辑器未就绪')
      return false
    }

    const resource = getResource()
    if (!hasPageResourceLocator(resource)) {
      if (!silent) options.ui.message.error('缺少必要参数: resource')
      return false
    }
    if (!options.hostServices.page?.saveDraft) {
      if (!silent) options.ui.message.error('缺少 hostServices.page.saveDraft')
      return false
    }

    isSaving.value = true
    try {
      const beforeSaveContext = createPluginContext(editor, resource, null)
      const canSave = await runBeforeSaveHooks(getPlugins(), beforeSaveContext)
      if (!canSave) return false

      const serialized = await serializeForSave(editor, resource)
      const saveContext = createPluginContext(
        editor,
        resource,
        serialized.projectData,
        serialized.usedComponentTypes,
      )

      const resourcesFlushed = await flushResourceDrafts(saveContext)
      if (!resourcesFlushed) return false

      try {
        await saveOnce({
          editor,
          resource,
          schemaJson: serialized.schemaJson,
          forceOverride: false,
        })
      } catch (error) {
        if ((error as { code?: unknown })?.code !== PAGE_CONFLICT_CODE) {
          if (!silent) options.ui.message.error(getErrorMessage(error, '保存失败，请重试'))
          return false
        }

        if (options.supportsConflictOverride === false) {
          options.ui.message.error('当前存储模式下不支持冲突覆盖')
          return false
        }

        const confirmed = await options.ui.confirm({
          title: '保存冲突',
          message: '页面已被他人修改，是否强制覆盖？',
          confirmText: '强制覆盖',
          cancelText: '取消',
        })
        if (!confirmed) return false

        await saveOnce({
          editor,
          resource,
          schemaJson: serialized.schemaJson,
          forceOverride: true,
        })
      }

      await runAfterSaveSuccessHooks(getPlugins(), {
        ...saveContext,
        action: 'save',
        silent,
        projectData: serialized.projectData,
      })

      isDirty.value = false
      if (!silent) options.ui.message.success('保存成功')
      return true
    } finally {
      isSaving.value = false
    }
  }

  const loadDraft = async (): Promise<Record<string, unknown> | null> => {
    const editor = getEditor()
    if (!editor) {
      options.ui.message.warning('编辑器未就绪')
      return null
    }

    const resource = getResource()
    if (!hasPageResourceLocator(resource)) return null
    if (!options.hostServices.page?.getDraft) {
      options.ui.message.error('缺少 hostServices.page.getDraft')
      return null
    }

    try {
      const draft = await options.hostServices.page.getDraft(resource)
      currentPage.value = draft ?? null
      baseUpdateTime.value = getDraftUpdateTime(draft)

      const schemaJson =
        draft && typeof draft === 'object' && 'schemaJson' in draft
          ? String((draft as { schemaJson?: unknown }).schemaJson ?? '')
          : ''
      const parsed = parseDraftProjectData(schemaJson)
      if (parsed.error) {
        options.ui.message.error('解析草稿数据失败')
        return null
      }
      if (!parsed.projectData) return null

      await runBeforeProjectLoadHooks(
        getPlugins(),
        createPluginContext(editor, resource, parsed.projectData),
      )

      if (
        editor &&
        typeof editor === 'object' &&
        'loadProjectData' in editor &&
        typeof editor.loadProjectData === 'function'
      ) {
        editor.loadProjectData(parsed.projectData)
      }

      isDirty.value = false
      return parsed.projectData
    } catch (error) {
      options.ui.message.warning(getErrorMessage(error, '加载草稿失败'))
      currentPage.value = null
      return null
    }
  }

  const serializeProject = async () => {
    const editor = getEditor()
    const resource = getResource()
    const serialized = await serializeForSave(editor, resource)
    return serialized.projectData
  }

  const markDirty = () => {
    isDirty.value = true
  }

  return {
    baseUpdateTime,
    currentPage,
    isDirty,
    isSaving,
    loadDraft,
    markDirty,
    saveDraft,
    serializeProject,
  }
}
