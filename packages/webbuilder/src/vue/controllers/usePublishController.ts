import { ref } from 'vue'

import {
  buildDraftSaveRequest,
  collectPublisherContributions,
  createResourceTransaction,
  getDraftUpdateTime,
  hasPageResourceLocator,
  normalizePageResourceIdentity,
  renderWebBuilderPublisherAssets,
  runAfterPublishSuccessHooks,
  runBeforePublishHooks,
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

export interface UsePublishControllerOptions {
  editor: unknown | (() => unknown)
  resource: PageResourceIdentity | (() => PageResourceIdentity)
  hostServices: HostServices
  saveDraft: (options?: { silent?: boolean }) => Promise<boolean>
  plugins?: WebBuilderFeaturePlugin[] | (() => WebBuilderFeaturePlugin[])
  commands?: WebBuilderCommandContext
  tenant?: TenantContext
  settings: SettingsSource
  ui: HostUi
  route: RouteAdapter
  getSessionKey?: () => string
  getResourceName?: (editor: unknown, resource: PageResourceIdentity) => string | undefined
  getBaseUpdateTime?: () => Date | string | undefined
  setBaseUpdateTime?: (time: Date | string) => void
}

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

const isLayoutPagePublishType = (type?: string) =>
  type === 'LAYOUT_PAGE_HEADER' ||
  type === 'LAYOUT_PAGE_FOOTER' ||
  type === 'HEADER' ||
  type === 'FOOTER'

export const usePublishController = (options: UsePublishControllerOptions) => {
  const isPublishing = ref(false)

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
    resourceMode: 'publish',
    registerCleanup: () => undefined,
  })

  const publishResources = async (context: WebBuilderPluginContext) => {
    const participants = getPlugins().flatMap(plugin =>
      (Array.isArray(plugin.resources) ? plugin.resources : [])
        .flatMap(provider => {
          const provided = provider(context)
          return Array.isArray(provided) ? provided : []
        })
    )

    if (!participants.length) return true

    const result = await createResourceTransaction({ participants }).publish()
    if (result.success) return true

    const firstFailure = result.failures[0]
    if (firstFailure?.message) {
      options.ui.message.error(firstFailure.message)
    }
    return false
  }

  const publish = async (): Promise<boolean> => {
    if (isPublishing.value) return false

    const editor = getEditor()
    if (!editor) {
      options.ui.message.warning('编辑器未就绪')
      return false
    }

    const resource = getResource()
    if (!hasPageResourceLocator(resource)) {
      options.ui.message.error('缺少必要参数: resource')
      return false
    }
    if (!options.hostServices.page?.publish) {
      options.ui.message.error('缺少 hostServices.page.publish')
      return false
    }

    isPublishing.value = true
    try {
      const beforeContext = createPluginContext(editor, resource, null)
      const canPublish = await runBeforePublishHooks(getPlugins(), beforeContext)
      if (!canPublish) return false

      const draftSaved = await options.saveDraft({ silent: true })
      if (!draftSaved) return false

      const serialized = serializeDraftProjectData(editor)
      const publishContext = createPluginContext(
        editor,
        resource,
        serialized.projectData,
        serialized.usedComponentTypes,
      )

      const resourcesPublished = await publishResources(publishContext)
      if (!resourcesPublished) return false

      const publisherAssets = await renderWebBuilderPublisherAssets(
        collectPublisherContributions(getPlugins()),
        {
          projectData: serialized.projectData,
          globalSettings: options.settings.getSnapshot(),
        },
      )
      const generatedCss = await options.hostServices.page.generateCss?.({
        resource,
        schemaJson: serialized.schemaJson,
        projectData: serialized.projectData,
        publisherAssets,
      })

      const type = resource.resourceType || resource.ownerType
      const request = {
        ...buildDraftSaveRequest({
          resource: {
            ...resource,
            resourceType: type || resource.resourceType,
          },
          resourceName: options.getResourceName?.(editor, resource),
          schemaJson: serialized.schemaJson,
          baseUpdateTime: options.getBaseUpdateTime?.(),
          sessionKey: options.getSessionKey?.() ?? '',
          forceOverride: false,
        }),
        publisherAssets,
        generatedCss,
      }

      const result = await options.hostServices.page.publish(request)

      if (isLayoutPagePublishType(type) && resource.ownerId) {
        await options.hostServices.page.publishLayoutPage?.(resource.ownerId)
      }

      const updateTime = getDraftUpdateTime(result) ?? new Date()
      options.setBaseUpdateTime?.(updateTime)

      await runAfterPublishSuccessHooks(getPlugins(), {
        ...publishContext,
        action: 'publish',
        silent: false,
        projectData: serialized.projectData,
      })

      options.ui.message.success(isLayoutPagePublishType(type) ? '发布并上线成功' : '发布成功')
      return true
    } catch (error) {
      options.ui.message.error(getErrorMessage(error, '发布失败，请重试'))
      return false
    } finally {
      isPublishing.value = false
    }
  }

  return {
    isPublishing,
    publish,
  }
}
