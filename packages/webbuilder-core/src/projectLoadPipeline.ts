import type {
  WebBuilderFeaturePlugin,
  WebBuilderPluginContext,
  WebBuilderProjectDataHook,
  WebBuilderActionHook,
  WebBuilderActionSuccessContext,
  WebBuilderActionSuccessHook,
} from './featurePlugin.js'

type ProjectDataHookName = 'beforeProjectLoad' | 'beforeProjectSerialize'
type ActionHookName = 'beforeSave' | 'beforePublish'
type ActionSuccessHookName = 'afterSaveSuccess' | 'afterPublishSuccess'

const runProjectDataHookSequence = async (
  plugins: WebBuilderFeaturePlugin[],
  context: WebBuilderPluginContext,
  hookName: ProjectDataHookName,
) => {
  for (const plugin of plugins) {
    const hook = plugin[hookName] as WebBuilderProjectDataHook | undefined
    if (hook) {
      await hook(context)
    }
  }
}

const runActionHookSequence = async (
  plugins: WebBuilderFeaturePlugin[],
  context: WebBuilderPluginContext,
  hookName: ActionHookName,
) => {
  for (const plugin of plugins) {
    const hook = plugin[hookName] as WebBuilderActionHook | undefined
    if (hook) {
      const result = await hook(context)
      if (result === false) {
        return false
      }
    }
  }
  return true
}

const runActionSuccessHookSequence = async (
  plugins: WebBuilderFeaturePlugin[],
  context: WebBuilderActionSuccessContext,
  hookName: ActionSuccessHookName,
) => {
  for (const plugin of plugins) {
    const hook = plugin[hookName] as WebBuilderActionSuccessHook | undefined
    if (hook) {
      await hook(context)
    }
  }
}

export const runBeforeProjectLoadHooks = (
  plugins: WebBuilderFeaturePlugin[],
  context: WebBuilderPluginContext,
) => runProjectDataHookSequence(plugins, context, 'beforeProjectLoad')

export const runBeforeProjectSerializeHooks = (
  plugins: WebBuilderFeaturePlugin[],
  context: WebBuilderPluginContext,
) => runProjectDataHookSequence(plugins, context, 'beforeProjectSerialize')

export const runBeforeSaveHooks = (
  plugins: WebBuilderFeaturePlugin[],
  context: WebBuilderPluginContext,
) => runActionHookSequence(plugins, context, 'beforeSave')

export const runBeforePublishHooks = (
  plugins: WebBuilderFeaturePlugin[],
  context: WebBuilderPluginContext,
) => runActionHookSequence(plugins, context, 'beforePublish')

export const runAfterSaveSuccessHooks = (
  plugins: WebBuilderFeaturePlugin[],
  context: WebBuilderActionSuccessContext,
) => runActionSuccessHookSequence(plugins, context, 'afterSaveSuccess')

export const runAfterPublishSuccessHooks = (
  plugins: WebBuilderFeaturePlugin[],
  context: WebBuilderActionSuccessContext,
) => runActionSuccessHookSequence(plugins, context, 'afterPublishSuccess')
