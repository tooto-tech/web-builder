import type { PageResourceIdentity } from './featurePlugin.js'

export type { PageResourceIdentity } from './featurePlugin.js'

type NullablePrimitive = string | number | null | undefined

const normalizeString = (value: NullablePrimitive): string | undefined => {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  return normalized ? normalized : undefined
}

const normalizeNumber = (value: NullablePrimitive): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  if (!normalized) return undefined
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

export interface PageDraftRecord extends PageResourceIdentity {
  id?: number
  resourceName?: string
  extJson?: string
  version?: string
  status?: string
  schemaJson?: string
  htmlContentInit?: string
  htmlContentFull?: string
  publishStatus?: string
  createTime?: Date | string
  updateTime?: Date | string
  creator?: string
  updater?: string
}

export interface PageSaveRequest extends PageResourceIdentity {
  resourceName?: string
  schemaJson: string
  baseUpdateTime?: Date | string
  forceOverride?: boolean
  sessionKey: string
}

export type DraftStorageMode = 'backend' | 'indexedDb'

export interface WebBuilderSelfStorageLoadContext {
  editor?: unknown
  resource: PageResourceIdentity
}

export interface WebBuilderSelfStorageLoadResult {
  project: Record<string, unknown> | null
}

export interface WebBuilderSelfStorageSaveContext {
  project: Record<string, unknown>
  schemaJson: string
  editor: unknown
  resource: PageResourceIdentity
}

export interface WebBuilderSelfStorageOptions {
  type: 'self'
  autosaveChanges?: number
  onLoad: (
    context?: WebBuilderSelfStorageLoadContext
  ) => Promise<WebBuilderSelfStorageLoadResult> | WebBuilderSelfStorageLoadResult
  onSave: (
    context: WebBuilderSelfStorageSaveContext
  ) => Promise<void> | void
}

export interface StorageAdapter {
  mode: DraftStorageMode
  supportsConflictOverride: boolean
  getDraft: (resource: PageResourceIdentity) => Promise<PageDraftRecord | null>
  saveDraft: (
    request: PageSaveRequest,
    context?: { currentPage?: PageDraftRecord | null }
  ) => Promise<PageDraftRecord>
  generateCss: (request: Record<string, unknown>) => Promise<unknown>
  getHistoryDetail: (id: number) => Promise<unknown>
  load: (resource: PageResourceIdentity) => Promise<PageDraftRecord | null>
  save: (
    request: PageSaveRequest,
    context?: { currentPage?: PageDraftRecord | null }
  ) => Promise<PageDraftRecord>
}

export type WebBuilderStorageOptions = StorageAdapter | WebBuilderSelfStorageOptions

export interface SharedResourceRecord extends PageResourceIdentity {
  id?: number
  schemaJson?: string
  updateTime?: Date | string
}

export interface SharedResourceCreateRequest extends PageResourceIdentity {
  name: string
  schemaJson?: string
}

export interface SharedResourceSaveRequest extends PageSaveRequest {}

export interface SharedResourceStorageAdapter {
  getDraft: (resource: PageResourceIdentity) => Promise<SharedResourceRecord>
  create: (request: SharedResourceCreateRequest) => Promise<SharedResourceRecord>
  saveDraft: (request: SharedResourceSaveRequest) => Promise<SharedResourceRecord>
}

export interface LockAcquireOptions {
  forceTakeover?: boolean
  immediateTakeover?: boolean
}

export interface LockHolder extends PageResourceIdentity {
  sessionKey: string
  userId: number
  username: string
  lockTime: Date | string
  heartbeatTime: Date | string
  isCurrentUser: boolean
  isCurrentSession: boolean
}

export interface HeartbeatResult {
  success: boolean
  takenOver: boolean
  takeoverInfo?: LockHolder
}

export interface LockAdapter {
  acquire: (
    resource: PageResourceIdentity,
    sessionKey: string,
    options?: LockAcquireOptions
  ) => Promise<LockHolder | null>
  release: (resource: PageResourceIdentity, sessionKey: string) => Promise<unknown>
  heartbeat: (resource: PageResourceIdentity, sessionKey: string) => Promise<HeartbeatResult>
  releaseKeepalive?: (resource: PageResourceIdentity, sessionKey: string) => boolean
}

export const normalizePageResourceIdentity = (
  identity?: Partial<PageResourceIdentity> | null
): PageResourceIdentity => {
  const resourceType = normalizeString(identity?.resourceType as NullablePrimitive)
  const ownerId = normalizeNumber(identity?.ownerId as NullablePrimitive)
  const ownerType =
    normalizeString(identity?.ownerType as NullablePrimitive) ||
    (ownerId !== undefined ? resourceType : undefined)
  const resourceId = normalizeNumber(identity?.resourceId as NullablePrimitive)
  const resourceKey = normalizeString(identity?.resourceKey as NullablePrimitive)
  const resourceScope =
    normalizeString(identity?.resourceScope as NullablePrimitive) ||
    (ownerType && ownerId !== undefined ? 'OWNED' : undefined)

  return {
    resourceId,
    resourceKey,
    resourceType,
    resourceScope,
    ownerType,
    ownerId,
  }
}

export const hasPageResourceLocator = (identity?: PageResourceIdentity | null): boolean => {
  const normalized = normalizePageResourceIdentity(identity)
  return Boolean(
    normalized.resourceId !== undefined ||
      normalized.resourceKey ||
      (normalized.ownerType && normalized.ownerId !== undefined)
  )
}
