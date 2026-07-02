import type {
  WebBuilderFeaturePlugin,
  WebBuilderPublisherAssets,
  WebBuilderPublisherContribution,
  WebBuilderPublisherContext,
} from './featurePlugin.js'

const sortPublisherContributions = (
  contributions: WebBuilderPublisherContribution[]
) =>
  [...contributions].sort((left, right) => {
    const orderDelta = (left.order ?? 0) - (right.order ?? 0)
    if (orderDelta !== 0) return orderDelta
    return left.id.localeCompare(right.id)
  })

const assertUniquePublisherContributionIds = (
  contributions: WebBuilderPublisherContribution[]
) => {
  const seen = new Set<string>()

  for (const contribution of contributions) {
    if (seen.has(contribution.id)) {
      throw new Error(
        `Duplicate WebBuilder publisher contribution id "${contribution.id}"`
      )
    }
    seen.add(contribution.id)
  }
}

export const collectPublisherContributions = (
  plugins: WebBuilderFeaturePlugin[]
): WebBuilderPublisherContribution[] => {
  const contributions = plugins
    .map(plugin => plugin.publisher)
    .filter((publisher): publisher is WebBuilderPublisherContribution =>
      Boolean(publisher)
    )

  assertUniquePublisherContributionIds(contributions)
  return sortPublisherContributions(contributions)
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
