import type { Editor } from 'grapesjs'
import { createGrapesPluginDescriptor } from './grapesPluginAdapter.js'
import type { WebBuilderCommandContext } from './commandContext.js'
import type {
  HostServices,
  HostUi,
  RouteAdapter,
  SettingsSource,
} from './hostServices.js'
import type {
  TenantContext,
  WebBuilderFeaturePlugin,
  WebBuilderPluginContext,
  WebBuilderPluginResolveContext,
} from './featurePlugin.js'

export interface WebBuilderPluginActivationContext extends WebBuilderPluginResolveContext {
  commands: WebBuilderCommandContext
  hostServices: HostServices
  settings: SettingsSource
  ui: HostUi
  route: RouteAdapter
  tenant: TenantContext
}

export interface WebBuilderPluginManager {
  resolve: (context: WebBuilderPluginResolveContext) => WebBuilderFeaturePlugin[]
  activateEditor: (
    editor: Editor,
    context: WebBuilderPluginActivationContext
  ) => () => void
  getActivationDiagnostics: () => WebBuilderPluginActivationDiagnostic[]
}

export interface WebBuilderPluginActivationDiagnostic {
  pluginId: string
  message: string
  error: unknown
}

const hasMatchingComponentType = (
  plugin: WebBuilderFeaturePlugin,
  usedComponentTypes: Set<string>
) => plugin.loadComponentTypes?.some(type => usedComponentTypes.has(type)) ?? false

const shouldActivatePlugin = (
  plugin: WebBuilderFeaturePlugin,
  context: WebBuilderPluginResolveContext
) =>
  Boolean(plugin.alwaysEnabled) ||
  hasMatchingComponentType(plugin, context.usedComponentTypes) ||
  Boolean(plugin.activateWhen?.(context))

const sortPlugins = (plugins: WebBuilderFeaturePlugin[]) =>
  [...plugins].sort((left, right) => {
    const orderDelta = (left.order ?? 0) - (right.order ?? 0)
    if (orderDelta !== 0) return orderDelta
    return left.id.localeCompare(right.id)
  })

const assertUniquePluginIds = (plugins: WebBuilderFeaturePlugin[]) => {
  const seen = new Set<string>()

  for (const plugin of plugins) {
    if (seen.has(plugin.id)) {
      throw new Error(`Duplicate WebBuilder feature plugin id "${plugin.id}"`)
    }
    seen.add(plugin.id)
  }
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message || 'Plugin activation failed')
  }
  return 'Plugin activation failed'
}

const removeEditorPluginIfPresent = (editor: Editor, id: string) => {
  const pluginManager = editor.Plugins as Editor['Plugins'] & {
    get?: (id: string) => unknown
  }

  if (typeof pluginManager.get === 'function' && !pluginManager.get(id)) return

  editor.Plugins.remove(id)
}

export function createWebBuilderPluginManager(
  plugins: WebBuilderFeaturePlugin[]
): WebBuilderPluginManager {
  assertUniquePluginIds(plugins)
  let activationDiagnostics: WebBuilderPluginActivationDiagnostic[] = []

  const resolve = (context: WebBuilderPluginResolveContext) =>
    sortPlugins(plugins.filter(plugin => shouldActivatePlugin(plugin, context)))

  const activateEditor = (
    editor: Editor,
    context: WebBuilderPluginActivationContext
  ) => {
    const activePlugins = resolve(context)
    const activatedIds: string[] = []
    activationDiagnostics = []

    try {
      activePlugins.forEach((feature) => {
        const descriptor = createGrapesPluginDescriptor(feature, (activeEditor) => ({
          ...context,
          editor: activeEditor,
          registerCleanup: () => undefined,
        } satisfies WebBuilderPluginContext))
        editor.Plugins.add(descriptor)
        activatedIds.push(feature.id)
      })
    } catch (error) {
      const pluginId = activePlugins.find(plugin => !activatedIds.includes(plugin.id))?.id
      activationDiagnostics = [
        ...activationDiagnostics,
        {
          pluginId: pluginId ?? 'unknown',
          message: getErrorMessage(error),
          error,
        },
      ]
      activatedIds
        .slice()
        .reverse()
        .forEach((id) => {
          removeEditorPluginIfPresent(editor, id)
        })
      throw error
    }

    let cleaned = false
    return () => {
      if (cleaned) return
      cleaned = true
      activatedIds
        .slice()
        .reverse()
        .forEach((id) => {
          removeEditorPluginIfPresent(editor, id)
        })
    }
  }

  return {
    resolve,
    activateEditor,
    getActivationDiagnostics: () => [...activationDiagnostics],
  }
}
