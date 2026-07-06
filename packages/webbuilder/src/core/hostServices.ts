import type { PageResourceIdentity, WebBuilderPluginCleanup } from './featurePlugin.js'

export interface PageStorageService {
  getDraft: (resource: PageResourceIdentity) => Promise<unknown> | unknown
  saveDraft: (request: Record<string, unknown>) => Promise<unknown> | unknown
  publish?: (request: Record<string, unknown>) => Promise<unknown> | unknown
  publishLayoutPage?: (ownerId: number) => Promise<unknown> | unknown
  generateCss: (request: Record<string, unknown>) => Promise<unknown> | unknown
  getHistoryDetail: (id: number) => Promise<unknown> | unknown
  getPagePage: (params: Record<string, unknown>) => Promise<unknown> | unknown
}

export interface GlobalSettingsSnapshot {
  version?: string
  hash?: string
  colors: unknown[]
  typography: unknown
  customCss: string
  customCode: unknown[]
  updatedAt?: string
}

export interface GlobalSettingsLoadContext {
  resource: PageResourceIdentity
  tenantId?: string | number
}

export interface GlobalSettingsSaveContext extends GlobalSettingsLoadContext {
  sessionKey?: string
}

export interface GlobalSettingsService {
  loadDraft: (
    context: GlobalSettingsLoadContext
  ) => Promise<GlobalSettingsSnapshot> | GlobalSettingsSnapshot
  saveDraft: (
    snapshot: GlobalSettingsSnapshot,
    context: GlobalSettingsSaveContext
  ) => Promise<GlobalSettingsSnapshot> | GlobalSettingsSnapshot
  publish: (
    context: GlobalSettingsSaveContext
  ) => Promise<GlobalSettingsSnapshot> | GlobalSettingsSnapshot
}

export interface I18nService {
  loadBundle?: (context: unknown) => Promise<unknown> | unknown
  saveBundle?: (context: unknown) => Promise<unknown> | unknown
  translateEntries?: (context: unknown) => Promise<unknown> | unknown
  autoTranslateEntries?: (context: unknown) => Promise<unknown> | unknown
  getEnabledLanguages?: () => Promise<unknown[]> | unknown[]
  getTranslationConfig?: () => Promise<unknown> | unknown
  getEnabledProviderConfigs?: () => Promise<unknown[]> | unknown[]
}

export interface MediaAssetLike {
  src?: string
  url?: string | (() => string)
  getSrc?: () => string
  get?: (key: string) => unknown
}

export interface MediaSelectionTarget {
  isStyleProp?: boolean
  filterType?: string
  selectCallback?: (asset: MediaAssetLike) => void
  [key: string]: unknown
}

export interface MediaService {
  openAssetsDialog?: (target?: MediaSelectionTarget) => void
  openAssetsDialogWithTarget?: (target: MediaSelectionTarget) => void
  loadAssets?: (params?: Record<string, unknown>) => Promise<unknown> | unknown
  uploadAssets?: (files: File[], params?: Record<string, unknown>) => Promise<unknown> | unknown
}

export type PageSettingsHostQuery = Record<string, unknown>
export type PageSettingsHostLoader<
  T = unknown,
  Args extends unknown[] = [],
> = (...args: Args) => Promise<T> | T

export interface PageSettingsService {
  getPostPage?: PageSettingsHostLoader<unknown, [params: PageSettingsHostQuery]>
  getPost?: PageSettingsHostLoader<unknown, [id: number]>
  getSpuSimpleList?: PageSettingsHostLoader<unknown>
  getSpu?: PageSettingsHostLoader<unknown, [id: number]>
  getProductCategoryList?: PageSettingsHostLoader<unknown, [params?: PageSettingsHostQuery]>
  getMediaResourcePage?: PageSettingsHostLoader<unknown, [params: PageSettingsHostQuery]>
  getMediaResourceDetail?: PageSettingsHostLoader<unknown, [id: number]>
}

export interface EditLockHolder {
  userId: string | number
  displayName?: string
  username?: string
  sessionKey?: string
  isCurrentUser?: boolean
  isCurrentSession?: boolean
}

/**
 * Normalized edit-lock state exposed by hostServices.lock.
 * Current admin lock APIs expose holder identity, session ownership, lock/heartbeat
 * timestamps, and takeover status; package controllers should depend on this
 * normalized state instead of HTTP response shapes.
 */
export interface EditLockState {
  locked: boolean
  ownedByMe: boolean
  holder?: EditLockHolder
  expiresAt?: string
  heartbeatIntervalMs?: number
  message?: string
  raw?: unknown
}

export interface HostLockAcquireOptions {
  sessionKey?: string
  forceTakeover?: boolean
  immediateTakeover?: boolean
}

export interface HostLockHeartbeatOptions {
  sessionKey?: string
}

export interface HostLockReleaseOptions {
  sessionKey?: string
  keepalive?: boolean
}

export interface LockService {
  acquire: (
    resource: PageResourceIdentity,
    options?: HostLockAcquireOptions
  ) => Promise<EditLockState> | EditLockState
  heartbeat: (
    resource: PageResourceIdentity,
    options?: HostLockHeartbeatOptions
  ) => Promise<EditLockState> | EditLockState
  release: (
    resource: PageResourceIdentity,
    options?: HostLockReleaseOptions
  ) => Promise<void> | void
  query: (
    resource: PageResourceIdentity,
    options?: HostLockHeartbeatOptions
  ) => Promise<EditLockState> | EditLockState
}

/**
 * Normalized revision row exposed by hostServices.revision.
 * Current admin history rows are keyed by id and carry created/update time,
 * operator fields, and optional page metadata/summary text.
 */
export interface RevisionSummary {
  id: number
  createdAt: string
  createdBy?: string
  note?: string
  updatedAt?: string
  title?: string
  raw?: unknown
}

export interface RevisionService {
  list: (
    resource: PageResourceIdentity,
    params?: Record<string, unknown>
  ) => Promise<RevisionSummary[]> | RevisionSummary[]
  getDetail: (id: number) => Promise<unknown> | unknown
  snapshot?: (
    resource: PageResourceIdentity,
    note?: string
  ) => Promise<RevisionSummary> | RevisionSummary
}

export interface HostServices {
  page?: PageStorageService
  globalSettings?: GlobalSettingsService
  i18n?: I18nService
  media?: MediaService
  pageSettings?: PageSettingsService
  lock?: LockService
  revision?: RevisionService
  product?: Record<string, unknown>
  menu?: Record<string, unknown>
  faq?: Record<string, unknown>
  inquiry?: Record<string, unknown>
}

export interface HostUiMessageApi {
  success: (message: unknown) => void
  warning: (message: unknown) => void
  info: (message: unknown) => void
  error: (message: unknown) => void
}

export interface HostUiConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
}

export interface HostUiPromptOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  inputValue?: string
  inputValidator?: (value: string) => boolean | string
}

export interface HostUi {
  confirm: (options: HostUiConfirmOptions) => Promise<boolean>
  message: HostUiMessageApi
  prompt?: (options: HostUiPromptOptions) => Promise<string | null>
  openDialog?: (options: Record<string, unknown>) => unknown
}

export interface RouteAdapter {
  getQuery: () => Record<string, unknown>
  replaceQuery: (query: Record<string, unknown>) => Promise<void> | void
  onBeforeLeave: (guard: () => boolean | Promise<boolean>) => WebBuilderPluginCleanup
}

export interface SettingsSource {
  getSnapshot: () => GlobalSettingsSnapshot | null
  hydrate: (snapshot: GlobalSettingsSnapshot) => void
  subscribe: (
    listener: (snapshot: GlobalSettingsSnapshot | null) => void
  ) => WebBuilderPluginCleanup
}

export const createMemorySettingsSource = (): SettingsSource => {
  let snapshot: GlobalSettingsSnapshot | null = null
  const listeners = new Set<(snapshot: GlobalSettingsSnapshot | null) => void>()

  return {
    getSnapshot: () => snapshot,
    hydrate(nextSnapshot) {
      snapshot = nextSnapshot
      listeners.forEach(listener => listener(snapshot))
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
