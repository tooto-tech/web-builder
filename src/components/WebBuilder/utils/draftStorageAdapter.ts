import {
  getDraft,
  normalizePageResourceIdentity,
  saveDraft,
  type PageResourceIdentity,
  type PageSaveReqVO,
  type PageVO,
} from '@/api/content/page'
import { isIndexedDbStorageMode } from '../config/storage'
import { loadDraft as loadLocalDraft, saveDraft as saveLocalDraft } from './draftStorage'

export type DraftStorageMode = 'backend' | 'indexedDb'

export interface DraftStorageAdapter {
  mode: DraftStorageMode
  supportsConflictOverride: boolean
  load(resource: PageResourceIdentity): Promise<PageVO | null>
  save(request: PageSaveReqVO, context?: { currentPage?: PageVO | null }): Promise<PageVO>
}

export const getLocalDraftKey = (resource: PageResourceIdentity): string => {
  const normalized = normalizePageResourceIdentity(resource)
  if (normalized.resourceId !== undefined) {
    return `webbuilder:draft:resource:${normalized.resourceId}`
  }
  if (normalized.resourceKey) {
    return `webbuilder:draft:key:${normalized.resourceKey}`
  }
  return `webbuilder:draft:owner:${normalized.ownerType || 'UNKNOWN'}:${normalized.ownerId || 0}`
}

const backendDraftStorageAdapter: DraftStorageAdapter = {
  mode: 'backend',
  supportsConflictOverride: true,
  load: (resource) => getDraft(resource),
  save: (request) => saveDraft(request),
}

const indexedDbDraftStorageAdapter: DraftStorageAdapter = {
  mode: 'indexedDb',
  supportsConflictOverride: false,
  load: async (resource) => {
    const localDraft = await loadLocalDraft<PageVO>(getLocalDraftKey(resource))
    if (localDraft) return localDraft

    try {
      return await getDraft(resource)
    } catch {
      return null
    }
  },
  save: async (request, context) => {
    const {
      resourceId,
      resourceKey,
      resourceName,
      resourceType,
      resourceScope,
      ownerType,
      ownerId,
      schemaJson,
    } = request
    const localRecord: PageVO = {
      ...(context?.currentPage || {}),
      resourceId,
      resourceKey,
      resourceName,
      resourceType,
      resourceScope,
      ownerType,
      ownerId,
      schemaJson,
      status: 'draft',
      updateTime: new Date(),
    }

    await saveLocalDraft(getLocalDraftKey(request), localRecord)
    return localRecord
  },
}

export const createDraftStorageAdapter = (): DraftStorageAdapter =>
  isIndexedDbStorageMode() ? indexedDbDraftStorageAdapter : backendDraftStorageAdapter
