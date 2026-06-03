import type {
  ResourceTransactionParticipant,
  WebBuilderFeaturePlugin,
  WebBuilderPanelContribution,
  WebBuilderPluginContext,
} from '@tooto-tech/webbuilder-core'

export const LAYOUT_TEMPLATE_PLUGIN_ID = 'layout-template'

export type LayoutTemplatePanelRuntime = Partial<
  Pick<
    WebBuilderPanelContribution,
    'label' | 'order' | 'icon' | 'preserveOnSelection' | 'component' | 'props'
  >
>

export interface LayoutTemplatePluginRuntime {
  panels?: {
    layout?: LayoutTemplatePanelRuntime
    template?: LayoutTemplatePanelRuntime
  }
  collectResourceParticipants?: (
    context: WebBuilderPluginContext
  ) => ResourceTransactionParticipant[]
  collectLockParticipants?: (
    context: WebBuilderPluginContext
  ) => ResourceTransactionParticipant[]
  beforeProjectLoad?: (context: WebBuilderPluginContext) => Promise<void> | void
}

const createPanel = (
  id: 'layout' | 'template',
  label: string,
  order: number,
  panel?: LayoutTemplatePanelRuntime,
): WebBuilderPanelContribution => ({
  id,
  label: panel?.label ?? label,
  order: panel?.order ?? order,
  ...(panel?.icon ? { icon: panel.icon } : {}),
  ...(panel?.preserveOnSelection !== undefined
    ? { preserveOnSelection: panel.preserveOnSelection }
    : {}),
  ...(panel?.component !== undefined ? { component: panel.component } : {}),
  ...(panel?.props !== undefined ? { props: panel.props } : {}),
})

export const createLayoutTemplatePlugin = (
  runtime: LayoutTemplatePluginRuntime = {}
): WebBuilderFeaturePlugin => ({
  id: LAYOUT_TEMPLATE_PLUGIN_ID,
  label: 'Layout Template',
  order: 40,
  alwaysEnabled: true,
  panels: [
    createPanel('layout', 'Layout', 40, runtime.panels?.layout),
    createPanel('template', 'Template', 50, runtime.panels?.template),
  ],
  resources: [
    context => [
      ...(runtime.collectResourceParticipants?.(context) ?? []),
      ...(runtime.collectLockParticipants?.(context) ?? []),
    ],
  ],
  beforeProjectLoad: context => runtime.beforeProjectLoad?.(context),
})
