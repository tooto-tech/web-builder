import type { ResourceTransactionParticipant } from './resourceTransaction.js'
import { collectWebBuilderBlockPacks } from './blockContributions.js'
import { collectWebBuilderPanelContributions } from './panelContributions.js'
import {
  collectWebBuilderPreviewContributions,
  type WebBuilderActivePreviewContribution,
} from './previewContributions.js'
import { createWebBuilderPluginManager } from './pluginManager.js'
import { collectWebBuilderResourceParticipants } from './resourceContributions.js'
import type {
  WebBuilderBlockPack,
  WebBuilderFeaturePlugin,
  WebBuilderPanelContribution,
  WebBuilderPluginContext,
  WebBuilderPluginResolveContext,
} from './featurePlugin.js'

export interface WebBuilderPluginSessionOptions {
  plugins: WebBuilderFeaturePlugin[]
  resolveContext: WebBuilderPluginResolveContext
}

export interface WebBuilderPluginSession {
  activePlugins: WebBuilderFeaturePlugin[]
  panels: WebBuilderPanelContribution[]
  previews: WebBuilderActivePreviewContribution[]
  collectBlockPacks: (
    canInsertComponentType: (type: string) => boolean
  ) => WebBuilderBlockPack[]
  collectResourceParticipants: (
    context: WebBuilderPluginContext
  ) => ResourceTransactionParticipant[]
}

export const createWebBuilderPluginSession = (
  options: WebBuilderPluginSessionOptions,
): WebBuilderPluginSession => {
  const manager = createWebBuilderPluginManager(options.plugins)
  const activePlugins = manager.resolve(options.resolveContext)

  return {
    activePlugins,
    panels: collectWebBuilderPanelContributions(activePlugins),
    previews: collectWebBuilderPreviewContributions(activePlugins),
    collectBlockPacks: canInsertComponentType =>
      collectWebBuilderBlockPacks(activePlugins, {
        ...options.resolveContext,
        canInsertComponentType,
      }),
    collectResourceParticipants: context =>
      collectWebBuilderResourceParticipants(activePlugins, context),
  }
}
