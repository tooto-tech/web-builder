import type {
  GlobalSettingsSaveContext,
  GlobalSettingsService,
  GlobalSettingsSnapshot,
  PageResourceIdentity,
  SettingsSource,
} from '@toototech/webbuilder/core'

export interface GlobalSettingsPanelCacheSnapshot {
  colors: unknown[]
  typography: unknown
  customCss: string
  customCode: unknown[]
}

export interface SaveGlobalSettingsPanelDraftOptions {
  settings: SettingsSource
  service: GlobalSettingsService
  resource: PageResourceIdentity
  tenantId?: string | number | null
  sessionKey?: string
  cacheSnapshot: GlobalSettingsPanelCacheSnapshot
}

const createEmptyBaseSnapshot = (): GlobalSettingsSnapshot => ({
  colors: [],
  typography: {},
  customCss: '',
  customCode: [],
})

export const buildGlobalSettingsPanelDraftSnapshot = (
  currentSnapshot: GlobalSettingsSnapshot | null,
  cacheSnapshot: GlobalSettingsPanelCacheSnapshot
): GlobalSettingsSnapshot => ({
  ...(currentSnapshot ?? createEmptyBaseSnapshot()),
  colors: cacheSnapshot.colors,
  typography: cacheSnapshot.typography,
  customCss: cacheSnapshot.customCss,
  customCode: cacheSnapshot.customCode,
})

export const saveGlobalSettingsPanelDraft = async (
  options: SaveGlobalSettingsPanelDraftOptions
): Promise<GlobalSettingsSnapshot> => {
  const nextSnapshot = buildGlobalSettingsPanelDraftSnapshot(
    options.settings.getSnapshot(),
    options.cacheSnapshot
  )
  const context: GlobalSettingsSaveContext = {
    resource: options.resource,
    tenantId: options.tenantId ?? undefined,
    sessionKey: options.sessionKey,
  }
  const savedSnapshot = await options.service.saveDraft(nextSnapshot, context)
  options.settings.hydrate(savedSnapshot)
  return savedSnapshot
}
