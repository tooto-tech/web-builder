import type {
  WebBuilderFeaturePlugin,
  WebBuilderPreviewContribution,
} from './featurePlugin.js'

export interface WebBuilderActivePreviewContribution {
  pluginId: string
  preview: WebBuilderPreviewContribution
}

export const collectWebBuilderPreviewContributions = (
  plugins: WebBuilderFeaturePlugin[]
): WebBuilderActivePreviewContribution[] =>
  plugins
    .filter(plugin => plugin.preview)
    .map(plugin => ({
      pluginId: plugin.id,
      preview: plugin.preview as WebBuilderPreviewContribution,
    }))

export const hasWebBuilderPreviewContribution = (
  contributions: WebBuilderActivePreviewContribution[]
) => contributions.some(contribution => contribution.preview.hasPreview?.() === true)

export const canLoadWebBuilderPreviewContribution = (
  contributions: WebBuilderActivePreviewContribution[]
) =>
  contributions.some(contribution =>
    contribution.preview.getPreviewProjectData &&
    contribution.preview.canLoadPreview?.() !== false
  )

export const getWebBuilderPreviewProjectData = (
  contributions: WebBuilderActivePreviewContribution[]
) => {
  for (const contribution of contributions) {
    if (!contribution.preview.getPreviewProjectData) continue
    if (contribution.preview.canLoadPreview?.() === false) continue
    const projectData = contribution.preview.getPreviewProjectData()
    if (projectData) return projectData
  }
  return null
}

export const restoreWebBuilderPreviewContributions = async (
  contributions: WebBuilderActivePreviewContribution[]
) => {
  for (const contribution of contributions) {
    if (contribution.preview.hasPreview?.() !== true) continue
    await contribution.preview.restorePreview?.()
  }
}
