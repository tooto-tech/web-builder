import type {
  WebBuilderCapabilitySnapshot,
} from './capabilityAdapter.js'
import { collectProjectDataComponentTypes } from './projectDataDependencies.js'
import {
  createWebBuilderPluginSession,
  type WebBuilderPluginSession,
} from './pluginSession.js'
import type {
  PageResourceIdentity,
  WebBuilderFeaturePlugin,
  WebBuilderPluginResolveContext,
} from './featurePlugin.js'

export interface WebBuilderPluginLoadPlanOptions {
  plugins: WebBuilderFeaturePlugin[]
  resource: PageResourceIdentity
  projectData: Record<string, unknown> | null
  resolveCapabilities: (
    resource: PageResourceIdentity,
    options: { usedComponentTypes: Set<string> }
  ) => WebBuilderCapabilitySnapshot
}

export interface WebBuilderPluginLoadPlan {
  usedComponentTypes: Set<string>
  capabilitySnapshot: WebBuilderCapabilitySnapshot
  resolveContext: WebBuilderPluginResolveContext
  session: WebBuilderPluginSession
}

export const createWebBuilderPluginLoadPlan = (
  options: WebBuilderPluginLoadPlanOptions,
): WebBuilderPluginLoadPlan => {
  const usedComponentTypes = collectProjectDataComponentTypes(options.projectData)
  const capabilitySnapshot = options.resolveCapabilities(options.resource, {
    usedComponentTypes,
  })
  const resolveContext: WebBuilderPluginResolveContext = {
    resource: options.resource,
    projectData: options.projectData,
    usedComponentTypes,
    capabilityIds: capabilitySnapshot.capabilityIds,
    tenant: capabilitySnapshot.tenant,
  }

  return {
    usedComponentTypes,
    capabilitySnapshot,
    resolveContext,
    session: createWebBuilderPluginSession({
      plugins: options.plugins,
      resolveContext,
    }),
  }
}
