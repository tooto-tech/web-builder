import type { WebBuilderPanelContribution } from './featurePlugin.js'
import { sortWebBuilderPanels } from './panelContributions.js'

export const BUILTIN_WEB_BUILDER_PANELS: WebBuilderPanelContribution[] = [
  {
    id: 'blocks',
    label: 'Components',
    icon: 'uit:create-dashboard',
    order: 10,
  },
  {
    id: 'styles',
    label: 'Styles',
    icon: 'material-symbols-light:palette-outline',
    order: 20,
  },
  {
    id: 'layers',
    label: 'Layers',
    icon: 'lucide:layers',
    order: 40,
  },
  {
    id: 'pages',
    label: 'Pages',
    icon: 'lucide:file-stack',
    order: 50,
  },
  {
    id: 'assets',
    label: 'Assets',
    icon: 'ph:image-light',
    order: 60,
  },
]

export const BUILTIN_WEB_BUILDER_PANEL_IDS = new Set(
  BUILTIN_WEB_BUILDER_PANELS.map(panel => panel.id),
)

export const collectBuiltinWebBuilderPanels = (
  pluginPanels: WebBuilderPanelContribution[] = [],
): WebBuilderPanelContribution[] => {
  const seenPanelIds = new Set<string>()
  const panels = [...BUILTIN_WEB_BUILDER_PANELS, ...pluginPanels]

  panels.forEach((panel) => {
    if (seenPanelIds.has(panel.id)) {
      throw new Error(`Duplicate WebBuilder panel id "${panel.id}"`)
    }
    seenPanelIds.add(panel.id)
  })

  return sortWebBuilderPanels(panels)
}
