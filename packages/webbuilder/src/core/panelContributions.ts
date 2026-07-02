import type {
  WebBuilderFeaturePlugin,
  WebBuilderPanelContribution,
} from './featurePlugin.js'

export const sortWebBuilderPanels = (panels: WebBuilderPanelContribution[]) =>
  [...panels].sort((left, right) => {
    const orderDelta = (left.order ?? 0) - (right.order ?? 0)
    if (orderDelta !== 0) return orderDelta
    return left.id.localeCompare(right.id)
  })

export const collectWebBuilderPanelContributions = (
  plugins: WebBuilderFeaturePlugin[],
): WebBuilderPanelContribution[] => {
  const seenPanelIds = new Set<string>()
  const panels: WebBuilderPanelContribution[] = []

  plugins.forEach((plugin) => {
    plugin.panels?.forEach((panel) => {
      if (seenPanelIds.has(panel.id)) {
        throw new Error(`Duplicate WebBuilder panel id "${panel.id}"`)
      }
      seenPanelIds.add(panel.id)
      panels.push(panel)
    })
  })

  return sortWebBuilderPanels(panels)
}

export const findWebBuilderPanelContribution = (
  panels: WebBuilderPanelContribution[],
  panelId: string,
) => panels.find(panel => panel.id === panelId) ?? null
