import {
  hasWebBuilderCapability,
  type WebBuilderFeaturePlugin,
  type WebBuilderPanelContribution,
  type WebBuilderPluginAction,
} from '@toototech/webbuilder/core'

export const I18N_PLUGIN_ID = 'i18n'
export const I18N_PLUGIN_CAPABILITY = 'webbuilder:i18n'

export interface WebBuilderI18nRuntime {
  panelComponent?: unknown
  panelProps?: WebBuilderPanelContribution['props']
  isDirty?: () => boolean
  ensureReadyOrConfirm?: (action: WebBuilderPluginAction) => Promise<boolean> | boolean
  refreshSourceEntries?: () => void
  autoTranslateMissing?: (options: {
    publishReady: boolean
    reloadCurrentLocale: boolean
    silent: boolean
  }) => Promise<unknown> | unknown
  reloadBundle?: () => Promise<unknown> | unknown
  canLoadPreview?: () => boolean
  hasPreview?: () => boolean
  restorePreview?: () => Promise<void> | void
  getPreviewProjectData?: () => Record<string, unknown> | null
}

const runI18nPreflight = async (
  runtime: WebBuilderI18nRuntime | undefined,
  action: WebBuilderPluginAction
) => {
  runtime?.refreshSourceEntries?.()
  if (!runtime?.ensureReadyOrConfirm) return true
  return runtime.ensureReadyOrConfirm(action)
}

export const createI18nPlugin = (
  runtime?: WebBuilderI18nRuntime
): WebBuilderFeaturePlugin => ({
  id: I18N_PLUGIN_ID,
  label: 'I18n',
  order: 30,
  activateWhen: context => hasWebBuilderCapability(context.capabilityIds, I18N_PLUGIN_CAPABILITY),
  panels: [
    {
      id: 'i18n',
      label: 'I18n',
      order: 30,
      preserveOnSelection: true,
      component: runtime?.panelComponent,
      props: runtime?.panelProps,
    },
  ],
  preview: {
    canLoadPreview: runtime?.canLoadPreview,
    getPreviewProjectData: runtime?.getPreviewProjectData,
    hasPreview: runtime?.hasPreview,
    restorePreview: runtime?.restorePreview,
  },
  beforeProjectSerialize: () => {
    runtime?.refreshSourceEntries?.()
  },
  resources: [
    context =>
      context.resourceMode === 'lifecycle'
        ? [
            {
              id: 'i18n-draft',
              label: '多语言草稿',
              isDirty: () => Boolean(runtime?.isDirty?.()),
              failurePolicy: 'warning',
              flushDraft: () => true,
              publish: () => true,
              releaseLock: () => undefined,
            },
          ]
        : [],
  ],
  beforeSave: () => runI18nPreflight(runtime, 'save'),
  beforePublish: () => runI18nPreflight(runtime, 'publish'),
  afterSaveSuccess: async context => {
    if (!context.silent) return
    await runtime?.autoTranslateMissing?.({
      publishReady: false,
      reloadCurrentLocale: false,
      silent: true,
    })
  },
  afterPublishSuccess: async () => {
    await runtime?.reloadBundle?.()
  },
})
