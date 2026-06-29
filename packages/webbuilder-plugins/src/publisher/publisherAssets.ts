import type {
  PageResourceIdentity,
  TenantContext,
  WebBuilderFeaturePlugin,
  WebBuilderPublisherAssets,
  WebBuilderPublisherContext,
} from '@toototech/webbuilder/core'
import { collectProjectDataComponentTypes } from '@toototech/webbuilder/core'
import { componentsCms } from '../cms/index.js'
import { globalSettings } from '../global-settings/index.js'
import { createWebBuilderPublisherPluginRegistry } from './publisherPlugins.js'

export interface WebBuilderPublisherRuntimeRenderOptions
  extends WebBuilderPublisherContext {
  resource?: PageResourceIdentity
  capabilityIds?: Iterable<string>
  tenant?: Partial<TenantContext>
}

const createPublisherTenantContext = (
  tenant: Partial<TenantContext> = {}
): TenantContext => ({
  roles: tenant.roles ?? [],
  permissions: tenant.permissions ?? new Set(),
  tenantId: tenant.tenantId,
  userId: tenant.userId,
  getAccessToken: tenant.getAccessToken,
  getEffectiveTenantId: tenant.getEffectiveTenantId,
})

export const WEB_BUILDER_PUBLISHER_FEATURE_PLUGINS: WebBuilderFeaturePlugin[] = [
  globalSettings(),
  componentsCms(),
]

export const createWebBuilderPublisherRuntimeRegistry = (
  options: WebBuilderPublisherRuntimeRenderOptions,
) => {
  const projectData = options.projectData ?? null
  const usedComponentTypes = collectProjectDataComponentTypes(projectData)

  return createWebBuilderPublisherPluginRegistry({
    plugins: WEB_BUILDER_PUBLISHER_FEATURE_PLUGINS,
    resolveContext: {
      resource: options.resource ?? {},
      projectData,
      usedComponentTypes,
      capabilityIds: new Set(options.capabilityIds ?? []),
      tenant: createPublisherTenantContext(options.tenant),
    },
  })
}

export const renderWebBuilderPublisherPluginAssets = async (
  options: WebBuilderPublisherRuntimeRenderOptions,
): Promise<WebBuilderPublisherAssets> =>
  createWebBuilderPublisherRuntimeRegistry(options).renderPublisherAssets({
    projectData: options.projectData ?? null,
    globalSettings: options.globalSettings ?? null,
  })
