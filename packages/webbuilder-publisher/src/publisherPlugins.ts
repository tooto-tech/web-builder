import {
  collectPublisherContributions,
  createWebBuilderPluginManager,
  type WebBuilderFeaturePlugin,
  type WebBuilderPluginResolveContext,
  type WebBuilderPublisherAssets,
  type WebBuilderPublisherContext,
  type WebBuilderPublisherContribution,
} from '@toototech/webbuilder-core'

export interface WebBuilderPublisherPluginRegistryOptions {
  plugins: WebBuilderFeaturePlugin[]
  resolveContext: WebBuilderPluginResolveContext
}

export interface WebBuilderPublisherPluginRegistry {
  activePlugins: WebBuilderFeaturePlugin[]
  publisherContributions: WebBuilderPublisherContribution[]
  renderPublisherAssets: (
    context: WebBuilderPublisherContext
  ) => Promise<WebBuilderPublisherAssets>
}

const appendAssetFragment = (left?: string, right?: string): string | undefined => {
  const fragments = [left, right].filter(
    (fragment): fragment is string =>
      typeof fragment === 'string' && fragment.trim() !== ''
  )

  return fragments.length > 0 ? fragments.join('\n') : undefined
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const mergePublisherMetadata = (
  left?: Record<string, unknown>,
  right?: Record<string, unknown>
): Record<string, unknown> | undefined => {
  if (!left && !right) return undefined
  if (!left) return { ...right }
  if (!right) return { ...left }

  const merged: Record<string, unknown> = { ...left }

  Object.entries(right).forEach(([key, value]) => {
    const previous = merged[key]

    merged[key] =
      isRecord(previous) && isRecord(value)
        ? { ...previous, ...value }
        : value
  })

  return merged
}

const mergePublisherAssets = (
  left: WebBuilderPublisherAssets,
  right: WebBuilderPublisherAssets
): WebBuilderPublisherAssets => {
  const metadata = mergePublisherMetadata(left.metadata, right.metadata)

  return {
    css: appendAssetFragment(left.css, right.css),
    headHtml: appendAssetFragment(left.headHtml, right.headHtml),
    bodyStartHtml: appendAssetFragment(left.bodyStartHtml, right.bodyStartHtml),
    bodyEndHtml: appendAssetFragment(left.bodyEndHtml, right.bodyEndHtml),
    ...(metadata ? { metadata } : {}),
  }
}

export const renderWebBuilderPublisherAssets = async (
  contributions: WebBuilderPublisherContribution[],
  context: WebBuilderPublisherContext
): Promise<WebBuilderPublisherAssets> => {
  let assets: WebBuilderPublisherAssets = {}

  for (const contribution of contributions) {
    const rendered = await contribution.render?.(context)
    if (!rendered) continue
    assets = mergePublisherAssets(assets, rendered)
  }

  return assets
}

export const createWebBuilderPublisherPluginRegistry = (
  options: WebBuilderPublisherPluginRegistryOptions
): WebBuilderPublisherPluginRegistry => {
  const activePlugins = createWebBuilderPluginManager(options.plugins).resolve(
    options.resolveContext
  )
  const publisherContributions = collectPublisherContributions(activePlugins)

  return {
    activePlugins,
    publisherContributions,
    renderPublisherAssets: context =>
      renderWebBuilderPublisherAssets(publisherContributions, context),
  }
}
