import type {
  WebBuilderFeaturePlugin,
  WebBuilderPublisherContribution,
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
